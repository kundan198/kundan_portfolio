export const personalInfo = {
  name: "Kundan Srinivas",
  fullName: "Kundan Srinivas Sakkuru",
  title: "Full Stack Engineer & AI Specialist",
  email: "kundansrinivas377@gmail.com",
  phone: "+1 813 568 7378",
  linkedin: "https://www.linkedin.com/in/kundan-srinivas-sakkuru-513532200/",
  github: "https://github.com/kundan198",
  location: "Tampa, FL",
  summary:
    "Full-stack software engineer specializing in production AI systems, cross-platform mobile, and scalable web applications. Hands-on experience building and shipping generative AI pipelines, agentic systems, and real-time data applications used by real users in production. Two-time hackathon award winner. Published researcher with 8 papers in ML, computer vision, and mobile systems.",
  roles: [
    "Full Stack Engineer",
    "AI / ML Engineer",
    "Mobile App Developer",
    "Published Researcher",
    "Software Engineer",
  ],
  stats: [
    { label: "Projects Shipped", value: "6+" },
    { label: "Hackathon Awards", value: "2x" },
    { label: "Research Papers", value: "8" },
    { label: "Production Users", value: "Real" },
  ],
};

export const skills = {
  languages: [
    { name: "Python", level: 95 },
    { name: "TypeScript / JavaScript", level: 93 },
    { name: "Java", level: 88 },
    { name: "Dart", level: 85 },
    { name: "SQL", level: 82 },
    { name: "C", level: 75 },
    { name: "Bash", level: 70 },
    { name: "Swift", level: 65 },
  ],
  webMobile: [
    { name: "React", level: 93 },
    { name: "Flutter / Dart", level: 90 },
    { name: "FastAPI", level: 88 },
    { name: "Django", level: 85 },
    { name: "REST APIs / WebSocket", level: 90 },
    { name: "React Native", level: 78 },
    { name: "Android SDK (Java)", level: 80 },
    { name: "iOS / Swift", level: 65 },
  ],
  aiMl: [
    { name: "PyTorch / TensorFlow / Keras", level: 92 },
    { name: "LangChain / Agentic AI", level: 90 },
    { name: "RAG / Vector Search", level: 90 },
    { name: "Generative AI (Gemini, GPT)", level: 88 },
    { name: "Computer Vision (MediaPipe, OpenCV)", level: 85 },
    { name: "NLP (NLTK, Transformers)", level: 85 },
    { name: "Scikit-learn", level: 88 },
    { name: "LLM Evaluation / Prompt Engineering", level: 87 },
  ],
  dataCloud: [
    { name: "Firebase / Firestore", level: 92 },
    { name: "PostgreSQL / MySQL", level: 85 },
    { name: "MongoDB", level: 80 },
    { name: "GCP / Cloud Functions", level: 82 },
    { name: "AWS", level: 72 },
    { name: "CI/CD / GitHub Actions", level: 80 },
    { name: "ChromaDB / Vector DBs", level: 85 },
  ],
  tools: [
    "Git / GitHub", "VS Code", "Android Studio", "Jupyter", "Postman",
    "Agile / Scrum", "SDLC", "Unit Testing", "Code Review",
  ],
};

