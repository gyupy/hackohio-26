
"use strict";

/*
  BUCKEYE GUILD

  Student accounts, messages, office hours and applications
  are simulated and stored locally.

  Mentor matching uses POST /api/rank when available.
  Otherwise, it falls back to local subject matching.
*/

const $ = id =>
  document.getElementById(id) ||
  document.getElementById({
    "create-tab": "auth-create-tab",
    "login-tab": "auth-return-tab",
    "signup-form": "signup-view",
    "login-form": "return-view",
    "mentor-subjects": "mentor-specialty",
    "profile-name": "profile-display-name",
    "profile-subjects": "profile-subject-tags",
    "profile-links": "profile-evidence-links",
    "project-form": "add-project-form",
    "project-title": "new-project-title",
    "project-description": "new-project-description",
    "project-url": "new-project-link",
    "cancel-edit": "cancel-edit-btn"
  }[id]);

const node = (tag, value = "", cls = "") => {
  const element = document.createElement(tag);
  element.textContent = value;
  if (cls) element.className = cls;
  return element;
};

const on = (id, event, handler) =>
  $(id)?.addEventListener(event, handler);

const text = (id, value) => {
  if ($(id)) $(id).textContent = value;
};

const visible = (id, yes) => {
  if ($(id)) $(id).hidden = !yes;
};

const SUBJECTS = [
  "Computer Science",
  "Mathematics",
  "Engineering",
  "Writing",
  "Business",
  "Design & Games"
];

const STORAGE_KEY = "buckeye-guild-integrated-v1";

const motionOff =
  matchMedia("(prefers-reduced-motion: reduce)").matches;

const SWIPE_MS = motionOff ? 0 : 700;
const UNFURL_MS = motionOff ? 0 : 1600;

const API_URL =
  String(window.BUCKEYE_API_BASE || "").replace(/\/$/, "") +
  "/api/rank";

/* ======================================
   MENTOR AND QUEST DATA
   ====================================== */

const quest = (title, steps) => ({
  title,
  xp: 150,
  steps
});

