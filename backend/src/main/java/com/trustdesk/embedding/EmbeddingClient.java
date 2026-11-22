package com.trustdesk.embedding;

/**
 * Abstraction over an embedding model.
 * Embeddings are stored in the `documents.embedding` column (pgvector).
 */
public interface EmbeddingClient {

    /** Convert text into a vector of floats. */
    float[] embed(String text);

    /** Dimensionality of the produced vectors (must match the DB column). */
    int dimensions();
}
