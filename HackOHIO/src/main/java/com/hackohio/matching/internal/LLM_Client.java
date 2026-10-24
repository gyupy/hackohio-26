package com.hackohio.matching.internal;

import com.hackohio.matching.MatchingAgentException;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.time.Duration;
import java.util.Objects;

/**
 * Wraps Java 11's {@link java.net.http.HttpClient} to send a prompt to the LLM API and return
 * the raw response body.
 *
 * <p>Request format (Requirement 4.1):
 * <pre>
 * POST {LLM_API_URL}
 * Authorization: Bearer {LLM_API_KEY}
 * Content-Type: text/plain
 *
 * {prompt string}
 * </pre>
 *
 * <p>Failure handling:
 * <ul>
 *   <li>HTTP status != 200 → {@link MatchingAgentException} carrying the status and body
 *       (Requirement 4.3).</li>
 *   <li>Request timeout → {@link MatchingAgentException} wrapping the cause (Requirement 4.4).</li>
 *   <li>Connection / I/O error → {@link MatchingAgentException} wrapping the cause
 *       (Requirement 4.4).</li>
 * </ul>
 *
 * <p>The value of {@code LLM_API_KEY} is never included in any exception message or
 * {@link #toString()} output. It is only ever placed in the outgoing {@code Authorization}
 * header (Requirements 4.5, 4.6 for timeout configuration; secret-safety per Requirement 2.6).
 */
public class LLM_Client {

    private static final int HTTP_OK = 200;

    private final EnvironmentConfig config;
    private final HttpClient httpClient;

    /**
     * Primary constructor used in production. Builds a default {@link HttpClient} whose connect
     * timeout is taken from {@link EnvironmentConfig#getTimeoutSeconds()}.
     *
     * @param config the validated environment configuration; must not be null
     */
    public LLM_Client(EnvironmentConfig config) {
        this(config, buildDefaultClient(config));
    }

    /**
     * Package-private seam for unit testing. Accepts an injected {@link HttpClient} so tests can
     * supply a mock or stub without performing real network I/O.
     *
     * @param config     the validated environment configuration; must not be null
     * @param httpClient the HTTP client to use for sending requests; must not be null
     */
    LLM_Client(EnvironmentConfig config, HttpClient httpClient) {
        this.config = Objects.requireNonNull(config, "config must not be null");
        this.httpClient = Objects.requireNonNull(httpClient, "httpClient must not be null");
    }

    /**
     * Builds the default {@link HttpClient}, applying the configured timeout as the connection
     * timeout.
     */
    private static HttpClient buildDefaultClient(EnvironmentConfig config) {
        Objects.requireNonNull(config, "config must not be null");
        return HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(config.getTimeoutSeconds()))
                .build();
    }

    /**
     * Sends the supplied prompt to the LLM API as an HTTP POST and returns the raw response body.
     *
     * @param prompt the fully-formed prompt string to send as the request body
     * @return the raw response body string returned by the LLM API on an HTTP 200 response
     * @throws MatchingAgentException if the API returns a non-200 status (carrying status and
     *                                body), if the request times out, or if a connection/I/O
     *                                error occurs
     */
    public String send(String prompt) throws MatchingAgentException {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(config.getApiUrl()))
                .timeout(Duration.ofSeconds(config.getTimeoutSeconds()))
                .header("Content-Type", "text/plain")
                .header("Authorization", "Bearer " + config.getApiKey())
                .POST(HttpRequest.BodyPublishers.ofString(prompt))
                .build();

        try {
            HttpResponse<String> response =
                    httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            int status = response.statusCode();
            if (status != HTTP_OK) {
                // Includes status and body only — never the API key (Requirement 4.3, 2.6).
                throw new MatchingAgentException(
                        "LLM API returned HTTP " + status + ": " + response.body(), status);
            }
            return response.body();
        } catch (HttpTimeoutException e) {
            // Must be caught before IOException since it is a subclass (Requirement 4.4).
            throw new MatchingAgentException("LLM API request timed out", e);
        } catch (IOException e) {
            throw new MatchingAgentException("LLM API connection error", e);
        } catch (InterruptedException e) {
            // Restore the interrupt flag so callers can observe the interruption.
            Thread.currentThread().interrupt();
            throw new MatchingAgentException("LLM API connection error", e);
        }
    }

    /**
     * Returns a diagnostic representation that deliberately omits any secret material. The
     * delegated {@link EnvironmentConfig#toString()} also masks the API key.
     */
    @Override
    public String toString() {
        return "LLM_Client{config=" + config + "}";
    }
}