export const projects = [
  {
    id: "bayshield",
    title: "BayShield",
    subtitle: "Agentic AI Disaster Response System",
    description:
      "Production agentic AI system built in 24 hours featuring four autonomous specialized agents running in parallel: real-time NOAA weather data ingestion, shelter-capacity optimization, cross-zone resource allocation, and synthesized incident command reports — all operating on live Hurricane Helene disaster data.",
    highlights: [
      "4 autonomous agents running in parallel",
      "RAG pipeline with ChromaDB + sentence-transformers",
      "Live React dashboard over FastAPI WebSocket (5s refresh)",
      "Real Hurricane Helene disaster data",
    ],
    tech: ["Python", "LangChain", "Agentic AI", "RAG", "ChromaDB", "FastAPI", "WebSocket", "React"],
    category: "AI/ML",
    badge: { text: "🏆 HackUSF 2026 — 3rd Place", color: "yellow" },
    github: "https://github.com/kundan198",
    color: "purple",
  },
  {
    id: "signbridge",
    title: "SignBridge",
    subtitle: "Real-Time Generative AI Sign Language Platform",
    description:
      "Production-ready two-way real-time communication system targeting 70M+ sign language users worldwide. Speech-to-Sign pipeline uses NLTK NLP grammar restructuring; Sign-to-Speech uses MediaPipe + Google Gemini + ElevenLabs TTS — with sub-second end-to-end latency.",
    highlights: [
      "Sub-second end-to-end latency across both pipelines",
      "Targets 70M+ sign language users",
      "Real-time NLP grammar reordering for ASL/English mismatch",
      "MediaPipe landmark tracking + Gemini gesture interpretation",
    ],
    tech: ["MediaPipe", "Google Gemini", "NLTK", "Django", "ElevenLabs", "Computer Vision", "Python"],
    category: "AI/ML",
    badge: { text: "🥈 HackaBull 2025 — 2nd Place", color: "silver" },
    github: "https://github.com/kundan198",
    color: "cyan",
  },
  {
    id: "cognix",
    title: "CogniX",
    subtitle: "Production Neurocognitive Assessment Platform",
    description:
      "Production-deployed cross-platform Flutter app (Android & iOS) actively used in live neuroscience studies. Features sub-millisecond Dart isolate event logging, zero-collision Firestore schema, and a serverless pipeline delivering analysis-ready CSV and PDF reports instantly on session completion.",
    highlights: [
      "Sub-millisecond Dart isolate precision timing",
      "Zero data loss across 50+ real production sessions",
      "Eliminated 100% manual data entry via Cloud Functions",
      "Offline-first with automatic sync on reconnect",
    ],
    tech: ["Flutter", "Dart Isolates", "Firebase Firestore", "Python Cloud Functions", "pandas", "ReportLab"],
    category: "Mobile",
    badge: { text: "Production Deployed", color: "green" },
    github: "https://github.com/kundan198",
    color: "blue",
  },
  {
    id: "finderly",
    title: "Finderly",
    subtitle: "Full-Stack Intelligent Matching Web App",
    description:
      "Full-stack real-time web application featuring a custom TypeScript token-overlap scoring engine that automatically matches found-item reports against lost-item descriptions. Real-time P2P messaging via Firestore onSnapshot with per-conversation security rules.",
    highlights: [
      "Custom TypeScript scoring engine — no third-party SDKs",
      "Real-time P2P messaging with Firestore onSnapshot",
      "Multi-provider Firebase Auth (Google OAuth + email)",
      "Composite Firestore queries across category, location, date",
    ],
    tech: ["React", "TypeScript", "Firebase Auth", "Google OAuth", "Firestore", "REST APIs"],
    category: "Full Stack",
    badge: { text: "Full Stack", color: "blue" },
    github: "https://github.com/kundan198",
    color: "violet",
  },
  {
    id: "skin-cancer",
    title: "Skin Cancer CNN",
    subtitle: "Published Scopus Research — Deep Learning",
    description:
      "Production-quality deep learning CNN for 7-class skin lesion classification on the HAM10000 clinical dataset. Solved 67% class imbalance via inverse-frequency weighting. 18% improvement in minority-class recall. Published in Scopus-indexed journal.",
    highlights: [
      "7-class classification on HAM10000 clinical dataset",
      "18% improvement in minority-class recall",
      "Solved 67% class imbalance with inverse-frequency weighting",
      "Benchmarked against ResNet50 transfer learning",
    ],
    tech: ["PyTorch", "TensorFlow", "Keras", "ResNet50", "NumPy", "Pandas", "Computer Vision"],
    category: "Research",
    badge: { text: "📄 Published — Scopus", color: "orange" },
    github: "https://github.com/kundan198",
    color: "pink",
  },
  {
    id: "llm-eval",
    title: "LLM Distillation Eval",
    subtitle: "Evaluating Distilled Models in In-Context Learning",
    description:
      "Rigorous evaluation of knowledge-distilled generative AI models under few-shot and zero-shot in-context learning across standard NLP benchmarks. Systematically varied prompt structure, shot count, and formatting to quantify how distillation degrades or preserves contextual reasoning.",
    highlights: [
      "Few-shot and zero-shot evaluation across NLP benchmarks",
      "Varied prompt structure, shot count, and formatting",
      "Actionable model selection guidance for production teams",
      "Trade-off analysis: size vs. latency vs. task accuracy",
    ],
    tech: ["Python", "Generative AI", "LLM Evaluation", "Prompt Engineering", "Hugging Face", "NLP"],
    category: "Research",
    badge: { text: "AI Research", color: "purple" },
    github: "https://github.com/kundan198",
    color: "indigo",
  },
];

