package com.trustdesk.action;

import com.trustdesk.enums.ActionType;
import com.trustdesk.enums.ToolCallStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActionProposalResponse {

    private Long toolCallId;
    private Long ticketId;
    private ActionType actionType;
    private ToolCallStatus status;
    private boolean requiresApproval;
    private boolean duplicate;
    private String idempotencyKey;
    private Map<String, Object> parameters;
    private String rationale;
    private String approvedBy;
    private String result;
    private LocalDateTime createdAt;
    private LocalDateTime approvedAt;
    private LocalDateTime executedAt;
}
