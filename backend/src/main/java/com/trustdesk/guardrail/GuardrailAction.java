package com.trustdesk.guardrail;

/**
 * Severity/outcome of a guardrail check.
 * Ordered by severity: ALLOW &lt; WARN &lt; ESCALATE &lt; BLOCK.
 */
public enum GuardrailAction {
    ALLOW,
    WARN,
    ESCALATE,
    BLOCK;

    public static GuardrailAction max(GuardrailAction a, GuardrailAction b) {
        return a.ordinal() >= b.ordinal() ? a : b;
    }
}
