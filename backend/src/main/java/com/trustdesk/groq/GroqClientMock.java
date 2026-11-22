package com.trustdesk.groq;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

/**
 * Deterministic mock used for tests and for local demos without a Groq key.
 * Activated by the "test" profile.
 *
 * It analyses only the ticket subject + description (not the customer/order
 * context) so order fields like "Warranty: 730 days" do not skew classification.
 */
@Component
@Profile("test")
@Primary
@Slf4j
public class GroqClientMock implements GroqClient {

    @Override
    public String generate(List<Map<String, String>> messages, double temperature) {
        String userMessage = messages.stream()
                .filter(m -> "user".equals(m.get("role")))
                .map(m -> m.get("content"))
                .findFirst()
                .orElse("")
                .toLowerCase();

        log.info("GroqClientMock invoked");

        // Draft prompts ask for a JSON object with "content"
        if (userMessage.contains("generate a draft") || userMessage.contains("knowledge base documents")) {
            return """
                    {
                      "content": "Thank you for reaching out. Based on our policy [KB-REFUND-001], refunds are available within 30 days of delivery for damaged items. We will process your request accordingly.",
                      "citation_ids": ["KB-REFUND-001"],
                      "status": "GENERATED",
                      "refusal_reason": "",
                      "grounding_score": 0.85
                    }
                    """;
        }

        // For triage, isolate the subject + description so order context
        // (e.g. "Warranty: 730 days") does not interfere.
        String ticketText = extractTicketText(userMessage);

        // Order matters: security first (highest priority), then refund, shipping, warranty, billing.
        if (containsAny(ticketText, "login", "log in", "log into", "security", "unauthorized", "hacked", "password", "breach", "new device")) {
            return triage("ACCOUNT_SECURITY", "URGENT", true, "Account security issue");
        }
        if (containsAny(ticketText, "refund", "damaged", "money back", "return the")) {
            return triage("REFUND", "HIGH", false, "Refund request");
        }
        if (containsAny(ticketText, "package", "ship", "delivery", "tracking", "where is my")) {
            return triage("SHIPPING", "MEDIUM", false, "Shipping inquiry");
        }
        if (containsAny(ticketText, "warranty", "broken", "stopped working", "defective", "repair")) {
            return triage("WARRANTY", "MEDIUM", false, "Warranty claim");
        }
        if (containsAny(ticketText, "billing", "charged", "invoice", "duplicate", "subscription")) {
            return triage("BILLING", "LOW", false, "Billing inquiry");
        }
        return triage("GENERAL", "MEDIUM", false, "General inquiry");
    }

    private String extractTicketText(String userMessage) {
        int start = userMessage.indexOf("ticket subject:");
        if (start < 0) start = 0;
        int end = userMessage.indexOf("customer context:", start);
        if (end < 0) end = userMessage.indexOf("order context:", start);
        if (end < 0) end = userMessage.length();
        return userMessage.substring(start, end);
    }

    private boolean containsAny(String text, String... keywords) {
        for (String k : keywords) {
            if (text.contains(k)) return true;
        }
        return false;
    }

    private String triage(String category, String priority, boolean escalation, String reasoning) {
        return String.format(
                "{\"category\":\"%s\",\"priority\":\"%s\",\"escalation_needed\":%s,\"reasoning\":\"%s\"}",
                category, priority, escalation, reasoning);
    }

    @Override
    public boolean isAvailable() {
        return true;
    }
}
