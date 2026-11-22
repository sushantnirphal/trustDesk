package com.trustdesk.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Knowledge base document.
 * The `embedding` column stores the pgvector representation of the content.
 * On PostgreSQL with the pgvector extension, this column is of type `vector(1536)`.
 * It is stored as a String (e.g. "[0.12,-0.45,...]") and cast in native queries.
 */
@Entity
@Table(name = "documents", uniqueConstraints = {
        @UniqueConstraint(columnNames = "kb_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "kb_id", nullable = false, length = 50, unique = true)
    private String kbId; // e.g., KB-REFUND-001

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(length = 50)
    private String category;

    /**
     * Vector embedding of the document content, stored in pgvector's text form
     * ("[0.12,-0.45,...]"). Kept as TEXT for portability (works on H2 too);
     * on PostgreSQL the VectorStoreInitializer converts this column to
     * vector(1536) and adds an index. Queries CAST to vector explicitly.
     */
    @Column(name = "embedding", columnDefinition = "TEXT")
    private String embedding;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
