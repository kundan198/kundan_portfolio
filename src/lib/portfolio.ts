// Single source of truth for all portfolio content in The Kundanverse.

export const profile = {
  name: "Kundan Srinivas Sakkuru",
  short: "Kundan Srinivas",
  initials: "KS",
  location: "Tampa, FL",
  email: "kundansrinivas377@gmail.com",
  linkedin: "https://www.linkedin.com/in/kundan-srinivas-sakkuru-513532200/",
  github: "https://github.com/kundan198",
  headline: "Full-Stack Software Engineer • Mobile • AI Systems",
  pitch:
    "I build research-grade and product-ready applications using React, Firebase, and Flutter — shipping clean UX, structured data pipelines, and scalable systems.",
};

export type District = {
  id: string;
  name: string;
  subtitle: string;
  color: string; // neon theme
  position: [number, number]; // [x, z] on the world plane
  icon: string;
  mission: string;
  orbs: number; // collectibles required to "bring this district alive"
  content: { heading: string; body: string }[];
};

export const districts: District[] = [
  {
    id: "home",
    name: "HOME DISTRICT",
    subtitle: "Where the journey begins",
    color: "#5eead4",
    position: [-72, -62],
    icon: "🏠",
    mission: "Boot up the world — drive or walk out and explore the grey city.",
    orbs: 0,
    content: [
      { heading: "Welcome, Explorer", body: profile.pitch },
      { heading: "Who", body: `${profile.name} — ${profile.headline}. Based in ${profile.location}.` },
      { heading: "Objective", body: "Bring each district of the Kundanverse to life by completing its mission. As the world awakens, you'll discover my story." },
    ],
  },
  {
    id: "campus",
    name: "UNIVERSITY DISTRICT",
    subtitle: "Education",
    color: "#60a5fa",
    position: [-54, -28],
    icon: "🎓",
    mission: "Collect the scattered Knowledge Orbs to light up the campus.",
    orbs: 4,
    content: [
      { heading: "University of South Florida", body: "Graduate studies in Computer Science with a focus on full-stack systems, mobile, and applied machine learning." },
      { heading: "Foundations", body: "Strong CS fundamentals — data structures, algorithms, databases, distributed systems, and software engineering practice." },
      { heading: "Approach", body: "Research-style rigor: reproducibility, structured logging, and analysis-ready outputs across everything I build." },
    ],
  },
  {
    id: "lab",
    name: "AI RESEARCH CAMPUS",
    subtitle: "Research Assistant • Aug 2025 – May 2026",
    color: "#a78bfa",
    position: [0, 0],
    icon: "🧬",
    mission: "Reactivate the neural cores by gathering the Data Orbs.",
    orbs: 5,
    content: [
      { heading: "Neurocognitive Testing", body: "Built mobile-based neurocognitive testing modules with reliable data capture and research-ready CSV/PDF outputs for longitudinal analysis." },
      { heading: "Interdisciplinary", body: "Collaborated with interdisciplinary teams to align app workflows, study protocols, and analytics pipelines for reproducibility." },
      { heading: "Publications", body: "8+ papers across IEEE Xplore, Scopus, Web of Science — sign-language detection, skin-cancer CNNs, AR for the blind, IoT anomaly detection." },
    ],
  },
  {
    id: "startup",
    name: "STARTUP DISTRICT",
    subtitle: "Projects shipped",
    color: "#fbbf24",
    position: [54, 10],
    icon: "🚀",
    mission: "Power up each company tower by collecting Build Orbs.",
    orbs: 5,
    content: [
      { heading: "CogniX", body: "Flutter neurocognitive assessment platform — reaction/memory/attention tests with structured event logging and automated CSV/PDF exports." },
      { heading: "Finderly", body: "React + Firebase campus lost-&-found app with user profiles, secure workflows, and real-time messaging." },
      { heading: "Sign-Language Detection", body: "Real-time computer-vision pipeline using hand landmarks (Mediapipe) for gesture recognition." },
      { heading: "Distilled LLMs in ICL", body: "Benchmarked distilled language models under prompt-based inference; analyzed in-context-learning behavior." },
    ],
  },
  {
    id: "forest",
    name: "TECHNOLOGY FOREST",
    subtitle: "The tech stack, growing",
    color: "#34d399",
    position: [-58, 26],
    icon: "🌲",
    mission: "Plant the tech-trees — collect Seed Orbs to grow the forest.",
    orbs: 6,
    content: [
      { heading: "Languages", body: "Python, Java, C, SQL (advanced), Dart, Bash." },
      { heading: "Web & Mobile", body: "React, TypeScript, JavaScript, Flutter, Android SDK, HTML/CSS." },
      { heading: "Data / ML", body: "PyTorch, TensorFlow, Keras, scikit-learn, NumPy, Pandas, PySpark, Tableau." },
      { heading: "Backend / Cloud", body: "Firebase, MySQL, PostgreSQL, MongoDB, SQLite, REST APIs, Google Cloud, Git." },
    ],
  },
  {
    id: "downtown",
    name: "DOWNTOWN CITY",
    subtitle: "Business. Life. Opportunity.",
    color: "#ef4444",
    position: [5, -46],
    icon: "🏙️",
    mission: "Restore the city core by collecting Signal Orbs around the towers.",
    orbs: 4,
    content: [
      { heading: "Professional Core", body: "A dense downtown district representing production systems, teamwork, interviews, and real-world engineering delivery." },
      { heading: "City Rhythm", body: "Tall towers, clean roads, plazas, traffic, and readable routes connect every district back to the center." },
    ],
  },
  {
    id: "waterfront",
    name: "WATERFRONT",
    subtitle: "Relax. Explore. Enjoy.",
    color: "#06b6d4",
    position: [70, -58],
    icon: "⛵",
    mission: "Bring the marina lights online by collecting Tide Orbs near the coast.",
    orbs: 3,
    content: [
      { heading: "Coastal District", body: "A bright marina edge with docks, promenade paths, boats, and open sightlines toward the city." },
      { heading: "Balance", body: "The waterfront gives the world a breathable edge: beaches, calm water, and space between high-density districts." },
    ],
  },
  {
    id: "summit",
    name: "MOUNTAIN OBSERVATORY",
    subtitle: "Awards & recognition",
    color: "#f472b6",
    position: [-4, 76],
    icon: "🏆",
    mission: "Light the beacons of the summit to unlock the finale.",
    orbs: 5,
    content: [
      { heading: "Gold Medal", body: "Best Outgoing Student." },
      { heading: "Hackathons", body: "Smart India Hackathon 2022 — Finalist · Cognizant PRODIGI — Finalist." },
      { heading: "Selections", body: "TNSI Program Phase II · Center of Excellence in Cloud Computing — Member." },
      { heading: "Leadership", body: "Public Relations Officer — Technical Symposium." },
    ],
  },
  {
    id: "space",
    name: "SPACE CENTER",
    subtitle: "Dream. Build. Beyond.",
    color: "#c7d2fe",
    position: [78, 52],
    icon: "🚀",
    mission: "Fuel the launch systems by collecting Orbit Orbs around the spaceport.",
    orbs: 4,
    content: [
      { heading: "Future Systems", body: "A coastal launch district for ambitious systems work, cloud infrastructure, and long-range engineering goals." },
      { heading: "Beyond", body: "Rocket towers, gantries, hangars, and clean service roads make this the most futuristic edge of the Kundanverse." },
    ],
  },
];

export const finale = {
  title: "THE KUNDANVERSE",
  lines: [
    "You didn't browse a portfolio.",
    "You explored a journey.",
    "You built a future.",
    "You discovered Kundan Srinivas.",
  ],
  actions: [
    { label: "Email Me", href: `mailto:${profile.email}?subject=Let's%20build%20together`, kind: "mail" },
    { label: "GitHub", href: profile.github, kind: "link" },
    { label: "LinkedIn", href: profile.linkedin, kind: "link" },
  ],
};

// AI boot sequence lines for the cinematic intro
export const bootSequence = [
  "INITIALIZING NEURAL CORE...",
  "RENDERING REALITY...",
];
