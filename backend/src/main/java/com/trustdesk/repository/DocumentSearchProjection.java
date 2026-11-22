package com.trustdesk.repository;

/**
 * Projection returned by the pgvector similarity query.
 * `distance` is the cosine distance (lower = more similar).
 */
public interface DocumentSearchProjection {
    Long getId();
    String getKbId();
    String getTitle();
    String getContent();
    String getCategory();
    Double getDistance();
}
