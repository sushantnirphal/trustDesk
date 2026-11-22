package com.trustdesk.eval;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvalCaseResult {

    private String caseId;
    private String input;
    private String expectedOutput;
    private String actualOutput;
    private Boolean expectedEscalation;
    private Boolean actualEscalation;
    private String guardrailAction;
    private List<String> guardrailViolations;

    private boolean triagePassed;
    private boolean escalationPassed;
    private boolean unsafeActionBlocked;
    private boolean citationCovered;
    private boolean passed;

    private String notes;
}
