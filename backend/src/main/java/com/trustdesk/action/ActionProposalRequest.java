package com.trustdesk.action;

import com.trustdesk.enums.ActionType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActionProposalRequest {

    @NotNull(message = "actionType is required")
    private ActionType actionType;

    /** Action parameters, e.g. {"amount": 149.98, "reason": "damaged item"}. */
    private Map<String, Object> parameters;

    /** Optional client-supplied key; retries with the same key never duplicate the action. */
    private String idempotencyKey;

    private String rationale;
}