const mentors = [
  {
    id: "chen",
    name: "Dr. Maya Chen",
    role: "AI & Robotics Research Mentor",
    icon: "🤖",
    subjects: ["Computer Science", "Engineering"],
    skills: ["Python", "AI", "Robotics"],

    description:
      "Studies how robots recognize objects, navigate unfamiliar environments, and assist people.",

    outcome:
      "Practice Python, learn machine learning concepts, and get feedback on an AI project.",

    research: [
      [
        "Autonomous Navigation",
        "Robots mapping unfamiliar spaces",
        "Python, ROS"
      ]
    ],

    projects: [
      [
        "Campus Accessibility Assistant",
        "Computer vision obstacle detection",
        "Python, OpenCV"
      ]
    ],

    slots: [
      "Tuesday · 3:00 PM (demo)",
      "Friday · 10:30 AM (demo)"
    ],

    quest: quest("Robot Rescue", [
      [
        "What value does the robot read?",
        "int[] sensors = {2, 4, 6};\nSystem.out.println(sensors[1]);",
        ["2", "4", "6"],
        1,
        "Java arrays start at zero."
      ],
      [
        "Which condition detects a wall?",
        "boolean wallAhead = true;",
        [
          "if (wallAhead)",
          "if (!wallAhead)",
          "if (wallAhead = false)"
        ],
        0,
        "A boolean can be used directly."
      ],
      [
        "Which loop runs three times?",
        "// Java",
        [
          "for (int i = 0; i < 3; i++)",
          "for (int i = 0; i <= 3; i++)",
          "for (int i = 1; i < 3; i++)"
        ],
        0,
        "Count 0, 1, and 2."
      ]
    ])
  },

  {
    id: "lee",
    name: "Prof. Jordan Lee",
    role: "Game Development & Graphics Mentor",
    icon: "🎮",
    subjects: ["Computer Science", "Design & Games"],
    skills: ["C++", "Unity", "Unreal Engine"],

    description:
      "Develops game systems, procedural worlds, and interactive experiences.",

    outcome:
      "Debug game logic, improve a mechanic, and create a playable portfolio project.",

    research: [
      [
        "Procedural World Generator",
        "Automatically generated environments",
        "C++, Unreal Engine"
      ]
    ],

    projects: [
      [
        "AI Enemy Combat System",
        "Enemies adapting to player actions",
        "Unity, C#"
      ]
    ],

    slots: [
      "Monday · 2:00 PM (demo)",
      "Thursday · 4:00 PM (demo)"
    ],

    quest: quest("The Bug Hunter", [
      [
        "Which operator compares health to zero in C#?",
        "if (health __ 0) { GameOver(); }",
        ["=", "==", "+="],
        1,
        "Two equals signs compare."
      ],
      [
        "What is the new speed?",
        "int speed = 5;\nspeed += 3;",
        ["3", "5", "8"],
        2,
        "+= adds to the original value."
      ],
      [
        "Which Unity check detects the first press of Space?",
        "// Legacy Unity API",
        [
          "Input.GetKeyDown(KeyCode.Space)",
          "Input.GetKey(KeyCode.Space)",
          "Input.anyKey"
        ],
        0,
        "GetKeyDown detects the first press."
      ]
    ])
  },

  {
    id: "rivera",
    name: "Dr. Alex Rivera",
    role: "Cybersecurity & Software Engineering Mentor",
    icon: "🔐",
    subjects: ["Computer Science"],
    skills: ["Java", "Testing", "Cybersecurity"],

    description:
      "Researches secure programming, software vulnerabilities, and reliable applications.",

    outcome:
      "Practice testing, debugging, and secure coding techniques.",

    research: [
      [
        "Automated Code Review",
        "Finding common software vulnerabilities",
        "Java, Python"
      ]
    ],

    projects: [
      [
        "Password Safety Checker",
        "Password policy testing",
        "Java"
      ]
    ],

    slots: [
      "Wednesday · 1:30 PM (demo)",
      "Friday · 2:00 PM (demo)"
    ],

    quest: quest("Shield Keeper", [
      [
        "Which check finds a password shorter than eight characters?",
        'String password = "abc123";',
        [
          "password.length() < 8",
          "password.length() > 8",
          "password.length() == 8"
        ],
        0,
        "Shorter means less than eight."
      ],
      [
        "Which comparison checks String contents?",
        'String input = "admin";',
        [
          'input == "admin"',
          'input.equals("admin")',
          'input = "admin"'
        ],
        1,
        "Use .equals() for Strings."
      ],
      [
        "Which SQL approach is safer?",
        "// User supplies search text",
        [
          "Concatenate input into SQL",
          "Prepared statement with parameters",
          "Remove spaces only"
        ],
        1,
        "Keep data separate from SQL instructions."
      ]
    ])
  },

  {
    id: "patel",
    name: "Dr. Priya Patel",
    role: "Mathematics & Data Science Mentor",
    icon: "∑",
    subjects: ["Mathematics", "Computer Science"],
    skills: ["Calculus", "Statistics", "Python"],

    description:
      "Helps students understand calculus, statistics, and mathematical models.",

    outcome:
      "Learn mathematical reasoning and apply it to real problems.",

    research: [
      [
        "Everyday Data Models",
        "Mathematical models of real-world patterns",
        "Python, R"
      ]
    ],

    projects: [
      [
        "Campus Transit Analysis",
        "Travel-time patterns",
        "Statistics, R"
      ]
    ],

    slots: [
      "Tuesday · 11:00 AM (demo)",
      "Thursday · 1:00 PM (demo)"
    ],

    quest: quest("The Numbers Keep", [
      [
        "What is the derivative of x squared?",
        "f(x) = x²",
        ["x", "2x", "x³"],
        1,
        "Use the power rule."
      ],
      [
        "What is the mean of 2, 4 and 6?",
        "[2, 4, 6]",
        ["3", "4", "6"],
        1,
        "Add and divide by three."
      ],
      [
        "What is P(heads) on one fair coin toss?",
        "P(H)",
        ["1/4", "1/2", "1"],
        1,
        "There are two equally likely outcomes."
      ]
    ])
  },

  {
    id: "brooks",
    name: "Prof. Samira Brooks",
    role: "Writing & Communication Mentor",
    icon: "✒",
    subjects: ["Writing", "Business"],
    skills: ["Writing", "Presentations", "Feedback"],

    description:
      "Helps students communicate complex ideas through writing and presentations.",

    outcome:
      "Improve project pitches, writing clarity, and public speaking.",

    research: [
      [
        "Communicating Technical Ideas",
        "Making research understandable",
        "Writing, Media"
      ]
    ],

    projects: [
      [
        "Accessible Science Exhibit",
        "Explaining research to the public",
        "Writing, Design"
      ]
    ],

    slots: [
      "Monday · 11:00 AM (demo)",
      "Wednesday · 3:00 PM (demo)"
    ],

    quest: quest("The Storysmith", [
      [
        "Which opening clearly describes a problem?",
        "// Project pitch",
        [
          "We used many technologies.",
          "Students struggle to find academic help, so we connect them with mentors.",
          "Our team is talented."
        ],
        1,
        "Start with your audience's problem."
      ],
      [
        "Which outcome is most specific?",
        "// Outcome",
        [
          "It was cool.",
          "We did work.",
          "Three students tested our prototype."
        ],
        2,
        "Specific results communicate value."
      ],
      [
        "What should you do after feedback?",
        "// Revision",
        [
          "Understand the feedback",
          "Ignore it",
          "Add jargon"
        ],
        0,
        "Understand feedback before revising."
      ]
    ])
  },

  {
    id: "okafor",
    name: "Dr. Nia Okafor",
    role: "Engineering & Physics Mentor",
    icon: "⚙",
    subjects: ["Engineering", "Mathematics", "Design & Games"],
    skills: ["Physics", "CAD", "Prototyping"],

    description:
      "Guides students in engineering design, measurement, and physical prototyping.",

    outcome:
      "Build prototypes, evaluate design tradeoffs, and test ideas.",

    research: [
      [
        "Rapid Prototyping",
        "Measurable design experiments",
        "CAD, Physics"
      ]
    ],

    projects: [
      [
        "Bridge Structure Tester",
        "Comparing structural performance",
        "CAD, Fabrication"
      ]
    ],

    slots: [
      "Tuesday · 4:00 PM (demo)",
      "Friday · 11:00 AM (demo)"
    ],

    quest: quest("The Inventor's Trial", [
      [
        "What is the SI unit of force?",
        "F = ma",
        ["Newton", "Watt", "Joule"],
        0,
        "Force is measured in newtons."
      ],
      [
        "What should change in a controlled experiment?",
        "// Design test",
        [
          "Every variable",
          "One variable at a time",
          "Nothing"
        ],
        1,
        "Isolate one factor."
      ],
      [
        "What should you do after a prototype fails?",
        "// Iterate",
        [
          "Hide the failure",
          "Guess randomly",
          "Measure the failure and improve"
        ],
        2,
        "Use evidence for the next design."
      ]
    ])
  }
];

/* ======================================
   STATE AND LOCAL STORAGE
   ====================================== */

const blank = () => ({
  profile: null,
  liked: [],
  passed: [],
  messages: {},
  quests: {},
  sessions: [],
  projects: [],
  applications: [],
  xp: 0
});

function load() {
  try {
    const stored = JSON.parse(
      localStorage.getItem(STORAGE_KEY)
    );

    if (!stored || typeof stored !== "object") {
      return blank();
    }

    const state = {
      ...blank(),
      ...stored
    };

    for (const key of [
      "liked",
      "passed",
      "sessions",
      "projects",
      "applications"
    ]) {
      if (!Array.isArray(state[key])) {
        state[key] = [];
      }
    }

    for (const key of ["messages", "quests"]) {
      if (!state[key] || typeof state[key] !== "object") {
        state[key] = {};
      }
    }

    return state;

  } catch {
    return blank();
  }
}

let state = load();

let signedIn = false;
let current = null;
let chatId = null;
let questId = null;
let applicationId = null;

let animationTimer;
let swipeTimer;
let toastTimer;
let resumeUrl;
let rankController;
let rankNumber = 0;

