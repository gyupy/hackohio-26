
/* =========================================
   BUCKEYE GUILD
   Mentor Matching + Playable Quests
   ========================================= */

// Fictional mentor data for the demo

const mentors = [
    {
        id: 1,
        name: "Dr. Maya Chen",
        role: "AI & Robotics Research Professor",
        icon: "🤖",
        match: 94,

        skills: ["Python", "AI", "Robotics"],

        description:
            "Studies how intelligent robots recognize objects, navigate environments, and assist people.",

        outcome:
            "Practice machine learning, receive code feedback, and create a research portfolio project.",

        professorProjects: [
            {
                title: "Autonomous Robot Navigation",
                description:
                    "Research on robots mapping unfamiliar spaces.",
                technologies: "Python, ROS"
            },
            {
                title: "AI Object Recognition",
                description:
                    "Models that classify images from cameras.",
                technologies: "Python, PyTorch"
            }
        ],

        studentProjects: [
            {
                title: "Campus Accessibility Assistant",
                description:
                    "A computer vision prototype that detects obstacles.",
                technologies: "Python, OpenCV"
            }
        ],

        quest: {
            title: "Robot Rescue",
            difficulty: "Apprentice",
            xp: 150,

            intro:
                "Help a tiny robot read sensor data and choose its next commands.",

            stages: [
                {
                    question:
                        "Which sensor reading is at index 1?",

                    code:
                        "int[] sensors = {2, 4, 6};\n" +
                        "System.out.println(sensors[1]);",

                    choices: ["2", "4", "6"],
                    answer: 1,

                    tip:
                        "Java array indexing starts at zero."
                },
                {
                    question:
                        "Which condition checks whether a wall is ahead?",

                    code:
                        "boolean wallAhead = true;",

                    choices: [
                        "if (wallAhead)",
                        "if (!wallAhead)",
                        "if (wallAhead = false)"
                    ],

                    answer: 0,

                    tip:
                        "A boolean can be used directly as a condition."
                },
                {
                    question:
                        "Which loop runs exactly three times?",

                    code:
                        "// Choose the correct Java loop",

                    choices: [
                        "for (int i = 0; i < 3; i++)",
                        "for (int i = 0; i <= 3; i++)",
                        "for (int i = 1; i < 3; i++)"
                    ],

                    answer: 0,

                    tip:
                        "The loop runs for i = 0, 1 and 2."
                }
            ]
        }
    },

    {
        id: 2,
        name: "Prof. Jordan Lee",
        role: "Game Development & Graphics Professor",
        icon: "🎮",
        match: 89,

        skills: ["C++", "Unity", "Unreal Engine"],

        description:
            "Develops games and researches procedural worlds, gameplay systems, and real-time graphics.",

        outcome:
            "Learn game engine workflows, fix gameplay code, and build a playable portfolio project.",

        professorProjects: [
            {
                title: "Procedural World Generator",
                description:
                    "Algorithms that generate unique game environments.",
                technologies: "C++, Unreal Engine"
            }
        ],

        studentProjects: [
            {
                title: "AI Enemy Combat System",
                description:
                    "Enemies that adapt to player actions.",
                technologies: "Unity, C#"
            },
            {
                title: "Multiplayer Arena Prototype",
                description:
                    "A small competitive multiplayer game.",
                technologies: "Unreal Engine, C++"
            }
        ],

        quest: {
            title: "The Bug Hunter",
            difficulty: "Apprentice",
            xp: 150,

            intro:
                "Repair three programming mistakes before your game can launch.",

            stages: [
                {
                    question:
                        "Which operator compares a player's health to zero in C#?",

                    code:
                        "if (health __ 0) { GameOver(); }",

                    choices: ["=", "==", "+="],
                    answer: 1,

                    tip:
                        "One equals sign assigns a value. Two compare."
                },
                {
                    question:
                        "What is the new value of speed?",

                    code:
                        "int speed = 5;\n" +
                        "speed += 3;",

                    choices: ["3", "5", "8"],
                    answer: 2,

                    tip:
                        "The += operator adds to the existing value."
                },
                {
                    question:
                        "Which Unity input check triggers once when Space is pressed?",

                    code:
                        "// Choose a Unity input check",

                    choices: [
                        "Input.GetKeyDown(KeyCode.Space)",
                        "Input.GetKey(KeyCode.Space)",
                        "Input.anyKey"
                    ],

                    answer: 0,

                    tip:
                        "GetKeyDown detects the frame a key is first pressed."
                }
            ]
        }
    },

    {
        id: 3,
        name: "Dr. Alex Rivera",
        role: "Cybersecurity & Software Engineering Professor",
        icon: "🔐",
        match: 86,

        skills: ["Java", "Cybersecurity", "Testing"],

        description:
            "Researches vulnerabilities and ways to build safer, more reliable applications.",

        outcome:
            "Practice secure coding, write tests, and improve debugging and software design skills.",

        professorProjects: [
            {
                title: "Automated Security Scanner",
                description:
                    "Checks applications for common security issues.",
                technologies: "Java, Python"
            }
        ],

        studentProjects: [
            {
                title: "Password Security Analyzer",
                description:
                    "Examines password strength and common weaknesses.",
                technologies: "Java"
            }
        ],

        quest: {
            title: "Shield Keeper",
            difficulty: "Apprentice",
            xp: 150,

            intro:
                "Protect a small Java application by choosing safer code.",

            stages: [
                {
                    question:
                        "Which check identifies passwords shorter than eight characters?",

                    code:
                        'String password = "abc123";',

                    choices: [
                        "password.length() < 8",
                        "password.length() > 8",
                        "password.length() == 8"
                    ],

                    answer: 0,

                    tip:
                        "Shorter than eight means the length is less than eight."
                },
                {
                    question:
                        "Which Java comparison checks String contents?",

                    code:
                        'String input = "admin";',

                    choices: [
                        'input == "admin"',
                        'input.equals("admin")',
                        'input = "admin"'
                    ],

                    answer: 1,

                    tip:
                        "Use .equals() for String content comparisons."
                },
                {
                    question:
                        "Which database query approach is safer?",

                    code:
                        "// A user enters a search value",

                    choices: [
                        "Concatenate user input into SQL",
                        "Use a prepared statement with parameters",
                        "Remove spaces from user input"
                    ],

                    answer: 1,

                    tip:
                        "Parameterized queries keep user data separate from SQL instructions."
                }
            ]
        }
    }
];


