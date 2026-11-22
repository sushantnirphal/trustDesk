package com.trustdesk.triage;

import com.trustdesk.enums.TicketCategory;
import com.trustdesk.enums.TicketPriority;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TriageResponse {

    private Long ticketId;
    private TicketCategory category;
    private TicketPriority priority;
    private Boolean escalationNeeded;
    private String reasoning;
    private Double confidenceScore;
    private Long processingTimeMs;

    // Guardrail transparency
    private String guardrailAction;
    private List<String> guardrailViolations;
}
