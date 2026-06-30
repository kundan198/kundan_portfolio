import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const OLLAMA_HOST = process.env.OLLAMA_HOST ?? "http://127.0.0.1:11434";
const DEFAULT_MODEL = process.env.OLLAMA_MODEL ?? "llama3.1";
const SYSTEM_PROMPT = `You are Kai, Kundan Srinivas Sakkuru's portfolio guide.
Keep replies short, natural, and helpful. Sound human and confident.
Kundan is an MS CS student at USF graduating May 2026, a Full Stack and AI Engineer in Tampa, FL.
Key projects: BayShield, SignBridge, CogniX, Finderly, Skin Cancer CNN, and LLM Distillation Eval.
Strengths: React, TypeScript, Flutter, Python, FastAPI, LangChain, RAG, PyTorch, Firebase, GCP, and production delivery.
Mention contact and hiring fit clearly when asked, but do not invent facts.`;

type ChatRole = "user" | "assistant";
type ChatMessage = {
  role: ChatRole;
  content: string;
};

async function getAvailableModel(signal?: AbortSignal) {
  if (process.env.OLLAMA_MODEL) return process.env.OLLAMA_MODEL;

  const tagsRes = await fetch(`${OLLAMA_HOST}/api/tags`, { signal });
  if (!tagsRes.ok) return DEFAULT_MODEL;

  const data: { models?: { name?: string }[] } = await tagsRes.json();
  return data.models?.find((model) => model.name)?.name ?? DEFAULT_MODEL;
}

function sanitizeMessages(messages: unknown): ChatMessage[] {
  if (!Array.isArray(messages)) return [];

  return messages
    .filter((message): message is ChatMessage => {
      if (!message || typeof message !== "object") return false;
      const candidate = message as Partial<ChatMessage>;
      return (
        (candidate.role === "user" || candidate.role === "assistant") &&
        typeof candidate.content === "string" &&
        candidate.content.trim().length > 0
      );
    })
    .slice(-8)
    .map((message) => ({
      role: message.role,
      content: message.content.trim().slice(0, 1200),
    }));
}

function offlineReply(message: string) {
  const q = message.toLowerCase();

  if (q.includes("project")) {
    return "Start with BayShield and SignBridge. BayShield shows multi-agent disaster AI, and SignBridge shows real-time accessibility AI with production-minded architecture.";
  }
  if (q.includes("skill") || q.includes("stack")) {
    return "Core strengths: React, Flutter, FastAPI, Python, LangChain, RAG, and cloud-backed production delivery.";
  }
  if (q.includes("hire") || q.includes("role") || q.includes("why")) {
    return "Kundan combines strong full-stack delivery with applied AI depth, plus proven hackathon wins and published research. He is a strong fit for SWE and AI engineering roles.";
  }
  if (q.includes("research") || q.includes("paper")) {
    return "There are 8 research papers across AI/ML topics, including work with measurable model improvements and practical evaluation focus.";
  }

  return "I can still guide you without Ollama. Ask me about projects, skills, research, or hiring fit.";
}

export async function GET() {
  try {
    const signal = AbortSignal.timeout(3000);
    const tagsRes = await fetch(`${OLLAMA_HOST}/api/tags`, { signal });

    if (!tagsRes.ok) {
      return NextResponse.json({ connected: false, model: null, models: [] });
    }

    const data: { models?: { name?: string }[] } = await tagsRes.json();
    const models = (data.models ?? [])
      .map((model) => model.name)
      .filter((name): name is string => Boolean(name));

    return NextResponse.json({
      connected: models.length > 0,
      model: process.env.OLLAMA_MODEL ?? models[0] ?? null,
      models,
    });
  } catch {
    return NextResponse.json({ connected: false, model: null, models: [] });
  }
}

export async function POST(req: NextRequest) {
  let userMessage = "";

  try {
    const body = await req.json();
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    const history = sanitizeMessages(body?.messages);
    userMessage = message || [...history].reverse().find((item) => item.role === "user")?.content || "";

    if (!userMessage) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    const signal = AbortSignal.timeout(60000);
    const model = typeof body?.model === "string" && body.model.trim()
      ? body.model.trim()
      : await getAvailableModel(signal);

    const conversation = history.length
      ? history
      : [{ role: "user" as const, content: userMessage }];

    const ollamaRes = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...conversation,
        ],
        options: {
          temperature: 0.55,
          num_predict: 220,
        },
      }),
    });

    if (!ollamaRes.ok) {
      return NextResponse.json({
        reply: offlineReply(userMessage),
        offline: true,
        model,
        note: "Ollama is unavailable right now.",
      });
    }

    const data = await ollamaRes.json();
    const reply = data?.message?.content ?? "I am here. Ask me about projects, skills, or hiring details.";

    return NextResponse.json({ reply, offline: false, model });
  } catch {
    return NextResponse.json({
      reply: offlineReply(userMessage),
      offline: true,
      note: "Unable to reach Ollama. Install and run Ollama to enable full LLM responses.",
    });
  }
}
