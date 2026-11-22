package com.trustdesk.action;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.trustdesk.entity.Approval;
import com.trustdesk.entity.Ticket;
import com.trustdesk.entity.ToolCall;
import com.trustdesk.enums.ActionType;
import com.trustdesk.enums.ApprovalDecision;
import com.trustdesk.enums.RunType;
import com.trustdesk.enums.TicketCategory;
import com.trustdesk.enums.TicketStatus;
import com.trustdesk.enums.ToolCallStatus;
import com.trustdesk.enums.TraceStatus;
import com.trustdesk.exception.BadRequestException;
import com.trustdesk.exception.ConflictException;
import com.trustdesk.exception.ResourceNotFoundException;
import com.trustdesk.repository.ApprovalRepository;
import com.trustdesk.repository.TicketRepository;
import com.trustdesk.repository.ToolCallRepository;
import com.trustdesk.trace.TraceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Approval-gated tool actions.
 *
 * Safety properties:
 *  - the AI (or an agent) can only *propose* an action; a human must approve it
 *  - proposals are validated against ticket category / order amount (excessive-agency guard)
 *  - every proposal carries a unique idempotency key, so retries never duplicate the action
 *  - approvals are idempotent and execution happens exactly once
 *  - execution is simulated: no real money moves in this capstone
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ActionService {

    private static final Set<ToolCallStatus> ACTIVE_STATUSES =
            EnumSet.of(ToolCallStatus.PENDING_APPROVAL, ToolCallStatus.APPROVED, ToolCallStatus.EXECUTED);

    private final ToolCallRepository toolCallRepository;
    private final ApprovalRepository approvalRepository;
    private final TicketRepository ticketRepository;
    private final TraceService traceService;
    private final ObjectMapper objectMapper;

    // --- Recommendation -------------------------------------------------------

    @Transactional(readOnly = true)
    public ActionRecommendation recommend(Long ticketId) {
        Ticket ticket = getTicket(ticketId);

        if (ticket.getCategory() == TicketCategory.ACCOUNT_SECURITY || Boolean.TRUE.equals(ticket.getEscalationNeeded())) {
            return ActionRecommendation.builder()
                    .ticketId(ticketId)
                    .recommended(false)
                    .rationale("Security / escalated tickets must be handled by a human; no automated monetary action is recommended.")
                    .requiresHumanApproval(true)
                    .suggestedParameters(Map.of())
                    .build();
        }

        ActionType action = switch (ticket.getCategory()) {
            case REFUND -> ActionType.START_REFUND_REVIEW;
            case WARRANTY -> ActionType.CREATE_REPLACEMENT_ORDER;
            default -> null;
        };

        if (action == null) {
            return ActionRecommendation.builder()
                    .ticketId(ticketId)
                    .recommended(false)
                    .rationale("No sensitive tool action is appropriate for category " + ticket.getCategory() + ".")
                    .requiresHumanApproval(true)
                    .suggestedParameters(Map.of())
                    .build();
        }

        Map<String, Object> params = new LinkedHashMap<>();
        if (action == ActionType.START_REFUND_REVIEW && ticket.getOrder() != null) {
            params.put("amount", ticket.getOrder().getTotal());
            params.put("orderId", ticket.getOrder().getId());
        }
        if (action == ActionType.CREATE_REPLACEMENT_ORDER && ticket.getOrder() != null) {
            params.put("orderId", ticket.getOrder().getId());
        }
        params.put("reason", ticket.getSubject());

        return ActionRecommendation.builder()
                .ticketId(ticketId)
                .recommendedAction(action)
                .recommended(true)
                .rationale("Ticket category is " + ticket.getCategory() + "; " + action
                        + " requires human approval before execution.")
                .suggestedParameters(params)
                .requiresHumanApproval(true)
                .build();
    }

    // --- Propose --------------------------------------------------------------

    @Transactional
    public ActionProposalResponse propose(Long ticketId, ActionProposalRequest request) {
        Ticket ticket = getTicket(ticketId);

        String idempotencyKey = (request.getIdempotencyKey() == null || request.getIdempotencyKey().isBlank())
                ? UUID.randomUUID().toString()
                : request.getIdempotencyKey().trim();

        // Idempotency: same key -> same result, never a duplicate action.
        var existing = toolCallRepository.findByIdempotencyKey(idempotencyKey);
        if (existing.isPresent()) {
            ToolCall call = existing.get();
            if (!call.getTicket().getId().equals(ticketId)) {
                throw new ConflictException("Idempotency key is already used by another ticket");
            }
            return toResponse(call, true);
        }

        if (ticket.getStatus() == TicketStatus.CLOSED || ticket.getStatus() == TicketStatus.RESOLVED) {
            throw new BadRequestException("Cannot propose an action for a " + ticket.getStatus() + " ticket");
        }

        validateAction(ticket, request.getActionType(), request.getParameters());

        // Duplicate-action guard (beyond idempotency key): one active action per type per ticket.
        if (toolCallRepository.existsByTicketIdAndActionTypeAndStatusIn(
                ticketId, request.getActionType(), ACTIVE_STATUSES)) {
            throw new ConflictException("An active " + request.getActionType()
                    + " already exists for this ticket; approve or reject it first");
        }

        Map<String, Object> parameters = new LinkedHashMap<>();
        if (request.getParameters() != null) parameters.putAll(request.getParameters());
        if (request.getRationale() != null && !request.getRationale().isBlank()) {
            parameters.put("rationale", request.getRationale());
        }

        ToolCall call = ToolCall.builder()
                .ticket(ticket)
                .actionType(request.getActionType())
                .parameters(toJson(parameters))
                .idempotencyKey(idempotencyKey)
                .status(ToolCallStatus.PENDING_APPROVAL)
                .build();

        try {
            call = toolCallRepository.saveAndFlush(call);
        } catch (DataIntegrityViolationException ex) {
            // Concurrent retry with the same key: return the winner instead of failing.
            ToolCall winner = toolCallRepository.findByIdempotencyKey(idempotencyKey)
                    .orElseThrow(() -> ex);
            return toResponse(winner, true);
        }

        traceService.record(ticketId, RunType.ACTION, List.of(),
                Map.of("phase", "PROPOSED", "toolCallId", call.getId(),
                        "actionType", request.getActionType().name()),
                "ALLOW", TraceStatus.SUCCESS);

        log.info("Proposed action {} for ticket {} (toolCallId={}, idempotencyKey={})",
                request.getActionType(), ticketId, call.getId(), idempotencyKey);

        return toResponse(call, false);
    }

    // --- Approve / reject -----------------------------------------------------

    @Transactional
    public ApprovalResponse approve(Long toolCallId, String approver, String comments) {
        ToolCall call = getCall(toolCallId);

        if (call.getStatus() == ToolCallStatus.REJECTED) {
            throw new ConflictException("This action was already rejected and cannot be approved");
        }
        if (call.getStatus() == ToolCallStatus.EXECUTED) {
            Approval existing = approvalRepository.findByToolCallId(toolCallId).orElse(null);
            return toApprovalResponse(call, existing, true);
        }

        call.setStatus(ToolCallStatus.APPROVED);
        call.setApprovedBy(approver);
        call.setApprovedAt(LocalDateTime.now());
        toolCallRepository.save(call);

        Approval approval = approvalRepository.findByToolCallId(toolCallId)
                .orElseGet(() -> Approval.builder().toolCall(call).build());
        approval.setApproverId(approver);
        approval.setDecision(ApprovalDecision.APPROVED);
        approval.setComments(comments);
        approval.setTimestamp(LocalDateTime.now());
        approval = approvalRepository.save(approval);

        executeSimulated(call);

        traceService.record(call.getTicket().getId(), RunType.ACTION, List.of(),
                Map.of("phase", "APPROVED", "toolCallId", call.getId(),
                        "actionType", call.getActionType().name(), "approver", approver),
                "ALLOW", TraceStatus.SUCCESS);

        log.info("Action {} approved by {} and executed (toolCallId={})",
                call.getActionType(), approver, call.getId());

        return toApprovalResponse(call, approval, false);
    }

    @Transactional
    public ApprovalResponse reject(Long toolCallId, String approver, String comments) {
        ToolCall call = getCall(toolCallId);

        if (call.getStatus() == ToolCallStatus.EXECUTED) {
            throw new ConflictException("This action was already executed and cannot be rejected");
        }

        if (call.getStatus() == ToolCallStatus.REJECTED) {
            Approval existing = approvalRepository.findByToolCallId(toolCallId).orElse(null);
            return toApprovalResponse(call, existing, true);
        }

        call.setStatus(ToolCallStatus.REJECTED);
        call.setApprovedBy(approver);
        call.setApprovedAt(LocalDateTime.now());
        toolCallRepository.save(call);

        Approval approval = approvalRepository.findByToolCallId(toolCallId)
                .orElseGet(() -> Approval.builder().toolCall(call).build());
        approval.setApproverId(approver);
        approval.setDecision(ApprovalDecision.REJECTED);
        approval.setComments(comments);
        approval.setTimestamp(LocalDateTime.now());
        approval = approvalRepository.save(approval);

        traceService.record(call.getTicket().getId(), RunType.ACTION, List.of(),
                Map.of("phase", "REJECTED", "toolCallId", call.getId(),
                        "actionType", call.getActionType().name(), "approver", approver),
                "ALLOW", TraceStatus.FAILED);

        log.info("Action {} rejected by {} (toolCallId={})", call.getActionType(), approver, call.getId());

        return toApprovalResponse(call, approval, false);
    }

    // --- Queries --------------------------------------------------------------

    @Transactional(readOnly = true)
    public ActionProposalResponse get(Long toolCallId) {
        return toResponse(getCall(toolCallId), false);
    }

    @Transactional(readOnly = true)
    public List<ActionProposalResponse> listAll() {
        return toolCallRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(call -> toResponse(call, false)).toList();
    }

    @Transactional(readOnly = true)
    public List<ActionProposalResponse> listByTicket(Long ticketId) {
        getTicket(ticketId);
        return toolCallRepository.findByTicketIdOrderByCreatedAtDesc(ticketId).stream()
                .map(call -> toResponse(call, false)).toList();
    }

    @Transactional(readOnly = true)
    public List<ActionProposalResponse> listPending() {
        return toolCallRepository.findByStatus(ToolCallStatus.PENDING_APPROVAL).stream()
                .map(call -> toResponse(call, false)).toList();
    }

    // --- Validation / execution ----------------------------------------------

    private void validateAction(Ticket ticket, ActionType actionType, Map<String, Object> parameters) {
        if (actionType == null) {
            throw new BadRequestException("actionType is required");
        }

        if (ticket.getCategory() == TicketCategory.ACCOUNT_SECURITY
                || Boolean.TRUE.equals(ticket.getEscalationNeeded())
                && ticket.getCategory() == TicketCategory.ACCOUNT_SECURITY) {
            throw new BadRequestException(
                    "Security tickets cannot trigger monetary actions; escalate to a human instead");
        }

        if (actionType == ActionType.START_REFUND_REVIEW) {
            if (ticket.getCategory() != TicketCategory.REFUND && ticket.getCategory() != TicketCategory.WARRANTY) {
                throw new BadRequestException("Refund review is only allowed for REFUND or WARRANTY tickets");
            }
            requireOrder(ticket);
            BigDecimal amount = parseAmount(parameters, ticket.getOrder().getTotal());
            BigDecimal total = ticket.getOrder().getTotal();
            if (amount.compareTo(BigDecimal.ZERO) <= 0) {
                throw new BadRequestException("Refund amount must be greater than zero");
            }
            if (total != null && amount.compareTo(total) > 0) {
                throw new BadRequestException("Refund amount cannot exceed the order total (" + total + ")");
            }
        }

        if (actionType == ActionType.CREATE_REPLACEMENT_ORDER) {
            if (ticket.getCategory() != TicketCategory.WARRANTY && ticket.getCategory() != TicketCategory.REFUND) {
                throw new BadRequestException("Replacement orders are only allowed for WARRANTY or REFUND tickets");
            }
            requireOrder(ticket);
        }
    }

    private void requireOrder(Ticket ticket) {
        if (ticket.getOrder() == null) {
            throw new BadRequestException("This ticket has no linked order; the action cannot be validated");
        }
    }

    private BigDecimal parseAmount(Map<String, Object> parameters, BigDecimal fallback) {
        Object raw = parameters == null ? null : parameters.get("amount");
        if (raw == null) {
            if (fallback == null) throw new BadRequestException("Refund amount is required");
            return fallback;
        }
        try {
            return new BigDecimal(String.valueOf(raw));
        } catch (NumberFormatException ex) {
            throw new BadRequestException("Invalid refund amount: " + raw);
        }
    }

    /** Simulated execution: no external side effects, deterministic confirmation id. */
    private void executeSimulated(ToolCall call) {
        String prefix = call.getActionType() == ActionType.START_REFUND_REVIEW ? "REF" : "RPL";
        String confirmationId = prefix + "-" + call.getTicket().getId() + "-"
                + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("simulated", true);
        result.put("confirmationId", confirmationId);
        result.put("actionType", call.getActionType().name());
        result.put("message", call.getActionType() == ActionType.START_REFUND_REVIEW
                ? "Refund review started (simulated; no money moved)."
                : "Replacement order created (simulated; no shipment scheduled).");

        call.setResult(toJson(result));
        call.setStatus(ToolCallStatus.EXECUTED);
        call.setExecutedAt(LocalDateTime.now());
        toolCallRepository.save(call);
    }

    // --- Helpers --------------------------------------------------------------

    private Ticket getTicket(Long ticketId) {
        return ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException("Ticket not found: " + ticketId));
    }

    private ToolCall getCall(Long toolCallId) {
        return toolCallRepository.findById(toolCallId)
                .orElseThrow(() -> new ResourceNotFoundException("Action not found: " + toolCallId));
    }

    private ActionProposalResponse toResponse(ToolCall call, boolean duplicate) {
        Map<String, Object> parameters = parseMap(call.getParameters());
        String rationale = parameters.get("rationale") == null ? null : String.valueOf(parameters.remove("rationale"));

        return ActionProposalResponse.builder()
                .toolCallId(call.getId())
                .ticketId(call.getTicket() == null ? null : call.getTicket().getId())
                .actionType(call.getActionType())
                .status(call.getStatus())
                .requiresApproval(true)
                .duplicate(duplicate)
                .idempotencyKey(call.getIdempotencyKey())
                .parameters(parameters)
                .rationale(rationale)
                .approvedBy(call.getApprovedBy())
                .result(call.getResult())
                .createdAt(call.getCreatedAt())
                .approvedAt(call.getApprovedAt())
                .executedAt(call.getExecutedAt())
                .build();
    }

    private ApprovalResponse toApprovalResponse(ToolCall call, Approval approval, boolean duplicate) {
        return ApprovalResponse.builder()
                .approvalId(approval == null ? null : approval.getId())
                .toolCallId(call.getId())
                .status(call.getStatus())
                .decision(approval == null ? null : approval.getDecision())
                .approver(approval == null ? call.getApprovedBy() : approval.getApproverId())
                .comments(approval == null ? null : approval.getComments())
                .result(call.getResult())
                .duplicate(duplicate)
                .timestamp(approval == null ? call.getApprovedAt() : approval.getTimestamp())
                .build();
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception ex) {
            throw new BadRequestException("Could not serialize action parameters");
        }
    }

    private Map<String, Object> parseMap(String json) {
        if (json == null || json.isBlank()) return new LinkedHashMap<>();
        try {
            return new LinkedHashMap<>(objectMapper.readValue(json, new TypeReference<Map<String, Object>>() {}));
        } catch (Exception ex) {
            return new LinkedHashMap<>();
        }
    }
}
