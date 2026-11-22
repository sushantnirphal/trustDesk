package com.trustdesk.guardrail;

import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

/**
 * Detects and redacts common PII: emails, phone numbers, credit cards, SSNs.
 * Used to prevent PII leakage in AI prompts, responses and logs.
 */
@Component
public class PiiRedactor {

    private static final Pattern EMAIL =
            Pattern.compile("[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}");

    private static final Pattern PHONE =
            Pattern.compile("(\\+?\\d{1,3}[-.\\s]?)?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}");

    private static final Pattern CREDIT_CARD =
            Pattern.compile("\\b(?:\\d[ -]*?){13,16}\\b");

    private static final Pattern SSN =
            Pattern.compile("\\b\\d{3}-\\d{2}-\\d{4}\\b");

    /** Returns true if the text contains any detected PII. */
    public boolean containsPii(String text) {
        if (text == null || text.isBlank()) return false;
        return EMAIL.matcher(text).find()
                || PHONE.matcher(text).find()
                || CREDIT_CARD.matcher(text).find()
                || SSN.matcher(text).find();
    }

    /** Replaces PII with typed placeholders. Order matters (SSN/card before phone). */
    public String redact(String text) {
        if (text == null) return null;
        String out = text;
        out = SSN.matcher(out).replaceAll("[REDACTED_SSN]");
        out = CREDIT_CARD.matcher(out).replaceAll("[REDACTED_CARD]");
        out = EMAIL.matcher(out).replaceAll("[REDACTED_EMAIL]");
        out = PHONE.matcher(out).replaceAll("[REDACTED_PHONE]");
        return out;
    }
}
