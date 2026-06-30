"use client";
import { motion } from "framer-motion";

interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}

export default function SectionHeader({ eyebrow, title, subtitle, center = true }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className={`mb-20 ${center ? "text-center" : ""}`}
    >
      {eyebrow && (
        <span className="tag mb-6 inline-block">{eyebrow}</span>
      )}
      <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
        {title.split(" ").map((word, i) =>
          i === title.split(" ").length - 1 ? (
            <span key={i} className="gradient-text"> {word}</span>
          ) : (
            <span key={i}>{i === 0 ? word : " " + word}</span>
          )
        )}
      </h2>
      {subtitle && (
        <p className="text-white/50 text-xl max-w-2xl mx-auto leading-relaxed">{subtitle}</p>
      )}
    </motion.div>
  );
}
