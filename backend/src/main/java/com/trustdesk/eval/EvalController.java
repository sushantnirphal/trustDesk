package com.trustdesk.eval;

import com.trustdesk.entity.EvalCase;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/eval")
@RequiredArgsConstructor
public class EvalController {

    private final EvalService evalService;

    @GetMapping("/cases")
    public ResponseEntity<List<EvalCase>> cases() {
        return ResponseEntity.ok(evalService.getCases());
    }

    @GetMapping("/cases/{caseId}")
    public ResponseEntity<EvalCase> caseById(@PathVariable String caseId) {
        return ResponseEntity.ok(evalService.getCase(caseId));
    }

    /** Run all eval cases (or a subset) and return the summary report. */
    @PostMapping("/run")
    public ResponseEntity<EvalRunResponse> run(@RequestBody(required = false) EvalRunRequest request) {
        return ResponseEntity.ok(evalService.run(request));
    }
}
