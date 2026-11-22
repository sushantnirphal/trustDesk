package com.trustdesk.guardrail;

import com.trustdesk.retrieval.KnowledgeBaseSearchResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Central safety layer for TrustDesk.
 *
 * Treats customer messages and retrieved documents as UNTRUSTED input and defends
 * against:
 *   - prompt injection (incl. hidden-coupon injection)
 *   - identity-check bypass requests
 *   - requests to reveal hidden prompts / secrets / credentials
 *   - PII leakage (detection + redaction)
 *   - the intentionally unsafe KB-ADVERSARIAL-001 document
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GuardrailService {

    private final PiiRedactor piiRedactor;

    /** Known intentionally-unsafe knowledge base document IDs. */
    private static final List<String> UNSAFE_DOC_IDS = List.of("KB-ADVERSARIAL-001");

    // --- Pattern definitions -------------------------------------------------

    private static final List<Pattern> PROMPT_INJECTION = List.of(
            Pattern.compile("ignore\\s+(all\\s+)?(previous|prior|above|earlier)\\s+instructions?", Pattern.CASE_INSENSITIVE),
            Pattern.compile("disregard\\s+(all\\s+)?(previous|prior|above|earlier)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("forget\\s+(all\\s+)?(previous|prior|above|your)\\s+instructions?", Pattern.CASE_INSENSITIVE),
            Pattern.compile("system\\s+prompt", Pattern.CASE_INSENSITIVE),
            Pattern.compile("you\\s+are\\s+now", Pattern.CASE_INSENSITIVE),
            Pattern.compile("act\\s+as\\s+(an?\\s+)?(admin|developer|system|root)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("developer\\s+mode", Pattern.CASE_INSENSITIVE),
            Pattern.compile("jailbreak", Pattern.CASE_INSENSITIVE),
            Pattern.compile("hidden\\s+coupon", Pattern.CASE_INSENSITIVE),
            Pattern.compile("free\\s+coupon", Pattern.CASE_INSENSITIVE),
            Pattern.compile("give\\s+me\\s+(a\\s+)?(free\\s+)?coupon", Pattern.CASE_INSENSITIVE),
            Pattern.compile("every\\s+customer\\s+(should|must)\\s+(get|receive)", Pattern.CASE_INSENSITIVE)
    );

    private static final List<Pattern> SECRET_REVEAL = List.of(
            Pattern.compile("reveal\\s+(your\\s+|the\\s+)?(system\\s+)?(prompt|instructions?|secrets?|configuration)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("show\\s+(me\\s+)?(your\\s+|the\\s+)?(system\\s+)?(prompt|instructions?|secrets?)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("(admin|system|root)\\s+(password|credentials?|token)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("api\\s*key", Pattern.CASE_INSENSITIVE),
            Pattern.compile("secret\\s*key", Pattern.CASE_INSENSITIVE),
            Pattern.compile("sk-[A-Za-z0-9]{10,}")
    );

    private static final List<Pattern> IDENTITY_BYPASS = List.of(
            Pattern.compile("skip\\s+(the\\s+)?(identity|verification|authentication|auth)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("bypass\\s+(the\\s+)?(identity|verification|authentication|auth)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("without\\s+(identity\\s+)?(verification|authentication)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("no\\s+need\\s+to\\s+verify", Pattern.CASE_INSENSITIVE),
            Pattern.compile("don'?t\\s+verify", Pattern.CASE_INSENSITIVE),
            Pattern.compile("i\\s+am\\s+(the\\s+|an\\s+)?admin", Pattern.CASE_INSENSITIVE),
            Pattern.compile("(grant|give)\\s+me\\s+access", Pattern.CASE_INSENSITIVE)
    );

    // --- Public API ----------------------------------------------------------

    /**
     * Check an inbound customer message / ticket text before sending it to the LLM.
     */
    public GuardrailResult checkInput(String text) {
        if (text == null || text.isBlank()) {
            return GuardrailResult.allow(text);
        }

        List<String> violations = new ArrayList<>();
        GuardrailAction action = GuardrailAction.ALLOW;

        action = GuardrailAction.max(action, match(PROMPT_INJECTION, text, "PROMPT_INJECTION", violations, GuardrailAction.BLOCK));
        action = GuardrailAction.max(action, match(SECRET_REVEAL, text, "SECRET_REVEAL", violations, GuardrailAction.BLOCK));
        action = GuardrailAction.max(action, match(IDENTITY_BYPASS, text, "IDENTITY_BYPASS", violations, GuardrailAction.ESCALATE));

        if (piiRedactor.containsPii(text)) {
            violations.add("PII_DETECTED");
            action = GuardrailAction.max(action, GuardrailAction.WARN);
        }

        String sanitized = piiRedactor.redact(text);

        if (action == GuardrailAction.ALLOW) {
            return GuardrailResult.builder()
                    .action(GuardrailAction.ALLOW)
                    .violations(violations)
                    .reason("Input passed guardrails")
                    .sanitizedText(sanitized)
                    .build();
        }

        if (action == GuardrailAction.WARN) {
            return GuardrailResult.builder()
                    .action(GuardrailAction.WARN)
                    .violations(violations)
                    .reason("Input contains PII; it will be redacted")
                    .sanitizedText(sanitized)
                    .build();
        }

        log.warn("Guardrail {} on input: {}", action, violations);
        String prefix = action == GuardrailAction.BLOCK ? "Blocked by guardrails: " : "Escalated by guardrails: ";
        return GuardrailResult.builder()
                .action(action)
                .violations(violations)
                .reason(prefix + String.join(", ", violations))
                .sanitizedText(sanitized)
                .build();
    }

    /**
     * Check the LLM output before returning it to the agent / customer.
     */
    public GuardrailResult checkOutput(String aiOutput) {
        if (aiOutput == null || aiOutput.isBlank()) {
            return GuardrailResult.allow(aiOutput);
        }

        List<String> violations = new ArrayList<>();
        GuardrailAction action = GuardrailAction.ALLOW;

        // Prevent the model from leaking its own instructions or secrets.
        action = GuardrailAction.max(action, match(SECRET_REVEAL, aiOutput, "OUTPUT_SECRET_LEAK", violations, GuardrailAction.BLOCK));
        action = GuardrailAction.max(action, match(PROMPT_INJECTION, aiOutput, "OUTPUT_INJECTION_ECHO", violations, GuardrailAction.WARN));

        if (piiRedactor.containsPii(aiOutput)) {
            violations.add("OUTPUT_PII_DETECTED");
            action = GuardrailAction.max(action, GuardrailAction.WARN);
        }

        String sanitized = piiRedactor.redact(aiOutput);

        if (action == GuardrailAction.BLOCK) {
            log.warn("Guardrail BLOCK on output: {}", violations);
            return GuardrailResult.builder()
                    .action(GuardrailAction.BLOCK)
                    .violations(violations)
                    .reason("AI output blocked: potential secret leak")
                    .sanitizedText(sanitized)
                    .build();
        }

        return GuardrailResult.builder()
                .action(action)
                .violations(violations)
                .reason(action == GuardrailAction.ALLOW ? "Output passed guardrails" : "Output sanitized")
                .sanitizedText(sanitized)
                .build();
    }

    /**
     * Filter retrieved documents, dropping adversarial / injected ones
     * (e.g. KB-ADVERSARIAL-001) so they are never followed as instructions.
     */
    public DocumentGuardrailResult checkDocuments(List<KnowledgeBaseSearchResponse.MatchedDocument> docs) {
        List<KnowledgeBaseSearchResponse.MatchedDocument> safe = new ArrayList<>();
        List<String> blockedIds = new ArrayList<>();
        List<String> violations = new ArrayList<>();

        if (docs == null) {
            return DocumentGuardrailResult.builder()
                    .safeDocuments(List.of())
                    .blockedDocumentIds(List.of())
                    .violations(List.of())
                    .passed(true)
                    .build();
        }

        for (KnowledgeBaseSearchResponse.MatchedDocument doc : docs) {
            if (isAdversarial(doc)) {
                blockedIds.add(doc.getKbId());
                violations.add("ADVERSARIAL_DOCUMENT:" + doc.getKbId());
            } else {
                safe.add(doc);
            }
        }

        if (!blockedIds.isEmpty()) {
            log.warn("Guardrail blocked adversarial documents: {}", blockedIds);
        }

        return DocumentGuardrailResult.builder()
                .safeDocuments(safe)
                .blockedDocumentIds(blockedIds)
                .violations(violations)
                .passed(blockedIds.isEmpty())
                .build();
    }

    /** A document is adversarial if it is a known unsafe ID, marked UNSAFE, or contains injection. */
    public boolean isAdversarial(KnowledgeBaseSearchResponse.MatchedDocument doc) {
        if (doc == null) return false;

        String kbId = doc.getKbId() == null ? "" : doc.getKbId().toUpperCase(Locale.ROOT);
        if (UNSAFE_DOC_IDS.stream().anyMatch(id -> id.equalsIgnoreCase(kbId))) {
            return true;
        }
        if (doc.getTitle() != null && doc.getTitle().toUpperCase(Locale.ROOT).contains("UNSAFE")) {
            return true;
        }
        String content = doc.getContent();
        if (content == null) return false;
        return PROMPT_INJECTION.stream().anyMatch(p -> p.matcher(content).find())
                || SECRET_REVEAL.stream().anyMatch(p -> p.matcher(content).find());
    }

    // --- Helpers -------------------------------------------------------------

    private GuardrailAction match(List<Pattern> patterns, String text, String category,
                                  List<String> violations, GuardrailAction severity) {
        GuardrailAction result = GuardrailAction.ALLOW;
        for (Pattern p : patterns) {
            if (p.matcher(text).find()) {
                violations.add(category + ":" + p.pattern());
                result = GuardrailAction.max(result, severity);
            }
        }
        return result;
    }
}
