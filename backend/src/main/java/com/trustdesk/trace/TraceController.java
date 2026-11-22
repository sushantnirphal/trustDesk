package com.trustdesk.trace;

import com.trustdesk.enums.RunType;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/traces")
@RequiredArgsConstructor
public class TraceController {

    private final TraceService traceService;

    @GetMapping
    public ResponseEntity<List<TraceResponse>> list() {
        return ResponseEntity.ok(traceService.listAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TraceResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(traceService.get(id));
    }

    @GetMapping("/ticket/{ticketId}")
    public ResponseEntity<List<TraceResponse>> byTicket(@PathVariable Long ticketId) {
        return ResponseEntity.ok(traceService.listByTicket(ticketId));
    }

    @GetMapping("/type/{runType}")
    public ResponseEntity<List<TraceResponse>> byType(@PathVariable RunType runType) {
        return ResponseEntity.ok(traceService.listByRunType(runType));
    }
}
