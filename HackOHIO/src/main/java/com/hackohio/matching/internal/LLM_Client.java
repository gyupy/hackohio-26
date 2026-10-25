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
 * Wraps Java 11's {@link java.net.http.HttpClient} to send a prompt to the Google Gemini
 * generateContent API and return the raw response body.
 *
 * <p>Request format:
 * <pre>
 * POST {LLM_API_URL}
 * Content-Type: application/json
 * x-goog-api-key: {LLM_API_KEY}
 *
 * {"contents":[{"parts":[{"text":"{prompt}"}]}]}
 * </pre>
 *
 * <p>The {@code LLM_API_URL} should be the Gemini generateContent endpoint, e.g.
 * {@code https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent}.
 *
 * <p>Failure handling:
 * <ul>
 *   <li>HTTP status != 200 → {@link MatchingAgentException} carrying the status and body.</li>
 *   <li>Request timeout → {@link MatchingAgentException} wrapping the cause.</li>
 *   <li>Connection / I/O error → {@link MatchingAgentException} wrapping the cause.</li>
 * </ul>
 *
 * <p>The value of {@code LLM_API_KEY} is never included in any exception message or
 * {@link #toString()} output. It is only ever placed in the outgoing {@code x-goog-api-key}
 * header.
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

    private static HttpClient buildDefaultClient(EnvironmentConfig config) {
        Objects.requireNonNull(config, "config must not be null");
        return HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(config.getTimeoutSeconds()))
                .build();
    }

    /**
     * Sends the supplied prompt to the Gemini API as an HTTP POST and returns the raw response
     * body (the full Gemini JSON envelope).
     *
     * @param prompt the fully-formed prompt string to embed in the Gemini request
     * @return the raw response body string returned on an HTTP 200 response
     * @throws MatchingAgentException if the API returns a non-200 status, times out, or a
     *                                connection/I/O error occurs
     */
    public String send(String prompt) throws MatchingAgentException {
        String requestBody = buildGeminiRequestBody(prompt);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(config.getApiUrl()))
                .timeout(Duration.ofSeconds(config.getTimeoutSeconds()))
                .header("Content-Type", "application/json")
                .header("x-goog-api-key", config.getApiKey())
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        try {
            HttpResponse<String> response =
                    httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            int status = response.statusCode();
            if (status != HTTP_OK) {
                throw new MatchingAgentException(
                        "LLM API returned HTTP " + status + ": " + response.body(), status);
            }
            return response.body();
        } catch (HttpTimeoutException e) {
            throw new MatchingAgentException("LLM API request timed out", e);
        } catch (IOException e) {
            throw new MatchingAgentException("LLM API connection error", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new MatchingAgentException("LLM API connection error", e);
        }
    }

    /**
     * Wraps the prompt in the Gemini {@code generateContent} request envelope, JSON-escaping the
     * prompt text so arbitrary content is transmitted safely.
     */
    private static String buildGeminiRequestBody(String prompt) {
        String escaped = jsonEscape(prompt == null ? "" : prompt);
        return "{\"contents\":[{\"parts\":[{\"text\":\"" + escaped + "\"}]}]}";
    }

    /**
     * Minimal JSON string escaper for the prompt text (quotes, backslashes, and control chars).
     */
    private static String jsonEscape(String s) {
        StringBuilder sb = new StringBuilder(s.length() + 16);
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '"':  sb.append("\\\""); break;
                case '\\': sb.append("\\\\"); break;
                case '\n': sb.append("\\n"); break;
                case '\r': sb.append("\\r"); break;
                case '\t': sb.append("\\t"); break;
                case '\b': sb.append("\\b"); break;
                case '\f': sb.append("\\f"); break;
                default:
                    if (c < 0x20) {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
            }
        }
        return sb.toString();
    }

    @Override
    public String toString() {
        return "LLM_Client{config=" + config + "}";
    }
}
