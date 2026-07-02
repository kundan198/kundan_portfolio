"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CustomCursor from "@/components/CustomCursor";
import AnimatedOrbs from "@/components/AnimatedOrbs";
import TechParticles from "@/components/TechParticles";
// import KaiAssistant from "@/components/KaiAssistant";
import SplashScreen from "@/components/SplashScreen";

// The portfolio's chrome (nav, footer, cursor, splash, assistant) renders on every
// page EXCEPT the immersive /game route, which manages its own full-screen UI.
export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const inGame = pathname?.startsWith("/game");

  if (inGame) return <>{children}</>;

  return (
    <>
      <SplashScreen />
      <CustomCursor />
      <TechParticles />
      <AnimatedOrbs />
      <Navbar />
      <main className="relative z-10">{children}</main>
      <Footer />
      {/* Kai AI assistant is temporarily disabled. */}
      {/* <KaiAssistant /> */}

      {/* Mode switch into the 3D Kundanverse */}
      <Link
        href="/game"
        aria-label="Enter 3D game mode"
        className="group fixed bottom-5 left-5 z-[60] grid h-16 w-16 place-items-center rounded-full border border-cyan-300/40 bg-slate-950/70 text-cyan-100 backdrop-blur-xl transition hover:scale-105 sm:h-auto sm:w-auto sm:grid-cols-[2.75rem_1fr] sm:gap-3 sm:rounded-full sm:px-3 sm:py-2.5"
        style={{ boxShadow: "0 0 30px rgba(34,211,238,0.28), inset 0 0 22px rgba(124,58,237,0.18)" }}
      >
        <span className="relative grid h-11 w-11 place-items-center rounded-full border border-cyan-200/35 bg-cyan-400/10">
          <span className="absolute inset-1 rounded-full border border-violet-300/35 opacity-70 transition group-hover:rotate-45" />
          <span className="text-[15px] font-black tracking-tight">3D</span>
        </span>
        <span className="hidden text-left sm:block">
          <span className="block text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-300/70">Switch</span>
          <span className="block text-xs font-black uppercase tracking-[0.18em] text-white">Game Mode</span>
        </span>
      </Link>
    </>
  );
}
