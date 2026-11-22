package com.trustdesk.draft;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DraftGenerationRequest {

    @NotNull(message = "Ticket ID is required")
    private Long ticketId;

    @Builder.Default
    private boolean allowEscalation = true;

    @Builder.Default
    private List<String> preferredCitationIds = List.of();
}