/* =========================================
   ANIMATION SPEEDS
   ========================================= */

// You can adjust these numbers later.

const SWIPE_DURATION = 700;
const UNFURL_DURATION = 1600;
const SNAP_BACK_DURATION = 400;


/* =========================================
   VARIABLES
   ========================================= */

const $ = id => document.getElementById(id);

const card = $("card");
const swipeArea = $("swipe-area");
const questBoard = $("quest-board");

const projectsBtn = $("projects-btn");
const projectsPanel = $("projects-panel");

const likedSection = $("liked-section");
const likedList = $("liked-list");

const chatPanel = $("chat-panel");
const chatMessages = $("chat-messages");
const chatInput = $("chat-input");

const toast = $("swipe-toast");

let currentIndex = 0;
let likedMentors = [];
let activeMentor = null;
let activeQuest = null;

let dragging = false;
let pointerId = null;
let startX = 0;
let moveX = 0;
let animating = false;

let nextEntranceSide = "left";

let entranceTimer;
let swipeTimer;
let toastTimer;

const conversations = new Map();
const questProgress = new Map();

let totalXp = 0;


/* =========================================
   HELPER FUNCTIONS
   ========================================= */

function make(tag, className = "", value) {

    const element = document.createElement(tag);

    element.className = className;

    if (value !== undefined) {
        element.textContent = value;
    }

    return element;
}


// Show a notification

function showToast(message) {

    clearTimeout(toastTimer);

    toast.textContent = message;
    toast.hidden = false;

    toastTimer = setTimeout(() => {
        toast.hidden = true;
    }, 2400);
}


