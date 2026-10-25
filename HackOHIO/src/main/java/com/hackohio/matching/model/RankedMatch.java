package com.hackohio.matching.model;

/**
 * Immutable pair associating a {@link MentorProfile} with an integer compatibility score.
 *
 * <p>Instances are produced by {@code ResponseParser} after the LLM response is parsed and
 * scores have been clamped to the range [0, 100].
 *
 * <p>Satisfies Requirements 5.1, 6.1.
 */
public class RankedMatch {

    private final MentorProfile mentor;
    private final int score;

    /**
     * Constructs a RankedMatch.
     *
     * @param mentor the matched mentor (non-null)
     * @param score  compatibility score in the range 0–100 inclusive
     */
    public RankedMatch(MentorProfile mentor, int score) {
        this.mentor = mentor;
        this.score = score;
    }

    /**
     * Returns the matched mentor profile.
     *
     * @return the mentor; never {@code null} when constructed via {@code ResponseParser}
     */
    public MentorProfile getMentor() {
        return mentor;
    }

    /**
     * Returns the compatibility score for this mentor.
     *
     * @return an integer in [0, 100] inclusive (clamped by the parser before construction)
     */
    public int getScore() {
        return score;
    }
}
