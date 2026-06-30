import {
  SiReact, SiNextdotjs, SiFlutter, SiTypescript, SiJavascript, SiPython,
  SiDart, SiDotnet, SiTailwindcss, SiNodedotjs, SiExpress, SiNestjs,
  SiFastapi, SiGraphql, SiMongodb, SiPostgresql, SiMysql, SiFirebase,
  SiSupabase, SiRedis, SiDocker, SiKubernetes, SiGit, SiGithub, SiGitlab,
  SiJenkins, SiFigma, SiPostman, SiLinux, SiSocketdotio, SiWebrtc,
} from "react-icons/si";
import { FaAws, FaJava } from "react-icons/fa";
import { VscVscode } from "react-icons/vsc";
import { TbApi, TbRepeat } from "react-icons/tb";

export interface SkillDef {
  id: string;
  name: string;
  short: string;
  category: string;
  color: string;
  level: number;
  years: string;
  desc: string;
  projects: string[];
  Icon: React.ComponentType<{ size?: number; color?: string }>;
}

export const SKILLS: SkillDef[] = [
  // Row 1
  { id:"react",     name:"React",       short:"React",    category:"Frontend Library",  color:"#61dafb", level:95, years:"3+ Years", Icon:SiReact,      desc:"Building interactive UIs with components and hooks.",       projects:["BayShield","Portfolio","Finderly"] },
  { id:"nextjs",    name:"Next.js",     short:"Next.js",  category:"React Framework",   color:"#ffffff", level:90, years:"2+ Years", Icon:SiNextdotjs,  desc:"Production-ready React applications.",                     projects:["Portfolio"] },
  { id:"flutter",   name:"Flutter",     short:"Flutter",  category:"UI Toolkit",        color:"#54c5f8", level:90, years:"2+ Years", Icon:SiFlutter,    desc:"Cross-platform mobile & web apps.",                        projects:["CogniX","EduLearn"] },
  { id:"typescript",name:"TypeScript",  short:"TS",       category:"Language",          color:"#3178c6", level:93, years:"3+ Years", Icon:SiTypescript, desc:"Typed JavaScript for better DX.",                          projects:["Portfolio","Finderly"] },
  { id:"javascript",name:"JavaScript",  short:"JS",       category:"Language",          color:"#f7df1e", level:93, years:"4+ Years", Icon:SiJavascript, desc:"The language of the web.",                                 projects:["Portfolio","BayShield"] },
  { id:"python",    name:"Python",      short:"Python",   category:"Language",          color:"#3776ab", level:96, years:"4+ Years", Icon:SiPython,     desc:"High-level programming language.",                         projects:["BayShield","SignBridge"] },
  { id:"nodejs",    name:"Node.js",     short:"Node.js",  category:"Runtime",           color:"#339933", level:85, years:"3+ Years", Icon:SiNodedotjs,  desc:"Backend JavaScript runtime.",                             projects:["APIs","Chat Services"] },
  { id:"express",   name:"Express.js",  short:"Express",  category:"Backend Framework", color:"#aaaaaa", level:82, years:"2+ Years", Icon:SiExpress,    desc:"Fast, minimal Node.js framework.",                         projects:["Auth Services"] },
  { id:"nestjs",    name:"NestJS",      short:"NestJS",   category:"Backend Framework", color:"#e0234e", level:78, years:"2+ Years", Icon:SiNestjs,     desc:"Progressive Node.js framework.",                          projects:["Microservices"] },
  { id:"fastapi",   name:"FastAPI",     short:"FastAPI",  category:"Backend Framework", color:"#009688", level:90, years:"2+ Years", Icon:SiFastapi,    desc:"High-performance Python API.",                             projects:["BayShield API","SignBridge"] },
  // Row 2
  { id:"dart",      name:"Dart",        short:"Dart",     category:"Language",          color:"#00b4ab", level:85, years:"2+ Years", Icon:SiDart,       desc:"Language for Flutter & more.",                            projects:["CogniX","EduLearn"] },
  { id:"java",      name:"Java",        short:"Java",     category:"Language",          color:"#ed8b00", level:88, years:"3+ Years", Icon:FaJava,       desc:"Robust, platform-independent.",                           projects:["Android Apps"] },
  { id:"csharp",    name:"C#",          short:"C#",       category:"Language",          color:"#9b4993", level:75, years:"2+ Years", Icon:SiDotnet,     desc:"Modern, object-oriented language.",                       projects:["Unity Projects"] },
  { id:"tailwind",  name:"Tailwind CSS",short:"Tailwind", category:"CSS Framework",     color:"#06b6d4", level:92, years:"3+ Years", Icon:SiTailwindcss,desc:"Utility-first CSS framework.",                            projects:["Portfolio","All UIs"] },
  { id:"graphql",   name:"GraphQL",     short:"GraphQL",  category:"Query Language",    color:"#e10098", level:80, years:"2+ Years", Icon:SiGraphql,    desc:"Flexible API query language.",                            projects:["BayShield API"] },
  { id:"restapi",   name:"REST API",    short:"REST",     category:"API",               color:"#ff6b35", level:95, years:"4+ Years", Icon:TbApi,        desc:"Designing scalable APIs.",                                projects:["All Projects"] },
  { id:"websocket", name:"WebSocket",   short:"WS",       category:"Protocol",          color:"#7c3aed", level:88, years:"2+ Years", Icon:SiWebrtc,     desc:"Real-time, bi-directional comms.",                        projects:["BayShield","Real-time"] },
  { id:"socketio",  name:"Socket.io",   short:"Socket",   category:"Library",           color:"#e0e0e0", level:82, years:"2+ Years", Icon:SiSocketdotio,desc:"Real-time events for Node.js.",                           projects:["Chat Features"] },
  { id:"mongodb",   name:"MongoDB",     short:"MongoDB",  category:"Database",          color:"#47a248", level:80, years:"3+ Years", Icon:SiMongodb,    desc:"NoSQL document database.",                                projects:["APIs","Research"] },
  { id:"postgresql",name:"PostgreSQL",  short:"Postgres", category:"Database",          color:"#336791", level:85, years:"2+ Years", Icon:SiPostgresql, desc:"Powerful open-source SQL DB.",                            projects:["BayShield DB"] },
  // Row 3
  { id:"mysql",     name:"MySQL",       short:"MySQL",    category:"Database",          color:"#4479a1", level:83, years:"3+ Years", Icon:SiMysql,      desc:"Reliable SQL database.",                                  projects:["Web Apps"] },
  { id:"firebase",  name:"Firebase",    short:"Firebase", category:"Backend Service",   color:"#ffca28", level:92, years:"2+ Years", Icon:SiFirebase,   desc:"Backend-as-a-Service platform.",                          projects:["CogniX","EduLearn"] },
  { id:"supabase",  name:"Supabase",    short:"Supabase", category:"Backend Service",   color:"#3ecf8e", level:78, years:"2+ Years", Icon:SiSupabase,   desc:"Open-source Firebase alternative.",                       projects:["Web Projects"] },
  { id:"redis",     name:"Redis",       short:"Redis",    category:"Database",          color:"#dc382d", level:78, years:"2+ Years", Icon:SiRedis,      desc:"In-memory data structure store.",                         projects:["API Caching"] },
  { id:"docker",    name:"Docker",      short:"Docker",   category:"Containerization",  color:"#2496ed", level:82, years:"3+ Years", Icon:SiDocker,     desc:"Containerize applications.",                              projects:["All AI Services"] },
  { id:"kubernetes",name:"Kubernetes",  short:"K8s",      category:"Orchestration",     color:"#326ce5", level:70, years:"2+ Years", Icon:SiKubernetes, desc:"Automate container deployment.",                          projects:["Cloud Projects"] },
  { id:"aws",       name:"AWS",         short:"AWS",      category:"Cloud",             color:"#ff9900", level:72, years:"2+ Years", Icon:FaAws,        desc:"Cloud computing platform.",                               projects:["Production Hosting"] },
  { id:"git",       name:"Git",         short:"Git",      category:"VCS",               color:"#f05032", level:95, years:"4+ Years", Icon:SiGit,        desc:"Version control system.",                                 projects:["All Projects"] },
  { id:"github",    name:"GitHub",      short:"GitHub",   category:"Dev Platform",      color:"#ffffff", level:95, years:"3+ Years", Icon:SiGithub,     desc:"Code hosting & collaboration.",                           projects:["All Projects"] },
  { id:"gitlab",    name:"GitLab",      short:"GitLab",   category:"Dev Platform",      color:"#fc6d26", level:80, years:"2+ Years", Icon:SiGitlab,     desc:"DevOps lifecycle platform.",                              projects:["CI Pipelines"] },
  // Row 4 (6 real)
  { id:"cicd",      name:"CI/CD",       short:"CI/CD",    category:"DevOps",            color:"#00acd7", level:80, years:"2+ Years", Icon:TbRepeat,     desc:"Automate build & deploy.",                                projects:["All Prod Apps"] },
  { id:"jenkins",   name:"Jenkins",     short:"Jenkins",  category:"DevOps",            color:"#d33833", level:70, years:"2+ Years", Icon:SiJenkins,    desc:"Automation server.",                                      projects:["Enterprise CI"] },
  { id:"figma",     name:"Figma",       short:"Figma",    category:"Design Tool",       color:"#f24e1e", level:78, years:"2+ Years", Icon:SiFigma,      desc:"UI/UX design & prototyping.",                             projects:["App Mockups"] },
  { id:"postman",   name:"Postman",     short:"Postman",  category:"API Tool",          color:"#ff6c37", level:88, years:"3+ Years", Icon:SiPostman,    desc:"API testing & development.",                              projects:["All APIs"] },
  { id:"vscode",    name:"VS Code",     short:"VS Code",  category:"Code Editor",       color:"#007acc", level:97, years:"4+ Years", Icon:VscVscode,    desc:"Lightweight powerful editor.",                            projects:["All Projects"] },
  { id:"linux",     name:"Linux",       short:"Linux",    category:"OS",                color:"#fcc624", level:85, years:"4+ Years", Icon:SiLinux,      desc:"Open-source operating system.",                           projects:["Server Work"] },
];

export type SkillOrNull = SkillDef | null;

export const ROWS: SkillOrNull[][] = [
  SKILLS.slice(0, 10),
  SKILLS.slice(10, 20),
  SKILLS.slice(20, 30),
  [...SKILLS.slice(30, 36), null, null, null, null],
];

export const GROUPS = [
  { label: "Frontend", color: "#61dafb", ids: ["react","nextjs","flutter","tailwind"] },
  { label: "Languages", color: "#a78bfa", ids: ["typescript","javascript","python","dart","java","csharp"] },
  { label: "Backend", color: "#f472b6", ids: ["nodejs","express","nestjs","fastapi","graphql","restapi","websocket","socketio"] },
  { label: "Databases", color: "#fb923c", ids: ["mongodb","postgresql","mysql","firebase","supabase","redis"] },
  { label: "Cloud & DevOps", color: "#60a5fa", ids: ["docker","kubernetes","aws","git","github","gitlab","cicd","jenkins"] },
  { label: "Design & Tools", color: "#e879f9", ids: ["figma","postman","vscode","linux"] },
];
