package com.hackohio.matching.model;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Immutable data object representing a student's profile for mentor matching.
 *
 * <p>Satisfies Requirements 1.1, 1.3, 1.4, 1.6.
 */
public class StudentProfile {

    private final String id;
    private final List<String> interests;
    private final List<String> desiredSkills;
    private final String careerGoal;

    /**
     * Constructs a StudentProfile.
     *
     * @param id            unique identifier — must not be null or blank
     * @param interests     list of interest tags; null is treated as empty
     * @param desiredSkills list of skills the student wants to learn; null is treated as empty
     * @param careerGoal    free-text career goal; null is treated as empty string
     * @throws IllegalArgumentException if {@code id} is null, empty, or whitespace-only
     */
    public StudentProfile(String id,
                          List<String> interests,
                          List<String> desiredSkills,
                          String careerGoal) {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("Identifier must not be null or blank");
        }
        this.id = id;
        this.interests = Collections.unmodifiableList(
                new ArrayList<>(interests != null ? interests : Collections.emptyList()));
        this.desiredSkills = Collections.unmodifiableList(
                new ArrayList<>(desiredSkills != null ? desiredSkills : Collections.emptyList()));
        this.careerGoal = careerGoal != null ? careerGoal : "";
    }

    /** Returns the student's unique identifier. */
    public String getId() {
        return id;
    }

    /** Returns an unmodifiable view of the student's interest tags. */
    public List<String> getInterests() {
        return interests;
    }

    /** Returns an unmodifiable view of the skills the student wants to learn. */
    public List<String> getDesiredSkills() {
        return desiredSkills;
    }

    /** Returns the student's career goal string. */
    public String getCareerGoal() {
        return careerGoal;
    }

    /**
     * Returns a combined list of all interest tags followed by all desired-skill entries,
     * preserving duplicates and relative order from each source list.
     *
     * <p>If both source lists are empty, an empty list is returned (Requirement 1.6).
     *
     * @return concatenation of {@code interests} and {@code desiredSkills} in declaration order
     */
    public List<String> getAllTags() {
        List<String> combined = new ArrayList<>(interests.size() + desiredSkills.size());
        combined.addAll(interests);
        combined.addAll(desiredSkills);
        return Collections.unmodifiableList(combined);
    }
}
