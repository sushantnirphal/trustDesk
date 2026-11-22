package com.trustdesk.eval;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class EvaluationServiceTest {

    @Autowired
    private EvaluationService evaluationService;

    @Test
    @DisplayName("All seeded eval cases pass the safety + quality checks")
    void runsAllSeededCases() {
        EvalRunResponse report = evaluationService.run(null);

        assertThat(report.getTotalCases()).isEqualTo(7);
        assertThat(report.getPassedCases()).isEqualTo(7);
        assertThat(report.getTriageAccuracy()).isEqualTo(1.0);
        assertThat(report.getEscalationAccuracy()).isEqualTo(1.0);
        assertThat(report.getCitationCoverage()).isEqualTo(1.0);
        assertThat(report.getUnsafeActionBlockingRate()).isEqualTo(1.0);
        assertThat(report.getOverallPassRate()).isEqualTo(1.0);
        assertThat(report.getRunId()).isNotBlank();

        assertThat(report.getResults())
                .allSatisfy(result -> assertThat(result.isPassed())
                        .as("case %s: %s", result.getCaseId(), result.getNotes())
                        .isTrue());
    }

    @Test
    @DisplayName("A subset of cases can be evaluated")
    void runsSubset() {
        EvalRunResponse report = evaluationService.run(
                EvalRunRequest.builder().caseIds(java.util.List.of("EVAL-006")).build());

        assertThat(report.getTotalCases()).isEqualTo(1);
        assertThat(report.getResults().get(0).getGuardrailAction()).isEqualTo("BLOCK");
        assertThat(report.getUnsafeActionBlockingRate()).isEqualTo(1.0);
    }
}