/* =========================================
   DISPLAY MENTOR
   ========================================= */

function showMentor() {

    const finished =
        currentIndex >= mentors.length;

    card.hidden = finished;
    $("card-behind").hidden = finished;
    $("actions").hidden = finished;
    $("swipe-hint").hidden = finished;

    projectsBtn.hidden = finished;
    projectsPanel.hidden = true;

    $("empty-state").hidden = !finished;

    swipeArea.classList.toggle(
        "finished",
        finished
    );

    questBoard.classList.toggle(
        "complete",
        finished
    );

    // All mentors have been viewed
    if (finished) {

        animating = false;

        if (likedMentors.length > 0) {

            requestAnimationFrame(() => {

                likedSection.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

            });
        }

        return;
    }

    const mentor = mentors[currentIndex];

    // Update mentor profile
    $("mentor-name").textContent = mentor.name;
    $("mentor-role").textContent = mentor.role;
    $("mentor-icon").textContent = mentor.icon;

    $("match-score").textContent =
        mentor.match + "% Match";

    $("mentor-description").textContent =
        mentor.description;

    $("mentor-outcome").textContent =
        mentor.outcome;

    // Display mentor skills
    const skills = $("mentor-skills");

    skills.replaceChildren();

    mentor.skills.forEach(skill => {

        skills.appendChild(
            make("span", "", skill)
        );
    });

    // Close the project archive
    projectsBtn.textContent =
        "📜 Open Quest Archive ↓";

    projectsBtn.setAttribute(
        "aria-expanded",
        "false"
    );

    // Return parchment content to top
    $("scroll-paper")
        .querySelector(".scroll-content")
        .scrollTop = 0;

    // Reset animations
    clearTimeout(entranceTimer);

    card.style.transition = "none";

    card.style.transform = "translateX(-50%)";

    card.style.opacity = "1";

    $("like-stamp").style.opacity = "0";
    $("pass-stamp").style.opacity = "0";

    card.classList.remove(
        "enter-left",
        "enter-right",
        "unfurl"
    );

    // Restart the scroll-opening animation
    void card.offsetWidth;

    const directionClass =
        nextEntranceSide === "right"
            ? "enter-right"
            : "enter-left";

    // Scroll moves to center and unfolds
    card.classList.add(
        directionClass,
        "unfurl"
    );

    // Prevent swiping while the scroll opens
    animating = true;

    entranceTimer = setTimeout(() => {

        card.classList.remove(
            "enter-left",
            "enter-right",
            "unfurl"
        );

        card.style.transform =
            "translateX(-50%)";

        animating = false;

    }, UNFURL_DURATION + 50);
}


/* =========================================
   PROJECT ARCHIVE
   ========================================= */

function createProjectCard(project) {

    const entry = make(
        "article",
        "project-item"
    );

    entry.append(
        make("h4", "", project.title),

        make("p", "", project.description),

        make(
            "small",
            "",
            "Technologies: " + project.technologies
        )
    );

    if (project.url) {

        const link = make(
            "a",
            "",
            "View Project"
        );

        link.href = project.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";

        entry.appendChild(link);
    }

    return entry;
}


// Open or close project archive

projectsBtn.addEventListener("click", () => {

    const opening = projectsPanel.hidden;

    if (opening) {

        const mentor = mentors[currentIndex];

        $("professor-projects").replaceChildren(
            ...mentor.professorProjects.map(
                createProjectCard
            )
        );

        $("student-projects").replaceChildren(
            ...mentor.studentProjects.map(
                createProjectCard
            )
        );
    }

    projectsPanel.hidden = !opening;

    projectsBtn.textContent = opening
        ? "📜 Close Quest Archive ↑"
        : "📜 Open Quest Archive ↓";

    projectsBtn.setAttribute(
        "aria-expanded",
        String(opening)
    );
});


/* =========================================
   LIKED MENTORS
   ========================================= */

