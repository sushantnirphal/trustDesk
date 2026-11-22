package com.trustdesk.draft;

import com.trustdesk.entity.Draft;
import com.trustdesk.enums.DraftStatus;
import com.trustdesk.exception.BadRequestException;
import com.trustdesk.exception.ResourceNotFoundException;
import com.trustdesk.repository.DraftRepository;
import com.trustdesk.ticket.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DraftServiceImpl implements DraftService {

    private final DraftGenerationService draftGenerationService;
    private final DraftRepository draftRepository;
    private final TicketService ticketService;

    @Override
    public DraftGenerationResponse generate(DraftGenerationRequest request) {
        if (!ticketService.existsById(request.getTicketId())) {
            throw new ResourceNotFoundException("Ticket not found: " + request.getTicketId());
        }
        return draftGenerationService.generateDraft(request);
    }

    @Override
    @Transactional(readOnly = true)
    public Draft get(Long draftId) {
        return draftRepository.findById(draftId)
                .orElseThrow(() -> new ResourceNotFoundException("Draft not found: " + draftId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Draft> findByTicket(Long ticketId) {
        if (!ticketService.existsById(ticketId)) {
            throw new ResourceNotFoundException("Ticket not found: " + ticketId);
        }
        return draftRepository.findByTicketId(ticketId);
    }

    @Override
    @Transactional
    public Draft review(Long draftId, DraftReviewRequest request) {
        if (request.getDecision() != DraftStatus.APPROVED && request.getDecision() != DraftStatus.REJECTED) {
            throw new BadRequestException("decision must be APPROVED or REJECTED");
        }

        Draft draft = get(draftId);
        draft.setStatus(request.getDecision());
        return draftRepository.save(draft);
    }
}
