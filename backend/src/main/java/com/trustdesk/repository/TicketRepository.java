package com.trustdesk.repository;

import com.trustdesk.entity.Ticket;
import com.trustdesk.enums.TicketCategory;
import com.trustdesk.enums.TicketStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {

    @Override
    @EntityGraph(attributePaths = {"customer", "order"})
    List<Ticket> findAll();

    @Override
    @EntityGraph(attributePaths = {"customer", "order"})
    Optional<Ticket> findById(Long id);

    @EntityGraph(attributePaths = {"customer", "order"})
    List<Ticket> findByCustomerId(Long customerId);

    @EntityGraph(attributePaths = {"customer", "order"})
    List<Ticket> findByStatus(TicketStatus status);

    @EntityGraph(attributePaths = {"customer", "order"})
    List<Ticket> findByCategory(TicketCategory category);
}
