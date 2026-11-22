package com.trustdesk.embedding;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.stream.Collectors;

/**
 * Convenience wrapper around the EmbeddingClient that also converts
 * vectors to/from the pgvector text representation ("[0.1,0.2,...]").
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmbeddingService {

    private final EmbeddingClient embeddingClient;

    /** Embed text and return the pgvector string form. */
    public String embedToPgVector(String text) {
        float[] vector = embeddingClient.embed(text);
        return toPgVectorString(vector);
    }

    /** Embed text and return the raw float array. */
    public float[] embed(String text) {
        return embeddingClient.embed(text);
    }

    public int dimensions() {
        return embeddingClient.dimensions();
    }

    public static String toPgVectorString(float[] vector) {
        return Arrays.stream(toObjectArray(vector))
                .map(String::valueOf)
                .collect(Collectors.joining(",", "[", "]"));
    }

    private static Float[] toObjectArray(float[] vector) {
        Float[] boxed = new Float[vector.length];
        for (int i = 0; i < vector.length; i++) {
            boxed[i] = vector[i];
        }
        return boxed;
    }
}
