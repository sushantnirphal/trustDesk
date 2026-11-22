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
public class EvalRunRequest {

    /** Optional subset of case IDs (e.g. ["EVAL-001"]). Empty/null runs all cases. */
    private List<String> caseIds;
}
