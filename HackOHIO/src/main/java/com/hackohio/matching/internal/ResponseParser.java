package com.hackohio.matching.internal;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hackohio.matching.MatchingAgentException;
import com.hackohio.matching.model.MentorProfile;
import com.hackohio.matching.model.RankedMatch;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Parses the raw LLM response body into a {@link RankedMatch} list.
 *
 * <p>Responsibilities:
 * <ul>
 *   <li>Parse the response body as a JSON array via Jackson, throwing a
 *       {@link MatchingAgentException} on malformed JSON (Requirement 5.3).</li>
 *   <li>Map each {@code mentorId} back to the corresponding {@link MentorProfile}
 *       from the original candidates list, dropping entries that reference an
 *       unknown mentor (Requirement 5.4) or that are missing the {@code mentorId}
 *       or {@code score} field (Requirement 5.5).</li>
 *   <li>Clamp each score to the range [0, 100] (Requirement 5.2).</li>
 *   <li>Return the results sorted by descending score with stable tie-breaking
 *       that preserves the original JSON order (Requirement 5.6).</li>
 * </ul>
 *
 * <p>Package-private — used internally by {@code MatchingAgent}.
 *
 * <p>Satisfies Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6.
 */
public class ResponseParser {

    private final ObjectMapper mapper;

    /**
     * Constructs a ResponseParser.
     *
     * @param mapper the Jackson {@link ObjectMapper} used to parse response bodies
     */
    public ResponseParser(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    /**
     * Parses the LLM response body into a ranked list of mentor matches.
     *
     * @param responseBody the raw JSON array returned by the LLM API
     * @param candidates    the original candidate mentors supplied to the agent
     * @return a list of {@link RankedMatch} sorted by descending score, with stable
     *         tie-breaking preserving the original JSON order
     * @throws MatchingAgentException if {@code responseBody} cannot be parsed as JSON;
     *         the message includes the first 500 characters of the raw body
     */
    public List<RankedMatch> parse(String responseBody, List<MentorProfile> candidates)
            throws MatchingAgentException {

        // Build an id -> mentor lookup for O(1) resolution (Requirement 5.4).
        Map<String, MentorProfile> byId = new HashMap<>();
        if (candidates != null) {
            for (MentorProfile mentor : candidates) {
                if (mentor != null) {
                    byId.put(mentor.getId(), mentor);
                }
            }
        }

        JsonNode root;
        try {
            root = mapper.readTree(responseBody);
        } catch (Exception e) {
            throw new MatchingAgentException(
                    "Failed to parse LLM response: " + firstChars(responseBody, 500));
        }

        // A non-array (or null) root is not a usable response array.
        if (root == null || !root.isArray()) {
            throw new MatchingAgentException(
                    "Failed to parse LLM response: " + firstChars(responseBody, 500));
        }

        List<RankedMatch> matches = new ArrayList<>();
        for (JsonNode element : root) {
            if (element == null || !element.isObject()) {
                continue;
            }

            JsonNode idNode = element.get("mentorId");
            JsonNode scoreNode = element.get("score");

            // Skip entries missing either required field (Requirement 5.5).
            if (idNode == null || idNode.isNull() || scoreNode == null || scoreNode.isNull()) {
                continue;
            }

            String mentorId = idNode.asText();
            MentorProfile mentor = byId.get(mentorId);

            // Skip entries referencing an unknown mentor (Requirement 5.4).
            if (mentor == null) {
                continue;
            }

            int rawScore = scoreNode.asInt();
            int clamped = Math.max(0, Math.min(100, rawScore));

            matches.add(new RankedMatch(mentor, clamped));
        }

        // Stable sort by descending score preserves original JSON order for ties
        // (Requirement 5.6).
        matches.sort(Comparator.comparingInt(RankedMatch::getScore).reversed());

        return matches;
    }

    /**
     * Returns at most {@code max} leading characters of {@code value}, or the empty
     * string when {@code value} is {@code null}.
     */
    private static String firstChars(String value, int max) {
        if (value == null) {
            return "";
        }
        return value.length() <= max ? value : value.substring(0, max);
    }
}
