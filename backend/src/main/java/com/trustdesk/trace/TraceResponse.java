package com.trustdesk.trace;

import com.trustdesk.enums.RunType;
import com.trustdesk.enums.TraceStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TraceResponse {

    private Long id;
    private Long ticketId;
    private RunType runType;
    private List<String> retrievedDocIds;
    private Object toolActions;
    private String guardrailResult;
    private TraceStatus finalStatus;
    private LocalDateTime timestamp;
}
