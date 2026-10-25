package com.hackohio.matching;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.equalTo;
import static com.github.tomakehurst.wiremock.client.WireMock.post;
import static com.github.tomakehurst.wiremock.client.WireMock.postRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.urlEqualTo;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
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
 * End-to-end integration test for {@link MatchingAgent} against a WireMock stub of the Gemini
 * generateContent API.
 *
 * <p>The stub returns a Gemini envelope whose inner text is a Markdown-fenced JSON array. The
 * envelope is built with Jackson so the inner JSON is correctly escaped, mirroring a real Gemini
 * response. This exercises both the envelope unwrapping and the code-fence stripping in
 * {@link ResponseParser}.
 */
@DisplayName("MatchingAgent end-to-end integration (WireMock + Gemini contract)")
class MatchingAgentIntegrationTest {

    private static final String API_KEY = "test-key";

    private final ObjectMapper mapper = new ObjectMapper();

    private WireMockServer wireMockServer;
    private MatchingAgent agent;

    @BeforeEach
    void startServer() {
        wireMockServer = new WireMockServer(WireMockConfiguration.options().dynamicPort());
        wireMockServer.start();

        int port = wireMockServer.port();
        String baseUrl = "http://localhost:" + port + "/";

        Map<String, String> env = new HashMap<>();
        env.put("LLM_API_URL", baseUrl);
        env.put("LLM_API_KEY", API_KEY);
        EnvironmentConfig config = new EnvironmentConfig(env);

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
    @DisplayName("ranks mentors by descending score and sends a Gemini-shaped POST")
    void rankMentorsReturnsSortedMatchesAndSendsExpectedRequest() throws Exception {
        // Inner model text: a Markdown-fenced JSON array, listed ascending to prove the parser
        // does the descending sort (not the LLM).
        String innerText = "```json\n"
                + "[{\"mentorId\":\"m2\",\"score\":60},{\"mentorId\":\"m1\",\"score\":90}]\n"
                + "```";

        // Build the Gemini envelope with Jackson so innerText is correctly JSON-escaped.
        ObjectNode envelope = mapper.createObjectNode();
        ArrayNode candidates = envelope.putArray("candidates");
        ObjectNode candidate = candidates.addObject();
        ObjectNode content = candidate.putObject("content");
        ArrayNode parts = content.putArray("parts");
        parts.addObject().put("text", innerText);
        String envelopeJson = mapper.writeValueAsString(envelope);

        wireMockServer.stubFor(post(urlEqualTo("/"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/json")
                        .withBody(envelopeJson)));

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

        List<MentorProfile> candidatesList = Arrays.asList(mentor1, mentor2);

        List<RankedMatch> matches = agent.rankMentors(student, candidatesList);

        assertNotNull(matches, "rankMentors must not return null");
        assertEquals(2, matches.size(), "both stubbed mentors should be present");

        RankedMatch first = matches.get(0);
        RankedMatch second = matches.get(1);

        assertEquals("m1", first.getMentor().getId(),
                "highest-scoring mentor (m1) must come first");
        assertEquals(90, first.getScore(), "m1 score must be preserved");
        assertEquals("m2", second.getMentor().getId(),
                "lower-scoring mentor (m2) must come second");
        assertEquals(60, second.getScore(), "m2 score must be preserved");

        assertEquals(mentor1, first.getMentor(),
                "the match must hold the original m1 MentorProfile instance");
        assertEquals(mentor2, second.getMentor(),
                "the match must hold the original m2 MentorProfile instance");

        // Request assertions: Gemini contract uses the x-goog-api-key header and JSON content.
        wireMockServer.verify(postRequestedFor(urlEqualTo("/"))
                .withHeader("x-goog-api-key", equalTo(API_KEY))
                .withHeader("Content-Type", equalTo("application/json")));
    }
}