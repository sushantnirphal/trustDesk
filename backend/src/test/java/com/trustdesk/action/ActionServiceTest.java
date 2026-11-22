package com.trustdesk.action;

import com.trustdesk.enums.ActionType;
import com.trustdesk.enums.ToolCallStatus;
import com.trustdesk.exception.BadRequestException;
import com.trustdesk.exception.ConflictException;
import com.trustdesk.repository.ToolCallRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ActionServiceTest {

    @Autowired
    private ActionService actionService;

    @Autowired
    private ToolCallRepository toolCallRepository;

    private ActionProposalRequest request(ActionType type, String key, Map<String, Object> params) {
        return ActionProposalRequest.builder()
                .actionType(type)
                .idempotencyKey(key)
                .parameters(params)
                .rationale("unit test")
                .build();
    }

    @Test
    @DisplayName("Proposal is idempotent and approval executes exactly once")
    void idempotentProposalAndApproval() {
        var request = request(ActionType.START_REFUND_REVIEW, "test-key-1", Map.of("amount", 50));

        var first = actionService.propose(1L, request);
        assertThat(first.isDuplicate()).isFalse();
        assertThat(first.getStatus()).isEqualTo(ToolCallStatus.PENDING_APPROVAL);
        assertThat(first.isRequiresApproval()).isTrue();

        var retry = actionService.propose(1L, request);
        assertThat(retry.isDuplicate()).isTrue();
        assertThat(retry.getToolCallId()).isEqualTo(first.getToolCallId());
        assertThat(toolCallRepository.findByTicketId(1L)).hasSize(1);

        var approval = actionService.approve(first.getToolCallId(), "agent", "looks good");
        assertThat(approval.getStatus()).isEqualTo(ToolCallStatus.EXECUTED);
        assertThat(approval.getResult()).contains("confirmationId").contains("simulated");
        assertThat(approval.isDuplicate()).isFalse();

        var repeatedApproval = actionService.approve(first.getToolCallId(), "agent", "looks good");
        assertThat(repeatedApproval.isDuplicate()).isTrue();
        assertThat(repeatedApproval.getResult()).isEqualTo(approval.getResult());
        assertThat(repeatedApproval.getApprovalId()).isEqualTo(approval.getApprovalId());

        // A different key cannot create a duplicate action of the same type.
        assertThatThrownBy(() -> actionService.propose(1L,
                request(ActionType.START_REFUND_REVIEW, "test-key-2", Map.of("amount", 50))))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    @DisplayName("Rejected action cannot be approved")
    void rejectedActionCannotBeApproved() {
        var proposal = actionService.propose(3L,
                request(ActionType.CREATE_REPLACEMENT_ORDER, "test-key-3", Map.of()));

        var rejection = actionService.reject(proposal.getToolCallId(), "agent", "not covered");
        assertThat(rejection.getStatus()).isEqualTo(ToolCallStatus.REJECTED);

        assertThatThrownBy(() -> actionService.approve(proposal.getToolCallId(), "agent", "late approval"))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    @DisplayName("Actions on security tickets are blocked (excessive agency guard)")
    void blocksActionsOnSecurityTickets() {
        assertThatThrownBy(() -> actionService.propose(4L,
                request(ActionType.START_REFUND_REVIEW, "test-key-4", Map.of("amount", 10))))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Security tickets");
    }

    @Test
    @DisplayName("Refund amount cannot exceed the order total")
    void rejectsAmountAboveOrderTotal() {
        assertThatThrownBy(() -> actionService.propose(3L,
                request(ActionType.START_REFUND_REVIEW, "test-key-5", Map.of("amount", 100000))))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("cannot exceed");
    }

    @Test
    @DisplayName("Recommendation only suggests actions for eligible categories")
    void recommendsOnlyForEligibleTickets() {
        var refund = actionService.recommend(1L);
        assertThat(refund.isRecommended()).isTrue();
        assertThat(refund.getRecommendedAction()).isEqualTo(ActionType.START_REFUND_REVIEW);

        var shipping = actionService.recommend(2L);
        assertThat(shipping.isRecommended()).isFalse();

        var security = actionService.recommend(4L);
        assertThat(security.isRecommended()).isFalse();
        assertThat(security.getRationale()).contains("Security");
    }
}
