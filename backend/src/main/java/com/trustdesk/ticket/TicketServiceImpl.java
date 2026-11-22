package com.trustdesk.ticket;

import com.trustdesk.entity.Customer;
import com.trustdesk.entity.Order;
import com.trustdesk.entity.Ticket;
import com.trustdesk.enums.TicketCategory;
import com.trustdesk.enums.TicketPriority;
import com.trustdesk.enums.TicketStatus;
import com.trustdesk.exception.BadRequestException;
import com.trustdesk.exception.ResourceNotFoundException;
import com.trustdesk.repository.CustomerRepository;
import com.trustdesk.repository.OrderRepository;
import com.trustdesk.repository.TicketRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TicketServiceImpl implements TicketService {

    private final TicketRepository ticketRepository;
    private final CustomerRepository customerRepository;
    private final OrderRepository orderRepository;

    @Override
    @Transactional(readOnly = true)
    public List<Ticket> findAll() {
        return ticketRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Ticket> findByStatus(TicketStatus status) {
        return ticketRepository.findByStatus(status);
    }

    @Override
    @Transactional(readOnly = true)
    public Ticket findById(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsById(Long id) {
        return ticketRepository.existsById(id);
    }

    @Override
    @Transactional
    public Ticket create(CreateTicketRequest request) {
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found: " + request.getCustomerId()));

        Order order = null;
        if (request.getOrderId() != null) {
            order = orderRepository.findById(request.getOrderId())
                    .orElseThrow(() -> new ResourceNotFoundException("Order not found: " + request.getOrderId()));
            if (order.getCustomer() == null || !order.getCustomer().getId().equals(customer.getId())) {
                throw new BadRequestException("Order does not belong to the selected customer");
            }
        }

        Ticket ticket = Ticket.builder()
                .customer(customer)
                .order(order)
                .subject(request.getSubject())
                .description(request.getDescription())
                .category(TicketCategory.GENERAL)
                .priority(TicketPriority.MEDIUM)
                .status(TicketStatus.OPEN)
                .escalationNeeded(false)
                .build();

        return ticketRepository.save(ticket);
    }

    @Override
    @Transactional
    public Ticket updateStatus(Long id, TicketStatus status) {
        Ticket ticket = findById(id);

        ticket.setStatus(status);
        if (status == TicketStatus.ESCALATED) {
            ticket.setEscalationNeeded(true);
        }
        return ticketRepository.save(ticket);
    }

    @Override
    @Transactional(readOnly = true)
    public TicketContextResponse getContext(Long id) {
        Ticket ticket = findById(id);
        return TicketContextResponse.builder()
                .ticket(ticket)
                .customer(ticket.getCustomer())
                .order(ticket.getOrder())
                .build();
    }
}