export const experience = [
  {
    role: "Research Software Engineer",
    org: "SHIELD Lab, University of South Florida",
    location: "Tampa, FL",
    period: "Aug 2025 – May 2026",
    type: "Research",
    bullets: [
      "Sole engineer behind CogniX — a production-deployed cross-platform Flutter app (Android & iOS) actively used across live neuroscience studies with sub-millisecond Dart isolate event logging.",
      "Designed scalable, zero-collision Firestore schema (participantId → sessionId → trialIndex) supporting high-concurrency multi-device sessions with offline-first persistence — zero data loss across 50+ real production sessions.",
      "Eliminated 100% of manual data entry by shipping a serverless Python Cloud Function auto-delivering analysis-ready CSV and formatted PDF reports on session completion.",
      "Operated in tight Agile sprints with neuroscientists; owned requirements gathering, development, testing, and deployment end-to-end.",
    ],
    color: "purple",
  },
  {
    role: "Artificial Intelligence Intern",
    org: "YoungMinds",
    location: "Remote",
    period: "Jan 2023 – Jun 2023",
    type: "Industry",
    bullets: [
      "Built and shipped production-ready end-to-end ML pipelines for NLP text classification and predictive analytics — owning the full lifecycle from data ingestion through deployment.",
      "Drove model quality through rigorous evaluation on precision, recall, F1, and ROC-AUC; applied targeted hyperparameter tuning to reduce overfitting.",
      "Delivered data-backed performance reports to stakeholders every sprint within Agile cycles.",
    ],
    color: "blue",
  },
];

export const education = [
  {
    degree: "MS, Computer Science",
    school: "University of South Florida",
    location: "Tampa, FL",
    period: "Aug 2024 – May 2026",
    courses: ["Operating Systems", "Algorithms", "Machine Learning", "Mobile Systems", "Software Engineering"],
    highlight: "GPA: 4.0 (Expected)",
  },
  {
    degree: "BE, Computer Science and Engineering",
    school: "R.M.D Engineering College, Anna University",
    location: "India",
    period: "Nov 2020 – May 2024",
    courses: ["Compilers", "OS", "Data Structures", "Computer Networks"],
    highlight: "CGPA: 9.03/10 | Gold Medal, Best Outgoing Student",
  },
];

export const achievements = [
  {
    title: "HackaBull 2025 — 2nd Place",
    desc: "SignBridge: production generative AI sign language platform for 70M+ users, built & demoed in 24 hours.",
    icon: "🥈",
    color: "cyan",
  },
  {
    title: "HackUSF 2026 — 3rd Place",
    desc: "BayShield: production agentic AI disaster response system on real Hurricane Helene data, built in 24 hours.",
    icon: "🏆",
    color: "yellow",
  },
  {
    title: "Gold Medal — Best Outgoing Student",
    desc: "Highest academic performance across entire undergraduate cohort; CGPA 9.03/10.",
    icon: "🥇",
    color: "gold",
  },
  {
    title: "Smart India Hackathon 2022 — National Finalist",
    desc: "Selected among top teams nationally in Ministry of Education innovation challenge.",
    icon: "🇮🇳",
    color: "orange",
  },
  {
    title: "Cognizant PRODIGI Hackathon — Finalist",
    desc: "Selected as finalist in Cognizant's national innovation challenge.",
    icon: "⚡",
    color: "purple",
  },
  {
    title: "Published Researcher",
    desc: "8 papers published in ML, computer vision, and mobile systems. One Scopus-indexed journal publication.",
    icon: "📄",
    color: "blue",
  },
];