let dragging = false;
let pointer = null;
let startX = 0;
let dragX = 0;
let animating = false;
let arrival = "left";
let canAdvance = false;

let rankingLabel = "Local interest matching";

const agentScores = new Map();

const mentor = id =>
  mentors.find(m => m.id === id);

/*
  IMPORTANT BROWSE AGAIN FIX

  null means the normal deck.
  An array means we're browsing all mentors again.

  We do NOT delete liked mentors or quest progress.
*/

let replayDeck = null;

function save() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(state)
    );
  } catch (error) {
    console.warn("Storage unavailable:", error);
  }
}

function notice(message) {
  clearTimeout(toastTimer);

  text("toast", message);
  visible("toast", true);

  toastTimer = setTimeout(() => {
    visible("toast", false);
  }, 2800);
}

const uniqueSkills = raw =>
  [...new Set(
    raw.split(",")
      .map(s => s.trim())
      .filter(Boolean)
  )].slice(0, 15);

const selected = id =>
  [...$(id).querySelectorAll("input:checked")]
    .map(input => input.value);

function subjectInputs(id, checked = []) {
  $(id).replaceChildren(
    ...SUBJECTS.map(subject => {
      const label = node("label", "", "subject-choice");
      const input = node("input");

      input.type = "checkbox";
      input.value = subject;
      input.checked = checked.includes(subject);

      label.append(
        input,
        node("span", subject)
      );

      return label;
    })
  );
}

function safeURL(raw, host = "") {
  if (!raw.trim()) {
    return "";
  }

  const url = new URL(raw.trim());

  const domain = url.hostname
    .toLowerCase()
    .replace(/^www\./, "");

  if (
    url.protocol !== "https:" ||
    (host && domain !== host)
  ) {
    throw Error(
      "Enter a valid HTTPS URL" +
      (host ? " from " + host : "") +
      "."
    );
  }

  return url.href;
}

const fieldURL = (id, host) =>
  safeURL($(id).value, host);

function resume(id) {
  const file = $(id)?.files?.[0];

  if (!file) return null;

  if (
    !/\.(pdf|doc|docx)$/i.test(file.name) ||
    file.size > 5 * 1024 * 1024
  ) {
    throw Error(
      "Resume must be PDF/Word and at most 5 MB."
    );
  }

  if (resumeUrl) {
    URL.revokeObjectURL(resumeUrl);
  }

  resumeUrl = URL.createObjectURL(file);

  return file.name;
}

function addLink(parent, title, href) {
  if (!href) return;

  const a = node("a", title + " ↗");

  a.href = href;
  a.target = "_blank";
  a.rel = "noopener noreferrer";

  parent.append(a);
}

function evidence(title, description = "", href = "") {
  const card = node("div", "", "evidence-card");

  card.append(node("strong", title));

  if (description) {
    card.append(node("p", description));
  }

  addLink(card, "View project", href);

  return card;
}

function stats() {
  text("stat-xp", state.xp);
  text("stat-mentors", state.liked.length);
  text("nav-liked-count", state.liked.length);
  text("guild-count", state.liked.length);

  text(
    "stat-quests",
    Object.values(state.quests)
      .filter(q => q?.completed).length
  );
}

/* ======================================
   ACCOUNT CREATION AND LOGIN
   ====================================== */

function authTab(name) {
  const create = name === "create";

  visible("signup-form", create);
  visible("login-form", !create);

  $("create-tab").classList.toggle(
    "active",
    create
  );

  $("login-tab").classList.toggle(
    "active",
    !create
  );

  text(
    "saved-account-note",
    state.profile
      ? `Saved demo: ${state.profile.name} (${state.profile.email})`
      : "No demo account saved."
  );

  if (state.profile) {
    $("login-email").value =
      state.profile.email;
  }
}

on("create-tab", "click", () => authTab("create"));
on("login-tab", "click", () => authTab("login"));

function createAccount(profile) {
  state = {
    ...blank(),
    profile
  };

  replayDeck = null;
  agentScores.clear();

  save();
  startApp();
}

on("signup-form", "submit", event => {
  event.preventDefault();
  visible("signup-error", false);

  try {
    const profile = {
      name: $("signup-name").value.trim(),

      email: $("signup-email")
        .value.trim().toLowerCase(),

      major: $("signup-major").value.trim(),

      year: $("signup-year").value,

      subjects: selected("signup-subjects"),

      goal: $("signup-goal").value.trim(),

      desiredSkills: uniqueSkills(
        $("signup-skills")?.value || ""
      ),

      help: $("signup-help").value,
      time: $("signup-time").value,

      github: fieldURL(
        "signup-github",
        "github.com"
      ),

      linkedin: fieldURL(
        "signup-linkedin",
        "linkedin.com"
      ),

      portfolio: fieldURL("signup-portfolio"),

      resumeName:
        resume("signup-resume") || ""
    };

    if (
      ![
        profile.name,
        profile.email,
        profile.major,
        profile.year,
        profile.goal
      ].every(Boolean) ||
      !profile.subjects.length
    ) {
      throw Error(
        "Complete required fields and choose a subject."
      );
    }

    createAccount(profile);

  } catch (error) {
    text("signup-error", error.message);
    visible("signup-error", true);
  }
});

on("sample-btn", "click", () => {
  createAccount({
    name: "Taylor Morgan",
    email: "taylor.demo@buckeyemail.osu.edu",
    major: "Computer Science",
    year: "Second year",

    subjects: [
      "Computer Science",
      "Design & Games"
    ],

    goal: "Improve my C# skills and build a game.",

    desiredSkills: [
      "C#",
      "Unity"
    ],

    help: "Office hours",
    time: "2–3 hours / week",

    github: "",
    linkedin: "",
    portfolio: "",
    resumeName: ""
  });
});

function login(event) {
  event?.preventDefault();

  if (
    state.profile?.email ===
    $("login-email").value.trim().toLowerCase()
  ) {
    startApp();

  } else {
    text(
      "login-error",
      "No matching local demo account exists."
    );

    visible("login-error", true);
  }
}

on("login-form", "submit", login);
on("login-btn", "click", login);

on("signout-btn", "click", () => {
  signedIn = false;

  rankNumber++;
  rankController?.abort();

  visible("app-screen", false);
  visible("top-nav", false);
  visible("auth-screen", true);

  authTab("login");
});

