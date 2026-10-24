package com.hackohio.matching.model;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * Immutable data object representing a mentor's profile for mentor matching.
 *
 * <p>Satisfies Requirements 1.2, 1.3, 1.5, 1.6.
 */
public class MentorProfile {

    private final String id;
    private final String displayName;
    private final List<String> expertiseTags;
    private final List<String> teachableSkills;
    private final String professionalBackground;

    /**
     * Constructs a MentorProfile.
     *
     * @param id                     unique identifier — must not be null or blank
     * @param displayName            human-readable name; null is treated as empty string
     * @param expertiseTags          domain tags; null is treated as empty
     * @param teachableSkills        skills the mentor can teach; null is treated as empty
     * @param professionalBackground free-text background; null is treated as empty string
     * @throws IllegalArgumentException if {@code id} is null, empty, or whitespace-only
     */
    public MentorProfile(String id,
                         String displayName,
                         List<String> expertiseTags,
                         List<String> teachableSkills,
                         String professionalBackground) {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("Identifier must not be null or blank");
        }
        this.id = id;
        this.displayName = displayName != null ? displayName : "";
        this.expertiseTags = Collections.unmodifiableList(
                new ArrayList<>(expertiseTags != null ? expertiseTags : Collections.emptyList()));
        this.teachableSkills = Collections.unmodifiableList(
                new ArrayList<>(teachableSkills != null ? teachableSkills : Collections.emptyList()));
        this.professionalBackground = professionalBackground != null ? professionalBackground : "";
    }

    /** Returns the mentor's unique identifier. */
    public String getId() {
        return id;
    }

    /** Returns the mentor's display name. */
    public String getDisplayName() {
        return displayName;
    }

    /** Returns an unmodifiable view of the mentor's domain expertise tags. */
    public List<String> getExpertiseTags() {
        return expertiseTags;
    }

    /** Returns an unmodifiable view of the skills the mentor can teach. */
    public List<String> getTeachableSkills() {
        return teachableSkills;
    }

    /** Returns the mentor's professional background description. */
    public String getProfessionalBackground() {
        return professionalBackground;
    }

    /**
     * Returns a combined list of all expertise tags followed by all teachable-skill entries,
     * preserving duplicates and relative order from each source list.
     *
     * <p>If both source lists are empty, an empty list is returned (Requirement 1.6).
     *
     * @return concatenation of {@code expertiseTags} and {@code teachableSkills} in declaration order
     */
    public List<String> getAllTags() {
        List<String> combined = new ArrayList<>(expertiseTags.size() + teachableSkills.size());
        combined.addAll(expertiseTags);
        combined.addAll(teachableSkills);
        return Collections.unmodifiableList(combined);
    }
}
