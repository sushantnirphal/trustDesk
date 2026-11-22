package com.trustdesk.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStats {

    private long totalTickets;
    private long openTickets;
    private long inProgressTickets;
    private long resolvedTickets;
    private long escalatedTickets;
    private long highPriorityTickets;
    private Map<String, Long> ticketsByCategory;

    private long pendingApprovals;
    private long executedActions;
    private long totalDrafts;
    private long totalTraces;
}
