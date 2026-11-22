package com.trustdesk.groq;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroqRequest {

    private String model;
    private List<GroqMessage> messages;
    private double temperature;

    @JsonProperty("max_tokens")
    private int maxTokens;

    private boolean stream;
}
