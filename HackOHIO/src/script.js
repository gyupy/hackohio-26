
"use strict";

// Buckeye Guild: single-file frontend demo.
// Accounts, messages, office hours, and applications are local-only.
// Only matching preferences are sent to POST /api/rank.

const $ = id => document.getElementById(id) || document.getElementById({
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

const el = (tag, text = "", cls = "") => {
  const node = document.createElement(tag);
  node.textContent = text;
  if (cls) node.className = cls;
  return node;
};

const on = (id, type, fn) => $(id)?.addEventListener(type, fn);
const set = (id, text) => {
  if ($(id)) $(id).textContent = text;
};
const show = (id, visible) => {
  if ($(id)) $(id).hidden = !visible;
};

const subjects = [
  "Computer Science", "Mathematics", "Engineering",
  "Writing", "Business", "Design & Games"
];

const STORE = "buckeye-guild-integrated-v1";
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const SWIPE = reduceMotion ? 0 : 700;
const UNFURL = reduceMotion ? 0 : 1600;

const API = String(window.BUCKEYE_API_BASE || "")
  .replace(/\/$/, "") + "/api/rank";

// QUEST DATA
// Each stage: [question, code, answers, correct index, hint]

const quiz = (title, stages) => ({ title, xp: 150, stages });

const mentors = [
  {
    id: "chen",
    name: "Dr. Maya Chen",
    role: "AI & Robotics Research Mentor",
    icon: "🤖",
    subjects: ["Computer Science", "Engineering"],
    skills: ["Python", "AI", "Robotics"],
    description: "Studies how robots recognize objects, navigate unfamiliar environments, and assist people.",
    outcome: "Practice Python, learn machine learning concepts, and get feedback on an AI project.",
    research: [
      ["Autonomous Navigation", "Robots mapping unfamiliar spaces", "Python, ROS"]
    ],
    projects: [
      ["Campus Accessibility Assistant", "Computer vision obstacle detection", "Python, OpenCV"]
    ],
    slots: [
      "Tuesday · 3:00 PM (demo)",
      "Friday · 10:30 AM (demo)"
    ],
    quest: quiz("Robot Rescue", [
      [
        "What value does the robot read?",
        "int[] sensors = {2, 4, 6};\nSystem.out.println(sensors[1]);",
        ["2", "4", "6"],
        1,
        "Arrays start at index zero."
      ],
      [
        "Which condition detects a wall?",
        "boolean wallAhead = true;",
        ["if (wallAhead)", "if (!wallAhead)", "if (wallAhead = false)"],
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
        "Count 0, 1 and 2."
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
    description: "Develops game systems, procedural worlds, and interactive experiences.",
    outcome: "Debug game logic, improve a mechanic, and create a playable portfolio project.",
    research: [
      ["Procedural World Generator", "Automatically generated environments", "C++, Unreal Engine"]
    ],
    projects: [
      ["AI Enemy Combat System", "Enemies adapting to player actions", "Unity, C#"]
    ],
    slots: [
      "Monday · 2:00 PM (demo)",
      "Thursday · 4:00 PM (demo)"
    ],
    quest: quiz("The Bug Hunter", [
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
        "// Legacy input API",
        [
          "Input.GetKeyDown(KeyCode.Space)",
          "Input.GetKey(KeyCode.Space)",
          "Input.anyKey"
        ],
        0,
        "GetKeyDown detects the initial press."
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
    description: "Researches secure programming, software vulnerabilities, and reliable applications.",
    outcome: "Practice testing, debugging, and secure coding techniques.",
    research: [
      ["Automated Code Review", "Finding common software vulnerabilities", "Java, Python"]
    ],
    projects: [
      ["Password Safety Checker", "Password policy testing", "Java"]
    ],
    slots: [
      "Wednesday · 1:30 PM (demo)",
      "Friday · 2:00 PM (demo)"
    ],
    quest: quiz("Shield Keeper", [
      [
        "Which condition detects passwords shorter than 8 characters?",
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
        "Which Java comparison checks String contents?",
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
    description: "Helps students understand calculus, statistics, and mathematical models.",
    outcome: "Learn mathematical reasoning and apply it to real problems.",
    research: [
      ["Everyday Data Models", "Mathematical models of real-world patterns", "Python, R"]
    ],
    projects: [
      ["Campus Transit Analysis", "Travel-time patterns", "Statistics, R"]
    ],
    slots: [
      "Tuesday · 11:00 AM (demo)",
      "Thursday · 1:00 PM (demo)"
    ],
    quest: quiz("The Numbers Keep", [
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
        "What is P(heads) on a fair coin toss?",
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
    description: "Helps students communicate complex ideas through writing and presentations.",
    outcome: "Improve project pitches, writing clarity, and public speaking.",
    research: [
      ["Communicating Technical Ideas", "Making research understandable", "Writing, Media"]
    ],
    projects: [
      ["Accessible Science Exhibit", "Explaining research to the public", "Writing, Design"]
    ],
    slots: [
      "Monday · 11:00 AM (demo)",
      "Wednesday · 3:00 PM (demo)"
    ],
    quest: quiz("The Storysmith", [
      [
        "Which opening clearly describes a problem?",
        "// Project introduction",
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
        ["Understand the feedback", "Ignore it", "Add jargon"],
        0,
        "Understanding comes before revising."
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
    description: "Guides students in engineering design, measurement, and physical prototyping.",
    outcome: "Build prototypes, evaluate design tradeoffs, and test ideas.",
    research: [
      ["Rapid Prototyping", "Measurable design experiments", "CAD, Physics"]
    ],
    projects: [
      ["Bridge Structure Tester", "Comparing structural performance", "CAD, Fabrication"]
    ],
    slots: [
      "Tuesday · 4:00 PM (demo)",
      "Friday · 11:00 AM (demo)"
    ],
    quest: quiz("The Inventor's Trial", [
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
        ["Every variable", "One variable at a time", "Nothing"],
        1,
        "Isolate one factor."
      ],
      [
        "What should you do after a prototype fails?",
        "// Iterate",
        ["Hide the failure", "Guess randomly", "Measure the failure and improve"],
        2,
        "Use evidence for the next design."
      ]
    ])
  }
];

/* ======================================
   LOCAL STORAGE AND HELPERS
   ====================================== */

const fresh = () => ({
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
    const data = JSON.parse(localStorage.getItem(STORE));

    if (!data || typeof data !== "object") return fresh();

    const s = { ...fresh(), ...data };

    for (const key of ["liked", "passed", "sessions", "projects", "applications"]) {
      if (!Array.isArray(s[key])) s[key] = [];
    }

    for (const key of ["messages", "quests"]) {
      if (!s[key] || typeof s[key] !== "object") s[key] = {};
    }

    return s;
  } catch {
    return fresh();
  }
}

let state = load();
let signedIn = false;
let current = null;
let chatId = null;
let questId = null;
let applicationId = null;

let dragging = false;
let pointer = null;
let startX = 0;
let dragX = 0;
let animating = false;
let arrival = "left";

let animationTimer, swipeTimer, toastTimer, resumeUrl;
let canAdvance = false;
let rankingLabel = "Local interest matching";
let rankNumber = 0;
let rankController = null;

const agentScores = new Map();
const mentor = id => mentors.find(m => m.id === id);

function save() {
  try {
    localStorage.setItem(STORE, JSON.stringify(state));
  } catch (e) {
    console.warn("Browser storage unavailable", e);
  }
}

function notice(message) {
  clearTimeout(toastTimer);
  set("toast", message);
  show("toast", true);

  toastTimer = setTimeout(() => show("toast", false), 2800);
}

const skillsFrom = value => [...new Set(
  value.split(",").map(s => s.trim()).filter(Boolean)
)].slice(0, 15);

const chosen = id => [...$(id).querySelectorAll("input:checked")]
  .map(n => n.value);

function subjectInputs(id, checked = []) {
  $(id).replaceChildren(...subjects.map(subject => {
    const label = el("label", "", "subject-choice");
    const input = el("input");
    const span = el("span", subject);

    input.type = "checkbox";
    input.value = subject;
    input.checked = checked.includes(subject);

    label.append(input, span);
    return label;
  }));
}

function safeUrl(raw, site = "") {
  if (!raw.trim()) return "";

  const u = new URL(raw.trim());
  const host = u.hostname.toLowerCase().replace(/^www\./, "");

  if (u.protocol !== "https:" || (site && host !== site)) {
    throw Error(`Use a valid https://${site || ""} URL.`);
  }

  return u.href;
}

const url = (id, site = "") => safeUrl($(id).value, site);

function resume(id) {
  const file = $(id).files[0];
  if (!file) return null;

  if (!/\.(pdf|doc|docx)$/i.test(file.name) ||
      file.size > 5 * 1024 * 1024) {
    throw Error("Resume must be PDF/Word and under 5 MB.");
  }

  if (resumeUrl) URL.revokeObjectURL(resumeUrl);

  resumeUrl = URL.createObjectURL(file);
  return file.name;
}

function link(parent, name, href) {
  if (!href) return;

  const a = el("a", name + " ↗");
  a.href = href;
  a.target = "_blank";
  a.rel = "noopener noreferrer";

  parent.append(a);
}

function evidence(title, body = "", href = "") {
  const box = el("div", "", "evidence-card");
  box.append(el("strong", title));

  if (body) box.append(el("p", body));

  link(box, "View project", href);
  return box;
}

function stats() {
  set("stat-xp", state.xp);
  set("stat-mentors", state.liked.length);
  set("nav-liked-count", state.liked.length);
  set(
    "stat-quests",
    Object.values(state.quests).filter(q => q?.completed).length
  );
  set("guild-count", state.liked.length);
}

/* ======================================
   ACCOUNT CREATION / LOGIN
   ====================================== */

function authTab(which) {
  const create = which === "create";

  show("signup-form", create);
  show("login-form", !create);

  $("create-tab").classList.toggle("active", create);
  $("login-tab").classList.toggle("active", !create);

  set(
    "saved-account-note",
    state.profile
      ? `Saved demo: ${state.profile.name} (${state.profile.email})`
      : "No saved demo account."
  );

  if (state.profile) {
    $("login-email").value = state.profile.email;
  }
}

on("create-tab", "click", () => authTab("create"));
on("login-tab", "click", () => authTab("login"));

function createAccount(profile) {
  state = { ...fresh(), profile };
  agentScores.clear();
  save();
  startApp();
}

on("signup-form", "submit", e => {
  e.preventDefault();
  show("signup-error", false);

  try {
    const profile = {
      name: $("signup-name").value.trim(),
      email: $("signup-email").value.trim().toLowerCase(),
      major: $("signup-major").value.trim(),
      year: $("signup-year").value,
      subjects: chosen("signup-subjects"),
      goal: $("signup-goal").value.trim(),
      desiredSkills: skillsFrom($("signup-skills")?.value || ""),
      help: $("signup-help").value,
      time: $("signup-time").value,
      github: url("signup-github", "github.com"),
      linkedin: url("signup-linkedin", "linkedin.com"),
      portfolio: url("signup-portfolio"),
      resumeName: resume("signup-resume") || ""
    };

    if (
      ![profile.name, profile.email, profile.major,
        profile.year, profile.goal].every(Boolean) ||
      !profile.subjects.length
    ) {
      throw Error("Complete the required fields and choose a subject.");
    }

    createAccount(profile);
  } catch (error) {
    set("signup-error", error.message);
    show("signup-error", true);
  }
});

on("sample-btn", "click", () => createAccount({
  name: "Taylor Morgan",
  email: "taylor.demo@buckeyemail.osu.edu",
  major: "Computer Science",
  year: "Second year",
  subjects: ["Computer Science", "Design & Games"],
  goal: "Improve my C# skills and build a game.",
  desiredSkills: ["C#", "Unity"],
  help: "Office hours",
  time: "2–3 hours / week",
  github: "",
  linkedin: "",
  portfolio: "",
  resumeName: ""
}));

function login(e) {
  e?.preventDefault();

  if (
    state.profile?.email ===
    $("login-email").value.trim().toLowerCase()
  ) {
    startApp();
  } else {
    set("login-error", "No matching local demo account exists.");
    show("login-error", true);
  }
}

on("login-form", "submit", login);
on("login-btn", "click", login);

on("signout-btn", "click", () => {
  signedIn = false;
  rankNumber++;
  rankController?.abort();

  show("app-screen", false);
  show("top-nav", false);
  show("auth-screen", true);

  authTab("login");
});

function startApp() {
  signedIn = true;

  show("auth-screen", false);
  show("app-screen", true);
  show("top-nav", true);

  page("discover");
  rankBackend();

  notice("Welcome to Buckeye Guild!");
}

function page(name) {
  if (!signedIn) return;

  for (const view of ["discover", "guild", "journey", "mentor"]) {
    show("view-" + view, view === name);
  }

  document.querySelectorAll("[data-page]").forEach(b => {
    b.classList.toggle("active", b.dataset.page === name);
  });

  stats();

  ({
    discover,
    guild,
    journey,
    mentor: mentorPreview
  })[name]();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

document.querySelectorAll("[data-page]").forEach(b => {
  b.addEventListener("click", () => page(b.dataset.page));
});

on("brand-link", "click", e => {
  e.preventDefault();
  if (signedIn) page("discover");
});

/* ======================================
   JAVA BACKEND MATCHING
   ====================================== */

// Send only learning goals, subjects and skills.
// The Java backend is expected at POST /api/rank.

const studentDTO = p => ({
  id: "demo-student",
  interests: p.subjects,
  desiredSkills: p.desiredSkills?.length
    ? p.desiredSkills : p.subjects,
  careerGoal: p.goal
});

const mentorDTO = m => ({
  id: m.id,
  displayName: m.name,
  expertiseTags: [...new Set([...m.subjects, ...m.skills])],
  teachableSkills: m.skills,
  professionalBackground: `${m.role}. ${m.description} ${m.outcome}`
});

function match(m) {
  if (agentScores.has(m.id)) return agentScores.get(m.id);

  const overlap = m.subjects.filter(s =>
    state.profile.subjects.includes(s)
  ).length;

  const skillHits = m.skills.filter(s =>
    (state.profile.desiredSkills || []).some(w =>
      w.toLowerCase() === s.toLowerCase()
    )
  ).length;

  return Math.min(97, 65 + overlap * 10 + skillHits * 6);
}

function ranking(text, connected = false) {
  rankingLabel = text;
  set("ranking-status", text);
  $("ranking-status")?.classList.toggle("online", connected);
}

async function rankBackend() {
  if (!signedIn) return;

  rankController?.abort();

  const request = ++rankNumber;
  const controller = new AbortController();
  const profile = JSON.stringify(studentDTO(state.profile));

  rankController = controller;
  ranking("Checking Java Matching Agent...");

  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student: JSON.parse(profile),
        mentors: mentors.map(mentorDTO)
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      throw Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data.matches)) {
      throw Error("Missing matches array");
    }

    const rows = data.matches
      .map(r => [
        String(r.id ?? r.mentorId ?? r.mentor?.id ?? ""),
        Number(r.score ?? r.matchScore ?? r.compatibilityScore)
      ])
      .filter(([id, score]) =>
        mentor(id) && Number.isFinite(score) && score >= 0
      );

    if (!rows.length) throw Error("No valid mentor scores");

    const normalized = rows.every(([, score]) => score <= 1);
    const next = new Map();

    rows.forEach(([id, score]) => {
      const value = normalized ? score * 100 : score;

      if (value <= 100) {
        next.set(id, Math.round(value));
      }
    });

    if (!next.size) throw Error("Scores out of range");

    if (
      !signedIn ||
      request !== rankNumber ||
      profile !== JSON.stringify(studentDTO(state.profile))
    ) {
      return;
    }

    agentScores.clear();
    next.forEach((value, id) => agentScores.set(id, value));

    ranking(`Java Matching Agent connected · ${next.size} ranked`, true);

    if (current) {
      set("match-score", match(current) + "% Interest Fit");
    }

  } catch (error) {
    if (!signedIn || request !== rankNumber) return;

    agentScores.clear();
    ranking("Local matching · Java backend unavailable");

    if (current) {
      set("match-score", match(current) + "% Interest Fit");
    }

    console.warn("Matching Agent fallback:", error.message);

  } finally {
    clearTimeout(timeout);

    if (rankController === controller) {
      rankController = null;
    }
  }
}

/* ======================================
   MENTOR DISCOVERY AND SWIPING
   ====================================== */

const remaining = () => mentors
  .filter(m =>
    !state.liked.includes(m.id) &&
    !state.passed.includes(m.id)
  )
  .sort((a, b) => match(b) - match(a));

function discover() {
  set(
    "welcome-copy",
    `Welcome, ${state.profile.name}! Interests: ` +
    state.profile.subjects.join(", ") + "."
  );

  ranking(rankingLabel, agentScores.size > 0);
  renderCard();
}

function renderCard() {
  clearTimeout(animationTimer);

  current = remaining()[0] || null;
  const finished = !current;

  for (const id of [
    "card", "card-behind", "actions",
    "swipe-hint", "projects-btn"
  ]) {
    show(id, !finished);
  }

  show("empty-state", finished);
  show("projects-panel", false);

  $("swipe-area").classList.toggle("finished", finished);

  if (finished) {
    animating = false;
    return;
  }

  set("mentor-name", current.name);
  set("mentor-role", current.role);
  set("mentor-icon", current.icon);
  set("mentor-subjects", current.subjects.join(" · "));
  set("match-score", match(current) + "% Interest Fit");
  set("mentor-description", current.description);
  set("mentor-outcome", current.outcome);
  set("mentor-office", "◷ Typical visit: 15–30 minutes (demo)");

  $("mentor-skills").replaceChildren(
    ...current.skills.map(s => el("span", s))
  );

  $("scroll-paper")
    .querySelector(".scroll-content").scrollTop = 0;

  set("projects-btn", "📜 Open Quest Archive ↓");

  const card = $("card");

  card.classList.remove("enter-left", "enter-right", "unfurl");

  Object.assign(card.style, {
    transition: "none",
    transform: "translateX(-50%)",
    opacity: "1"
  });

  $("like-stamp").style.opacity =
    $("pass-stamp").style.opacity = "0";

  void card.offsetWidth;

  card.classList.add(
    arrival === "left" ? "enter-left" : "enter-right",
    "unfurl"
  );

  animating = UNFURL > 0;

  animationTimer = setTimeout(() => {
    card.classList.remove("enter-left", "enter-right", "unfurl");
    card.style.transform = "translateX(-50%)";
    animating = false;
  }, UNFURL + 40);
}

on("projects-btn", "click", () => {
  if (!current) return;

  const opening = $("projects-panel").hidden;

  show("projects-panel", opening);

  set(
    "projects-btn",
    opening ? "📜 Close Quest Archive ↑" : "📜 Open Quest Archive ↓"
  );

  $("projects-btn").setAttribute("aria-expanded", String(opening));

  if (opening) {
    for (const [id, items] of [
      ["professor-projects", current.research],
      ["student-projects", current.projects]
    ]) {
      $(id).replaceChildren(...items.map(([title, body, tech]) => {
        const box = el("div", "", "project-item");

        box.append(
          el("strong", title),
          el("p", body),
          el("small", tech)
        );

        return box;
      }));
    }
  }
});

function ensureChat(id) {
  if (!state.messages[id]) {
    state.messages[id] = [{
      from: "mentor",
      text:
        `Greetings! I've assigned you “${mentor(id).quest.title}.” ` +
        "Open Quests to begin. (Demo)"
    }];
  }

  if (!state.quests[id]) {
    state.quests[id] = { index: 0, completed: false };
  }
}

function swipe(kind) {
  if (animating || !current) return;

  animating = true;

  const id = current.id;
  const like = kind === "like";
  const direction = like ? 1 : -1;
  const list = like ? state.liked : state.passed;

  if (!list.includes(id)) list.push(id);

  if (like) {
    ensureChat(id);
    chatId = id;
    notice(`♥ ${current.name} added to Your Guild!`);
  }

  save();
  stats();

  arrival = like ? "left" : "right";

  const card = $("card");

  card.style.transition =
    `transform ${SWIPE}ms ease-in-out, opacity ${SWIPE}ms ease-in-out`;

  card.style.transform =
    `translateX(calc(-50% + ${direction * 850}px)) ` +
    `rotate(${direction * 24}deg)`;

  card.style.opacity = "0";

  $(like ? "like-stamp" : "pass-stamp").style.opacity = "1";

  clearTimeout(swipeTimer);
  swipeTimer = setTimeout(renderCard, SWIPE);
}

on("like-btn", "click", () => swipe("like"));
on("pass-btn", "click", () => swipe("pass"));

on("restart-btn", "click", () => {
  state.passed = [];
  save();
  arrival = "left";
  renderCard();
});

function snap() {
  $("card").style.transition =
    `transform ${reduceMotion ? 0 : 400}ms ease`;

  $("card").style.transform = "translateX(-50%) rotate(0deg)";

  $("like-stamp").style.opacity =
    $("pass-stamp").style.opacity = "0";
}

on("card", "pointerdown", e => {
  if (
    animating ||
    (e.pointerType === "mouse" && e.button !== 0)
  ) {
    return;
  }

  dragging = true;
  pointer = e.pointerId;
  startX = e.clientX;
  dragX = 0;

  e.currentTarget.setPointerCapture(pointer);
  e.currentTarget.style.transition = "none";
});

on("card", "pointermove", e => {
  if (!dragging || e.pointerId !== pointer) return;

  dragX = e.clientX - startX;

  $("card").style.transform =
    `translateX(calc(-50% + ${dragX}px)) rotate(${dragX / 22}deg)`;

  $("like-stamp").style.opacity =
    Math.min(1, Math.max(0, dragX / 100));

  $("pass-stamp").style.opacity =
    Math.min(1, Math.max(0, -dragX / 100));
});

on("card", "pointerup", e => {
  if (!dragging || e.pointerId !== pointer) return;

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
   GUILD, MESSAGES AND OFFICE HOURS
   ====================================== */

function guild() {
  const list = $("liked-list");
  list.replaceChildren();

  if (!state.liked.length) {
    list.append(el("p", "No connections yet. Swipe right on a mentor."));
    show("chat-panel", false);
    show("chat-placeholder", true);
    return;
  }

  list.replaceChildren(...state.liked.filter(mentor).map(id => {
    const m = mentor(id);
    const button = el("button", "", "liked-mentor");

    button.type = "button";

    button.append(
      el("strong", m.name),
      el("small", m.role)
    );

    button.addEventListener("click", () => openChat(id));

    return button;
  }));

  openChat(
    state.liked.includes(chatId) ? chatId : state.liked[0]
  );
}

function openChat(id) {
  chatId = id;
  questId = null;

  ensureChat(id);

  show("chat-panel", true);
  show("chat-placeholder", false);

  set("chat-mentor-name", mentor(id).name);
  set("chat-mentor-role", mentor(id).role);

  [...$("liked-list").children].forEach((b, i) => {
    b.classList.toggle("selected", state.liked[i] === id);
  });

  messages();
  tab("messages");
}

function messages() {
  const box = $("chat-messages");

  box.replaceChildren(...(state.messages[chatId] || []).map(msg =>
    el(
      "div",
      msg.text,
      "chat-message" +
      (msg.from === "mentor" ? " mentor-message" : "")
    )
  ));

  box.scrollTop = box.scrollHeight;
}

on("chat-form", "submit", e => {
  e.preventDefault();

  const text = $("chat-input").value.trim();

  if (!text || !chatId) return;

  state.messages[chatId].push({ from: "student", text });
  $("chat-input").value = "";

  save();
  messages();
});

function tab(name) {
  for (const t of ["messages", "quests", "hours"]) {
    show(t + "-view", t === name);

    $(t + "-tab").classList.toggle("active", t === name);
    $(t + "-tab").setAttribute(
      "aria-selected", String(t === name)
    );
  }

  if (name === "quests") questList();
  if (name === "hours") hours();
}

for (const name of ["messages", "quests", "hours"]) {
  on(name + "-tab", "click", () => tab(name));
}

/* ======================================
   PLAYABLE QUESTS
   ====================================== */

function questList() {
  show("quest-list", true);
  show("quest-game", false);

  const m = mentor(chatId);
  const progress = state.quests[chatId];

  const card = el("div", "", "quest-card");

  card.append(
    el(
      "p",
      progress.completed ? "✓ Quest completed" : "⚔ New practice quest"
    ),
    el("h3", m.quest.title),
    el("p", `3 stages · ${m.quest.xp} XP once`)
  );

  const btn = el(
    "button",
    progress.completed ? "Replay quest" :
      progress.index ? "Continue quest" : "Accept quest",
    "primary-button"
  );

  btn.addEventListener("click", () => {
    questId = chatId;

    if (progress.completed) progress.index = 0;

    show("quest-list", false);
    show("quest-game", true);

    stage();
  });

  card.append(btn);
  $("quest-list").replaceChildren(card);
}

function stage() {
  const m = mentor(questId);
  const progress = state.quests[questId];

  const [question, code, answers, right, hint] =
    m.quest.stages[progress.index];

  canAdvance = false;

  set(
    "quest-stage",
    `Stage ${progress.index + 1} of ${m.quest.stages.length}`
  );

  set("quest-title", m.quest.title);
  set("quest-question", question);
  set("quest-code", code);

  show("quest-code", !!code);
  show("next-stage", false);
  set("quest-feedback", "");

  $("quest-choices").replaceChildren(...answers.map((answer, i) => {
    const btn = el("button", answer);
    btn.type = "button";

    btn.addEventListener("click", () => {
      if (canAdvance) return;

      if (i !== right) {
        btn.classList.add("wrong");
        set("quest-feedback", "Not quite. Hint: " + hint);
        return;
      }

      canAdvance = true;

      [...$("quest-choices").children].forEach(b => {
        b.disabled = true;
        b.classList.remove("wrong");
      });

      btn.classList.add("correct");
      set("quest-feedback", "✓ Correct! " + hint);

      set(
        "next-stage",
        progress.index === m.quest.stages.length - 1
          ? "Complete quest ✓"
          : "Next stage →"
      );

      show("next-stage", true);
    });

    return btn;
  }));
}

on("next-stage", "click", () => {
  if (!canAdvance || !questId) return;

  const progress = state.quests[questId];
  const m = mentor(questId);

  if (progress.index < m.quest.stages.length - 1) {
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
        `Quest complete! You earned ${m.quest.xp} XP. (Demo message)`
    });

    notice(`Quest complete! +${m.quest.xp} XP`);
  } else {
    notice("Quest replayed. XP is awarded once.");
  }

  save();
  stats();
  questList();
  messages();
});

on("back-to-quests", "click", questList);

function hours() {
  if (!chatId) return;

  $("hours-slot").replaceChildren(
    ...mentor(chatId).slots.map(s => {
      const o = el("option", s);
      o.value = s;
      return o;
    })
  );

  $("hours-history").replaceChildren(
    ...state.sessions
      .filter(s => s.mentorId === chatId)
      .map(s =>
        el("div", `${s.slot} · ${s.question}`, "session-entry")
      )
  );
}

on("hours-form", "submit", e => {
  e.preventDefault();
  if (!chatId) return;

  const question = $("hours-question").value.trim();
  const slot = $("hours-slot").value;

  if (!question) return;

  state.sessions.push({ mentorId: chatId, question, slot });

  state.messages[chatId].push({
    from: "student",
    text: `Office hours (${slot}): ${question}`
  });

  $("hours-question").value = "";

  save();
  hours();

  notice("Demo request saved (not a real booking).");
});

/* ======================================
   STUDENT PROFILE AND PROJECTS
   ====================================== */

function journey() {
  const p = state.profile;

  set("profile-name", p.name);
  set("profile-xp", `${state.xp} XP`);

  set(
    "profile-summary",
    `${p.year} · ${p.major} · ${p.time}. Goal: ${p.goal}`
  );

  $("profile-subjects").replaceChildren(
    ...p.subjects.map(s => el("span", s))
  );

  const links = $("profile-links");
  links.replaceChildren();

  link(links, "GitHub", p.github);
  link(links, "LinkedIn", p.linkedin);
  link(links, "Portfolio", p.portfolio);

  set(
    "resume-note",
    p.resumeName
      ? `Resume: ${p.resumeName}. ` +
        (resumeUrl
          ? "Available this session."
          : "Re-upload to preview.")
      : "No resume selected."
  );

  $("quest-evidence").replaceChildren(
    ...mentors
      .filter(m => state.quests[m.id]?.completed)
      .map(m => evidence(`✓ ${m.quest.title} · ${m.quest.xp} XP`))
  );

  $("project-evidence").replaceChildren(
    ...state.projects.map(p =>
      evidence(p.title, p.description, p.url)
    )
  );

  const list = $("path-mentor-list");
  list.replaceChildren();

  if (!state.liked.length) {
    list.append(el("p", "Connect with a mentor first."));
  }

  for (const id of state.liked) {
    const m = mentor(id);
    if (!m) continue;

    const card = el("div", "", "path-mentor");
    const btn = el("button", "Express Interest →", "secondary-button");

    btn.addEventListener("click", () => apply(id));

    card.append(
      el("strong", m.name),
      el("small", m.role),
      btn
    );

    list.append(card);
  }

  const apps = $("application-list");
  apps.replaceChildren();

  if (!state.applications.length) {
    apps.append(el("p", "No applications yet."));
  }

  for (const a of state.applications) {
    apps.append(
      evidence(
        `${mentor(a.mentorId)?.name || "Mentor"} · ${a.type}`,
        `${a.message} · Status: ${a.status}`
      )
    );
  }

  show("edit-profile-panel", false);
}

on("project-form", "submit", e => {
  e.preventDefault();

  try {
    const title = $("project-title").value.trim();
    const description = $("project-description").value.trim();
    const href = url("project-url");

    if (!title || !description) return;

    state.projects.push({
      title,
      description,
      url: href
    });

    save();
    $("project-form").reset();
    journey();

    notice("Project added.");
  } catch (e) {
    notice(e.message);
  }
});

/* ======================================
   EDIT PROFILE
   ====================================== */

on("edit-profile-btn", "click", () => {
  const p = state.profile;

  for (const key of [
    "name", "major", "year", "goal", "help",
    "time", "github", "linkedin", "portfolio"
  ]) {
    $("edit-" + key).value = p[key] || "";
  }

  if ($("edit-skills")) {
    $("edit-skills").value = (p.desiredSkills || []).join(", ");
  }

  subjectInputs("edit-subjects", p.subjects);
  show("edit-profile-panel", true);

  $("edit-profile-panel").scrollIntoView({
    behavior: "smooth"
  });
});

on("cancel-edit", "click", () => {
  show("edit-profile-panel", false);
});

on("edit-profile-form", "submit", e => {
  e.preventDefault();

  try {
    const p = { ...state.profile };

    for (const key of [
      "name", "major", "year", "goal", "help", "time"
    ]) {
      p[key] = $("edit-" + key).value.trim();
    }

    p.subjects = chosen("edit-subjects");
    p.desiredSkills = skillsFrom($("edit-skills")?.value || "");

    p.github = url("edit-github", "github.com");
    p.linkedin = url("edit-linkedin", "linkedin.com");
    p.portfolio = url("edit-portfolio");

    p.resumeName = resume("edit-resume") || p.resumeName;

    if (!p.name || !p.major || !p.goal || !p.subjects.length) {
      throw Error("Fill in required fields and subjects.");
    }

    state.profile = p;
    save();

    agentScores.clear();
    journey();
    rankBackend();

    notice("Preferences saved.");

  } catch (error) {
    set("edit-error", error.message);
    show("edit-error", true);
    notice(error.message);
  }
});

/* ======================================
   LONGER-TERM APPLICATIONS
   ====================================== */

function apply(id) {
  if (!state.liked.includes(id)) {
    return notice("Connect with the mentor first.");
  }

  applicationId = id;
  $("application-form").reset();

  set(
    "application-mentor-note",
    `Applying to ${mentor(id).name}. ` +
    "This is an expression of interest, not a real vacancy."
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

on("application-form", "submit", e => {
  e.preventDefault();

  if (!applicationId || !$("application-consent").checked) {
    return;
  }

  const message = $("application-message").value.trim();
  if (!message) return;

  state.applications.push({
    id: `app-${Date.now()}-${state.applications.length}`,
    mentorId: applicationId,
    type: $("application-type").value,
    message,
    availability: $("application-availability").value,
    status: "Submitted · demo",
    consent: true
  });

  save();
  $("application-dialog").close();
  journey();

  notice("Demo application saved for review.");
});

/* ======================================
   PROFESSOR / MENTOR PREVIEW
   ====================================== */

function mentorPreview() {
  const root = $("review-content");
  root.replaceChildren();

  const approved = state.applications.filter(a => a.consent);

  if (!approved.length) {
    root.append(
      evidence(
        "No applications yet",
        "Connect with a mentor and apply in My Journey."
      )
    );
    return;
  }

  for (const app of approved) {
    const p = state.profile;
    const m = mentor(app.mentorId);
    const card = el("article", "", "panel review-card");

    card.append(
      el("h2", `${p.name} → ${m?.name || "Mentor"}`),
      el("p", `${p.major} · ${p.year}`),
      el("p", `Interest: ${app.type}`),
      el("p", `Goal: ${p.goal}`),
      el("p", `Application: ${app.message}`),
      el("p", `Status: ${app.status}`),
      el("h3", "Student portfolio")
    );

    const links = el("div", "", "portfolio-links");

    link(links, "GitHub", p.github);
    link(links, "LinkedIn", p.linkedin);
    link(links, "Portfolio", p.portfolio);

    if (resumeUrl) {
      link(links, "View resume (this session)", resumeUrl);
    } else if (p.resumeName) {
      links.append(
        el("p", `Resume: ${p.resumeName} (re-upload to view).`)
      );
    }

    card.append(
      links,
      el("h3", "Previous projects"),
      ...state.projects.map(project =>
        evidence(project.title, project.description, project.url)
      ),
      el("h3", "Completed quests"),
      ...mentors
        .filter(x => state.quests[x.id]?.completed)
        .map(x => evidence(`✓ ${x.quest.title} · ${x.quest.xp} XP`))
    );

    const actions = el("div", "", "dialog-actions");

    for (const [label, status] of [
      ["Mark Reviewed", "Reviewed"],
      ["Invite to Discuss (Demo)", "Invited to discuss"]
    ]) {
      const btn = el(
        "button",
        label,
        status === "Reviewed" ? "secondary-button" : "primary-button"
      );

      btn.addEventListener("click", () => {
        if (
          status === "Invited to discuss" &&
          app.status !== status
        ) {
          ensureChat(app.mentorId);

          state.messages[app.mentorId].push({
            from: "mentor",
            text:
              "I'd like to discuss next steps. " +
              "(Simulated invitation.)"
          });
        }

        app.status = status;
        save();

        mentorPreview();
        notice(`Application: ${status}`);
      });

      actions.append(btn);
    }

    card.append(actions);
    root.append(card);
  }
}

/* ======================================
   INITIALIZE
   ====================================== */

subjectInputs("signup-subjects");

if (state.profile) {
  authTab("login");
} else {
  authTab("create");
}

