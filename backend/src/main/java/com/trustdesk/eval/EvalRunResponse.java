package com.trustdesk.eval;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvalRunResponse {

    private String runId;
    private int totalCases;
    private int passedCases;

    private double triageAccuracy;
    private double escalationAccuracy;
    private double citationCoverage;
    private double unsafeActionBlockingRate;
    private double overallPassRate;

    private long durationMs;
    private LocalDateTime startedAt;
    private List<EvalCaseResult> results;
}
