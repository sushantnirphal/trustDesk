package com.trustdesk.action;

import com.trustdesk.enums.ActionType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActionRecommendation {

    private Long ticketId;
    private ActionType recommendedAction;
    private boolean recommended;
    private String rationale;
    private Map<String, Object> suggestedParameters;
    private boolean requiresHumanApproval;
}