function ensureConversation(mentor) {

    if (!conversations.has(mentor.id)) {

        conversations.set(mentor.id, [
            {
                sender: "mentor",

                text:
                    `Greetings, adventurer! I've sent you ` +
                    `a practice quest called ` +
                    `“${mentor.quest.title}.” ` +
                    `Open the Quests tab to play it! ` +
                    `(Demo message)`
            }
        ]);
    }

    if (!questProgress.has(mentor.id)) {

        questProgress.set(mentor.id, {
            index: 0,
            completed: false
        });
    }
}


// Save a liked mentor

function saveLikedMentor(mentor) {

    const alreadyLiked = likedMentors.some(
        m => m.id === mentor.id
    );

    if (!alreadyLiked) {
        likedMentors.push(mentor);
    }

    $("guild-link").hidden = false;

    $("liked-count").textContent =
        likedMentors.length;

    likedSection.hidden = false;

    ensureConversation(mentor);

    openChat(mentor);

    showToast(
        "♥ " + mentor.name +
        " added to Your Guild! New quest available."
    );
}


// Display liked mentors

function renderLikedMentors() {

    likedList.replaceChildren();

    likedMentors.forEach(mentor => {

        const selected =
            activeMentor?.id === mentor.id;

        const button = make(
            "button",
            "liked-mentor" +
            (selected ? " selected" : "")
        );

        button.type = "button";

        button.append(
            make("strong", "", mentor.name),
            make("small", "", mentor.role)
        );

        button.addEventListener("click", () => {
            openChat(mentor);
        });

        likedList.appendChild(button);
    });
}


/* =========================================
   CHAT SYSTEM
   ========================================= */

function openChat(mentor) {

    activeMentor = mentor;
    activeQuest = null;

    ensureConversation(mentor);

    likedSection.hidden = false;
    chatPanel.hidden = false;

    $("chat-placeholder").hidden = true;

    $("chat-mentor-name").textContent =
        mentor.name;

    $("quest-count").textContent = "1";

    renderLikedMentors();
    renderMessages();

    showTab("messages");
}


// Display messages

function renderMessages() {

    chatMessages.replaceChildren();

    if (!activeMentor) {
        return;
    }

    const messages =
        conversations.get(activeMentor.id);

    messages.forEach(item => {

        const className =
            "chat-message" +
            (item.sender === "mentor"
                ? " mentor-message"
                : "");

        const bubble = make(
            "div",
            className,
            item.text
        );

        chatMessages.appendChild(bubble);
    });

    chatMessages.scrollTop =
        chatMessages.scrollHeight;
}


// Send a message

$("chat-form").addEventListener(
    "submit",
    event => {

        event.preventDefault();

        const message = chatInput.value.trim();

        if (!activeMentor || !message) {
            return;
        }

        conversations
            .get(activeMentor.id)
            .push({
                sender: "student",
                text: message
            });

        chatInput.value = "";

        renderMessages();
    }
);


/* =========================================
   MESSAGES AND QUESTS TABS
   ========================================= */

function showTab(tab) {

    $("messages-view").hidden =
        tab !== "messages";

    $("quests-view").hidden =
        tab !== "quests";

    for (const name of ["messages", "quests"]) {

        const button = $(name + "-tab");

        button.classList.toggle(
            "active",
            tab === name
        );

        button.setAttribute(
            "aria-selected",
            String(tab === name)
        );
    }

    if (tab === "quests") {
        renderQuestList();
    }
}


$("messages-tab").addEventListener(
    "click",
    () => showTab("messages")
);

$("quests-tab").addEventListener(
    "click",
    () => showTab("quests")
);


/* =========================================
   QUEST LIST
   ========================================= */

