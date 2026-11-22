package com.trustdesk.ticket;

import com.trustdesk.entity.Ticket;
import com.trustdesk.enums.TicketStatus;

import java.util.List;

public interface TicketService {

    List<Ticket> findAll();

    List<Ticket> findByStatus(TicketStatus status);

    Ticket findById(Long id);

    boolean existsById(Long id);

    Ticket create(CreateTicketRequest request);

    Ticket updateStatus(Long id, TicketStatus status);

    TicketContextResponse getContext(Long id);
}
