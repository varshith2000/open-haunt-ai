import fs from "node:fs";
import os from "node:os";
import { NextRequest, NextResponse } from "next/server";
import { SYSTEM_PERSONA } from "@/lib/persona";

export const runtime = "nodejs";

const MAX_COMMAND = 400;
const MAX_CONTENT = 600;
const MAX_HISTORY = 10;

// Containers often advertise many cores while a cgroup quota grants far fewer;
// llama.cpp oversubscribes and thrashes when it trusts nproc. Cap threads at 8 —
// generation of a 3B model stops scaling past that anyway.
function inferenceThreads(): number {
  const cap = (n: number) => Math.max(1, Math.min(8, Math.floor(n)));
  try {
    const [quota, period] = fs
      .readFileSync("/sys/fs/cgroup/cpu.max", "utf8")
      .trim()
      .split(/\s+/);
    if (quota !== "max") return cap(Number(quota) / Number(period));
  } catch {
    /* not cgroup v2 — fall through */
  }
  const env = Number(process.env.OLLAMA_NUM_THREAD ?? 0);
  if (env > 0) return cap(env);
  return cap(os.availableParallelism?.() ?? 2);
}

type ChatMessage = { role: string; content: string };

export async function POST(request: NextRequest) {
  let command = "";
  let history: ChatMessage[] = [];

  try {
    const body = await request.json();
    if (typeof body?.command === "string") {
      command = body.command.trim().slice(0, MAX_COMMAND);
    }
    if (Array.isArray(body?.history)) {
      history = body.history
        .filter(
          (m: unknown): m is ChatMessage =>
            !!m &&
            typeof m === "object" &&
            typeof (m as ChatMessage).role === "string" &&
            ["user", "assistant"].includes((m as ChatMessage).role) &&
            typeof (m as ChatMessage).content === "string",
        )
        .slice(-MAX_HISTORY)
        .map((m: ChatMessage) => ({
          role: m.role,
          content: m.content.slice(0, MAX_CONTENT),
        }));
    }
  } catch {
    return NextResponse.json(
      { error: "the séance was malformed. (bad request body)" },
      { status: 400 },
    );
  }

  if (!command) {
    return NextResponse.json(
      { error: "you typed nothing. the dead answer to names, not silences." },
      { status: 400 },
    );
  }

  const ollamaUrl = (process.env.OLLAMA_URL ?? "http://localhost:11434").replace(
    /\/+$/,
    "",
  );
  const model = process.env.OLLAMA_MODEL ?? "qwen2.5:3b-instruct";

  const messages = [
    { role: "system", content: SYSTEM_PERSONA },
    ...history,
    {
      role: "user",
      content: `The mortal has just typed:\n$ ${command}\n\nWhisper your eerie commentary on that specific command: 1–2 short sentences.`,
    },
  ];

  let upstream: Response;
  try {
    upstream = await fetch(`${ollamaUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages,
        stream: true,
        options: {
      num_ctx: 4096,
      num_predict: 120,
      temperature: 0.9,
      num_thread: inferenceThreads(),
    },
      }),
      signal: AbortSignal.timeout(90_000),
    });
  } catch {
    return NextResponse.json(
      {
        error:
          "the spirit is dormant. nothing answers on this machine's old line (Ollama unreachable). wake it with `ollama serve`, or run the docker image.",
      },
      { status: 503 },
    );
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    if (upstream.status === 404) {
      return NextResponse.json(
        {
          error: `the spirit knows that name but cannot wear it — model "${model}" has not been summoned here. run: ollama pull ${model}`,
        },
        { status: 503 },
      );
    }
    return NextResponse.json(
      {
        error: `the seance failed (Ollama replied ${upstream.status}).${
          detail ? ` ${detail.slice(0, 180)}` : ""
        }`,
      },
      { status: 502 },
    );
  }

  const decoder = new TextDecoder();
  let carry = "";
  const transformer = new TransformStream<Uint8Array, string>({
    transform(chunk, controller) {
      carry += decoder.decode(chunk, { stream: true });
      const lines = carry.split("\n");
      carry = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const obj = JSON.parse(line);
          if (typeof obj?.message?.content === "string") {
            controller.enqueue(obj.message.content);
          }
          if (typeof obj?.error === "string") {
            controller.enqueue(`[the spirit faltered: ${obj.error}]`);
          }
        } catch {
          // partial line — wait for the rest
        }
      }
    },
  });

  return new Response(upstream.body.pipeThrough(transformer), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
