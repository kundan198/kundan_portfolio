import type { Metadata, Viewport } from "next";
import "./globals.css";
import SiteChrome from "@/components/SiteChrome";

export const metadata: Metadata = {
  title: "Kundan Srinivas — Full Stack & AI Engineer",
  description:
    "Portfolio of Kundan Srinivas Sakkuru — Full Stack Engineer, AI/ML Specialist, Published Researcher, 2x Hackathon Award Winner. MS Computer Science @ USF.",
  keywords: ["Full Stack Engineer", "AI Engineer", "Machine Learning", "React", "Flutter", "Python", "Portfolio"],
};

// viewport-fit=cover exposes the safe-area insets the game HUD uses on notched phones
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#03040a",
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
