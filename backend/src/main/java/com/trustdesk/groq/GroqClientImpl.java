package com.trustdesk.groq;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class GroqClientImpl implements GroqClient {

    private final RestTemplate restTemplate;

    @Value("${groq.api-key}")
    private String apiKey;

    @Value("${groq.base-url:https://api.groq.com/openai/v1}")
    private String baseUrl;

    @Value("${groq.model:llama-3.1-8b-instant}")
    private String model;

    @Override
    public String generate(List<Map<String, String>> messages, double temperature) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("GROQ_API_KEY is not configured");
        }

        try {
            GroqRequest request = GroqRequest.builder()
                    .model(model)
                    .messages(messages.stream()
                            .map(m -> GroqMessage.builder()
                                    .role(m.get("role"))
                                    .content(m.get("content"))
                                    .build())
                            .toList())
                    .temperature(temperature)
                    .maxTokens(1500)
                    .stream(false)
                    .build();

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            HttpEntity<GroqRequest> entity = new HttpEntity<>(request, headers);
            String url = baseUrl + "/chat/completions";

            GroqResponse response = restTemplate.postForObject(url, entity, GroqResponse.class);

            if (response != null && response.getChoices() != null && !response.getChoices().isEmpty()) {
                return response.getChoices().get(0).getMessage().getContent();
            }

            throw new RuntimeException("Empty response from Groq API");

        } catch (HttpClientErrorException | HttpServerErrorException ex) {
            log.error("Groq API error: {} - {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new RuntimeException("Groq API error: " + ex.getStatusCode(), ex);
        } catch (Exception ex) {
            log.error("Unexpected error calling Groq: {}", ex.getMessage(), ex);
            throw new RuntimeException("Failed to call Groq API", ex);
        }
    }

    @Override
    public boolean isAvailable() {
        if (apiKey == null || apiKey.isBlank()) {
            return false;
        }
        try {
            generate(List.of(Map.of("role", "user", "content", "ping")), 0.1);
            return true;
        } catch (Exception ex) {
            log.warn("Groq provider unavailable: {}", ex.getMessage());
            return false;
        }
    }
}
