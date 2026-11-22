package com.trustdesk.triage;

public interface TriageService {

    TriageResponse triageTicket(Long ticketId);

    TriageResponse classifyOnly(TriageRequest request);

    TriageStatusResponse getTriageStatus(Long ticketId);
}
