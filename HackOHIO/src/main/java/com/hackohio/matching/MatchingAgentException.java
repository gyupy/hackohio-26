package com.hackohio.matching;

/**
 * Runtime exception thrown by the MatchingAgent when LLM API communication fails.
 *
 * <p>Covers two primary failure modes (Requirements 4.3, 4.4):
 * <ul>
 *   <li>Non-200 HTTP responses — carries the HTTP status code via
 *       {@link #getHttpStatusCode()}.</li>
 *   <li>Network timeouts and connection errors — wraps the original exception
 *       as the cause.</li>
 * </ul>
 */
public class MatchingAgentException extends RuntimeException {

    /** HTTP status code associated with the failure; {@code -1} when not applicable. */
    private final int httpStatusCode;

    /**
     * Constructs an exception with a descriptive message and no HTTP status code.
     * Used for non-HTTP failures such as parse errors or missing configuration.
     *
     * @param message human-readable description of the failure
     */
    public MatchingAgentException(String message) {
        super(message);
        this.httpStatusCode = -1;
    }

    /**
     * Constructs an exception that wraps an underlying cause (e.g. timeout or
     * connection error). Requirement 4.4.
     *
     * @param message human-readable description of the failure
     * @param cause   the original exception that triggered this failure
     */
    public MatchingAgentException(String message, Throwable cause) {
        super(message, cause);
        this.httpStatusCode = -1;
    }

    /**
     * Constructs an exception that records an HTTP status code returned by the
     * LLM API. Requirement 4.3.
     *
     * @param message        human-readable description of the failure
     * @param httpStatusCode the HTTP status code received from the remote API
     */
    public MatchingAgentException(String message, int httpStatusCode) {
        super(message);
        this.httpStatusCode = httpStatusCode;
    }

    /**
     * Returns the HTTP status code associated with this exception.
     *
     * @return the HTTP status code, or {@code -1} if this exception was not
     *         caused by an HTTP-level failure
     */
    public int getHttpStatusCode() {
        return httpStatusCode;
    }
}
