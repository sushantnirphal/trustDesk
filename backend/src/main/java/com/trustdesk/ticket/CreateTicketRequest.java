package com.trustdesk.ticket;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateTicketRequest {

    @NotNull(message = "customerId is required")
    private Long customerId;

    private Long orderId;

    @NotBlank(message = "subject is required")
    @Size(max = 200)
    private String subject;

    @NotBlank(message = "description is required")
    @Size(max = 5000)
    private String description;
}
