package com.hackohio.matching;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.equalTo;
import static com.github.tomakehurst.wiremock.client.WireMock.post;
import static com.github.tomakehurst.wiremock.client.WireMock.postRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.urlEqualTo;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.tomakehurst.wiremock.WireMockServer;
import com.github.tomakehurst.wiremock.core.WireMockConfiguration;
import com.hackohio.matching.internal.EnvironmentConfig;
import com.hackohio.matching.internal.LLM_Client;
import com.hackohio.matching.internal.PromptBuilder;
import com.hackohio.matching.internal.ResponseParser;
import com.hackohio.matching.model.MentorProfile;
import com.hackohio.matching.model.RankedMatch;
import com.hackohio.matching.model.StudentProfile;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * End-to-end integration test for {@link MatchingAgent} using WireMock to stub the external LLM
 * API endpoint.
 *
 * <p>This test exercises the full {@code rankMentors} call path with real collaborators
 * ({@link PromptBuilder}, {@link LLM_Client}, {@link ResponseParser}) and a real HTTP round-trip
 * against a locally-hosted WireMock server: prompt built → HTTP POST sent → stubbed JSON array
 * returned → parsed, clamped, and sorted into a {@link RankedMatch} list.
 *
 * <p>The {@link EnvironmentConfig} is constructed from an in-memory map (its public map
 * constructor) so the real process environment is never mutated. {@code LLM_API_URL} points at
 * the WireMock base URL and {@code LLM_API_KEY} is a dummy non-blank value.
 *
 * <p>Validates Requirements 4.1 (HTTP POST with Bearer auth and {@code text/plain} content type),
 * 4.2 (200 response forwarded to the parser), 5.1 (JSON array parsed into ranked matches), and
 * 5.6 (descending-score ordering).
 */
@DisplayName("MatchingAgent end-to-end integration (WireMock)")
class MatchingAgentIntegrationTest {

    private static final String API_KEY = "test-key";

    private WireMockServer wireMockServer;
    private MatchingAgent agent;

    @BeforeEach
    void startServer() {
        // Bind to a dynamic port so parallel/CI runs never collide on a fixed port.
        wireMockServer = new WireMockServer(WireMockConfiguration.options().dynamicPort());
        wireMockServer.start();

        int port = wireMockServer.port();
        String baseUrl = "http://localhost:" + port + "/";

        // Build an EnvironmentConfig from an in-memory map instead of System.getenv() so the real
        // environment is left untouched (and so the test is hermetic).
        Map<String, String> env = new HashMap<>();
        env.put("LLM_API_URL", baseUrl);
        env.put("LLM_API_KEY", API_KEY);
        EnvironmentConfig config = new EnvironmentConfig(env);

        // Wire the agent together via its package-private constructor with real collaborators.
        agent = new MatchingAgent(
                config,
                new PromptBuilder(),
                new LLM_Client(config),
                new ResponseParser(new ObjectMapper()));
    }

    @AfterEach
    void stopServer() {
        if (wireMockServer != null) {
            wireMockServer.stop();
        }
    }

    @Test
    @DisplayName("ranks two mentors by descending score and sends a Bearer/text-plain POST")
    void rankMentorsReturnsSortedMatchesAndSendsExpectedRequest() {
        // The LLM API is stubbed to return a valid JSON array. m1 (90) outranks m2 (60), and the
        // JSON deliberately lists them in ascending order to prove the parser sorts, not the LLM.
        String responseBody = "[{\"mentorId\":\"m2\",\"score\":60},"
                + "{\"mentorId\":\"m1\",\"score\":90}]";

        wireMockServer.stubFor(post(urlEqualTo("/"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody(responseBody)));

        // Student must have non-empty interests, desiredSkills, and careerGoal — PromptBuilder
        // rejects any empty required field.
        StudentProfile student = new StudentProfile(
                "student-1",
                Arrays.asList("machine learning", "distributed systems"),
                Arrays.asList("Python", "Kubernetes"),
                "Become a senior backend engineer");

        MentorProfile mentor1 = new MentorProfile(
                "m1",
                "Dr. Ada Chen",
                Arrays.asList("machine learning", "MLOps"),
                Arrays.asList("Python", "model deployment"),
                "Staff ML engineer");
        MentorProfile mentor2 = new MentorProfile(
                "m2",
                "Marcus Lee",
                Arrays.asList("frontend", "design systems"),
                Arrays.asList("TypeScript", "React"),
                "Senior frontend engineer");

        List<MentorProfile> candidates = Arrays.asList(mentor1, mentor2);

        List<RankedMatch> matches = agent.rankMentors(student, candidates);

        // --- Result assertions (Requirements 5.1, 5.6, 6.1) ---
        assertNotNull(matches, "rankMentors must not return null");
        assertEquals(2, matches.size(), "both stubbed mentors should be present");

        RankedMatch first = matches.get(0);
        RankedMatch second = matches.get(1);

        // Sorted descending by score: m1 (90) first, then m2 (60).
        assertEquals("m1", first.getMentor().getId(),
                "highest-scoring mentor (m1) must come first");
        assertEquals(90, first.getScore(), "m1 score must be preserved");
        assertEquals("m2", second.getMentor().getId(),
                "lower-scoring mentor (m2) must come second");
        assertEquals(60, second.getScore(), "m2 score must be preserved");

        // Each RankedMatch must carry the exact MentorProfile supplied as a candidate.
        assertEquals(mentor1, first.getMentor(),
                "the match must hold the original m1 MentorProfile instance");
        assertEquals(mentor2, second.getMentor(),
                "the match must hold the original m2 MentorProfile instance");

        // --- Request assertions (Requirement 4.1) ---
        // Exactly one POST to "/" carrying the Bearer token and a text/plain content type.
        wireMockServer.verify(postRequestedFor(urlEqualTo("/"))
                .withHeader("Authorization", equalTo("Bearer " + API_KEY))
                .withHeader("Content-Type", equalTo("text/plain")));
    }
}
