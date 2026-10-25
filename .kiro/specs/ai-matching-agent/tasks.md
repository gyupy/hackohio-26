# Implementation Plan: AI Matching Agent

## Overview

Implement the `com.hackohio.matching` package inside the existing HackOHIO Maven project. The work proceeds in six broad groups: project setup, data models, internal components (EnvironmentConfig, PromptBuilder, ResponseParser, LLM_Client), the public MatchingAgent façade, the demo entry point, and a full test suite (unit + property-based + integration).

## Tasks

- [x] 1. Set up Maven project structure and dependencies
  - Create `HackOHIO/pom.xml` with `groupId=com.hackohio`, `artifactId=hackohio`, Java 11, and the following dependencies: `jackson-databind 2.17.1`, `junit-jupiter 5.10.3`, `mockito-core 5.11.0`, `jqwik 1.9.0`, `wiremock 3.6.0` (all test-scoped except jackson-databind)
  - Configure the `maven-surefire-plugin` to include both JUnit Jupiter and jqwik engines
  - Move/replace the existing `src/App.java` stub to the standard Maven source path `src/main/java/` (rename or delete the bare `src/App.java`); the main package is `com.hackohio.matching`
  - Create all required package directories: `src/main/java/com/hackohio/matching/`, `.../matching/model/`, `.../matching/internal/`, `src/test/java/com/hackohio/matching/`, `.../matching/model/`, `.../matching/internal/`
  - _Requirements: 7.4_

- [x] 2. Implement data model classes
  - [x] 2.1 Implement `MatchingAgentException`
    - Create `src/main/java/com/hackohio/matching/MatchingAgentException.java`
    - `public class MatchingAgentException extends RuntimeException` with constructors `(String message)` and `(String message, Throwable cause)`
    - Add private `int httpStatusCode` field (default `-1`) and a third constructor `(String message, int httpStatusCode)` that sets it; expose `getHttpStatusCode()`
    - _Requirements: 4.3, 4.4_

  - [x] 2.2 Implement `StudentProfile`
    - Create `src/main/java/com/hackohio/matching/model/StudentProfile.java`
    - Fields: `String id` (non-null/non-blank), `List<String> interests`, `List<String> desiredSkills`, `String careerGoal`
    - Constructor validates `id`; throws `IllegalArgumentException("Identifier must not be null or blank")` for null/blank id
    - Store defensive copies of list fields (use `Collections.unmodifiableList(new ArrayList<>(source))`)
    - Implement `getAllTags()` returning `interests + desiredSkills` concatenated in order, preserving duplicates
    - Add standard getters
    - _Requirements: 1.1, 1.3, 1.4, 1.6_

  - [ ]* 2.3 Write property tests for `StudentProfile`
    - Create `src/test/java/com/hackohio/matching/model/StudentProfilePropertyTest.java`
    - **Property 1: getAllTags returns concatenation of both source lists**
    - `// Feature: ai-matching-agent, Property 1: getAllTags returns concatenation of both source lists`
    - Generate arbitrary `List<String>` for interests and desiredSkills; assert `getAllTags()` equals concatenation in declaration order, preserving duplicates
    - **Property 2: Invalid identifier rejection**
    - `// Feature: ai-matching-agent, Property 2: Invalid identifier rejection`
    - Generate null/blank/whitespace-only strings; assert constructor throws `IllegalArgumentException`
    - Run minimum 100 tries per property (jqwik default)
    - **Validates: Requirements 1.3, 1.4**

  - [x] 2.4 Implement `MentorProfile`
    - Create `src/main/java/com/hackohio/matching/model/MentorProfile.java`
    - Fields: `String id` (non-null/non-blank), `String displayName`, `List<String> expertiseTags`, `List<String> teachableSkills`, `String professionalBackground`
    - Same id validation as `StudentProfile`
    - Implement `getAllTags()` returning `expertiseTags + teachableSkills` concatenated, preserving duplicates
    - Add standard getters and defensive copies
    - _Requirements: 1.2, 1.3, 1.5, 1.6_

  - [ ]* 2.5 Write property tests for `MentorProfile`
    - Create `src/test/java/com/hackohio/matching/model/MentorProfilePropertyTest.java`
    - **Property 1 (MentorProfile variant): getAllTags returns concatenation of both source lists**
    - `// Feature: ai-matching-agent, Property 1: getAllTags returns concatenation of both source lists`
    - Generate arbitrary `List<String>` for expertiseTags and teachableSkills; assert `getAllTags()` equals concatenation in declaration order
    - **Property 2 (MentorProfile variant): Invalid identifier rejection**
    - `// Feature: ai-matching-agent, Property 2: Invalid identifier rejection`
    - Generate null/blank/whitespace-only strings; assert constructor throws `IllegalArgumentException`
    - **Validates: Requirements 1.2, 1.3, 1.5**

  - [x] 2.6 Implement `RankedMatch`
    - Create `src/main/java/com/hackohio/matching/model/RankedMatch.java`
    - Fields: `final MentorProfile mentor`, `final int score` (0–100 inclusive)
    - Constructor accepts both fields; add getters `getMentor()` and `getScore()`
    - _Requirements: 5.1, 6.1_

  - [ ]* 2.7 Write unit tests for data model classes
    - Create `src/test/java/com/hackohio/matching/model/DataModelUnitTest.java`
    - Test `StudentProfile` and `MentorProfile` blank-id rejection, empty-list `getAllTags()` returning empty, and `RankedMatch` getter correctness
    - _Requirements: 1.3, 1.6_

