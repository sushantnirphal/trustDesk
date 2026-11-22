package com.trustdesk.triage;

import com.trustdesk.enums.TicketCategory;
import com.trustdesk.enums.TicketPriority;
import com.trustdesk.enums.TicketStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TriageStatusResponse {

    private Long ticketId;
    private TicketCategory category;
    private TicketPriority priority;
    private Boolean escalationNeeded;
    private TicketStatus status;
}
