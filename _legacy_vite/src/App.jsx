import { useEffect, useMemo, useState, Suspense, lazy } from "react";

const GameMode = lazy(() => import("./components/GameMode.jsx"));

const cn = (...a) => a.filter(Boolean).join(" ");

// Top-level: 3D driving game is the default experience; "Classic" is the fallback site.
export default function App() {
  const [view, setView] = useState(() =>
    typeof window !== "undefined" && window.location.hash === "#classic" ? "classic" : "game"
  );

  if (view === "game")
    return (
      <Suspense
        fallback={
          <div className="fixed inset-0 grid place-items-center bg-[#070a12] font-mono text-sm text-cyan-300/80">
            Loading 3D world…
          </div>
        }
      >
        <GameMode onExit={() => setView("classic")} />
      </Suspense>
    );
  return <ClassicSite onEnterGame={() => setView("game")} />;
}

function useRevealOnScroll() {
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("opacity-100", "translate-y-0");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.18 }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

const Badge = ({ children }) => (
  <span className="inline-flex items-center rounded-full border border-white/15 bg-white/8 px-3 py-1 text-xs text-white/80">
    {children}
  </span>
);

const Card = ({ className, children }) => (
  <div
    className={cn(
      "glass relative rounded-2xl border border-white/12 bg-white/6 p-5 shadow-[0_18px_50px_rgba(0,0,0,0.35)]",
      "transition duration-200 hover:-translate-y-1 hover:border-white/20 hover:bg-white/9",
      className
    )}
  >
    <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/10" />
    {children}
  </div>
);

const Section = ({ id, title, subtitle, children }) => (
  <section id={id} className="scroll-mt-28">
    <div className="mb-7">
      <h2 className="text-2xl md:text-3xl font-semibold tracking-tight">{title}</h2>
      {subtitle ? <p className="mt-2 text-sm md:text-base text-white/65">{subtitle}</p> : null}
    </div>
    {children}
  </section>
);