function startApp() {
  signedIn = true;

  visible("auth-screen", false);
  visible("app-screen", true);
  visible("top-nav", true);

  page("discover");
  rankBackend();

  notice("Welcome to Buckeye Guild!");
}

/* ======================================
   PAGE NAVIGATION
   ====================================== */

function page(name) {
  if (!signedIn) return;

  for (const view of [
    "discover",
    "guild",
    "journey",
    "mentor"
  ]) {
    visible(
      "view-" + view,
      view === name
    );
  }

  document.querySelectorAll("[data-page]")
    .forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.page === name
      );
    });

  stats();

  ({
    discover,
    guild,
    journey,
    mentor: mentorPreview
  })[name]();

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}

document.querySelectorAll("[data-page]")
  .forEach(button => {
    button.addEventListener("click", () => {
      page(button.dataset.page);
    });
  });

on("brand-link", "click", event => {
  event.preventDefault();

  if (signedIn) {
    page("discover");
  }
});

/* ======================================
   JAVA BACKEND MATCHING AGENT
   ====================================== */

const studentDTO = profile => ({
  id: "demo-student",

  interests: profile.subjects,

  desiredSkills: profile.desiredSkills?.length
    ? profile.desiredSkills
    : profile.subjects,

  careerGoal: profile.goal
});

const mentorDTO = m => ({
  id: m.id,
  displayName: m.name,

  expertiseTags: [
    ...new Set([
      ...m.subjects,
      ...m.skills
    ])
  ],

  teachableSkills: m.skills,

  professionalBackground:
    `${m.role}. ${m.description} ${m.outcome}`
});

function score(m) {
  if (agentScores.has(m.id)) {
    return agentScores.get(m.id);
  }

  const subjectsHit = m.subjects.filter(
    subject =>
      state.profile.subjects.includes(subject)
  ).length;

  const skillsHit = m.skills.filter(
    skill =>
      (state.profile.desiredSkills || [])
        .some(wanted =>
          wanted.toLowerCase() === skill.toLowerCase()
        )
  ).length;

  return Math.min(
    97,
    65 + subjectsHit * 10 + skillsHit * 6
  );
}

function ranking(label, connected = false) {
  rankingLabel = label;

  text("ranking-status", label);

  $("ranking-status")?.classList.toggle(
    "online",
    connected
  );
}

async function rankBackend() {
  if (!signedIn) return;

  rankController?.abort();

  const seq = ++rankNumber;
  const controller = new AbortController();

  rankController = controller;

  const profile = JSON.stringify(
    studentDTO(state.profile)
  );

  ranking("Checking Java Matching Agent...");

  const timeout = setTimeout(
    () => controller.abort(),
    8000
  );

  try {
    const response = await fetch(API_URL, {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        student: JSON.parse(profile),
        mentors: mentors.map(mentorDTO)
      }),

      signal: controller.signal
    });

    if (!response.ok) {
      throw Error("HTTP " + response.status);
    }

    const data = await response.json();

    if (!Array.isArray(data.matches)) {
      throw Error("Missing matches array");
    }

    const rows = data.matches
      .map(match => [
        String(
          match.id ??
          match.mentorId ??
          match.mentor?.id ??
          ""
        ),

        Number(
          match.score ??
          match.matchScore ??
          match.compatibilityScore
        )
      ])
      .filter(([id, value]) =>
        mentor(id) &&
        Number.isFinite(value) &&
        value >= 0
      );

    if (!rows.length) {
      throw Error("No valid scores");
    }

    const normalized = rows.every(
      ([, value]) => value <= 1
    );

    const next = new Map();

    rows.forEach(([id, value]) => {
      const percent = normalized
        ? value * 100
        : value;

      if (percent <= 100) {
        next.set(
          id,
          Math.round(percent)
        );
      }
    });

    if (!next.size) {
      throw Error("Scores outside 0–100");
    }

    if (
      !signedIn ||
      seq !== rankNumber ||
      profile !== JSON.stringify(
        studentDTO(state.profile)
      )
    ) {
      return;
    }

    agentScores.clear();

    next.forEach((value, id) => {
      agentScores.set(id, value);
    });

    ranking(
      `Java Matching Agent connected · ${next.size} ranked`,
      true
    );

    if (current) {
      text(
        "match-score",
        score(current) + "% Interest Fit"
      );
    }

  } catch (error) {
    if (
      !signedIn ||
      seq !== rankNumber
    ) {
      return;
    }

    agentScores.clear();

    ranking(
      "Local matching · Java backend unavailable"
    );

    if (current) {
      text(
        "match-score",
        score(current) + "% Interest Fit"
      );
    }

    console.warn(
      "Matching Agent fallback:",
      error.message
    );

  } finally {
    clearTimeout(timeout);

    if (rankController === controller) {
      rankController = null;
    }
  }
}

/* ======================================
   MENTOR DISCOVERY
   ====================================== */

/*
  ORIGINAL DECK:
  Hide mentors you already liked or passed.

  REPLAY DECK:
  Show ALL mentors again.

  This fixes Browse Again without clearing Your Guild.
*/

function remaining() {
  return mentors
    .filter(m =>
      replayDeck !== null
        ? replayDeck.includes(m.id)
        : !state.liked.includes(m.id) &&
          !state.passed.includes(m.id)
    )
    .sort((a, b) =>
      score(b) - score(a) ||
      a.name.localeCompare(b.name)
    );
}

function discover() {
  text(
    "welcome-copy",
    `Welcome, ${state.profile.name}! Interests: ` +
    state.profile.subjects.join(", ") +
    "."
  );

  ranking(
    rankingLabel,
    agentScores.size > 0
  );

  renderCard();
}

/* ======================================
   FIX: AUTO-SIZE THE MENTOR SCROLL
   ====================================== */

/*
  The content determines the parchment height.

  This prevents a second vertical scrollbar from
  appearing inside the mentor scroll.
*/

