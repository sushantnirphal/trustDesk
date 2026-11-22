package com.trustdesk.guardrail;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GuardrailResult {

    private GuardrailAction action;
    private List<String> violations;
    private String reason;
    private String sanitizedText; // PII-redacted version of the input/output

    public boolean isBlocked() {
        return action == GuardrailAction.BLOCK;
    }

    public boolean isEscalated() {
        return action == GuardrailAction.ESCALATE;
    }

    public boolean isAllowed() {
        return action == GuardrailAction.ALLOW || action == GuardrailAction.WARN;
    }

    public static GuardrailResult allow(String text) {
        return GuardrailResult.builder()
                .action(GuardrailAction.ALLOW)
                .violations(new ArrayList<>())
                .reason("No violations detected")
                .sanitizedText(text)
                .build();
    }

    public static GuardrailResult block(List<String> violations, String reason, String sanitizedText) {
        return GuardrailResult.builder()
                .action(GuardrailAction.BLOCK)
                .violations(violations)
                .reason(reason)
                .sanitizedText(sanitizedText)
                .build();
    }
}
