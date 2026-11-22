package com.trustdesk.groq;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GroqMessage {
    private String role;    // system | user | assistant
    private String content;
}
