package com.trustdesk.draft;

import com.trustdesk.entity.Draft;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/drafts")
@RequiredArgsConstructor
public class DraftController {

    private final DraftService draftService;

    @PostMapping("/generate")
    public ResponseEntity<DraftGenerationResponse> generateDraft(
            @RequestBody @Valid DraftGenerationRequest request) {
        return ResponseEntity.ok(draftService.generate(request));
    }

    @GetMapping("/{draftId}")
    public ResponseEntity<Draft> getDraft(@PathVariable Long draftId) {
        return ResponseEntity.ok(draftService.get(draftId));
    }

    @GetMapping("/ticket/{ticketId}")
    public ResponseEntity<List<Draft>> getDraftsByTicket(@PathVariable Long ticketId) {
        return ResponseEntity.ok(draftService.findByTicket(ticketId));
    }

    /** Human review of an AI draft: APPROVED or REJECTED. */
    @PatchMapping("/{draftId}/review")
    public ResponseEntity<Draft> review(@PathVariable Long draftId,
                                        @RequestBody @Valid DraftReviewRequest request) {
        return ResponseEntity.ok(draftService.review(draftId, request));
    }
}
