package com.trustdesk.triage;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/tickets")
@RequiredArgsConstructor
public class TriageController {

    private final TriageService triageService;

    @PostMapping("/{ticketId}/triage")
    public ResponseEntity<TriageResponse> triageTicket(@PathVariable Long ticketId) {
        return ResponseEntity.ok(triageService.triageTicket(ticketId));
    }

    @PostMapping("/classify")
    public ResponseEntity<TriageResponse> classifyOnly(@RequestBody @Valid TriageRequest request) {
        return ResponseEntity.ok(triageService.classifyOnly(request));
    }

    @GetMapping("/{ticketId}/triage")
    public ResponseEntity<TriageStatusResponse> getTriageStatus(@PathVariable Long ticketId) {
        return ResponseEntity.ok(triageService.getTriageStatus(ticketId));
    }
}