function fitScroll() {
  if (!current || $("card").hidden) {
    return;
  }

  const area = $("swipe-area");

  const content = $("scroll-paper")
    .querySelector(".scroll-content");

  const minHeight = matchMedia(
    "(max-width:520px)"
  ).matches
    ? 770
    : 690;

  // Reset to normal size before measuring content.
  area.style.height = minHeight + "px";

  // Add space for paper borders and wooden rollers.
  const height = Math.max(
    minHeight,
    Math.ceil(content.scrollHeight + 54)
  );

  area.style.height = height + "px";

  // Move the rollers from the card center during unfurling.
  area.style.setProperty(
    "--roller-travel",
    Math.max(0, (height - 62) / 2) + "px"
  );
}

/* ======================================
   DISPLAY CURRENT MENTOR
   ====================================== */

function renderCard() {
  clearTimeout(animationTimer);

  current = remaining()[0] || null;

  const done = !current;

  for (const id of [
    "card",
    "card-behind",
    "actions",
    "swipe-hint",
    "projects-btn"
  ]) {
    visible(id, !done);
  }

  visible("empty-state", done);
  visible("projects-panel", false);

  const area = $("swipe-area");

  area.classList.toggle(
    "finished",
    done
  );

  if (done) {
    // Allow CSS to size the completed-state box.
    area.style.height = "";
    animating = false;
    return;
  }

  const fields = {
    "mentor-name": current.name,
    "mentor-role": current.role,
    "mentor-icon": current.icon,

    "mentor-subjects":
      current.subjects.join(" · "),

    "match-score":
      score(current) + "% Interest Fit",

    "mentor-description":
      current.description,

    "mentor-outcome":
      current.outcome,

    "mentor-office":
      "◷ Typical visit: 15–30 minutes (demo)"
  };

  for (const [id, value] of Object.entries(fields)) {
    text(id, value);
  }

  $("mentor-skills").replaceChildren(
    ...current.skills.map(skill =>
      node("span", skill)
    )
  );

  // Size the parchment to the new profile.
  setTimeout(fitScroll, 0);

  text(
    "projects-btn",
    "📜 Open Quest Archive ↓"
  );

  const card = $("card");

  card.classList.remove(
    "enter-left",
    "enter-right",
    "unfurl"
  );

  Object.assign(card.style, {
    transition: "none",
    transform: "translateX(-50%)",
    opacity: "1"
  });

  $("like-stamp").style.opacity = "0";
  $("pass-stamp").style.opacity = "0";

  // Restart parchment animations.
  void card.offsetWidth;

  card.classList.add(
    arrival === "left"
      ? "enter-left"
      : "enter-right",
    "unfurl"
  );

  animating = UNFURL_MS > 0;

  animationTimer = setTimeout(() => {
    card.classList.remove(
      "enter-left",
      "enter-right",
      "unfurl"
    );

    card.style.transform =
      "translateX(-50%)";

    animating = false;

  }, UNFURL_MS + 40);
}

// Recalculate parchment height on window resize.
window.addEventListener("resize", () => {
  if (
    signedIn &&
    !$("view-discover").hidden
  ) {
    fitScroll();
  }
});

/* ======================================
   MENTOR PROJECT ARCHIVE
   ====================================== */

on("projects-btn", "click", () => {
  if (!current) return;

  const open = $("projects-panel").hidden;

  visible("projects-panel", open);

  text(
    "projects-btn",
    open
      ? "📜 Close Quest Archive ↑"
      : "📜 Open Quest Archive ↓"
  );

  $("projects-btn").setAttribute(
    "aria-expanded",
    String(open)
  );

  if (!open) return;

  for (const [id, items] of [
    ["professor-projects", current.research],
    ["student-projects", current.projects]
  ]) {
    $(id).replaceChildren(
      ...items.map(([title, description, tech]) => {
        const card = node(
          "div",
          "",
          "project-item"
        );

        card.append(
          node("strong", title),
          node("p", description),
          node("small", tech)
        );

        return card;
      })
    );
  }
});

/* ======================================
   CONNECTIONS AND SWIPING
   ====================================== */

function ensureChat(id) {
  if (!state.messages[id]) {
    state.messages[id] = [{
      from: "mentor",

      text:
        `Greetings! I've assigned you ` +
        `“${mentor(id).quest.title}.” ` +
        `Open Quests to begin. (Demo)`
    }];
  }

  if (!state.quests[id]) {
    state.quests[id] = {
      index: 0,
      completed: false
    };
  }
}

function swipe(kind) {
  if (animating || !current) {
    return;
  }

  animating = true;

  const id = current.id;

  const like = kind === "like";
  const direction = like ? 1 : -1;

  // Remove this mentor from the current replay deck.
  if (replayDeck !== null) {
    replayDeck = replayDeck.filter(
      key => key !== id
    );
  }

  if (like) {
    if (!state.liked.includes(id)) {
      state.liked.push(id);
    }

    // A previously passed mentor can now be connected.
    state.passed = state.passed.filter(
      key => key !== id
    );

    ensureChat(id);
    chatId = id;

    notice(
      `♥ ${current.name} added to Your Guild!`
    );

  } else if (
    !state.liked.includes(id) &&
    !state.passed.includes(id)
  ) {
    state.passed.push(id);
  }

  save();
  stats();

  arrival = like ? "left" : "right";

  const card = $("card");

  card.style.transition =
    `transform ${SWIPE_MS}ms ease-in-out, ` +
    `opacity ${SWIPE_MS}ms ease-in-out`;

  card.style.transform =
    `translateX(calc(-50% + ${direction * 850}px)) ` +
    `rotate(${direction * 24}deg)`;

  card.style.opacity = "0";

  $(
    like ? "like-stamp" : "pass-stamp"
  ).style.opacity = "1";

  clearTimeout(swipeTimer);

  swipeTimer = setTimeout(
    renderCard,
    SWIPE_MS
  );
}

on("like-btn", "click", () => {
  swipe("like");
});

on("pass-btn", "click", () => {
  swipe("pass");
});

/* ======================================
   FIX: BROWSE AGAIN BUTTON
   ====================================== */

on("restart-btn", "click", () => {
  /*
    OLD BEHAVIOR:
    state.passed = [];

    This still hid every already-connected mentor.

    NEW BEHAVIOR:
    Create a fresh deck containing all six mentors.
    Keep the student's connections and progress.
  */

  replayDeck = mentors.map(m => m.id);

  arrival = "left";

  renderCard();

  notice(
    "All mentor scrolls are available again!"
  );
});

