"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center text-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="gradient-text text-9xl font-black mb-4">404</div>
        <h2 className="text-white text-2xl font-bold mb-3">Page Not Found</h2>
        <p className="text-white/40 mb-8">This page doesn't exist yet — but great things are coming.</p>
        <Link href="/">
          <button className="btn-primary">
            <span className="flex items-center gap-2">
              <Home size={16} /> Back to Home
            </span>
          </button>
        </Link>
      </motion.div>
    </div>
  );
}
