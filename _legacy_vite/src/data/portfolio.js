// Single source of truth for portfolio content — shared by Classic (2D) and Game (3D) modes.
export const portfolio = {
  name: "Kundan Srinivas Sakkuru",
  short: "Kundan Srinivas",
  initials: "KS",
  location: "Tampa, FL",
  email: "kundansrinivas377@gmail.com",
  linkedin: "https://www.linkedin.com/in/kundan-srinivas-sakkuru-513532200/",
  github: "https://github.com/kundan198",
  headline: "Full-Stack Software Engineer • Mobile • AI Systems",
  pitch:
    "I build research-grade and product-ready applications using React, Firebase, and Flutter—shipping clean UX, structured data pipelines, and scalable systems.",

  highlights: [
    { k: "Focus", v: "Full-Stack + Mobile" },
    { k: "Stack", v: "React • Firebase • Flutter" },
    { k: "ML", v: "PyTorch • TensorFlow • scikit-learn" },
    { k: "Cloud", v: "GCP • REST • SQL" },
  ],

  skills: {
    Programming: ["Python", "Java", "C", "SQL (Advanced)", "Bash", "Dart"],
    Web: ["React", "TypeScript", "JavaScript", "HTML", "CSS"],
    Mobile: ["Flutter", "Android SDK"],
    "Data / ML": ["NumPy", "Pandas", "PyTorch", "TensorFlow", "Keras", "scikit-learn", "PySpark", "Tableau"],
    "Backend / DB": ["Firebase", "MySQL", "PostgreSQL", "MongoDB", "SQLite", "REST APIs"],
    Tools: ["Git/GitHub", "Postman", "Jupyter/Colab", "Agile/Scrum"],
  },

  experience: [
    {
      title: "Research Assistant — SHIELD Lab, University of South Florida",
      time: "Aug 2025 – May 2026",
      bullets: [
        "Built mobile-based neurocognitive testing modules with reliable data capture and research-ready CSV/PDF outputs for longitudinal analysis.",
        "Collaborated with interdisciplinary teams to align app workflows, study protocols, and analytics pipelines for reproducibility.",
      ],
      tags: ["Flutter", "Data Logging", "Research Pipelines"],
    },
    {
      title: "Artificial Intelligence Intern — YoungMinds",
      time: "Jan 2023 – Jun 2023",
      bullets: [
        "Developed end-to-end ML pipelines in Python for NLP and predictive analytics, from preprocessing and features to evaluation.",
        "Partnered with teammates to refine models, validate results, and deliver requirements using iterative development.",
      ],
      tags: ["Python", "NLP", "Model Evaluation"],
    },
  ],

  projects: [
    {
      name: "CogniX",
      sub: "Neurocognitive Assessment Platform",
      desc: "Flutter platform for reaction/memory/attention tests with structured event logging and automated exports.",
      tags: ["Flutter", "Firebase", "CSV/PDF", "Research Logging"],
      impact: "Research-ready assessment workflows with clean, analyzable outputs.",
    },
    {
      name: "Finderly",
      sub: "Campus Lost & Found Web App",
      desc: "React + Firebase full-stack app with user profiles, secure workflows, and real-time messaging.",
      tags: ["React", "TypeScript", "Firebase", "Real-time"],
      impact: "Scalable campus matching + communication system.",
    },
    {
      name: "Distilled Models in ICL",
      sub: "LLM Evaluation Research",
      desc: "Benchmarked distilled LMs under prompt-based inference and compared in-context-learning behaviors.",
      tags: ["LLMs", "Evaluation", "Prompting"],
      impact: "Systematic analysis of ICL performance under distillation.",
    },
    {
      name: "Sign Language Detection",
      sub: "Real-time CV Pipeline",
      desc: "Real-time computer-vision pipeline using hand landmarks for gesture recognition and classification.",
      tags: ["Computer Vision", "Mediapipe", "Python"],
      impact: "Realtime sign recognition from hand landmarks.",
    },
  ],

  research: [
    "Sign Language Detection using Mediapipe (ICAETC 2023)",
    "ThinkLab Project (IJEC, Web of Science, 2022)",
    "Skin Cancer Prediction using CNN (Scopus)",
    "Meta World for Blind People using AR (DRDO 2023)",
    "Real-Time Traffic Sign Detection with Voice Alerts (DRDO 2023)",
    "Potato Disease Diagnosis and Forecasting (IJRESM 2023)",
    "Advancing Disease Diagnosis (Ai4IoT, Scopus)",
    "Anomaly Detection in IoT Networks (IEEE Xplore)",
  ],

  achievements: [
    "Best Outgoing Student (Gold Medal)",
    "Smart India Hackathon 2022 — Finalist",
    "Cognizant PRODIGI Hackathon — Finalist",
    "TNSI Program Phase II — Selected",
    "Center of Excellence in Cloud Computing — Member",
    "Public Relations Officer — Technical Symposium",
  ],
};

// World layout: each "zone" is a station the player drives to in the 3D game.
// position is [x, z] on the terrain plane. color drives the neon theme.
export const zones = [
  {
    id: "about",
    label: "ABOUT",
    title: "About Me",
    color: "#38bdf8",
    position: [0, -34],
    lines: [
      portfolio.pitch,
      "Software engineer focused on full-stack + mobile with strong fundamentals: clean architecture, performance, and data reliability.",
      `📍 ${portfolio.location}   ✉ ${portfolio.email}`,
    ],
  },
  {
    id: "skills",
    label: "SKILLS",
    title: "Skills & Stack",
    color: "#a78bfa",
    position: [44, -8],
    lines: Object.entries(portfolio.skills).map(([k, v]) => `${k}: ${v.join(", ")}`),
  },
  {
    id: "experience",
    label: "WORK",
    title: "Experience",
    color: "#34d399",
    position: [34, 38],
    lines: portfolio.experience.map((e) => `${e.title}  (${e.time})\n— ${e.bullets[0]}`),
  },
  {
    id: "projects",
    label: "PROJECTS",
    title: "Featured Projects",
    color: "#fbbf24",
    position: [-34, 38],
    lines: portfolio.projects.map((p) => `${p.name} — ${p.sub}\n${p.desc}  [${p.tags.join(", ")}]`),
  },
  {
    id: "research",
    label: "RESEARCH",
    title: "Research & Publications",
    color: "#f472b6",
    position: [-44, -8],
    lines: portfolio.research,
  },
  {
    id: "contact",
    label: "CONTACT",
    title: "Let's Connect",
    color: "#22d3ee",
    position: [0, 48],
    lines: [
      "Open to full-time SWE roles.",
      `✉ ${portfolio.email}`,
      `🔗 LinkedIn: kundan-srinivas-sakkuru`,
      `🐙 GitHub: kundan198`,
      "Drive into the glowing pads above to open my links ↑",
    ],
    actions: [
      { label: "Email Me", href: `mailto:${portfolio.email}?subject=Interview%20Opportunity%20-%20Kundan%20Srinivas` },
      { label: "LinkedIn", href: portfolio.linkedin },
      { label: "GitHub", href: portfolio.github },
    ],
  },
];
