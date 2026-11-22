package com.trustdesk.action;

import com.trustdesk.enums.ApprovalDecision;
import com.trustdesk.enums.ToolCallStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovalResponse {

    private Long approvalId;
    private Long toolCallId;
    private ToolCallStatus status;
    private ApprovalDecision decision;
    private String approver;
    private String comments;
    private String result;
    private boolean duplicate;
    private LocalDateTime timestamp;
}
