package com.trustdesk.guardrail;

import com.trustdesk.retrieval.KnowledgeBaseSearchResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentGuardrailResult {

    /** Documents safe to include in the LLM context. */
    private List<KnowledgeBaseSearchResponse.MatchedDocument> safeDocuments;

    /** IDs of documents that were blocked (e.g. KB-ADVERSARIAL-001). */
    private List<String> blockedDocumentIds;

    private List<String> violations;

    private boolean passed;
}
