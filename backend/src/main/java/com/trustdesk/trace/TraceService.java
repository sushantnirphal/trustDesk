package com.trustdesk.trace;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.trustdesk.entity.Trace;
import com.trustdesk.enums.RunType;
import com.trustdesk.enums.TraceStatus;
import com.trustdesk.exception.ResourceNotFoundException;
import com.trustdesk.repository.TraceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Minimal observability layer: one trace per AI run.
 * Stores ticket, run type, retrieved document IDs, tool actions,
 * guardrail outcome and the final status.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TraceService {

    private static final int MAX_GUARDRAIL_LENGTH = 500;

    private final TraceRepository traceRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public Trace record(Long ticketId, RunType runType, List<String> retrievedDocIds,
                        Object toolActions, String guardrailResult, TraceStatus finalStatus) {
        Trace trace = Trace.builder()
                .ticketId(ticketId)
                .runType(runType)
                .retrievedDocIds(toJson(retrievedDocIds == null ? List.of() : retrievedDocIds))
                .toolActions(toolActions == null ? null : toJson(toolActions))
                .guardrailResult(truncate(guardrailResult))
                .finalStatus(finalStatus == null ? TraceStatus.SUCCESS : finalStatus)
                .build();

        Trace saved = traceRepository.save(trace);
        log.info("Trace {}: ticket={} runType={} status={} guardrail={}",
                saved.getId(), ticketId, runType, saved.getFinalStatus(), saved.getGuardrailResult());
        return saved;
    }

    @Transactional(readOnly = true)
    public List<TraceResponse> listAll() {
        return traceRepository.findAllByOrderByTimestampDesc().stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<TraceResponse> listByTicket(Long ticketId) {
        return traceRepository.findByTicketIdOrderByTimestampDesc(ticketId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<TraceResponse> listByRunType(RunType runType) {
        return traceRepository.findByRunTypeOrderByTimestampDesc(runType)
                .stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public TraceResponse get(Long id) {
        Trace trace = traceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Trace not found: " + id));
        return toResponse(trace);
    }

    // --- Helpers -------------------------------------------------------------

    private TraceResponse toResponse(Trace trace) {
        return TraceResponse.builder()
                .id(trace.getId())
                .ticketId(trace.getTicketId())
                .runType(trace.getRunType())
                .retrievedDocIds(parseList(trace.getRetrievedDocIds()))
                .toolActions(parseObject(trace.getToolActions()))
                .guardrailResult(trace.getGuardrailResult())
                .finalStatus(trace.getFinalStatus())
                .timestamp(trace.getTimestamp())
                .build();
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception ex) {
            log.warn("Could not serialize trace payload", ex);
            return String.valueOf(value);
        }
    }

    @SuppressWarnings("unchecked")
    private List<String> parseList(String json) {
        if (json == null || json.isBlank()) return List.of();
        try {
            return objectMapper.readValue(json, List.class);
        } catch (Exception ex) {
            return List.of();
        }
    }

    private Object parseObject(String json) {
        if (json == null || json.isBlank()) return null;
        try {
            return objectMapper.readValue(json, Object.class);
        } catch (Exception ex) {
            return json;
        }
    }

    private String truncate(String value) {
        if (value == null) return null;
        return value.length() <= MAX_GUARDRAIL_LENGTH ? value : value.substring(0, MAX_GUARDRAIL_LENGTH);
    }
}
