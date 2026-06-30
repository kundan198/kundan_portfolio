"use client";
import { motion } from "framer-motion";
import { Brain, Cpu, Eye, MessageSquare, BarChart3, BookOpen, ExternalLink } from "lucide-react";
import SectionHeader from "@/components/SectionHeader";
import { triggerKai, resetKai } from "@/utils/kaiEvents";

const researchAreas = [
  {
    icon: <Brain size={22} />,
    title: "Generative AI & LLMs",
    color: "violet",
    desc: "Evaluating knowledge-distilled LLMs in few-shot and zero-shot settings. Prompt engineering, in-context learning, and model selection guidance for production environments.",
    tags: ["LLM Evaluation", "Prompt Engineering", "Few-shot Learning", "Knowledge Distillation"],
  },
  {
    icon: <Cpu size={22} />,
    title: "Agentic AI Systems",
    color: "blue",
    desc: "Designing multi-agent architectures with LangChain for real-world deployment. RAG pipelines grounded in verified data to eliminate hallucination in high-stakes systems.",
    tags: ["LangChain", "Multi-Agent", "RAG", "ChromaDB", "Vector Search"],
  },
  {
    icon: <Eye size={22} />,
    title: "Computer Vision",
    color: "cyan",
    desc: "Deep learning CNNs for medical image classification. MediaPipe landmark tracking for real-time gesture recognition. Published CNN achieving 18% minority-class recall improvement.",
    tags: ["PyTorch", "TensorFlow", "MediaPipe", "OpenCV", "CNN", "ResNet50"],
  },
  {
    icon: <MessageSquare size={22} />,
    title: "Natural Language Processing",
    color: "pink",
    desc: "Real-time grammar restructuring for ASL/English translation. Text classification pipelines for NLP. NLTK-based NLP in production systems achieving sub-second latency.",
    tags: ["NLTK", "NLP", "Text Classification", "Grammar Restructuring"],
  },
  {
    icon: <BarChart3 size={22} />,
    title: "Mobile & Systems Research",
    color: "green",
    desc: "Sub-millisecond precision event logging via Dart isolates. Scalable mobile data collection systems for neuroscience research. Offline-first architecture with zero data loss.",
    tags: ["Flutter", "Dart Isolates", "Firebase", "Mobile Systems"],
  },
];

const publications = [
  {
    title: "Skin Cancer Prediction using Convolutional Neural Network",
    venue: "Scopus-Indexed Journal",
    year: "2024",
    type: "Journal",
    desc: "7-class skin lesion classification on HAM10000. Solved 67% class imbalance; 18% improvement in minority-class recall. Benchmarked against ResNet50 transfer learning.",
    tags: ["PyTorch", "CNN", "Medical AI", "Class Imbalance"],
    highlight: true,
  },
  {
    title: "Evaluating Distilled Models in In-Context Learning",
    venue: "ML Research",
    year: "2025",
    type: "Research",
    desc: "Rigorous evaluation of knowledge-distilled generative AI models under few-shot and zero-shot in-context learning across standard NLP benchmarks.",
    tags: ["LLM", "In-Context Learning", "Distillation", "NLP Benchmarks"],
    highlight: false,
  },
  {
    title: "6+ Additional Publications",
    venue: "ML, Computer Vision, Mobile Systems",
    year: "2022–2025",
    type: "Multiple Venues",
    desc: "Research spanning machine learning, computer vision, and mobile systems. Topics include deep learning architectures, mobile data collection, and NLP applications.",
    tags: ["Machine Learning", "Computer Vision", "Mobile Systems"],
    highlight: false,
  },
];

const colorMap: Record<string, string> = {
  violet: "bg-violet-500/10 border-violet-500/20 text-violet-400",
  blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  cyan: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
  pink: "bg-pink-500/10 border-pink-500/20 text-pink-400",
  green: "bg-green-500/10 border-green-500/20 text-green-400",
};

export default function Research() {
  return (
    <div className="page-wrapper pt-24">
      <div className="container-custom section">
        <SectionHeader
          eyebrow="Academic & Applied Research"
          title="Research & AI"
          subtitle="8 published papers and production AI systems at the intersection of generative AI, computer vision, and NLP."
        />

        {/* Stats banner */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20"
        >
          {[
            { value: "8", label: "Papers Published", color: "text-violet-400" },
            { value: "1", label: "Scopus Indexed", color: "text-yellow-400" },
            { value: "5", label: "Research Domains", color: "text-cyan-400" },
            { value: "2", label: "Hackathon AI Systems", color: "text-green-400" },
          ].map((s) => (
            <div
              key={s.label}
              className="glass rounded-2xl p-5 text-center border border-white/6"
            >
              <div className={`text-5xl font-black mb-2 ${s.color}`}>{s.value}</div>
              <div className="text-white/40 text-sm font-medium">{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Research areas */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-white mb-8 text-center">
            Research <span className="gradient-text">Areas</span>
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7">
            {researchAreas.map((area, i) => (
              <motion.div
                key={area.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -6 }}
                onMouseEnter={() => triggerKai({ type: "research" })}
                onMouseLeave={() => resetKai()}
                className={`glass glass-hover border-animated rounded-2xl p-9 border ${colorMap[area.color]}`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 border ${colorMap[area.color]}`}>
                  {area.icon}
                </div>
                <h4 className={`font-bold text-lg mb-3 ${colorMap[area.color].split(" ").pop()}`}>
                  {area.title}
                </h4>
                <p className="text-white/55 leading-relaxed mb-6">{area.desc}</p>
                <div className="flex flex-wrap gap-2">
                  {area.tags.map((t) => (
                    <span key={t} className="tag text-xs py-0.5">{t}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Publications */}
        <div>
          <h3 className="text-2xl font-bold text-white mb-8 text-center">
            <span className="gradient-text">Publications</span>
          </h3>
          <div className="space-y-7 max-w-3xl mx-auto">
            {publications.map((pub, i) => (
              <motion.div
                key={pub.title}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                onMouseEnter={() => triggerKai({ type: "research" })}
                onMouseLeave={() => resetKai()}
                className={`glass glass-hover rounded-2xl p-10 border ${pub.highlight ? "border-yellow-500/20 bg-yellow-500/3" : "border-white/6"}`}
              >
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="flex items-start gap-3 flex-1">
                    <BookOpen
                      size={18}
                      className={pub.highlight ? "text-yellow-400 flex-shrink-0 mt-0.5" : "text-violet-400 flex-shrink-0 mt-0.5"}
                    />
                    <div>
                      <h4 className="text-white font-bold text-base leading-snug mb-1">{pub.title}</h4>
                      <p className="text-white/40 text-xs">
                        {pub.venue} · {pub.year}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ${
                      pub.highlight
                        ? "bg-yellow-500/15 text-yellow-300 border-yellow-500/25"
                        : "bg-violet-500/10 text-violet-300 border-violet-500/20"
                    }`}
                  >
                    {pub.type}
                  </span>
                </div>
                <p className="text-white/60 leading-relaxed mb-6">{pub.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {pub.tags.map((t) => (
                    <span key={t} className="tag text-xs py-0.5">{t}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
