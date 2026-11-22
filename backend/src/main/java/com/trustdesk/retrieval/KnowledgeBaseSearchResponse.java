package com.trustdesk.retrieval;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KnowledgeBaseSearchResponse {

    private List<MatchedDocument> documents;
    private int totalFound;
    private long searchTimeMs;
    private String mode; // "vector" or "keyword"

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MatchedDocument {
        private String kbId;
        private String title;
        private String content;
        private String category;
        private double relevanceScore; // 0.0 - 1.0
        private String matchedSnippet;
    }
}
