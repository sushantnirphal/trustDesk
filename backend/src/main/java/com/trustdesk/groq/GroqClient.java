package com.trustdesk.groq;

import java.util.List;
import java.util.Map;

/**
 * Abstraction over the AI provider (Groq).
 * Business logic depends on this interface so the provider can be mocked in tests
 * and swapped for another vendor later.
 */
public interface GroqClient {

    /**
     * Send a chat conversation to the model and get a text response.
     *
     * @param messages    list of maps with "role" and "content"
     * @param temperature 0.0 (deterministic) to 1.0 (creative)
     * @return raw text response
     */
    String generate(List<Map<String, String>> messages, double temperature);

    boolean isAvailable();
}
