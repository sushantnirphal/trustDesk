package com.trustdesk.dashboard;

import com.trustdesk.entity.Ticket;
import com.trustdesk.enums.TicketPriority;
import com.trustdesk.enums.TicketStatus;
import com.trustdesk.enums.ToolCallStatus;
import com.trustdesk.repository.DraftRepository;
import com.trustdesk.repository.TicketRepository;
import com.trustdesk.repository.ToolCallRepository;
import com.trustdesk.repository.TraceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final TicketRepository ticketRepository;
    private final ToolCallRepository toolCallRepository;
    private final DraftRepository draftRepository;
    private final TraceRepository traceRepository;

    @Transactional(readOnly = true)
    public DashboardStats stats() {
        List<Ticket> tickets = ticketRepository.findAll();

        Map<String, Long> byCategory = new LinkedHashMap<>();
        for (Ticket ticket : tickets) {
            String key = ticket.getCategory() == null ? "UNKNOWN" : ticket.getCategory().name();
            byCategory.merge(key, 1L, Long::sum);
        }

        return DashboardStats.builder()
                .totalTickets(tickets.size())
                .openTickets(count(tickets, TicketStatus.OPEN))
                .inProgressTickets(count(tickets, TicketStatus.IN_PROGRESS))
                .resolvedTickets(count(tickets, TicketStatus.RESOLVED))
                .escalatedTickets(count(tickets, TicketStatus.ESCALATED))
                .highPriorityTickets(tickets.stream()
                        .filter(t -> t.getPriority() == TicketPriority.HIGH || t.getPriority() == TicketPriority.URGENT)
                        .count())
                .ticketsByCategory(byCategory)
                .pendingApprovals(toolCallRepository.findByStatus(ToolCallStatus.PENDING_APPROVAL).size())
                .executedActions(toolCallRepository.findByStatus(ToolCallStatus.EXECUTED).size())
                .totalDrafts(draftRepository.count())
                .totalTraces(traceRepository.count())
                .build();
    }

    private long count(List<Ticket> tickets, TicketStatus status) {
        return tickets.stream().filter(t -> t.getStatus() == status).count();
    }
}
