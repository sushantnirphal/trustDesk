package com.trustdesk.guardrail;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GuardrailCheckRequest {

    @NotBlank(message = "Text is required")
    private String text;

    @Builder.Default
    private String type = "input"; // "input" or "output"
}