- [x] 3. Implement `EnvironmentConfig`
  - [x] 3.1 Implement `EnvironmentConfig`
    - Create `src/main/java/com/hackohio/matching/internal/EnvironmentConfig.java` (package-private class)
    - Read `LLM_API_KEY`, `LLM_API_URL`, and `LLM_REQUEST_TIMEOUT_SECONDS` from `System.getenv()` in the constructor
    - Throw `IllegalStateException("LLM_API_KEY is not set")` if key is absent or blank
    - Throw `IllegalStateException("LLM_API_URL is not set")` if URL is absent or blank
    - Throw `IllegalStateException("LLM_API_URL is not a valid URL")` if URL does not start with `http://` or `https://`
    - Parse timeout: use 30 as default if `LLM_REQUEST_TIMEOUT_SECONDS` is absent or not a valid integer in [1, 300]
    - Expose `getApiKey()`, `getApiUrl()`, `getTimeoutSeconds()`
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 4.5, 4.6_

  - [ ]* 3.2 Write unit tests for `EnvironmentConfig`
    - Create `src/test/java/com/hackohio/matching/internal/EnvironmentConfigTest.java`
    - Use a subclass or factory method to inject a mock env-var map instead of `System.getenv()` (avoid test pollution)
    - Test all missing/blank/invalid scenarios for `LLM_API_KEY`, `LLM_API_URL`, and `LLM_REQUEST_TIMEOUT_SECONDS`
    - Confirm that the API key value never appears in exception messages
    - _Requirements: 2.3, 2.4, 2.5, 2.6, 4.5, 4.6_

- [x] 4. Implement `PromptBuilder`
  - [x] 4.1 Implement `PromptBuilder`
    - Create `src/main/java/com/hackohio/matching/internal/PromptBuilder.java` (package-private class)
    - Implement `String buildPrompt(StudentProfile student, List<MentorProfile> mentors)` as a pure/stateless method
    - Use the exact template from the design: system instruction, `=== STUDENT ===` block, one `=== MENTOR: {id} ===` block per mentor
    - Join list fields with `", "` (comma-space); iterate mentors in the order provided
    - When mentors list is empty, omit all mentor blocks and instruct LLM to return `[]`
    - Throw `IllegalArgumentException("StudentProfile.{fieldName} must not be null or empty")` for any null/empty required student field
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [ ]* 4.2 Write property tests for `PromptBuilder`
    - Create `src/test/java/com/hackohio/matching/internal/PromptBuilderPropertyTest.java`
    - **Property 3: Prompt determinism**
    - `// Feature: ai-matching-agent, Property 3: Prompt determinism`
    - Generate arbitrary profiles; call `buildPrompt` twice; assert identical strings
    - **Property 4: Prompt completeness**
    - `// Feature: ai-matching-agent, Property 4: Prompt completeness`
    - Generate profiles with at least one mentor; assert prompt contains each mentor ID and all student fields as labeled sections
    - **Validates: Requirements 3.1, 3.2, 3.5**

  - [ ]* 4.3 Write unit tests for `PromptBuilder`
    - Create `src/test/java/com/hackohio/matching/internal/PromptBuilderTest.java`
    - Test empty-mentor case, missing-student-field rejection, and field ordering in output
    - _Requirements: 3.4, 3.6_

