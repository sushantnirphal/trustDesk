package com.trustdesk.draft;

import com.trustdesk.entity.Draft;

import java.util.List;

public interface DraftService {

    DraftGenerationResponse generate(DraftGenerationRequest request);

    Draft get(Long draftId);

    List<Draft> findByTicket(Long ticketId);

    Draft review(Long draftId, DraftReviewRequest request);
}
