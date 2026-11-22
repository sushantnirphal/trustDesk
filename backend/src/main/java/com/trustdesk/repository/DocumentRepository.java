package com.trustdesk.repository;

import com.trustdesk.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {

    List<Document> findByCategory(String category);

    Document findByKbId(String kbId);

    /**
     * Vector similarity search using pgvector's cosine distance operator (<=>).
     * Returns the top-K documents nearest to the query embedding, with distance.
     *
     * NOTE: Requires PostgreSQL + pgvector. On H2 the retrieval layer uses
     * the keyword fallback instead.
     */
    @Query(value = """
            SELECT id,
                   kb_id AS kbId,
                   title,
                   content,
                   category,
                   (CAST(embedding AS vector) <=> CAST(:queryEmbedding AS vector)) AS distance
            FROM documents
            WHERE embedding IS NOT NULL
            ORDER BY CAST(embedding AS vector) <=> CAST(:queryEmbedding AS vector)
            LIMIT :limit
            """, nativeQuery = true)
    List<DocumentSearchProjection> findNearestByEmbedding(
            @Param("queryEmbedding") String queryEmbedding,
            @Param("limit") int limit);

    /**
     * Full-text keyword search fallback (works on any database).
     */
    @Query("""
            SELECT d FROM Document d
            WHERE LOWER(d.content) LIKE LOWER(CONCAT('%', :term, '%'))
               OR LOWER(d.title) LIKE LOWER(CONCAT('%', :term, '%'))
            """)
    List<Document> searchByKeyword(@Param("term") String term);
}
