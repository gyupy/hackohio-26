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
 * Parses the raw Gemini response body into a {@link RankedMatch} list.
 *
 * <p>Steps:
 * <ol>
 *   <li>Parse the full response as JSON. If it is the Gemini envelope
 *       ({@code candidates[0].content.parts[0].text}), extract the inner text the model
 *       generated. If it is already a bare JSON array (e.g. in tests), use it directly.</li>
 *   <li>Strip any Markdown code fences the model may have wrapped the JSON in.</li>
 *   <li>Parse the resulting JSON array of {@code {mentorId, score}} objects.</li>
 *   <li>Map each {@code mentorId} to a candidate {@link MentorProfile}, skipping unknown ids
 *       and entries missing a field; clamp scores to [0, 100]; sort descending (stable).</li>
 * </ol>
 */
public class ResponseParser {

    private final ObjectMapper mapper;

    public ResponseParser(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    /**
     * Parses the Gemini response body into a ranked list of mentor matches.
     *
     * @param responseBody the raw response body returned by the LLM API
     * @param candidates   the original candidate mentors supplied to the agent
     * @return a list of {@link RankedMatch} sorted by descending score
     * @throws MatchingAgentException if the body cannot be parsed into the expected JSON array
     */
    public List<RankedMatch> parse(String responseBody, List<MentorProfile> candidates)
            throws MatchingAgentException {

        Map<String, MentorProfile> byId = new HashMap<>();
        if (candidates != null) {
            for (MentorProfile mentor : candidates) {
                if (mentor != null) {
                    byId.put(mentor.getId(), mentor);
                }
            }
        }

        JsonNode outer;
        try {
            outer = mapper.readTree(responseBody);
        } catch (Exception e) {
            throw new MatchingAgentException(
                    "Failed to parse LLM response: " + firstChars(responseBody, 500));
        }

        if (outer == null || outer.isNull()) {
            throw new MatchingAgentException(
                    "Failed to parse LLM response: " + firstChars(responseBody, 500));
        }

        // Resolve the JSON array node: either the body is already an array (test/stub case),
        // or it is the Gemini envelope and we must extract + re-parse the inner text.
        JsonNode arrayNode;
        if (outer.isArray()) {
            arrayNode = outer;
        } else {
            String innerText = extractGeminiText(outer);
            if (innerText == null) {
                throw new MatchingAgentException(
                        "Failed to parse LLM response: " + firstChars(responseBody, 500));
            }
            String cleaned = stripCodeFences(innerText).trim();
            try {
                arrayNode = mapper.readTree(cleaned);
            } catch (Exception e) {
                throw new MatchingAgentException(
                        "Failed to parse LLM response: " + firstChars(cleaned, 500));
            }
            if (arrayNode == null || !arrayNode.isArray()) {
                throw new MatchingAgentException(
                        "Failed to parse LLM response: " + firstChars(cleaned, 500));
            }
        }

        List<RankedMatch> matches = new ArrayList<>();
        for (JsonNode element : arrayNode) {
            if (element == null || !element.isObject()) {
                continue;
            }

            JsonNode idNode = element.get("mentorId");
            JsonNode scoreNode = element.get("score");

            if (idNode == null || idNode.isNull() || scoreNode == null || scoreNode.isNull()) {
                continue;
            }

            String mentorId = idNode.asText();
            MentorProfile mentor = byId.get(mentorId);
            if (mentor == null) {
                continue;
            }

            int rawScore = scoreNode.asInt();
            int clamped = Math.max(0, Math.min(100, rawScore));
            matches.add(new RankedMatch(mentor, clamped));
        }

        matches.sort(Comparator.comparingInt(RankedMatch::getScore).reversed());
        return matches;
    }

    /**
     * Extracts {@code candidates[0].content.parts[0].text} from a Gemini envelope, or returns
     * {@code null} if the structure is not present.
     */
    private static String extractGeminiText(JsonNode envelope) {
        JsonNode candidates = envelope.get("candidates");
        if (candidates == null || !candidates.isArray() || candidates.size() == 0) {
            return null;
        }
        JsonNode content = candidates.get(0).get("content");
        if (content == null) {
            return null;
        }
        JsonNode parts = content.get("parts");
        if (parts == null || !parts.isArray() || parts.size() == 0) {
            return null;
        }
        JsonNode text = parts.get(0).get("text");
        if (text == null || text.isNull()) {
            return null;
        }
        return text.asText();
    }

    /**
     * Removes a leading ```json (or ```) fence and a trailing ``` fence if present, so a model
     * that wraps its JSON in a Markdown code block is still parseable.
     */
    private static String stripCodeFences(String text) {
        String t = text.trim();
        if (t.startsWith("```")) {
            int firstNewline = t.indexOf('\n');
            if (firstNewline >= 0) {
                t = t.substring(firstNewline + 1);
            } else {
                t = t.substring(3);
            }
            int lastFence = t.lastIndexOf("```");
            if (lastFence >= 0) {
                t = t.substring(0, lastFence);
            }
        }
        return t;
    }

    private static String firstChars(String value, int max) {
        if (value == null) {
            return "";
        }
        return value.length() <= max ? value : value.substring(0, max);
    }
}
