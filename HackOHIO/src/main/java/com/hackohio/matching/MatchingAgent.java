package com.hackohio.matching;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackohio.matching.internal.EnvironmentConfig;
import com.hackohio.matching.internal.LLM_Client;
import com.hackohio.matching.internal.PromptBuilder;
import com.hackohio.matching.internal.ResponseParser;
import com.hackohio.matching.model.MentorProfile;
import com.hackohio.matching.model.RankedMatch;
import com.hackohio.matching.model.StudentProfile;

import java.util.Collections;
import java.util.List;
import java.util.Objects;

/**
 * Public façade for the AI mentor-matching agent.
 *
 * <p>Orchestrates the end-to-end ranking flow: it validates its inputs, delegates prompt
 * construction to {@link PromptBuilder}, sends the prompt to the external LLM API through
 * {@link LLM_Client}, and parses the response into a ranked list via {@link ResponseParser}.
 * Credentials and endpoint configuration are loaded from environment variables through
 * {@link EnvironmentConfig}.
 *
 * <p>The no-argument constructor reads all configuration from the process environment, making
 * the class suitable for Spring Boot dependency injection. A package-private constructor exists
 * so unit tests can inject mocked collaborators.
 *
 * <p>Satisfies Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7.
 */
public class MatchingAgent {

    private final PromptBuilder promptBuilder;
    private final LLM_Client llmClient;
    private final ResponseParser responseParser;

    /**
     * Constructs a {@code MatchingAgent} with all collaborators wired from environment
     * configuration. Reads {@code LLM_API_KEY}, {@code LLM_API_URL}, and optionally
     * {@code LLM_REQUEST_TIMEOUT_SECONDS} via {@link EnvironmentConfig}.
     *
     * @throws IllegalStateException if a required environment variable is absent or blank, or if
     *                               {@code LLM_API_URL} is not a valid URL (propagated from
     *                               {@link EnvironmentConfig}) — Requirement 6.7
     */
    public MatchingAgent() {
        EnvironmentConfig config = new EnvironmentConfig();
        this.promptBuilder = new PromptBuilder();
        this.llmClient = new LLM_Client(config);
        this.responseParser = new ResponseParser(new ObjectMapper());
    }

    /**
     * Package-private constructor for testing. Accepts pre-built collaborators so unit tests can
     * supply mocks or stubs without touching the real environment or network.
     *
     * @param config         the environment configuration (retained for symmetry; collaborators
     *                       are injected directly)
     * @param builder        the prompt builder; must not be null
     * @param client         the LLM HTTP client; must not be null
     * @param parser         the response parser; must not be null
     */
    MatchingAgent(EnvironmentConfig config, PromptBuilder builder,
                  LLM_Client client, ResponseParser parser) {
        Objects.requireNonNull(config, "config must not be null");
        this.promptBuilder = Objects.requireNonNull(builder, "builder must not be null");
        this.llmClient = Objects.requireNonNull(client, "client must not be null");
        this.responseParser = Objects.requireNonNull(parser, "parser must not be null");
    }

    /**
     * Ranks the supplied mentor candidates against the given student by compatibility.
     *
     * <p>Validation and short-circuit behavior (performed before any LLM API call):
     * <ul>
     *   <li>A null {@code student} throws {@code IllegalArgumentException} (Requirement 6.2).</li>
     *   <li>A null {@code candidates} list throws {@code IllegalArgumentException}
     *       (Requirement 6.3).</li>
     *   <li>A null entry in {@code candidates} throws {@code IllegalArgumentException} naming the
     *       offending index (Requirement 6.5).</li>
     *   <li>An empty {@code candidates} list returns an empty list immediately with no API call
     *       (Requirement 6.4).</li>
     * </ul>
     *
     * <p>Otherwise the agent builds a prompt, sends it to the LLM API, and parses the response
     * into a descending-score-ordered list of {@link RankedMatch} (Requirement 6.1).
     *
     * @param student    the student profile to match against; must not be null
     * @param candidates the candidate mentors; must not be null and must not contain null entries
     * @return a list of {@link RankedMatch} sorted by descending compatibility score; empty when
     *         {@code candidates} is empty
     * @throws IllegalArgumentException if {@code student} is null, {@code candidates} is null, or
     *                                  {@code candidates} contains a null entry
     * @throws MatchingAgentException   if the LLM API call fails or its response cannot be parsed
     */
    public List<RankedMatch> rankMentors(StudentProfile student, List<MentorProfile> candidates) {
        if (student == null) {
            throw new IllegalArgumentException("StudentProfile must not be null");
        }
        if (candidates == null) {
            throw new IllegalArgumentException("Candidates list must not be null");
        }
        for (int i = 0; i < candidates.size(); i++) {
            if (candidates.get(i) == null) {
                throw new IllegalArgumentException(
                        "Candidates list contains null entry at index " + i);
            }
        }
        if (candidates.isEmpty()) {
            return Collections.emptyList();
        }

        String prompt = promptBuilder.buildPrompt(student, candidates);
        String responseBody = llmClient.send(prompt);
        return responseParser.parse(responseBody, candidates);
    }
}
