package com.hackohio.matching.internal;

import java.util.Map;

/**
 * Reads and validates LLM API configuration from environment variables at construction time.
 *
 * <p>Recognized variables:
 * <ul>
 *   <li>{@code LLM_API_KEY} — required, non-blank bearer token.</li>
 *   <li>{@code LLM_API_URL} — required, non-blank URL beginning with {@code http://} or {@code https://}.</li>
 *   <li>{@code LLM_REQUEST_TIMEOUT_SECONDS} — optional integer in [1, 300]; defaults to 30.</li>
 * </ul>
 *
 * <p>The value of {@code LLM_API_KEY} is never included in any exception message, log output,
 * or {@link #toString()} representation.
 *
 * <p>Satisfies Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 4.5, 4.6.
 */
public class EnvironmentConfig {

    static final String ENV_API_KEY = "LLM_API_KEY";
    static final String ENV_API_URL = "LLM_API_URL";
    static final String ENV_TIMEOUT = "LLM_REQUEST_TIMEOUT_SECONDS";

    static final int DEFAULT_TIMEOUT_SECONDS = 30;
    static final int MIN_TIMEOUT_SECONDS = 1;
    static final int MAX_TIMEOUT_SECONDS = 300;

    private final String apiKey;
    private final String apiUrl;
    private final int timeoutSeconds;

    /**
     * Constructs an {@code EnvironmentConfig} by reading values from the process environment
     * via {@link System#getenv()}.
     *
     * @throws IllegalStateException if {@code LLM_API_KEY} or {@code LLM_API_URL} is missing/blank,
     *                               or if {@code LLM_API_URL} is not a valid URL
     */
    public EnvironmentConfig() {
        this(System.getenv());
    }

    /**
     * Constructs an {@code EnvironmentConfig} from the supplied environment map. This package-private
     * seam exists so unit tests can inject arbitrary values without polluting the real process
     * environment.
     *
     * @param env a map of environment-variable names to values; must not be null
     * @throws IllegalStateException if {@code LLM_API_KEY} or {@code LLM_API_URL} is missing/blank,
     *                               or if {@code LLM_API_URL} is not a valid URL
     */
    public EnvironmentConfig(Map<String, String> env) {
        String key = env.get(ENV_API_KEY);
        if (key == null || key.isBlank()) {
            // Never include the key value in the message.
            throw new IllegalStateException(ENV_API_KEY + " is not set");
        }

        String url = env.get(ENV_API_URL);
        if (url == null || url.isBlank()) {
            throw new IllegalStateException(ENV_API_URL + " is not set");
        }
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            throw new IllegalStateException(ENV_API_URL + " is not a valid URL");
        }

        this.apiKey = key;
        this.apiUrl = url;
        this.timeoutSeconds = parseTimeout(env.get(ENV_TIMEOUT));
    }

    /**
     * Parses the raw timeout value, falling back to {@link #DEFAULT_TIMEOUT_SECONDS} when it is
     * absent, non-numeric, or outside the inclusive range [{@link #MIN_TIMEOUT_SECONDS},
     * {@link #MAX_TIMEOUT_SECONDS}].
     */
    private static int parseTimeout(String raw) {
        if (raw == null || raw.isBlank()) {
            return DEFAULT_TIMEOUT_SECONDS;
        }
        try {
            int parsed = Integer.parseInt(raw.trim());
            if (parsed >= MIN_TIMEOUT_SECONDS && parsed <= MAX_TIMEOUT_SECONDS) {
                return parsed;
            }
            return DEFAULT_TIMEOUT_SECONDS;
        } catch (NumberFormatException e) {
            return DEFAULT_TIMEOUT_SECONDS;
        }
    }

    /** Returns the LLM API bearer token read from {@code LLM_API_KEY}. */
    public String getApiKey() {
        return apiKey;
    }

    /** Returns the LLM API endpoint URL read from {@code LLM_API_URL}. */
    public String getApiUrl() {
        return apiUrl;
    }

    /** Returns the effective request timeout in seconds (default 30). */
    public int getTimeoutSeconds() {
        return timeoutSeconds;
    }

    /**
     * Returns a diagnostic representation that deliberately omits the API key value to avoid
     * leaking the secret (Requirement 2.6).
     */
    @Override
    public String toString() {
        return "EnvironmentConfig{apiUrl=" + apiUrl
                + ", timeoutSeconds=" + timeoutSeconds
                + ", apiKey=***}";
    }
}
