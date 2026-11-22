package com.trustdesk.retrieval;

import com.trustdesk.embedding.EmbeddingService;
import com.trustdesk.entity.Document;
import com.trustdesk.repository.DocumentRepository;
import com.trustdesk.repository.DocumentSearchProjection;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Knowledge retrieval layer.
 *
 * Supports two modes:
 *  - "vector"  : pgvector cosine similarity over stored embeddings (PostgreSQL)
 *  - "keyword" : LIKE-based keyword matching (any database / test profile)
 *
 * If vector mode fails at runtime (e.g. pgvector missing) it automatically
 * falls back to keyword search so the app keeps working.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class KnowledgeBaseService {

    private final DocumentRepository documentRepository;
    private final EmbeddingService embeddingService;

    @Value("${retrieval.mode:vector}")
    private String retrievalMode;

    @Value("${retrieval.top-k:5}")
    private int topK;

    @Transactional(readOnly = true)
    public KnowledgeBaseSearchResponse search(KnowledgeBaseSearchRequest request) {
        long start = Instant.now().toEpochMilli();

        List<KnowledgeBaseSearchResponse.MatchedDocument> results;
        String modeUsed;

        if ("vector".equalsIgnoreCase(retrievalMode)) {
            try {
                results = vectorSearch(request);
                modeUsed = "vector";
            } catch (Exception ex) {
                log.warn("Vector search failed ({}). Falling back to keyword search.", ex.getMessage());
                results = keywordSearch(request);
                modeUsed = "keyword";
            }
        } else {
            results = keywordSearch(request);
            modeUsed = "keyword";
        }

        long elapsed = Instant.now().toEpochMilli() - start;

        return KnowledgeBaseSearchResponse.builder()
                .documents(results)
                .totalFound(results.size())
                .searchTimeMs(elapsed)
                .mode(modeUsed)
                .build();
    }

    // --- Vector search via pgvector ---

    private List<KnowledgeBaseSearchResponse.MatchedDocument> vectorSearch(KnowledgeBaseSearchRequest request) {
        String queryEmbedding = embeddingService.embedToPgVector(request.getQuery());
        int limit = request.getMaxResults() > 0 ? request.getMaxResults() : topK;

        List<DocumentSearchProjection> nearest =
                documentRepository.findNearestByEmbedding(queryEmbedding, limit);

        return nearest.stream()
                .filter(p -> request.getCategory() == null
                        || request.getCategory().isBlank()
                        || request.getCategory().equalsIgnoreCase(p.getCategory()))
                .map(p -> {
                    double distance = p.getDistance() == null ? 1.0 : p.getDistance();
                    // cosine distance in [0,2] -> similarity in [0,1]
                    double score = Math.max(0.0, Math.min(1.0, 1.0 - (distance / 2.0)));
                    return KnowledgeBaseSearchResponse.MatchedDocument.builder()
                            .kbId(p.getKbId())
                            .title(p.getTitle())
                            .content(p.getContent())
                            .category(p.getCategory())
                            .relevanceScore(score)
                            .matchedSnippet(snippet(p.getContent()))
                            .build();
                })
                .collect(Collectors.toList());
    }

    // --- Keyword fallback ---

    private List<KnowledgeBaseSearchResponse.MatchedDocument> keywordSearch(KnowledgeBaseSearchRequest request) {
        List<Document> candidates;
        if (request.getCategory() != null && !request.getCategory().isBlank()) {
            candidates = documentRepository.findByCategory(request.getCategory());
        } else {
            candidates = documentRepository.findAll();
        }

        String query = request.getQuery().toLowerCase();
        List<String> terms = Arrays.stream(query.split("\\s+"))
                .map(t -> t.replaceAll("[^a-z0-9]", ""))
                .filter(t -> t.length() > 2)
                .distinct()
                .toList();

        int limit = request.getMaxResults() > 0 ? request.getMaxResults() : topK;

        return candidates.stream()
                .map(doc -> scoreKeyword(doc, terms))
                .filter(m -> m.getRelevanceScore() > 0)
                .sorted(Comparator.comparingDouble(
                        (KnowledgeBaseSearchResponse.MatchedDocument m) -> m.getRelevanceScore()).reversed())
                .limit(limit)
                .collect(Collectors.toList());
    }

    private KnowledgeBaseSearchResponse.MatchedDocument scoreKeyword(Document doc, List<String> terms) {
        String contentLower = doc.getContent().toLowerCase();
        String titleLower = doc.getTitle().toLowerCase();

        double score = 0.0;
        for (String term : terms) {
            if (titleLower.contains(term)) score += 0.4;
            if (contentLower.contains(term)) score += 0.2;
        }
        score = Math.min(score, 1.0);

        return KnowledgeBaseSearchResponse.MatchedDocument.builder()
                .kbId(doc.getKbId())
                .title(doc.getTitle())
                .content(doc.getContent())
                .category(doc.getCategory())
                .relevanceScore(score)
                .matchedSnippet(snippet(doc.getContent()))
                .build();
    }

    private String snippet(String content) {
        if (content == null) return "";
        return content.length() <= 240 ? content : content.substring(0, 240) + "...";
    }

    @Transactional(readOnly = true)
    public Optional<Document> getDocumentByKbId(String kbId) {
        return Optional.ofNullable(documentRepository.findByKbId(kbId));
    }

    @Transactional(readOnly = true)
    public List<Document> getDocumentsByCategory(String category) {
        return documentRepository.findByCategory(category);
    }
}
