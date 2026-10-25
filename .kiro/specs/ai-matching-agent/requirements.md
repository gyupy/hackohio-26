# Requirements Document

## Introduction

This feature adds an AI-powered matching agent to the Mentor Match application. The agent accepts student and mentor profiles as input, calls an LLM API to evaluate compatibility based on shared interests, desired skills, and career goals, and returns a ranked list of compatible mentors. The agent is implemented as a self-contained Java class with credentials loaded from environment variables, designed to plug into the existing Java + Spring Boot backend.

## Glossary

- **MatchingAgent**: The Java class responsible for orchestrating LLM-based compatibility evaluation between a student and a set of mentor candidates.
- **StudentProfile**: A data object representing a student's interests, skills they want to learn, and career goals.
- **MentorProfile**: A data object representing a mentor's areas of expertise, skills they can teach, and professional background.
- **CompatibilityScore**: A numeric value between 0 and 100 representing how well a student and mentor are matched.
- **RankedMatchList**: An ordered list of MentorProfile objects paired with their CompatibilityScore, sorted from highest to lowest score.
- **LLM_Client**: The HTTP client component within MatchingAgent that communicates with the external LLM API endpoint.
- **PromptBuilder**: The component within MatchingAgent that constructs structured prompts from profile data before sending them to the LLM API.
- **EnvironmentConfig**: The mechanism by which the MatchingAgent reads API credentials and endpoint configuration from OS environment variables.

---

## Requirements

### Requirement 1: Profile Data Models

**User Story:** As a backend developer, I want well-defined profile data structures, so that student and mentor data can be passed to the matching agent in a consistent, type-safe format.

#### Acceptance Criteria

1. THE StudentProfile SHALL contain at minimum a unique identifier, a list of interest tags, a list of skills the student wants to learn, and a career goal string.
2. THE MentorProfile SHALL contain at minimum a unique identifier, a display name, a list of expertise tags, a list of skills the mentor can teach, and a professional background string.
3. IF a StudentProfile or MentorProfile is constructed with a null, empty, or whitespace-only identifier, THEN THE System SHALL throw an IllegalArgumentException with a message indicating that the identifier is invalid.
4. THE StudentProfile SHALL expose a method that returns all interest tags and desired-skill entries as a single combined list of strings, preserving duplicates across both source lists, for use by the PromptBuilder.
5. THE MentorProfile SHALL expose a method that returns all expertise tags and teachable-skill entries as a single combined list of strings, preserving duplicates across both source lists, for use by the PromptBuilder.
6. WHEN the combined list method is called on a StudentProfile or MentorProfile whose interest, skill, expertise, and teachable-skill fields are all empty, THE method SHALL return an empty list.

---

### Requirement 2: Environment-Based Credential Loading

**User Story:** As a developer, I want API credentials loaded from environment variables, so that no secrets are ever hardcoded in source files or committed to version control.

#### Acceptance Criteria

1. WHEN the MatchingAgent is instantiated, THE EnvironmentConfig SHALL read the LLM API key from an environment variable named `LLM_API_KEY`.
2. WHEN the MatchingAgent is instantiated, THE EnvironmentConfig SHALL read the LLM API endpoint URL from an environment variable named `LLM_API_URL`.
3. IF `LLM_API_KEY` is absent or its value contains only whitespace characters at instantiation time, THEN THE MatchingAgent SHALL throw an IllegalStateException with a message indicating that `LLM_API_KEY` is not set, without including the variable's value in the message text.
4. IF `LLM_API_URL` is absent or its value contains only whitespace characters at instantiation time, THEN THE MatchingAgent SHALL throw an IllegalStateException with a message indicating that `LLM_API_URL` is not set, without including the variable's value in the message text.
5. IF `LLM_API_URL` is present and non-blank but does not begin with `http://` or `https://`, THEN THE MatchingAgent SHALL throw an IllegalStateException with a message indicating that `LLM_API_URL` is not a valid URL.
6. THE MatchingAgent SHALL never include the value of `LLM_API_KEY` in any log output, printed output, or exception message at any log level or execution path.

---

### Requirement 3: Prompt Construction

**User Story:** As a developer, I want the agent to construct structured prompts from profile data, so that the LLM receives consistent, well-formatted input that produces reliable compatibility assessments.

#### Acceptance Criteria

1. WHEN given a StudentProfile and a list of MentorProfile objects, THE PromptBuilder SHALL produce a single prompt string that includes the student's interests, desired skills, and career goal, each as a distinct labeled section.
2. WHEN given a StudentProfile and a list of MentorProfile objects, THE PromptBuilder SHALL include each mentor's identifier, expertise tags, teachable skills, and background in the prompt string, with each mentor represented as a discrete labeled block identified by the mentor's identifier.
3. THE PromptBuilder SHALL include explicit instructions in the prompt directing the LLM to return a JSON array where each element contains exactly two fields: a mentor identifier matching one of the provided mentor identifiers, and a numeric compatibility score in the range 0 to 100 inclusive.
4. WHEN the list of MentorProfile objects is empty, THE PromptBuilder SHALL return a prompt string that contains instructions directing the LLM to return an empty JSON array and omits all mentor data sections.
5. THE PromptBuilder SHALL produce deterministic output for the same StudentProfile and MentorProfile list inputs, where determinism means byte-for-byte identical prompt strings for identical inputs regardless of invocation order or count.
6. IF any required field of the StudentProfile (interests, desired skills, or career goal) is null or empty, THEN THE PromptBuilder SHALL reject the input and throw an IllegalArgumentException indicating which field is missing without producing a partial prompt string.

---

### Requirement 4: LLM API Communication

