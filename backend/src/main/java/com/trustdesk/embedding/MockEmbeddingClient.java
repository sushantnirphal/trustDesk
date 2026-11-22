package com.trustdesk.embedding;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.Random;

/**
 * Deterministic local embedding used for development and tests.
 * Produces a stable pseudo-random vector derived from the text hash,
 * so identical text always yields the same vector and similar text yields
 * unrelated vectors. It is NOT semantically meaningful — it exists so the
 * full pgvector pipeline can be exercised without an external API key.
 *
 * Enable with: embedding.provider=mock
 */
@Component
@ConditionalOnProperty(name = "embedding.provider", havingValue = "mock", matchIfMissing = true)
@Slf4j
public class MockEmbeddingClient implements EmbeddingClient {

    private final int dimensions;

    public MockEmbeddingClient(@Value("${embedding.dimensions:1536}") int dimensions) {
        this.dimensions = dimensions;
        log.info("Using MockEmbeddingClient with {} dimensions", dimensions);
    }

    @Override
    public float[] embed(String text) {
        Random random = new Random(text == null ? 0 : text.hashCode());
        float[] vector = new float[dimensions];
        double norm = 0.0;
        for (int i = 0; i < dimensions; i++) {
            vector[i] = (float) random.nextGaussian();
            norm += vector[i] * vector[i];
        }
        // Normalize so cosine distance behaves well
        double sqrt = Math.sqrt(norm);
        if (sqrt > 0) {
            for (int i = 0; i < dimensions; i++) {
                vector[i] = (float) (vector[i] / sqrt);
            }
        }
        return vector;
    }

    @Override
    public int dimensions() {
        return dimensions;
    }
}
