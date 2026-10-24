package com.hackohio.matching;

import com.hackohio.matching.model.MentorProfile;
import com.hackohio.matching.model.RankedMatch;
import com.hackohio.matching.model.StudentProfile;

import java.util.Arrays;
import java.util.List;

/**
 * Self-contained runnable example that exercises the {@link MatchingAgent} end-to-end.
 *
 * <p>The {@code main} method constructs one {@link StudentProfile} and several
 * {@link MentorProfile} objects, instantiates a {@link MatchingAgent} (which reads its
 * configuration from environment variables), ranks the mentors for the student, and prints one
 * line per mentor to standard output in the form {@code "{mentorName}: {score}"}.
 *
 * <p>If a required environment variable ({@code LLM_API_KEY} or {@code LLM_API_URL}) is absent or
 * blank, the {@link MatchingAgent} constructor throws an {@link IllegalStateException} whose
 * message names the missing variable. This class catches that exception, prints the message to
 * standard error, and exits with status code 1.
 *
 * <p>Satisfies Requirements 7.1, 7.2, 7.3, 7.4.
 */
public final class MatchingAgentDemo {

    private MatchingAgentDemo() {
        // Utility entry-point class; not instantiable.
    }

    /**
     * Runs the matching demo.
     *
     * @param args command-line arguments (unused)
     */
    public static void main(String[] args) {
        // Construct one student profile with three meaningful matching fields:
        // interests, desired skills, and a career goal (Requirement 7.1).
        StudentProfile student = new StudentProfile(
                "student-001",
                Arrays.asList("machine learning", "distributed systems", "open source"),
                Arrays.asList("Python", "Kubernetes", "system design"),
                "Become a senior backend engineer working on large-scale ML platforms");

        // Construct at least two mentor profiles, each populating expertise tags, teachable
        // skills, and a professional background (plus id and display name) (Requirement 7.1).
        List<MentorProfile> mentors = Arrays.asList(
                new MentorProfile(
                        "mentor-ml",
                        "Dr. Ada Chen",
                        Arrays.asList("machine learning", "MLOps", "distributed systems"),
                        Arrays.asList("Python", "Kubernetes", "model deployment"),
                        "Staff ML engineer with 10 years building large-scale training and "
                                + "serving platforms at a cloud provider"),
                new MentorProfile(
                        "mentor-frontend",
                        "Marcus Lee",
                        Arrays.asList("frontend", "accessibility", "design systems"),
                        Arrays.asList("TypeScript", "React", "CSS architecture"),
                        "Senior frontend engineer focused on accessible, component-driven web "
                                + "applications"),
                new MentorProfile(
                        "mentor-backend",
                        "Priya Nair",
                        Arrays.asList("distributed systems", "databases", "system design"),
                        Arrays.asList("Java", "Go", "system design", "Kubernetes"),
                        "Principal backend engineer specializing in high-throughput services and "
                                + "data infrastructure"));

        // Instantiate the agent. A missing/blank required env var surfaces here as an
        // IllegalStateException whose message names the offending variable (Requirements 6.7, 7.3).
        MatchingAgent agent;
        try {
            agent = new MatchingAgent();
        } catch (IllegalStateException e) {
            System.err.println(e.getMessage());
            System.exit(1);
            return; // Unreachable after exit, but keeps the compiler happy about `agent`.
        }

        // Rank the mentors and print one line per mentor: "{mentorName}: {score}"
        // (Requirement 7.2).
        List<RankedMatch> matches = agent.rankMentors(student, mentors);
        for (RankedMatch match : matches) {
            System.out.println(match.getMentor().getDisplayName() + ": " + match.getScore());
        }
    }
}
