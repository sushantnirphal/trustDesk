package com.trustdesk.draft;

import com.trustdesk.enums.DraftStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DraftReviewRequest {

    /** APPROVED or REJECTED. */
    @NotNull(message = "decision is required")
    private DraftStatus decision;

    private String comments;
}