function renderQuestList() {

    $("quest-game").hidden = true;

    const list = $("quest-list");

    list.hidden = false;
    list.replaceChildren();

    if (!activeMentor) {
        return;
    }

    const quest = activeMentor.quest;

    const progress =
        questProgress.get(activeMentor.id);

    const questCard = make(
        "article",
        "quest-card"
    );

    const status = progress.completed
        ? "✓ COMPLETED"
        : "📜 NEW QUEST · " + quest.difficulty;

    questCard.append(
        make("p", "quest-meta", status),

        make("h3", "", quest.title),

        make("p", "", quest.intro),

        make(
            "p",
            "quest-meta",
            `Reward: ${quest.xp} XP · ` +
            `Total XP: ${totalXp}`
        )
    );

    let buttonText = "Accept Quest";

    if (progress.completed) {
        buttonText = "Replay Quest";

    } else if (progress.index > 0) {
        buttonText = "Continue Quest";
    }

    const playButton = make(
        "button",
        "",
        buttonText
    );

    playButton.type = "button";

    playButton.addEventListener(
        "click",
        openQuest
    );

    questCard.appendChild(playButton);

    list.appendChild(questCard);
}


/* =========================================
   OPEN QUEST
   ========================================= */

function openQuest() {

    if (!activeMentor) {
        return;
    }

    activeQuest = activeMentor.quest;

    const progress =
        questProgress.get(activeMentor.id);

    if (progress.completed) {
        progress.index = 0;
    }

    $("quest-list").hidden = true;
    $("quest-game").hidden = false;

    renderQuestStage();
}


/* =========================================
   QUEST GAME
   ========================================= */

function renderQuestStage() {

    if (!activeMentor || !activeQuest) {
        return;
    }

    const progress =
        questProgress.get(activeMentor.id);

    const stage =
        activeQuest.stages[progress.index];

    const choices = $("quest-choices");

    choices.replaceChildren();

    $("quest-feedback").textContent = "";
    $("next-stage").hidden = true;

    $("quest-title").textContent =
        activeQuest.title;

    $("quest-stage").textContent =
        `STAGE ${progress.index + 1} ` +
        `OF ${activeQuest.stages.length} · ` +
        `${activeQuest.xp} XP`;

    $("quest-question").textContent =
        stage.question;

    $("quest-code").hidden = !stage.code;
    $("quest-code").textContent =
        stage.code || "";

    stage.choices.forEach((choice, index) => {

        const button = make(
            "button",
            "",
            choice
        );

        button.type = "button";

        button.addEventListener("click", () => {

            if (index !== stage.answer) {

                $("quest-feedback").textContent =
                    "Not quite. Try again! Hint: " +
                    stage.tip;

                return;
            }

            [...choices.children].forEach(option => {
                option.disabled = true;
            });

            button.classList.add("correct");

            $("quest-feedback").textContent =
                "✓ Correct! " + stage.tip;

            const next = $("next-stage");

            next.hidden = false;

            next.textContent =
                progress.index ===
                activeQuest.stages.length - 1

                    ? "Complete Quest ✓"
                    : "Next Stage →";
        });

        choices.appendChild(button);
    });
}


/* =========================================
   QUEST PROGRESSION
   ========================================= */

$("next-stage").addEventListener("click", () => {

    if (!activeMentor || !activeQuest) {
        return;
    }

    const progress =
        questProgress.get(activeMentor.id);

    if (
        progress.index <
        activeQuest.stages.length - 1
    ) {

        progress.index++;

        renderQuestStage();

        return;
    }

    if (!progress.completed) {

        progress.completed = true;

        totalXp += activeQuest.xp;

        conversations
            .get(activeMentor.id)
            .push({
                sender: "mentor",

                text:
                    `Well done! You completed ` +
                    `“${activeQuest.title}” and earned ` +
                    `${activeQuest.xp} XP! ` +
                    `(Demo achievement)`
            });

        showToast(
            `⚔ Quest Complete! +${activeQuest.xp} XP`
        );

    } else {

        showToast(
            "Quest replayed! XP can only be earned once."
        );
    }

    renderQuestList();
    renderMessages();
});


$("back-to-quests").addEventListener(
    "click",
    renderQuestList
);


/* =========================================
   SWIPING WITH MOUSE OR TOUCH
   ========================================= */

// Start dragging

