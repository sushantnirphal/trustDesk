package com.trustdesk.groq;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroqResponse {

    private String id;
    private String object;
    private long created;
    private String model;
    private List<Choice> choices;
    private Map<String, Object> usage;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Choice {
        private int index;
        private GroqMessage message;

        @JsonProperty("finish_reason")
        private String finishReason;
    }
}
