package com.hackohio.matching.web;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.hackohio.matching.MatchingAgent;
import com.hackohio.matching.MatchingAgentException;
import com.hackohio.matching.model.MentorProfile;
import com.hackohio.matching.model.RankedMatch;
import com.hackohio.matching.model.StudentProfile;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

/**
 * Minimal HTTP server that bridges the static Buckeye Guild frontend to the
 * {@link MatchingAgent} backend.
 *
 * <p>Two responsibilities:
 * <ul>
 *   <li>Serves the static UI assets ({@code index.html}, {@code script.js}, {@code style.css})
 *       from the {@code src/} directory.</li>
 *   <li>Exposes {@code POST /api/rank}: accepts a JSON body containing a student profile and a
 *       list of mentor candidates, runs {@link MatchingAgent#rankMentors}, and returns the
 *       ranked mentor ids with their compatibility scores.</li>
 * </ul>
 *
 * <p>Uses the JDK's built-in {@link HttpServer}, so no additional dependencies are required.
 * Run with: {@code mvn compile exec:java -Dexec.mainClass=com.hackohio.matching.web.MatchingServer}
 * (requires {@code LLM_API_KEY} and {@code LLM_API_URL} to be set in the environment).
 */
public final class MatchingServer {

    private static final int DEFAULT_PORT = 8080;

    private final ObjectMapper mapper = new ObjectMapper();
    private final MatchingAgent agent;
    private final Path staticRoot;

    public MatchingServer(MatchingAgent agent, Path staticRoot) {
        this.agent = agent;
        this.staticRoot = staticRoot;
    }

    public static void main(String[] args) throws IOException {
        int port = DEFAULT_PORT;
        if (args.length > 0) {
            try {
                port = Integer.parseInt(args[0]);
            } catch (NumberFormatException ignored) {
                // keep default
            }
        }

        MatchingAgent agent;
        try {
            agent = new MatchingAgent();
        } catch (IllegalStateException e) {
            System.err.println("Cannot start server: " + e.getMessage());
            System.err.println("Set LLM_API_KEY and LLM_API_URL before starting.");
            System.exit(1);
            return;
        }

        // Resolve the static asset directory (the UI lives in HackOHIO/src).
        Path staticRoot = Paths.get("src").toAbsolutePath().normalize();

        MatchingServer server = new MatchingServer(agent, staticRoot);
        server.start(port);
    }

