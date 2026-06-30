"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const links = [
  { href: "/",           label: "Home"       },
  { href: "/about",      label: "About"      },
  { href: "/skills",     label: "Skills"     },
  { href: "/projects",   label: "Projects"   },
  { href: "/experience", label: "Experience" },
  { href: "/research",   label: "Research"   },
  { href: "/social",     label: "Social"     },
  { href: "/contact",    label: "Contact"    },
];

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* ── Fixed top bar ──────────────────────────────────────────── */}
      <nav
        data-kai-ignore="true"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "glass border-b border-white/5 py-3"
            : "bg-[#05060f]/80 backdrop-blur-xl py-5"
        }`}
      >
        <div className="container-custom flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:shadow-violet-500/40 transition-shadow">
              K
            </div>
            <span className="font-bold text-white/90 text-sm tracking-wide">
              Kundan<span className="text-violet-400">.</span>
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`nav-link ${pathname === l.href ? "active" : ""}`}
              >
                {l.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTAs + mobile hamburger */}
          <div className="flex items-center gap-3">
            <a
              href="/Kundan_Srinivas_Resume.pdf"
              download="Kundan_Srinivas_Resume.pdf"
              className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border border-white/10 text-white/70 hover:border-violet-500/50 hover:text-white hover:bg-violet-500/10 transition-all"
            >
              <Download size={13} /> Resume
            </a>
            <a
              href="mailto:kundansrinivas377@gmail.com"
              className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-violet-600 hover:bg-violet-500 text-white transition-all shadow-lg shadow-violet-500/25"
            >
              Hire Me
            </a>

            {/* Hamburger — z-[60] stays above the overlay */}
            <button
              data-kai-ignore="true"
              aria-label={open ? "Close menu" : "Open menu"}
              className="md:hidden text-white/70 hover:text-white p-2 rounded-lg border border-white/10 bg-white/5 relative z-[60] focus:outline-none"
              onClick={() => setOpen((o) => !o)}
            >
              <motion.div
                animate={{ rotate: open ? 90 : 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {open ? <X size={20} /> : <Menu size={20} />}
              </motion.div>
            </button>
          </div>
        </div>
      </nav>

      {/* ── Full-screen mobile overlay ──────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            data-kai-ignore="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-[55] md:hidden flex flex-col"
            style={{ background: "rgba(5,6,15,0.97)", backdropFilter: "blur(24px)" }}
          >
            {/* Nav links — vertically centred */}
            <div className="flex-1 flex flex-col items-center justify-center gap-1 px-8">
              {links.map((l, i) => (
                <motion.div
                  key={l.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  transition={{ delay: i * 0.04, type: "spring", stiffness: 280, damping: 26 }}
                  className="w-full"
                >
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={`block text-center text-2xl font-bold py-3 px-6 rounded-2xl transition-all ${
                      pathname === l.href
                        ? "text-violet-400 bg-violet-500/10 border border-violet-500/20"
                        : "text-white/65 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {l.label}
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Bottom CTA strip */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.28 }}
              className="flex flex-col gap-3 px-8 pb-14 pt-6 border-t border-white/8"
            >
              <a
                href="/Kundan_Srinivas_Resume.pdf"
                download="Kundan_Srinivas_Resume.pdf"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-sm font-semibold border border-white/15 text-white/80 bg-white/5 hover:bg-white/10 transition-colors"
              >
                <Download size={15} /> Download Resume
              </a>
              <a
                href="mailto:kundansrinivas377@gmail.com"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-sm font-semibold bg-violet-600 text-white hover:bg-violet-500 transition-colors shadow-xl shadow-violet-500/25"
              >
                Hire Me
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
