package com.trustdesk.draft;

import com.trustdesk.enums.DraftStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DraftGenerationResponse {

    private Long draftId;
    private Long ticketId;
    private String content;
    private List<String> citationIds;
    private DraftStatus status; // GENERATED | REFUSED | ESCALATED
    private String refusalReason;
    private Double groundingScore;
    private Long processingTimeMs;

    // Guardrail transparency
    private String guardrailAction;              // ALLOW | WARN | ESCALATE | BLOCK
    private List<String> guardrailViolations;
    private List<String> blockedDocumentIds;
    private List<String> retrievedDocumentIds;
}