    public void start(int port) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        server.createContext("/api/rank", this::handleRank);
        server.createContext("/", this::handleStatic);
        server.setExecutor(null); // default executor
        server.start();
        System.out.println("Buckeye Guild server running at http://localhost:" + port);
        System.out.println("Serving static assets from " + staticRoot);
    }

    // ---------------------------------------------------------------------
    // /api/rank
    // ---------------------------------------------------------------------

    private void handleRank(HttpExchange exchange) throws IOException {
        try {
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                applyCors(exchange);
                exchange.sendResponseHeaders(204, -1);
                return;
            }
            if (!"POST".equalsIgnoreCase(exchange.getRequestMethod())) {
                sendJson(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
                return;
            }

            byte[] bodyBytes;
            try (InputStream in = exchange.getRequestBody()) {
                bodyBytes = in.readAllBytes();
            }

            JsonNode root = mapper.readTree(bodyBytes);
            StudentProfile student = parseStudent(root.get("student"));
            List<MentorProfile> mentors = parseMentors(root.get("mentors"));

            List<RankedMatch> matches = agent.rankMentors(student, mentors);

            ArrayNode results = mapper.createArrayNode();
            for (RankedMatch match : matches) {
                ObjectNode entry = mapper.createObjectNode();
                entry.put("id", match.getMentor().getId());
                entry.put("score", match.getScore());
                results.add(entry);
            }
            ObjectNode payload = mapper.createObjectNode();
            payload.set("matches", results);

            sendJson(exchange, 200, mapper.writeValueAsString(payload));

        } catch (IllegalArgumentException e) {
            sendJson(exchange, 400, errorJson(e.getMessage()));
        } catch (MatchingAgentException e) {
            sendJson(exchange, 502, errorJson("Matching failed: " + e.getMessage()));
        } catch (Exception e) {
            sendJson(exchange, 500, errorJson("Unexpected error: " + e.getMessage()));
        }
    }

    private StudentProfile parseStudent(JsonNode node) {
        if (node == null || node.isNull()) {
            throw new IllegalArgumentException("Missing 'student' object");
        }
        String id = textOrDefault(node.get("id"), "student");
        return new StudentProfile(
                id,
                toStringList(node.get("interests")),
                toStringList(node.get("desiredSkills")),
                textOrDefault(node.get("careerGoal"), ""));
    }

    private List<MentorProfile> parseMentors(JsonNode node) {
        if (node == null || !node.isArray()) {
            throw new IllegalArgumentException("Missing 'mentors' array");
        }
        List<MentorProfile> mentors = new ArrayList<>();
        for (JsonNode m : node) {
            String id = textOrDefault(m.get("id"), null);
            if (id == null || id.isBlank()) {
                throw new IllegalArgumentException("Each mentor requires a non-blank 'id'");
            }
            mentors.add(new MentorProfile(
                    id,
                    textOrDefault(m.get("displayName"), ""),
                    toStringList(m.get("expertiseTags")),
                    toStringList(m.get("teachableSkills")),
                    textOrDefault(m.get("professionalBackground"), "")));
        }
        return mentors;
    }

    private static List<String> toStringList(JsonNode node) {
        List<String> out = new ArrayList<>();
        if (node != null && node.isArray()) {
            Iterator<JsonNode> it = node.elements();
            while (it.hasNext()) {
                JsonNode el = it.next();
                if (el != null && !el.isNull()) {
                    out.add(el.asText());
                }
            }
        }
        return out;
    }

    private static String textOrDefault(JsonNode node, String fallback) {
        if (node == null || node.isNull()) {
            return fallback;
        }
        return node.asText();
    }

    // ---------------------------------------------------------------------
    // Static files
    // ---------------------------------------------------------------------

    private void handleStatic(HttpExchange exchange) throws IOException {
        if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
            sendJson(exchange, 405, "{\"error\":\"Method Not Allowed\"}");
            return;
        }

        String rawPath = exchange.getRequestURI().getPath();
        if (rawPath == null || rawPath.equals("/")) {
            rawPath = "/index.html";
        }

        // Resolve safely within the static root to prevent path traversal.
        Path requested = staticRoot.resolve("." + rawPath).normalize();
        if (!requested.startsWith(staticRoot) || !Files.isRegularFile(requested)) {
            sendText(exchange, 404, "Not Found");
            return;
        }

        byte[] content = Files.readAllBytes(requested);
        exchange.getResponseHeaders().set("Content-Type", contentType(requested));
        exchange.sendResponseHeaders(200, content.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(content);
        }
    }

    private static String contentType(Path path) {
        String name = path.getFileName().toString().toLowerCase();
        if (name.endsWith(".html")) return "text/html; charset=utf-8";
        if (name.endsWith(".js")) return "application/javascript; charset=utf-8";
        if (name.endsWith(".css")) return "text/css; charset=utf-8";
        if (name.endsWith(".json")) return "application/json; charset=utf-8";
        if (name.endsWith(".svg")) return "image/svg+xml";
        if (name.endsWith(".png")) return "image/png";
        if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
        return "application/octet-stream";
    }

    // ---------------------------------------------------------------------
    // Response helpers
    // ---------------------------------------------------------------------

    private void applyCors(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "POST, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type");
    }

    private void sendJson(HttpExchange exchange, int status, String json) throws IOException {
        applyCors(exchange);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.sendResponseHeaders(status, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private void sendText(HttpExchange exchange, int status, String text) throws IOException {
        byte[] bytes = text.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "text/plain; charset=utf-8");
        exchange.sendResponseHeaders(status, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private String errorJson(String message) {
        try {
            ObjectNode node = mapper.createObjectNode();
            node.put("error", message == null ? "Unknown error" : message);
            return mapper.writeValueAsString(node);
        } catch (Exception e) {
            return "{\"error\":\"serialization failure\"}";
        }
    }
}
