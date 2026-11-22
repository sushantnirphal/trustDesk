package com.trustdesk.action;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/actions")
@RequiredArgsConstructor
public class ActionController {

    private final ActionService actionService;

    @GetMapping
    public ResponseEntity<List<ActionProposalResponse>> list() {
        return ResponseEntity.ok(actionService.listAll());
    }

    @GetMapping("/pending")
    public ResponseEntity<List<ActionProposalResponse>> pending() {
        return ResponseEntity.ok(actionService.listPending());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ActionProposalResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(actionService.get(id));
    }

    @GetMapping("/ticket/{ticketId}")
    public ResponseEntity<List<ActionProposalResponse>> byTicket(@PathVariable Long ticketId) {
        return ResponseEntity.ok(actionService.listByTicket(ticketId));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('AGENT','ADMIN')")
    public ResponseEntity<ApprovalResponse> approve(@PathVariable Long id,
                                                    @RequestBody(required = false) @Valid ApprovalRequest request,
                                                    Authentication authentication) {
        String comments = request == null ? null : request.getComments();
        return ResponseEntity.ok(actionService.approve(id, authentication.getName(), comments));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('AGENT','ADMIN')")
    public ResponseEntity<ApprovalResponse> reject(@PathVariable Long id,
                                                   @RequestBody(required = false) @Valid ApprovalRequest request,
                                                   Authentication authentication) {
        String comments = request == null ? null : request.getComments();
        return ResponseEntity.ok(actionService.reject(id, authentication.getName(), comments));
    }
}