/* ======================================
   DRAG-TO-SWIPE
   ====================================== */

function snap() {
  $("card").style.transition =
    `transform ${motionOff ? 0 : 400}ms ease`;

  $("card").style.transform =
    "translateX(-50%) rotate(0deg)";

  $("like-stamp").style.opacity = "0";
  $("pass-stamp").style.opacity = "0";
}

on("card", "pointerdown", event => {
  if (
    animating ||
    (
      event.pointerType === "mouse" &&
      event.button !== 0
    )
  ) {
    return;
  }

  dragging = true;
  pointer = event.pointerId;
  startX = event.clientX;
  dragX = 0;

  event.currentTarget.setPointerCapture(
    pointer
  );

  event.currentTarget.style.transition =
    "none";
});

on("card", "pointermove", event => {
  if (
    !dragging ||
    event.pointerId !== pointer
  ) {
    return;
  }

  dragX = event.clientX - startX;

  $("card").style.transform =
    `translateX(calc(-50% + ${dragX}px)) ` +
    `rotate(${dragX / 22}deg)`;

  $("like-stamp").style.opacity =
    Math.min(
      1,
      Math.max(0, dragX / 100)
    );

  $("pass-stamp").style.opacity =
    Math.min(
      1,
      Math.max(0, -dragX / 100)
    );
});

on("card", "pointerup", event => {
  if (
    !dragging ||
    event.pointerId !== pointer
  ) {
    return;
  }

  dragging = false;
  pointer = null;

  if (dragX > 100) {
    swipe("like");
  } else if (dragX < -100) {
    swipe("pass");
  } else {
    snap();
  }
});

on("card", "pointercancel", () => {
  dragging = false;
  pointer = null;
  snap();
});

/* ======================================
   YOUR GUILD
   ====================================== */

function guild() {
  const list = $("liked-list");

  list.replaceChildren();

  if (!state.liked.length) {
    list.append(
      node(
        "p",
        "No connections yet. Swipe right to connect."
      )
    );

    visible("chat-panel", false);
    visible("chat-placeholder", true);

    return;
  }

  list.replaceChildren(
    ...state.liked
      .filter(mentor)
      .map(id => {
        const m = mentor(id);

        const button = node(
          "button",
          "",
          "liked-mentor"
        );

        button.append(
          node("strong", m.name),
          node("small", m.role)
        );

        button.addEventListener("click", () => {
          openChat(id);
        });

        return button;
      })
  );

  openChat(
    state.liked.includes(chatId)
      ? chatId
      : state.liked[0]
  );
}

function openChat(id) {
  chatId = id;
  questId = null;

  ensureChat(id);

  visible("chat-panel", true);
  visible("chat-placeholder", false);

  text(
    "chat-mentor-name",
    mentor(id).name
  );

  text(
    "chat-mentor-role",
    mentor(id).role
  );

  [...$("liked-list").children]
    .forEach((button, index) => {
      button.classList.toggle(
        "selected",
        state.liked[index] === id
      );
    });

  messages();
  tab("messages");
}

function messages() {
  const box = $("chat-messages");

  box.replaceChildren(
    ...(state.messages[chatId] || [])
      .map(message =>
        node(
          "div",
          message.text,

          "chat-message" +
          (
            message.from === "mentor"
              ? " mentor-message"
              : ""
          )
        )
      )
  );

  box.scrollTop =
    box.scrollHeight;
}

on("chat-form", "submit", event => {
  event.preventDefault();

  const message =
    $("chat-input").value.trim();

  if (!message || !chatId) {
    return;
  }

  state.messages[chatId].push({
    from: "student",
    text: message
  });

  $("chat-input").value = "";

  save();
  messages();
});

/* ======================================
   MESSAGES, QUESTS, OFFICE HOURS TABS
   ====================================== */

function tab(name) {
  for (const currentTab of [
    "messages",
    "quests",
    "hours"
  ]) {
    visible(
      currentTab + "-view",
      currentTab === name
    );

    $(currentTab + "-tab")?.classList.toggle(
      "active",
      currentTab === name
    );

    $(currentTab + "-tab")?.setAttribute(
      "aria-selected",
      String(currentTab === name)
    );
  }

  if (name === "quests") {
    questList();
  }

  if (name === "hours") {
    hours();
  }
}

for (const name of [
  "messages",
  "quests",
  "hours"
]) {
  on(name + "-tab", "click", () => {
    tab(name);
  });
}

/* ======================================
   PLAYABLE QUESTS
   ====================================== */

function questList() {
  visible("quest-list", true);
  visible("quest-game", false);

  const m = mentor(chatId);
  const progress = state.quests[chatId];

  const card = node(
    "div",
    "",
    "quest-card"
  );

  card.append(
    node(
      "p",
      progress.completed
        ? "✓ Quest complete"
        : "⚔ Practice quest"
    ),

    node("h3", m.quest.title),

    node(
      "p",
      `3 stages · ${m.quest.xp} XP once`
    )
  );

  const button = node(
    "button",

    progress.completed
      ? "Replay quest"
      : progress.index
        ? "Continue quest"
        : "Accept quest",

    "primary-button"
  );

  button.addEventListener("click", () => {
    questId = chatId;

    if (progress.completed) {
      progress.index = 0;
    }

    visible("quest-list", false);
    visible("quest-game", true);

    stage();
  });

  card.append(button);

  $("quest-list").replaceChildren(card);
}

