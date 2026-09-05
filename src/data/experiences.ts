/**
 * The journey is data-driven: every destination below places a district in the
 * city, owns a slice of scroll progress, and supplies the card that fades in
 * while the car is inside that slice.
 *
 * `progressStart`/`progressEnd` are normalised journey progress (0–1) and must
 * stay sorted and non-overlapping — the overlay picks the active card by
 * scanning this list in order.
 */
export interface Destination {
  id: string;
  kind: "education" | "research" | "industry" | "finale";
  /** District label shown in the HUD. */
  district: string;
  title: string;
  organization: string;
  location: string;
  date: string;
  description: string;
  highlights: string[];
  /** Journey progress window in which the card is on screen. */
  progressStart: number;
  progressEnd: number;
  /** Point on the curve the district is built around. */
  anchor: number;
  accent: string;
}

export const destinations: Destination[] = [
  {
    id: "education",
    kind: "education",
    district: "Campus",
    title: "MS, Computer Science",
    organization: "University of South Florida",
    location: "Tampa, FL",
    date: "Aug 2024 – May 2026",
    description:
      "Graduate study across operating systems, algorithms, machine learning and mobile systems, alongside a first-class undergraduate record in computer science and engineering.",
    highlights: ["Machine Learning", "Operating Systems", "Mobile Systems", "Gold Medal, BE"],
    progressStart: 0.06,
    progressEnd: 0.2,
    anchor: 0.13,
    accent: "#818cf8",
  },
  {
    id: "research",
    kind: "research",
    district: "Research Park",
    title: "Graduate Research Assistant",
    organization: "University of South Florida, SHIELD Lab",
    location: "Tampa, FL",
    date: "Oct 2025 – Present",
    description:
      "Working on neurocognitive assessment tools to measure reaction time, memory, attention, and motor performance using mobile and cloud-based systems.",
    highlights: [
      "Cross-platform Development",
      "Data Pipeline & Analytics",
      "Research Translation",
      "Longitudinal Systems",
    ],
    progressStart: 0.24,
    progressEnd: 0.42,
    anchor: 0.33,
    accent: "#a78bfa",
  },
  {
    id: "pfizer",
    kind: "industry",
    district: "Healthcare District",
    title: "Software Engineering Intern",
    organization: "Pfizer",
    location: "United States",
    date: "Mar 2025 – Present",
    description:
      "Building enterprise healthcare software on Azure — AI document classification, clinical-workflow front ends, and the secure services behind them.",
    highlights: [
      "Azure AI & OpenAI",
      "React + TypeScript",
      "Spring Boot Microservices",
      "CI/CD on Azure DevOps",
    ],
    progressStart: 0.46,
    progressEnd: 0.62,
    anchor: 0.54,
    accent: "#38bdf8",
  },
  {
    id: "pnc",
    kind: "industry",
    district: "Financial District",
    title: "Full Stack Engineer",
    organization: "PNC Financial",
    location: "United States",
    date: "Jan 2023 – Jul 2024",
    description:
      "Delivered customer-facing banking applications end to end, from React interfaces to ASP.NET Core services and the AWS infrastructure underneath.",
    highlights: [
      "React & ASP.NET Core",
      "AWS EC2 · S3 · RDS · Lambda",
      "+20% User Engagement",
      "+25% Query Efficiency",
    ],
    progressStart: 0.66,
    progressEnd: 0.82,
    anchor: 0.74,
    accent: "#fbbf24",
  },
  {
    id: "next",
    kind: "finale",
    district: "The Horizon",
    title: "What's Next",
    organization: "Full Stack SWE · AI / ML Engineering",
    location: "Tampa, FL · Open to relocation",
    date: "May 2026",
    description:
      "Looking for teams building production AI products, real-time data tools and mobile-first platforms — where research prototypes become software people actually use.",
    highlights: ["2× Hackathon Winner", "8 Published Papers", "Research → Production", "Open to Opportunities"],
    progressStart: 0.86,
    progressEnd: 1,
    anchor: 0.95,
    accent: "#34d399",
  },
];

/** Index of the destination whose window contains `p`, or -1 between stops. */
export function destinationAt(p: number): number {
  for (let i = 0; i < destinations.length; i++) {
    const d = destinations[i];
    if (p >= d.progressStart && p <= d.progressEnd) return i;
  }
  return -1;
}

/** Index of the destination the car is heading for (for the HUD). */
export function upcomingDestination(p: number): number {
  for (let i = 0; i < destinations.length; i++) {
    if (p <= destinations[i].progressEnd) return i;
  }
  return destinations.length - 1;
}
