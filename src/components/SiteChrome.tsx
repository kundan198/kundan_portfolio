"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CustomCursor from "@/components/CustomCursor";
import AnimatedOrbs from "@/components/AnimatedOrbs";
import TechParticles from "@/components/TechParticles";
import KaiAssistant from "@/components/KaiAssistant";
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
      <KaiAssistant />

      {/* Launcher into the 3D game mode */}
      <Link
        href="/game"
        aria-label="Enter 3D game mode"
        className="fixed bottom-5 left-5 z-[60] flex items-center gap-2 rounded-full border border-violet-400/40 bg-violet-500/15 px-4 py-2 text-xs font-semibold tracking-widest text-violet-100 backdrop-blur transition hover:scale-105 hover:bg-violet-500/30"
        style={{ boxShadow: "0 0 24px rgba(124,58,237,0.35)" }}
      >
        🎮 GAME MODE
      </Link>
    </>
  );
}
