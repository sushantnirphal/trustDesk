package com.trustdesk.triage;

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
public class TriageRequest {

    @NotBlank(message = "Ticket description is required")
    @Size(max = 5000)
    private String ticketDescription;

    private String ticketSubject;
    private String customerContext;
    private String orderContext;

    @Builder.Default
    private boolean includeReasoning = true;
}
