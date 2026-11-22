package com.trustdesk.entity;

import com.trustdesk.enums.RunType;
import com.trustdesk.enums.TraceStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "traces")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Trace {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ticket_id", nullable = false)
    private Long ticketId;

    @Enumerated(EnumType.STRING)
    @Column(name = "run_type", nullable = false, length = 20)
    private RunType runType;

    @Column(name = "retrieved_doc_ids", columnDefinition = "TEXT")
    private String retrievedDocIds; // JSON array

    @Column(name = "tool_actions", columnDefinition = "TEXT")
    private String toolActions; // JSON

    @Column(name = "guardrail_result", length = 500)
    private String guardrailResult;

    @Enumerated(EnumType.STRING)
    @Column(name = "final_status", nullable = false, length = 20)
    private TraceStatus finalStatus;

    @Column(name = "timestamp")
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        this.timestamp = LocalDateTime.now();
    }
}