- [x] 5. Checkpoint — verify data models and PromptBuilder
  - Ensure all tests pass so far, ask the user if questions arise.

- [x] 6. Implement `ResponseParser`
  - [x] 6.1 Implement `ResponseParser`
    - Create `src/main/java/com/hackohio/matching/internal/ResponseParser.java` (package-private class)
    - Constructor accepts a Jackson `ObjectMapper`
    - Implement `List<RankedMatch> parse(String responseBody, List<MentorProfile> candidates) throws MatchingAgentException`
    - Parse `responseBody` as a JSON array using Jackson; throw `MatchingAgentException("Failed to parse LLM response: " + first500Chars)` on parse failure
    - Build a `Map<String, MentorProfile>` from candidates for O(1) lookup; skip entries with unknown `mentorId`
    - Skip entries missing either the `mentorId` or `score` field
    - Clamp scores: `Math.max(0, Math.min(100, rawScore))`
    - Sort the result by descending score using a stable sort (`List.sort` with `Comparator.comparingInt(RankedMatch::getScore).reversed()`)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 6.2 Write property tests for `ResponseParser`
    - Create `src/test/java/com/hackohio/matching/internal/ResponseParserPropertyTest.java`
    - **Property 5: Score clamping round-trip**
    - `// Feature: ai-matching-agent, Property 5: Score clamping round-trip`
    - Generate JSON arrays with arbitrary integer scores; assert all parsed scores are in [0, 100]
    - **Property 6: Unknown mentor exclusion**
    - `// Feature: ai-matching-agent, Property 6: Unknown mentor exclusion`
    - Generate JSON arrays with a mix of known and unknown mentor IDs; assert only known IDs appear in the result
    - **Property 7: Descending sort stability**
    - `// Feature: ai-matching-agent, Property 7: Descending sort stability`
    - Generate arbitrary score lists; assert result is sorted descending with stable tie-breaking matching original JSON order
    - **Validates: Requirements 5.2, 5.4, 5.6**

  - [ ]* 6.3 Write unit tests for `ResponseParser`
    - Create `src/test/java/com/hackohio/matching/internal/ResponseParserTest.java`
    - Test score clamping at exact boundaries (−1 → 0, 101 → 100, 0 and 100 pass-through), missing-field row skipping, malformed JSON exception with first-500-char body snippet, and stable sort with ties
    - _Requirements: 5.2, 5.3, 5.5, 5.6_

- [x] 7. Implement `LLM_Client`
  - [x] 7.1 Implement `LLM_Client`
    - Create `src/main/java/com/hackohio/matching/internal/LLM_Client.java` (package-private class)
    - Constructor accepts `EnvironmentConfig config`; build a `java.net.http.HttpClient` with the configured timeout
    - Implement `String send(String prompt) throws MatchingAgentException`
    - Build an `HttpRequest` with method POST, URI from `config.getApiUrl()`, header `Content-Type: text/plain`, header `Authorization: Bearer {apiKey}`, and body publisher `BodyPublishers.ofString(prompt)`
    - On HTTP status != 200 throw `MatchingAgentException("LLM API returned HTTP {status}: {body}", status)`
    - On `HttpTimeoutException` throw `MatchingAgentException("LLM API request timed out", cause)`
    - On `IOException` throw `MatchingAgentException("LLM API connection error", cause)`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [ ]* 7.2 Write unit tests for `LLM_Client`
    - Create `src/test/java/com/hackohio/matching/internal/LLM_ClientTest.java`
    - Use Mockito to mock `java.net.http.HttpClient` (or use a package-private seam that accepts an injected client)
    - Test: non-200 response throws with status and body, timeout wraps original exception, connection error wraps original exception
    - _Requirements: 4.2, 4.3, 4.4_

