package com.trustdesk.exception;

/**
 * Thrown when a request is refused because it violates a safety policy
 * (prompt injection, excessive agency, unsafe action, etc.).
 */
public class GuardrailViolationException extends RuntimeException {
    public GuardrailViolationException(String message) {
        super(message);
    }
}
