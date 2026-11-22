package com.trustdesk.embedding;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * Real embedding client backed by OpenAI's embeddings API.
 * Enable with: embedding.provider=openai and OPENAI_API_KEY set.
 *
 * (Groq does not currently expose an embeddings endpoint, so a separate
 *  embedding provider is required for vector search.)
 */
@Component
@ConditionalOnProperty(name = "embedding.provider", havingValue = "openai")
@RequiredArgsConstructor
@Slf4j
public class OpenAiEmbeddingClient implements EmbeddingClient {

    private final RestTemplate restTemplate;

    @Value("${embedding.openai.api-key}")
    private String apiKey;

    @Value("${embedding.openai.base-url:https://api.openai.com/v1}")
    private String baseUrl;

    @Value("${embedding.openai.model:text-embedding-3-small}")
    private String model;

    @Value("${embedding.dimensions:1536}")
    private int dimensions;

    @Override
    public float[] embed(String text) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("OPENAI_API_KEY is required for embedding.provider=openai");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(apiKey);

        Map<String, Object> body = Map.of(
                "model", model,
                "input", text,
                "dimensions", dimensions
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        @SuppressWarnings("unchecked")
        Map<String, Object> response = restTemplate.postForObject(
                baseUrl + "/embeddings", entity, Map.class);

        if (response == null || !response.containsKey("data")) {
            throw new RuntimeException("Invalid embedding response from OpenAI");
        }

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> data = (List<Map<String, Object>>) response.get("data");
        @SuppressWarnings("unchecked")
        List<Number> embedding = (List<Number>) data.get(0).get("embedding");

        float[] vector = new float[embedding.size()];
        for (int i = 0; i < embedding.size(); i++) {
            vector[i] = embedding.get(i).floatValue();
        }
        return vector;
    }

    @Override
    public int dimensions() {
        return dimensions;
    }
}