function ClassicSite({ onEnterGame }) {
  useRevealOnScroll();

  const data = useMemo(
    () => ({
      name: "Kundan Srinivas Sakkuru",
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
        "Programming": ["Python", "Java", "C", "SQL (Advanced)", "Bash", "Dart (Familiar)"],
        "Web": ["React", "TypeScript", "JavaScript", "HTML", "CSS"],
        "Mobile": ["Flutter", "Android SDK"],
        "Data/ML": ["NumPy", "Pandas", "PyTorch", "TensorFlow", "Keras", "scikit-learn", "PySpark", "Tableau"],
        "Backend/DB": ["Firebase (Auth/Firestore)", "MySQL", "PostgreSQL", "MongoDB", "SQLite", "REST APIs"],
        "Tools": ["Git/GitHub", "Postman", "Jupyter/Colab", "Agile/Scrum", "SDLC"],
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
          name: "CogniX — Neurocognitive Assessment Platform",
          desc: "Flutter platform for reaction/memory/attention tests with structured event logging and automated exports.",
          tags: ["Flutter", "Firebase", "CSV/PDF Export", "Research Logging"],
          impact: "Research-ready assessment workflows with clean, analyzable outputs.",
          links: [],
        },
        {
          name: "Finderly — Campus Lost & Found Web App",
          desc: "React + Firebase full-stack app with user profiles, secure workflows, and real-time messaging.",
          tags: ["React", "TypeScript", "Firebase", "Real-time"],
          impact: "Scalable campus matching + communication system.",
          links: [],
        },
        {
          name: "Evaluating Distilled Models in In-Context Learning",
          desc: "Benchmarked distilled LMs under prompt-based inference and compared ICL behaviors across settings.",
          tags: ["LLMs", "Evaluation", "Prompting"],
          impact: "Systematic analysis of ICL performance under distillation.",
          links: [],
        },
        {
          name: "Sign Language Detection System",
          desc: "Real-time CV pipeline using hand landmarks for gesture recognition and classification.",
          tags: ["Computer Vision", "Mediapipe", "Python"],
          impact: "Realtime sign recognition from hand landmarks.",
          links: [],
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
        "Center of Excellence in Cloud Computing — Selected Member",
        "Public Relations Officer (PRO) — Technical Symposium",
      ],
    }),
    []
  );

  const [mode, setMode] = useState("dark"); // dark | light

  const isLight = mode === "light";

  const textMain = isLight ? "text-slate-900" : "text-white";
  const textSub = isLight ? "text-slate-600" : "text-white/70";
  const borderSoft = isLight ? "border-black/10" : "border-white/12";
  const cardBg = isLight ? "bg-black/4" : "bg-white/6";

  return (
    <div className={cn("min-h-screen noise", isLight ? "light-bg" : "aurora-bg", textMain)}>
      {/* Top Nav */}
      <div className={cn("sticky top-0 z-40 border-b backdrop-blur", isLight ? "border-black/10 bg-white/65" : "border-white/10 bg-[#070A12]/65")}>
        <div className="mx-auto max-w-6xl px-5 py-4 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-3">
            <div className={cn("grid h-10 w-10 place-items-center rounded-xl border font-mono text-xs", isLight ? "border-black/10 bg-white/70" : "border-white/15 bg-white/7")}>
              KS
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">{data.name}</div>
              <div className={cn("text-[11px] font-mono tracking-widest", isLight ? "text-slate-500" : "text-white/55")}>
                NEO AURORA PORTFOLIO
              </div>
            </div>
          </a>

          <div className="hidden md:flex items-center gap-2">
            {["about", "skills", "experience", "projects", "research", "contact"].map((id) => (
              <a
                key={id}
                href={`#${id}`}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-mono tracking-wider transition",
                  isLight
                    ? "border-black/10 bg-white/70 text-slate-700 hover:border-black/20"
                    : "border-white/12 bg-white/6 text-white/75 hover:border-white/25 hover:text-white"
                )}
              >
                {id.toUpperCase()}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onEnterGame}
              className="rounded-xl border border-cyan-400/40 bg-cyan-400/15 px-3 py-2 text-xs font-mono tracking-widest text-cyan-200 transition hover:bg-cyan-400/25"
              aria-label="Enter 3D game mode"
            >
              🎮 GAME MODE
            </button>
            <button
              onClick={() => setMode(isLight ? "dark" : "light")}
              className={cn(
                "rounded-xl border px-3 py-2 text-xs font-mono tracking-widest transition",
                isLight ? "border-black/10 bg-white/70 hover:bg-white" : "border-white/12 bg-white/6 hover:bg-white/10"
              )}
              aria-label="Toggle theme"
            >
              {isLight ? "DARK MODE" : "LIGHT MODE"}
            </button>
          </div>
        </div>
      </div>

      <main id="top" className="mx-auto max-w-6xl px-5 pb-20 pt-10">
        {/* HERO */}
        <div className="grid gap-6 md:grid-cols-12 items-start">
          <div className="md:col-span-8">
            <div
              data-reveal
              className="opacity-0 translate-y-6 transition duration-700"
            >
              <div className={cn("font-mono text-xs tracking-widest", isLight ? "text-slate-500" : "text-white/55")}>
                {data.location} • {data.email}
              </div>

              <h1 className="mt-4 text-4xl md:text-6xl font-semibold tracking-tight">
                {data.name}
              </h1>

              <p className={cn("mt-4 text-lg md:text-xl", textSub)}>
                {data.headline}
              </p>

              <p className={cn("mt-4 max-w-2xl", isLight ? "text-slate-600" : "text-white/70")}>
                {data.pitch}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="#projects"
                  className={cn(
                    "rounded-xl border px-5 py-3 text-sm font-semibold transition",
                    isLight
                      ? "border-black/10 bg-white/80 hover:bg-white"
                      : "border-white/18 bg-white/10 hover:bg-white/15"
                  )}
                >
                  View Projects
                </a>

                <a
                  href={`mailto:${data.email}?subject=Interview%20Opportunity%20-%20Kundan%20Srinivas`}
                  className={cn(
                    "rounded-xl border px-5 py-3 text-sm transition",
                    isLight
                      ? "border-black/10 bg-white/60 hover:bg-white"
                      : "border-white/12 bg-white/6 hover:bg-white/10"
                  )}
                >
                  Email Me
                </a>

                <a
                  href={data.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "rounded-xl border px-5 py-3 text-sm transition",
                    isLight
                      ? "border-black/10 bg-white/60 hover:bg-white"
                      : "border-white/12 bg-white/6 hover:bg-white/10"
                  )}
                >
                  LinkedIn ↗
                </a>

                <a
                  href={data.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "rounded-xl border px-5 py-3 text-sm transition",
                    isLight
                      ? "border-black/10 bg-white/60 hover:bg-white"
                      : "border-white/12 bg-white/6 hover:bg-white/10"
                  )}
                >
                  GitHub ↗
                </a>
              </div>
            </div>
          </div>

          <div className="md:col-span-4">
            <div
              data-reveal
              className="opacity-0 translate-y-6 transition duration-700 delay-100"
            >
              <div className="grid gap-3">
                {data.highlights.map((m) => (
                  <div
                    key={m.k}
                    className={cn(
                      "rounded-2xl border p-4 glass",
                      borderSoft,
                      isLight ? "bg-white/65" : "bg-white/6"
                    )}
                  >
                    <div className={cn("font-mono text-[11px] tracking-widest", isLight ? "text-slate-500" : "text-white/55")}>
                      {m.k.toUpperCase()}
                    </div>
                    <div className="mt-2 text-base font-semibold">{m.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={cn("my-12 h-px", isLight ? "bg-black/10" : "bg-white/10")} />

        {/* ABOUT */}
        <Section
          id="about"
          title="About"
          subtitle="A quick snapshot of what I build and how I think about engineering."
        >
          <div
            data-reveal
            className="opacity-0 translate-y-6 transition duration-700"
          >
            <Card className={cn(borderSoft, cardBg, isLight ? "text-slate-900" : "text-white")}>
              <div className={cn("grid gap-5 md:grid-cols-12", isLight ? "text-slate-900" : "text-white")}>
                <div className="md:col-span-8">
                  <p className={cn("leading-relaxed", isLight ? "text-slate-700" : "text-white/75")}>
                    I’m a software engineer focused on building full-stack and mobile products with strong fundamentals:
                    clean architecture, performance, and data reliability. My work blends product engineering with
                    research-style rigor (structured logging, reproducibility, and analysis-ready outputs).
                  </p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {["Full-Stack Systems", "Mobile Apps", "Research Pipelines", "ML/Analytics", "Agile Delivery"].map((x) => (
                      <span
                        key={x}
                        className={cn(
                          "inline-flex items-center rounded-full border px-3 py-1 text-xs",
                          isLight ? "border-black/10 bg-white/70 text-slate-700" : "border-white/15 bg-white/8 text-white/80"
                        )}
                      >
                        {x}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-4">
                  <div className={cn("rounded-2xl border p-4", borderSoft, isLight ? "bg-white/70" : "bg-white/6")}>
                    <div className={cn("font-mono text-[11px] tracking-widest", isLight ? "text-slate-500" : "text-white/55")}>
                      CONTACT
                    </div>
                    <div className={cn("mt-3 space-y-2 text-sm", isLight ? "text-slate-700" : "text-white/80")}>
                      <div><span className={isLight ? "text-slate-500" : "text-white/55"}>Email:</span> {data.email}</div>
                      <div><span className={isLight ? "text-slate-500" : "text-white/55"}>Location:</span> {data.location}</div>
                      <div><span className={isLight ? "text-slate-500" : "text-white/55"}>Links:</span> LinkedIn / GitHub</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </Section>

        <div className={cn("my-12 h-px", isLight ? "bg-black/10" : "bg-white/10")} />

        {/* SKILLS */}
        <Section
          id="skills"
          title="Skills"
          subtitle="Grouped for clarity—optimized for recruiters scanning fast."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {Object.entries(data.skills).map(([group, items]) => (
              <div
                key={group}
                data-reveal
                className="opacity-0 translate-y-6 transition duration-700"
              >
                <Card className={cn(borderSoft, isLight ? "bg-white/70" : "bg-white/6")}>
                  <div className={cn("font-mono text-[11px] tracking-widest", isLight ? "text-slate-500" : "text-white/55")}>
                    {group.toUpperCase()}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {items.map((s) => (
                      <span
                        key={s}
                        className={cn(
                          "inline-flex items-center rounded-full border px-3 py-1 text-xs",
                          isLight ? "border-black/10 bg-white text-slate-700" : "border-white/15 bg-white/8 text-white/80"
                        )}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </Section>

        <div className={cn("my-12 h-px", isLight ? "bg-black/10" : "bg-white/10")} />

        {/* EXPERIENCE */}
        <Section
          id="experience"
          title="Experience"
          subtitle="Impact-focused bullets with clear technical direction."
        >
          <div className="grid gap-4">
            {data.experience.map((e) => (
              <div
                key={e.title}
                data-reveal
                className="opacity-0 translate-y-6 transition duration-700"
              >
                <Card className={cn(borderSoft, isLight ? "bg-white/70" : "bg-white/6")}>
                  <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="text-lg font-semibold">{e.title}</div>
                      <div className={cn("mt-1 font-mono text-xs tracking-widest", isLight ? "text-slate-500" : "text-white/55")}>
                        {e.time}
                      </div>

                      <ul className={cn("mt-4 list-disc space-y-2 pl-5", isLight ? "text-slate-700" : "text-white/75")}>
                        {e.bullets.map((b) => (
                          <li key={b}>{b}</li>
                        ))}
                      </ul>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {e.tags.map((t) => (
                          <span
                            key={t}
                            className={cn(
                              "inline-flex items-center rounded-full border px-3 py-1 text-xs",
                              isLight ? "border-black/10 bg-white text-slate-700" : "border-white/15 bg-white/8 text-white/80"
                            )}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="md:w-64">
                      <div className={cn("rounded-2xl border p-4", borderSoft, isLight ? "bg-white" : "bg-white/6")}>
                        <div className={cn("font-mono text-[11px] tracking-widest", isLight ? "text-slate-500" : "text-white/55")}>
                          NOTE
                        </div>
                        <div className={cn("mt-2 text-sm", isLight ? "text-slate-700" : "text-white/75")}>
                          I prioritize reproducibility, strong logging, and clean UX—useful for both research and product teams.
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </Section>

        <div className={cn("my-12 h-px", isLight ? "bg-black/10" : "bg-white/10")} />

        {/* PROJECTS */}
        <Section
          id="projects"
          title="Projects"
          subtitle="Featured work with tags and clear outcomes."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {data.projects.map((p) => (
              <div
                key={p.name}
                data-reveal
                className="opacity-0 translate-y-6 transition duration-700"
              >
                <Card className={cn(borderSoft, isLight ? "bg-white/70" : "bg-white/6")}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-lg font-semibold">{p.name}</div>
                      <div className={cn("mt-2", isLight ? "text-slate-700" : "text-white/75")}>
                        {p.desc}
                      </div>
                    </div>
                    <div className={cn("font-mono text-[11px]", isLight ? "text-slate-500" : "text-white/55")}>BUILD</div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {p.tags.map((t) => (
                      <span
                        key={t}
                        className={cn(
                          "inline-flex items-center rounded-full border px-3 py-1 text-xs",
                          isLight ? "border-black/10 bg-white text-slate-700" : "border-white/15 bg-white/8 text-white/80"
                        )}
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <div className={cn("mt-4 rounded-xl border p-3 text-sm", borderSoft, isLight ? "bg-white" : "bg-white/6")}>
                    <span className={cn("font-mono text-[11px] tracking-widest", isLight ? "text-slate-500" : "text-white/55")}>
                      IMPACT:{" "}
                    </span>
                    <span className={isLight ? "text-slate-700" : "text-white/75"}>{p.impact}</span>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </Section>

        <div className={cn("my-12 h-px", isLight ? "bg-black/10" : "bg-white/10")} />

        {/* RESEARCH */}
        <Section
          id="research"
          title="Research & Publications"
          subtitle="Compact list—easy for recruiters and professors to scan."
        >
          <div
            data-reveal
            className="opacity-0 translate-y-6 transition duration-700"
          >
            <Card className={cn(borderSoft, isLight ? "bg-white/70" : "bg-white/6")}>
              <div className="grid gap-3">
                {data.research.map((r) => (
                  <div
                    key={r}
                    className={cn("rounded-xl border px-4 py-3 flex items-center justify-between gap-4", borderSoft, isLight ? "bg-white" : "bg-white/6")}
                  >
                    <div className={isLight ? "text-slate-800" : "text-white/85"}>{r}</div>
                    <div className={cn("font-mono text-[11px]", isLight ? "text-slate-500" : "text-white/55")}>PUB</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </Section>

        <div className={cn("my-12 h-px", isLight ? "bg-black/10" : "bg-white/10")} />

        {/* ACHIEVEMENTS */}
        <Section
          id="achievements"
          title="Achievements"
          subtitle="Highlights that quickly signal credibility."
        >
          <div
            data-reveal
            className="opacity-0 translate-y-6 transition duration-700"
          >
            <Card className={cn(borderSoft, isLight ? "bg-white/70" : "bg-white/6")}>
              <div className="flex flex-wrap gap-2">
                {data.achievements.map((a) => (
                  <span
                    key={a}
                    className={cn(
                      "inline-flex items-center rounded-full border px-3 py-1 text-xs",
                      isLight ? "border-black/10 bg-white text-slate-700" : "border-white/15 bg-white/8 text-white/80"
                    )}
                  >
                    {a}
                  </span>
                ))}
              </div>
            </Card>
          </div>
        </Section>

        <div className={cn("my-12 h-px", isLight ? "bg-black/10" : "bg-white/10")} />

        {/* CONTACT */}
        <Section
          id="contact"
          title="Contact"
          subtitle="Fastest response via email. LinkedIn is great for recruiter messages."
        >
          <div
            data-reveal
            className="opacity-0 translate-y-6 transition duration-700"
          >
            <div className="grid gap-4 md:grid-cols-12">
              <Card className={cn("md:col-span-7", borderSoft, isLight ? "bg-white/70" : "bg-white/6")}>
                <div className={cn("font-mono text-[11px] tracking-widest", isLight ? "text-slate-500" : "text-white/55")}>
                  MESSAGE ROUTE
                </div>
                <div className="mt-2 text-lg font-semibold">Open to full-time SWE roles</div>
                <p className={cn("mt-3", isLight ? "text-slate-700" : "text-white/75")}>
                  Want to chat? I can share project demos, GitHub repos, and discuss how I build scalable systems with reliable data workflows.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <a
                    href={`mailto:${data.email}?subject=Interview%20Opportunity%20-%20Kundan%20Srinivas`}
                    className={cn(
                      "rounded-xl border px-5 py-3 text-sm font-semibold transition",
                      isLight ? "border-black/10 bg-white hover:bg-white" : "border-white/18 bg-white/10 hover:bg-white/15"
                    )}
                  >
                    Email Me
                  </a>

                  <a
                    href={data.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "rounded-xl border px-5 py-3 text-sm transition",
                      isLight ? "border-black/10 bg-white/70 hover:bg-white" : "border-white/12 bg-white/6 hover:bg-white/10"
                    )}
                  >
                    LinkedIn ↗
                  </a>

                  <a
                    href={data.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "rounded-xl border px-5 py-3 text-sm transition",
                      isLight ? "border-black/10 bg-white/70 hover:bg-white" : "border-white/12 bg-white/6 hover:bg-white/10"
                    )}
                  >
                    GitHub ↗
                  </a>
                </div>
              </Card>

              <Card className={cn("md:col-span-5", borderSoft, isLight ? "bg-white/70" : "bg-white/6")}>
                <div className={cn("font-mono text-[11px] tracking-widest", isLight ? "text-slate-500" : "text-white/55")}>
                  QUICK RECRUITER NOTE
                </div>
                <p className={cn("mt-3 text-sm leading-relaxed", isLight ? "text-slate-700" : "text-white/75")}>
                  Hi — I’m Kundan Srinivas, a Full-Stack/Mobile Software Engineer working with React, Firebase, and Flutter.
                  I’ve built research-grade logging + analytics workflows and I’m open to full-time roles. Could we schedule a quick chat?
                </p>
              </Card>
            </div>

            <div className={cn("mt-10 flex items-center justify-between border-t pt-6 text-xs", isLight ? "border-black/10 text-slate-500" : "border-white/10 text-white/55")}>
              <div className="font-mono">© {new Date().getFullYear()} {data.name}</div>
              <div className="font-mono">NEO AURORA • GLASS • MOTION</div>
            </div>
          </div>
        </Section>
      </main>
    </div>
  );
}