card.addEventListener("pointerdown", event => {

    if (animating) {
        return;
    }

    if (
        event.pointerType === "mouse" &&
        event.button !== 0
    ) {
        return;
    }

    dragging = true;

    pointerId = event.pointerId;
    startX = event.clientX;
    moveX = 0;

    card.setPointerCapture(event.pointerId);

    card.style.transition = "none";
});


// Move the scroll with the pointer

card.addEventListener("pointermove", event => {

    if (
        !dragging ||
        event.pointerId !== pointerId
    ) {
        return;
    }

    moveX = event.clientX - startX;

    card.style.transform =
        `translateX(calc(-50% + ${moveX}px)) ` +
        `rotate(${moveX / 22}deg)`;

    $("like-stamp").style.opacity =
        String(
            Math.min(1, Math.max(0, moveX / 100))
        );

    $("pass-stamp").style.opacity =
        String(
            Math.min(1, Math.max(0, -moveX / 100))
        );
});


// Slowly return an incomplete swipe to center

function snapBack() {

    card.style.transition =
        `transform ${SNAP_BACK_DURATION}ms ease`;

    card.style.transform =
        "translateX(-50%) rotate(0deg)";

    $("like-stamp").style.opacity = "0";
    $("pass-stamp").style.opacity = "0";
}


// Release the card

card.addEventListener("pointerup", event => {

    if (
        !dragging ||
        event.pointerId !== pointerId
    ) {
        return;
    }

    dragging = false;
    pointerId = null;

    if (moveX > 100) {

        swipe("like");

    } else if (moveX < -100) {

        swipe("pass");

    } else {

        snapBack();
    }
});


// Handle interrupted gestures

card.addEventListener("pointercancel", () => {

    dragging = false;
    pointerId = null;

    snapBack();
});


/* =========================================
   PROCESS SWIPES
   ========================================= */

function swipe(action) {

    if (
        animating ||
        currentIndex >= mentors.length
    ) {
        return;
    }

    animating = true;

    const direction =
        action === "like" ? 1 : -1;

    if (action === "like") {

        saveLikedMentor(
            mentors[currentIndex]
        );

        nextEntranceSide = "left";

    } else {

        nextEntranceSide = "right";
    }

    // Slower swipe animation
    card.style.transition =
        `transform ${SWIPE_DURATION}ms ease-in-out, ` +
        `opacity ${SWIPE_DURATION}ms ease-in-out`;

    card.style.transform =
        `translateX(calc(-50% + ${direction * 850}px)) ` +
        `rotate(${direction * 24}deg)`;

    card.style.opacity = "0";

    const stamp =
        action === "like"
            ? "like-stamp"
            : "pass-stamp";

    $(stamp).style.opacity = "1";

    // Wait until the swipe animation is complete
    clearTimeout(swipeTimer);

    swipeTimer = setTimeout(() => {

        currentIndex++;

        showMentor();

    }, SWIPE_DURATION);
}


// Pass button

$("pass-btn").addEventListener(
    "click",
    () => swipe("pass")
);


// Like button

$("like-btn").addEventListener(
    "click",
    () => swipe("like")
);


/* =========================================
   RESTART
   ========================================= */

$("restart-btn").addEventListener("click", () => {

    clearTimeout(swipeTimer);
    clearTimeout(entranceTimer);

    currentIndex = 0;

    likedMentors = [];
    activeMentor = null;
    activeQuest = null;

    nextEntranceSide = "left";

    conversations.clear();
    questProgress.clear();

    totalXp = 0;

    $("guild-link").hidden = true;
    $("liked-count").textContent = "0";

    likedSection.hidden = true;
    chatPanel.hidden = true;

    $("chat-placeholder").hidden = false;

    likedList.replaceChildren();
    chatMessages.replaceChildren();

    chatInput.value = "";

    clearTimeout(toastTimer);
    toast.hidden = true;

    showMentor();

    requestAnimationFrame(() => {

        questBoard.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    });
});


/* =========================================
   START APPLICATION
   ========================================= */

showMentor();