function stage() {
  const m = mentor(questId);

  const progress =
    state.quests[questId];

  const [
    question,
    code,
    choices,
    right,
    hint
  ] = m.quest.steps[progress.index];

  canAdvance = false;

  text(
    "quest-stage",
    `Stage ${progress.index + 1} of ${m.quest.steps.length}`
  );

  text("quest-title", m.quest.title);
  text("quest-question", question);
  text("quest-code", code);

  visible("quest-code", !!code);
  visible("next-stage", false);

  text("quest-feedback", "");

  $("quest-choices").replaceChildren(
    ...choices.map((answer, index) => {
      const button = node(
        "button",
        answer
      );

      button.type = "button";

      button.addEventListener("click", () => {
        if (canAdvance) {
          return;
        }

        if (index !== right) {
          button.classList.add("wrong");

          text(
            "quest-feedback",
            "Not quite. Hint: " + hint
          );

          return;
        }

        canAdvance = true;

        [...$("quest-choices").children]
          .forEach(choice => {
            choice.disabled = true;
            choice.classList.remove("wrong");
          });

        button.classList.add("correct");

        text(
          "quest-feedback",
          "✓ Correct! " + hint
        );

        text(
          "next-stage",

          progress.index ===
          m.quest.steps.length - 1
            ? "Complete quest ✓"
            : "Next stage →"
        );

        visible("next-stage", true);
      });

      return button;
    })
  );
}

on("next-stage", "click", () => {
  if (!canAdvance || !questId) {
    return;
  }

  const progress =
    state.quests[questId];

  const m = mentor(questId);

  if (
    progress.index <
    m.quest.steps.length - 1
  ) {
    progress.index++;

    save();
    stage();

    return;
  }

  if (!progress.completed) {
    progress.completed = true;

    state.xp += m.quest.xp;

    state.messages[questId].push({
      from: "mentor",

      text:
        `Quest complete! You earned ` +
        `${m.quest.xp} XP. (Demo message)`
    });

    notice(
      `Quest complete! +${m.quest.xp} XP`
    );

  } else {
    notice(
      "Quest replayed. XP is awarded once."
    );
  }

  save();
  stats();
  questList();
  messages();
});

on("back-to-quests", "click", questList);

/* ======================================
   OFFICE HOURS
   ====================================== */

function hours() {
  if (!chatId) return;

  $("hours-slot").replaceChildren(
    ...mentor(chatId).slots
      .map(slot => {
        const option = node(
          "option",
          slot
        );

        option.value = slot;

        return option;
      })
  );

  $("hours-history").replaceChildren(
    ...state.sessions
      .filter(session =>
        session.mentorId === chatId
      )
      .map(session =>
        node(
          "div",

          `${session.slot} · ${session.question}`,

          "session-entry"
        )
      )
  );
}

on("hours-form", "submit", event => {
  event.preventDefault();

  if (!chatId) return;

  const question =
    $("hours-question").value.trim();

  const slot =
    $("hours-slot").value;

  if (!question) return;

  state.sessions.push({
    mentorId: chatId,
    slot,
    question
  });

  state.messages[chatId].push({
    from: "student",

    text:
      `Office hours (${slot}): ${question}`
  });

  $("hours-question").value = "";

  save();
  hours();

  notice(
    "Demo request saved — not a real booking."
  );
});

/* ======================================
   STUDENT JOURNEY
   ====================================== */

function journey() {
  const profile = state.profile;

  text(
    "profile-name",
    profile.name
  );

  text(
    "profile-xp",
    `${state.xp} XP`
  );

  text(
    "profile-summary",

    `${profile.year} · ${profile.major} · ` +
    `${profile.time}. Goal: ${profile.goal}`
  );

  $("profile-subjects").replaceChildren(
    ...profile.subjects.map(subject =>
      node("span", subject)
    )
  );

  const links = $("profile-links");

  links.replaceChildren();

  addLink(
    links,
    "GitHub",
    profile.github
  );

  addLink(
    links,
    "LinkedIn",
    profile.linkedin
  );

  addLink(
    links,
    "Portfolio",
    profile.portfolio
  );

  text(
    "resume-note",

    profile.resumeName
      ? `Resume: ${profile.resumeName}. ` +
        (
          resumeUrl
            ? "Available in this session."
            : "Re-upload to view."
        )
      : "No resume selected."
  );

  /* Completed quests */

  $("quest-evidence").replaceChildren(
    ...mentors
      .filter(m =>
        state.quests[m.id]?.completed
      )
      .map(m =>
        evidence(
          `✓ ${m.quest.title} · ${m.quest.xp} XP`
        )
      )
  );

  /* Student projects */

  $("project-evidence").replaceChildren(
    ...state.projects.map(project =>
      evidence(
        project.title,
        project.description,
        project.url
      )
    )
  );

  /* Available longer-term applications */

  const list = $("path-mentor-list");

  list.replaceChildren();

  if (!state.liked.length) {
    list.append(
      node(
        "p",
        "Connect with a mentor first."
      )
    );
  }

  state.liked.forEach(id => {
    const m = mentor(id);

    if (!m) return;

    const card = node(
      "div",
      "",
      "path-mentor"
    );

    const button = node(
      "button",
      "Express Interest →",
      "secondary-button"
    );

    button.addEventListener("click", () => {
      apply(id);
    });

    card.append(
      node("strong", m.name),
      node("small", m.role),
      button
    );

    list.append(card);
  });

  /* Existing applications */

  const apps = $("application-list");

  apps.replaceChildren();

  if (!state.applications.length) {
    apps.append(
      node("p", "No applications yet.")
    );
  }

  state.applications.forEach(application => {
    apps.append(
      evidence(
        `${mentor(application.mentorId)?.name || "Mentor"} · ` +
        application.type,

        `${application.message} · Status: ` +
        application.status
      )
    );
  });

  visible("edit-profile-panel", false);
}

/* ======================================
   ADD PROJECT
   ====================================== */

on("project-form", "submit", event => {
  event.preventDefault();

  try {
    const title =
      $("project-title").value.trim();

    const description =
      $("project-description").value.trim();

    const href =
      fieldURL("project-url");

    if (!title || !description) {
      return;
    }

    state.projects.push({
      title,
      description,
      url: href
    });

    save();

    $("project-form").reset();

    journey();

    notice("Project added.");

  } catch (error) {
    notice(error.message);
  }
});

/* ======================================
   EDIT STUDENT PROFILE
   ====================================== */

