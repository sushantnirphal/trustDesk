package com.trustdesk.action;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/tickets/{ticketId}/actions")
@RequiredArgsConstructor
public class TicketActionController {

    private final ActionService actionService;

    @GetMapping
    public ResponseEntity<List<ActionProposalResponse>> list(@PathVariable Long ticketId) {
        return ResponseEntity.ok(actionService.listByTicket(ticketId));
    }

    @PostMapping("/recommend")
    public ResponseEntity<ActionRecommendation> recommend(@PathVariable Long ticketId) {
        return ResponseEntity.ok(actionService.recommend(ticketId));
    }

    @PostMapping
    public ResponseEntity<ActionProposalResponse> propose(@PathVariable Long ticketId,
                                                          @RequestBody @Valid ActionProposalRequest request) {
        ActionProposalResponse response = actionService.propose(ticketId, request);
        return ResponseEntity.status(response.isDuplicate() ? HttpStatus.OK : HttpStatus.CREATED)
                .body(response);
    }
}
