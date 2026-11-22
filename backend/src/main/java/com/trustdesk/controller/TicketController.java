package com.trustdesk.controller;

import com.trustdesk.entity.Ticket;
import com.trustdesk.enums.TicketStatus;
import com.trustdesk.ticket.CreateTicketRequest;
import com.trustdesk.ticket.TicketContextResponse;
import com.trustdesk.ticket.TicketService;
import com.trustdesk.ticket.UpdateTicketStatusRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @GetMapping
    public ResponseEntity<List<Ticket>> listTickets(@RequestParam(required = false) TicketStatus status) {
        List<Ticket> tickets = status == null
                ? ticketService.findAll()
                : ticketService.findByStatus(status);
        return ResponseEntity.ok(tickets);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Ticket> getTicket(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.findById(id));
    }

    @PostMapping
    public ResponseEntity<Ticket> create(@RequestBody @Valid CreateTicketRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ticketService.create(request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Ticket> updateStatus(@PathVariable Long id,
                                               @RequestBody @Valid UpdateTicketStatusRequest request) {
        return ResponseEntity.ok(ticketService.updateStatus(id, request.getStatus()));
    }

    @GetMapping("/{id}/context")
    public ResponseEntity<TicketContextResponse> getContext(@PathVariable Long id) {
        return ResponseEntity.ok(ticketService.getContext(id));
    }
}