on("edit-profile-btn", "click", () => {
  const profile = state.profile;

  for (const key of [
    "name",
    "major",
    "year",
    "goal",
    "help",
    "time",
    "github",
    "linkedin",
    "portfolio"
  ]) {
    $("edit-" + key).value =
      profile[key] || "";
  }

  if ($("edit-skills")) {
    $("edit-skills").value =
      (profile.desiredSkills || [])
        .join(", ");
  }

  subjectInputs(
    "edit-subjects",
    profile.subjects
  );

  visible(
    "edit-profile-panel",
    true
  );

  $("edit-profile-panel").scrollIntoView({
    behavior: "smooth"
  });
});

on("cancel-edit", "click", () => {
  visible(
    "edit-profile-panel",
    false
  );
});

on("edit-profile-form", "submit", event => {
  event.preventDefault();

  try {
    const profile = {
      ...state.profile
    };

    for (const key of [
      "name",
      "major",
      "year",
      "goal",
      "help",
      "time"
    ]) {
      profile[key] =
        $("edit-" + key).value.trim();
    }

    profile.subjects =
      selected("edit-subjects");

    profile.desiredSkills =
      uniqueSkills(
        $("edit-skills")?.value || ""
      );

    profile.github =
      fieldURL(
        "edit-github",
        "github.com"
      );

    profile.linkedin =
      fieldURL(
        "edit-linkedin",
        "linkedin.com"
      );

    profile.portfolio =
      fieldURL("edit-portfolio");

    profile.resumeName =
      resume("edit-resume") ||
      profile.resumeName;

    if (
      !profile.name ||
      !profile.major ||
      !profile.goal ||
      !profile.subjects.length
    ) {
      throw Error(
        "Fill out required fields and subjects."
      );
    }

    state.profile = profile;

    save();

    agentScores.clear();

    journey();
    rankBackend();

    notice(
      "Preferences saved."
    );

  } catch (error) {
    text(
      "edit-error",
      error.message
    );

    visible(
      "edit-error",
      true
    );

    notice(error.message);
  }
});

/* ======================================
   LONGER-TERM APPLICATIONS
   ====================================== */

function apply(id) {
  if (!state.liked.includes(id)) {
    return notice(
      "Connect with this mentor first."
    );
  }

  applicationId = id;

  $("application-form").reset();

  text(
    "application-mentor-note",

    `Applying to ${mentor(id).name}. ` +
    `Demo only, not a real vacancy.`
  );

  $("application-dialog").showModal();
}

on("apply-from-chat", "click", () => {
  if (chatId) {
    page("journey");
    apply(chatId);
  }
});

on("cancel-application", "click", () => {
  $("application-dialog").close();
});

on("close-application", "click", () => {
  $("application-dialog").close();
});

on("application-form", "submit", event => {
  event.preventDefault();

  if (
    !applicationId ||
    !$("application-consent").checked
  ) {
    return;
  }

  const message =
    $("application-message").value.trim();

  if (!message) return;

  state.applications.push({
    id:
      `app-${Date.now()}-${state.applications.length}`,

    mentorId: applicationId,

    type:
      $("application-type").value,

    message,

    availability:
      $("application-availability").value,

    status: "Submitted · demo",

    consent: true
  });

  save();

  $("application-dialog").close();

  journey();

  notice(
    "Demo application saved."
  );
});

/* ======================================
   MENTOR PREVIEW
   ====================================== */

function mentorPreview() {
  const root = $("review-content");

  root.replaceChildren();

  const applications =
    state.applications.filter(
      application => application.consent
    );

  if (!applications.length) {
    root.append(
      evidence(
        "No applications yet",

        "Connect with a mentor and apply through My Journey."
      )
    );

    return;
  }

  applications.forEach(application => {
    const profile = state.profile;

    const m =
      mentor(application.mentorId);

    const card = node(
      "article",
      "",
      "panel review-card"
    );

    card.append(
      node(
        "h2",

        `${profile.name} → ${m?.name || "Mentor"}`
      ),

      node(
        "p",
        `${profile.major} · ${profile.year}`
      ),

      node(
        "p",
        `Interest: ${application.type}`
      ),

      node(
        "p",
        `Goal: ${profile.goal}`
      ),

      node(
        "p",
        `Application: ${application.message}`
      ),

      node(
        "p",
        `Status: ${application.status}`
      ),

      node(
        "h3",
        "Student portfolio"
      )
    );

    const links = node(
      "div",
      "",
      "portfolio-links"
    );

    addLink(
      links,
      "GitHub",
      profile.github
    );

    addLink(
      links,
      "LinkedIn",
      profile.linkedin
    );

    addLink(
      links,
      "Portfolio",
      profile.portfolio
    );

    if (resumeUrl) {
      addLink(
        links,
        "View resume (this session)",
        resumeUrl
      );

    } else if (profile.resumeName) {
      links.append(
        node(
          "p",

          `Resume: ${profile.resumeName} ` +
          `(re-upload to view).`
        )
      );
    }

    card.append(
      links,

      node("h3", "Projects"),

      ...state.projects.map(project =>
        evidence(
          project.title,
          project.description,
          project.url
        )
      ),

      node("h3", "Completed quests"),

      ...mentors
        .filter(m =>
          state.quests[m.id]?.completed
        )
        .map(m =>
          evidence(
            `✓ ${m.quest.title} · ${m.quest.xp} XP`
          )
        )
    );

    const actions = node(
      "div",
      "",
      "dialog-actions"
    );

    for (const [label, status] of [
      ["Mark Reviewed", "Reviewed"],

      [
        "Invite to Discuss (Demo)",
        "Invited to discuss"
      ]
    ]) {
      const button = node(
        "button",
        label,

        status === "Reviewed"
          ? "secondary-button"
          : "primary-button"
      );

      button.addEventListener("click", () => {
        if (
          status === "Invited to discuss" &&
          application.status !== status
        ) {
          ensureChat(
            application.mentorId
          );

          state.messages[application.mentorId].push({
            from: "mentor",

            text:
              "I'd like to discuss next steps. " +
              "(Simulated invitation.)"
          });
        }

        application.status = status;

        save();

        mentorPreview();

        notice(
          `Application: ${status}`
        );
      });

      actions.append(button);
    }

    card.append(actions);
    root.append(card);
  });
}

/* ======================================
   INITIALIZE APP
   ====================================== */

subjectInputs("signup-subjects");

authTab(
  state.profile
    ? "login"
    : "create"
);