- [x] 8. Implement `MatchingAgent`
  - [x] 8.1 Implement `MatchingAgent`
    - Create `src/main/java/com/hackohio/matching/MatchingAgent.java`
    - No-arg constructor: instantiate `EnvironmentConfig`, `PromptBuilder`, `LLM_Client`, and `ResponseParser(new ObjectMapper())`
    - Package-private constructor `MatchingAgent(EnvironmentConfig, PromptBuilder, LLM_Client, ResponseParser)` for testing
    - Implement `public List<RankedMatch> rankMentors(StudentProfile student, List<MentorProfile> candidates)`:
      - Throw `IllegalArgumentException("StudentProfile must not be null")` if student is null
      - Throw `IllegalArgumentException("Candidates list must not be null")` if candidates is null
      - Throw `IllegalArgumentException("Candidates list contains null entry at index {i}")` for any null entry at index `i`
      - Return `Collections.emptyList()` immediately when candidates is empty (no HTTP call)
      - Otherwise: `buildPrompt` → `send` → `parse` → return
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [ ]* 8.2 Write property tests for `MatchingAgent`
    - Create `src/test/java/com/hackohio/matching/MatchingAgentPropertyTest.java`
    - **Property 8: Empty candidates short-circuit**
    - `// Feature: ai-matching-agent, Property 8: Empty candidates short-circuit`
    - Generate arbitrary valid `StudentProfile` objects; assert `rankMentors(student, Collections.emptyList())` returns an empty list; use a Mockito-mocked `LLM_Client` and verify `send()` is never called
    - **Validates: Requirements 6.4**

  - [ ]* 8.3 Write unit tests for `MatchingAgent`
    - Create `src/test/java/com/hackohio/matching/MatchingAgentTest.java`
    - Use Mockito mocks for all collaborators
    - Test null-student, null-candidates, null-entry-in-candidates, empty-candidates, and happy-path delegation
    - _Requirements: 6.2, 6.3, 6.4, 6.5_

- [x] 9. Implement `MatchingAgentDemo`
  - [x] 9.1 Implement `MatchingAgentDemo`
    - Create `src/main/java/com/hackohio/matching/MatchingAgentDemo.java`
    - `main` method constructs one `StudentProfile` (at least 3 meaningful fields: interests, desiredSkills, careerGoal) and at least two `MentorProfile` objects (each with at least 3 fields: expertise, teachable skills, background)
    - Catch `IllegalStateException` from `MatchingAgent` constructor; print the missing variable name to `System.err` and call `System.exit(1)`
    - On success, iterate the `List<RankedMatch>` and print one line per mentor: `"{mentorName}: {score}"` to `System.out`
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 10. Write integration test with WireMock
  - [x] 10.1 Write `MatchingAgentIntegrationTest`
    - Create `src/test/java/com/hackohio/matching/MatchingAgentIntegrationTest.java`
    - Use WireMock `WireMockServer` to stub `POST /` returning a valid JSON array with two mentor entries and known scores
    - Set `LLM_API_URL` to the WireMock base URL and `LLM_API_KEY` to any non-blank value using a test-scoped env-var mechanism (e.g., pass config via the package-private `MatchingAgent` constructor with a test `EnvironmentConfig`)
    - Assert that `rankMentors` returns a `List<RankedMatch>` of size 2, sorted by descending score, with each `RankedMatch` holding the correct `MentorProfile`
    - Verify the HTTP request received by WireMock contained `Authorization: Bearer <key>` and `Content-Type: text/plain`
    - _Requirements: 4.1, 4.2, 5.1, 5.6_

- [x] 11. Final checkpoint — ensure all tests pass
  - Run `mvn test` and confirm zero failures; ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at natural breaks
- Property tests use jqwik with a minimum of 100 tries per property; each is annotated with the feature and property number comment
- Unit tests use JUnit 5 and Mockito; they complement property tests by covering specific edge cases
- The `internal/` classes are package-private; tests in the `com.hackohio.matching.internal` test package can access them directly without reflection
- The `LLM_API_KEY` value must never appear in any exception message, log, or `toString()` — enforced in `EnvironmentConfig` and `LLM_Client`

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "2.2", "2.4", "2.6"] },
    { "id": 1, "tasks": ["2.3", "2.5", "2.7", "3.1", "4.1"] },
    { "id": 2, "tasks": ["3.2", "4.2", "4.3", "6.1"] },
    { "id": 3, "tasks": ["6.2", "6.3", "7.1"] },
    { "id": 4, "tasks": ["7.2", "8.1"] },
    { "id": 5, "tasks": ["8.2", "8.3", "9.1"] },
    { "id": 6, "tasks": ["10.1"] }
  ]
}
```
