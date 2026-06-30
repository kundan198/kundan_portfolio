import Link from "next/link";
import { Github, Linkedin, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-10">
      <div className="container-custom flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs">
            K
          </div>
          <span className="text-white/40 text-sm">
            © 2026 Kundan Srinivas. Built with Next.js & passion.
          </span>
        </div>
        <div className="flex items-center gap-5">
          <a
            href="https://github.com/kundan198"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/40 hover:text-violet-400 transition-colors"
          >
            <Github size={18} />
          </a>
          <a
            href="https://www.linkedin.com/in/kundan-srinivas-sakkuru-513532200/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/40 hover:text-violet-400 transition-colors"
          >
            <Linkedin size={18} />
          </a>
          <a
            href="mailto:kundansrinivas377@gmail.com"
            className="text-white/40 hover:text-violet-400 transition-colors"
          >
            <Mail size={18} />
          </a>
        </div>
        <nav className="flex gap-5 text-xs text-white/30">
          {["About", "Projects", "Research", "Contact"].map((p) => (
            <Link
              key={p}
              href={`/${p.toLowerCase()}`}
              className="hover:text-white/60 transition-colors"
            >
              {p}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
