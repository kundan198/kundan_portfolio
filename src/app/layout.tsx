import type { Metadata } from "next";
import "./globals.css";
import SiteChrome from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "Kundan Srinivas — Full Stack & AI Engineer",
  description:
    "Portfolio of Kundan Srinivas Sakkuru — Full Stack Engineer, AI/ML Specialist, Published Researcher, 2x Hackathon Award Winner. MS Computer Science @ USF.",
  keywords: ["Full Stack Engineer", "AI Engineer", "Machine Learning", "React", "Flutter", "Python", "Portfolio"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
