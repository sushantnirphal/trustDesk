package com.trustdesk.repository;

import com.trustdesk.entity.ToolCall;
import com.trustdesk.enums.ActionType;
import com.trustdesk.enums.ToolCallStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ToolCallRepository extends JpaRepository<ToolCall, Long> {
    List<ToolCall> findByTicketId(Long ticketId);
    List<ToolCall> findByTicketIdOrderByCreatedAtDesc(Long ticketId);
    Optional<ToolCall> findByIdempotencyKey(String idempotencyKey);
    List<ToolCall> findByStatus(ToolCallStatus status);
    List<ToolCall> findAllByOrderByCreatedAtDesc();
    boolean existsByTicketIdAndActionTypeAndStatusIn(
            Long ticketId, ActionType actionType, Collection<ToolCallStatus> statuses);
}
