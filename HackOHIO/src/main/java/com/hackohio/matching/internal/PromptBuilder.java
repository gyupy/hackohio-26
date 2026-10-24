package com.hackohio.matching.internal;

import com.hackohio.matching.model.MentorProfile;
import com.hackohio.matching.model.StudentProfile;

import java.util.List;

/**
 * Stateless builder that converts a {@link StudentProfile} and a list of
 * {@link MentorProfile} objects into a single deterministic prompt string for
 * the LLM.
 *
 * <p>All methods are pure functions: for identical inputs they produce
 * byte-for-byte identical output regardless of invocation order or count
 * (Requirement 3.5). The class holds no mutable state.
 *
 * <p>Satisfies Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6.
 */
public class PromptBuilder {

    private static final String SYSTEM_INSTRUCTION =
            "You are a mentor-matching assistant. Evaluate compatibility between the student and each mentor.\n"
            + "Return ONLY a JSON array. Each element must contain exactly two fields:\n"
            + "  \"mentorId\" (string matching one of the provided mentor IDs) and\n"
            + "  \"score\" (integer 0\u2013100, where 100 is a perfect match).\n"
            + "Do not include any explanation or text outside the JSON array.\n";

    /** Separator used to join list fields: comma followed by a single space. */
    private static final String LIST_SEPARATOR = ", ";

    /**
     * Builds the complete prompt string for the given student and mentors.
     *
     * <p>Required student fields (interests, desiredSkills, careerGoal) must be
     * present and non-empty; otherwise an {@link IllegalArgumentException} is
     * thrown and no partial prompt is produced (Requirement 3.6).
     *
     * <p>When {@code mentors} is empty, all mentor blocks are omitted and the
     * prompt instructs the LLM to return an empty JSON array (Requirement 3.4).
     *
     * @param student the student profile; must have non-empty required fields
     * @param mentors the candidate mentors, in the order they should appear
     * @return a deterministic prompt string
     * @throws IllegalArgumentException if a required student field is null or empty
     */
    public String buildPrompt(StudentProfile student, List<MentorProfile> mentors) {
        validateStudent(student);

        StringBuilder sb = new StringBuilder();
        sb.append(SYSTEM_INSTRUCTION);
        sb.append('\n');

        sb.append("=== STUDENT ===\n");
        sb.append("Interests: ").append(joinList(student.getInterests())).append('\n');
        sb.append("Desired Skills: ").append(joinList(student.getDesiredSkills())).append('\n');
        sb.append("Career Goal: ").append(student.getCareerGoal()).append('\n');

        if (mentors == null || mentors.isEmpty()) {
            sb.append('\n');
            sb.append("There are no mentors to evaluate. Return an empty JSON array: []\n");
            sb.append('\n');
            sb.append("Return the JSON array now:");
            return sb.toString();
        }

        for (MentorProfile mentor : mentors) {
            sb.append('\n');
            sb.append("=== MENTOR: ").append(mentor.getId()).append(" ===\n");
            sb.append("Name: ").append(mentor.getDisplayName()).append('\n');
            sb.append("Expertise: ").append(joinList(mentor.getExpertiseTags())).append('\n');
            sb.append("Teachable Skills: ").append(joinList(mentor.getTeachableSkills())).append('\n');
            sb.append("Background: ").append(mentor.getProfessionalBackground()).append('\n');
        }

        sb.append('\n');
        sb.append("Return the JSON array now:");
        return sb.toString();
    }

    /**
     * Validates that every required student field is present and non-empty.
     *
     * @throws IllegalArgumentException naming the first missing field encountered,
     *                                  in declaration order (interests, desiredSkills, careerGoal)
     */
    private void validateStudent(StudentProfile student) {
        if (student == null) {
            throw new IllegalArgumentException("StudentProfile must not be null");
        }
        if (student.getInterests() == null || student.getInterests().isEmpty()) {
            throw new IllegalArgumentException(
                    "StudentProfile.interests must not be null or empty");
        }
        if (student.getDesiredSkills() == null || student.getDesiredSkills().isEmpty()) {
            throw new IllegalArgumentException(
                    "StudentProfile.desiredSkills must not be null or empty");
        }
        if (student.getCareerGoal() == null || student.getCareerGoal().isEmpty()) {
            throw new IllegalArgumentException(
                    "StudentProfile.careerGoal must not be null or empty");
        }
    }

    /**
     * Joins the given list with {@link #LIST_SEPARATOR}, preserving order and
     * duplicates. A null or empty list yields an empty string.
     */
    private String joinList(List<String> values) {
        if (values == null || values.isEmpty()) {
            return "";
        }
        return String.join(LIST_SEPARATOR, values);
    }
}