**User Story:** As a developer, I want the agent to communicate reliably with the LLM API, so that compatibility evaluations are performed and errors are surfaced clearly.

#### Acceptance Criteria

1. WHEN `rankMentors` is called, THE LLM_Client SHALL send an HTTP POST request to the URL specified by `LLM_API_URL` with the prompt as the request body, the `Content-Type` header set to `text/plain`, and the `LLM_API_KEY` in the Authorization header using the Bearer scheme.
2. WHEN the LLM API returns an HTTP 200 response, THE LLM_Client SHALL pass the response body to the response parser for score extraction.
3. IF the LLM API returns an HTTP status code other than 200, THEN THE LLM_Client SHALL throw a MatchingAgentException that includes the HTTP status code and the response body in the exception message.
4. IF a network timeout or connection error occurs during the API call, THEN THE LLM_Client SHALL throw a MatchingAgentException with a message that identifies the failure type (timeout or connection error) and wraps the original exception as the cause.
5. WHEN `LLM_REQUEST_TIMEOUT_SECONDS` is set to a valid integer value between 1 and 300 inclusive, THE LLM_Client SHALL apply that value as the request timeout in seconds.
6. IF `LLM_REQUEST_TIMEOUT_SECONDS` is absent or is not a valid integer between 1 and 300 inclusive, THEN THE LLM_Client SHALL apply a default request timeout of 30 seconds.
7. IF `LLM_API_URL` or `LLM_API_KEY` is absent or empty at the time `rankMentors` is called, THEN THE LLM_Client SHALL throw a MatchingAgentException with a message indicating which required configuration value is missing before any HTTP request is made.

---

### Requirement 5: Response Parsing and Score Extraction

**User Story:** As a developer, I want the LLM response to be parsed into structured Java objects, so that the application can rank and display mentors programmatically.

#### Acceptance Criteria

1. WHEN the MatchingAgent receives the LLM API response body containing a JSON array where each element includes a mentor identifier field and a numeric score field, THE MatchingAgent SHALL parse the array into a RankedMatchList where each entry holds the mentor identifier and its CompatibilityScore.
2. IF a score field value in the JSON response is outside the range 0–100 inclusive, THEN THE MatchingAgent SHALL clamp the value to 0 if it is below 0 or to 100 if it is above 100, and SHALL continue parsing the remaining entries without throwing an exception.
3. IF the LLM API response body cannot be parsed as valid JSON, THEN THE MatchingAgent SHALL throw a MatchingAgentException with a message indicating a parse failure and including the first 500 characters of the raw response body.
4. IF a JSON entry in the response references a mentor identifier not present in the original input list, THEN THE MatchingAgent SHALL exclude that entry from the RankedMatchList.
5. IF a JSON entry in the response is missing the mentor identifier field or the numeric score field, THEN THE MatchingAgent SHALL exclude that entry from the RankedMatchList and SHALL continue processing the remaining entries.
6. THE MatchingAgent SHALL return the RankedMatchList sorted in descending order by CompatibilityScore; entries with equal CompatibilityScore SHALL retain their original order as received in the JSON response.

---

### Requirement 6: Public Matching API

**User Story:** As a backend developer, I want a simple public method to trigger mentor ranking, so that the Spring Boot controller layer can call the agent without knowing its internal implementation details.

#### Acceptance Criteria

1. THE MatchingAgent SHALL expose a public method `rankMentors(StudentProfile student, List<MentorProfile> candidates)` that returns a `List<RankedMatch>` where each `RankedMatch` contains the matched `MentorProfile` and a numeric compatibility score in the range 0 to 100 inclusive.
2. WHEN `rankMentors` is called with a null StudentProfile, THE MatchingAgent SHALL throw an IllegalArgumentException with the message "StudentProfile must not be null" before any LLM API call is made.
3. WHEN `rankMentors` is called with a null candidates list, THE MatchingAgent SHALL throw an IllegalArgumentException with the message "Candidates list must not be null" before any LLM API call is made.
4. WHEN `rankMentors` is called with an empty candidates list, THE MatchingAgent SHALL return an empty List<RankedMatch> without making an LLM API call.
5. WHEN `rankMentors` is called with a candidates list containing one or more null entries, THE MatchingAgent SHALL throw an IllegalArgumentException with a message indicating the null entry position before any LLM API call is made.
6. THE MatchingAgent class SHALL be instantiable with a no-argument constructor that reads all configuration from environment variables, enabling straightforward use in Spring Boot dependency injection.
7. IF the no-argument constructor is invoked and a required environment variable is absent or blank, THEN THE MatchingAgent SHALL throw an IllegalStateException with a message identifying the missing variable name.

---

### Requirement 7: Runnable Example Entry Point

**User Story:** As a developer, I want a self-contained runnable example, so that I can verify the agent works end-to-end before integrating it into the full Spring Boot application.

#### Acceptance Criteria

1. THE System SHALL provide a `MatchingAgentDemo` class with a `main` method that constructs one StudentProfile and at least two MentorProfile objects, where each profile populates a minimum of three fields relevant to matching (such as skills, interests, or goals).
2. WHEN `MatchingAgentDemo.main` is executed with both `LLM_API_KEY` and `LLM_API_URL` environment variables set, THE MatchingAgentDemo SHALL print the RankedMatchList to standard output with one line per mentor containing the mentor's name and a numeric match score.
3. IF `LLM_API_KEY` or `LLM_API_URL` is not set when `MatchingAgentDemo.main` is executed, THEN THE MatchingAgentDemo SHALL print an error message to standard error that names the missing variable, and SHALL exit with status code 1.
4. THE MatchingAgent implementation class SHALL reside in its own Java source file separate from `App.java` and `MatchingAgentDemo.java`.
