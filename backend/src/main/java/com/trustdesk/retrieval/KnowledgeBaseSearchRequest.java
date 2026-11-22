package com.trustdesk.retrieval;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KnowledgeBaseSearchRequest {

    @NotBlank(message = "Query is required")
    @Size(max = 2000)
    private String query;

    private String category; // optional filter

    @Builder.Default
    private int maxResults = 5;
}
