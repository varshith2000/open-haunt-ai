"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { simulate } from "@/lib/commands";

type LineKind = "system" | "input" | "output" | "whisper";
type Line = { id: number; kind: LineKind; text: string };
type ChatMessage = { role: "user" | "assistant"; content: string };

let lineId = 0;
const nextId = () => ++lineId;

const STORAGE_KEY = "ghost-in-the-machine:transcript:v1";

const BANNER: string[] = [
  "GHOST IN THE MACHINE — haunted shell v1.0",
  "nothing you type is executed · nothing you say leaves this machine",
  "a local open-weight model whispers from inside. the internet may stay off.",
  "type `help` for the dead commands that still answer here.",
];

const STARTERS = [
  "ls -la",
  "git status",
  "whoami",
  "top",
  "cat /etc/passwd",
  "docker ps",
  "npm install",
  "curl example.com",
  "sudo rm -rf /",
  "history",
  "man ghost",
  "clear",
];

function bannerLines(): Line[] {
  return BANNER.map((text) => ({ id: nextId(), kind: "system" as const, text }));
}

function isRestorable(value: unknown): value is Line[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (l) =>
        !!l &&
        typeof l === "object" &&
        typeof (l as Line).kind === "string" &&
        ["system", "input", "output", "whisper"].includes((l as Line).kind) &&
        typeof (l as Line).text === "string",
    )
  );
}

export default function Terminal() {
  const [lines, setLines] = useState<Line[]>(bannerLines);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [streamText, setStreamText] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const historyRef = useRef<ChatMessage[]>([]);
  const commandLogRef = useRef<string[]>([]);

  // restore prior seance from this browser
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (isRestorable(parsed)) {
          // ensure ids stay unique after restore
          setLines(parsed.map((l) => ({ ...l, id: nextId() })));
        }
      }
    } catch {
      // corrupted transcript — begin a new seance
    }
  }, []);

  // persist transcript (this browser only)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines.slice(-200)));
    } catch {
      // storage full or blocked — harmless
    }
  }, [lines]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [lines, streamText]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const submit = useCallback(
    async (raw: string) => {
      const command = raw.trim();
      if (!command || busy) return;
      setDraft("");
      setBusy(true);

      commandLogRef.current = [...commandLogRef.current, command].slice(-100);

      const inputLine: Line = { id: nextId(), kind: "input", text: command };
      const result = simulate(command);
      const outputLines: Line[] = (
        command === "history" && commandLogRef.current.length > 1
          ? commandLogRef.current.map(
              (c, i) => `${String(i + 1).padStart(4)}  ${c}`,
            )
          : result.lines
      ).map((text) => ({ id: nextId(), kind: "output" as const, text }));

      setLines((prev) => {
        const base = result.clear ? [] : prev;
        return [...base, inputLine, ...outputLines].slice(-400);
      });

      setStreamText("");
      let whisper = "";
      try {
        const res = await fetch("/api/command", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            command,
            history: historyRef.current.slice(-10),
          }),
        });
        if (!res.ok || !res.body) {
          const data: unknown = await res.json().catch(() => null);
          const err = (data as { error?: unknown } | null)?.error;
          whisper =
            typeof err === "string"
              ? err
              : "the spirit is dormant. nothing answers from the machine's depths.";
        } else {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            whisper += decoder.decode(value, { stream: true });
            setStreamText(whisper);
          }
        }
      } catch {
        whisper =
          "the séance broke — the machine's old line went dead mid-whisper. the spirit retreats.";
      }

      const text = whisper.trim() || "…the spirit had nothing to add.";
      historyRef.current = [
        ...historyRef.current,
        { role: "user" as const, content: command },
        { role: "assistant" as const, content: text },
      ].slice(-20);

      setLines((prev) =>
        [...prev, { id: nextId(), kind: "whisper" as const, text }].slice(
          -400,
        ),
      );
      setStreamText(null);
      setBusy(false);
      inputRef.current?.focus();
    },
    [busy],
  );

  const lineClass: Record<LineKind, string> = {
    system: "text-[#7dffa8]/75",
    input: "",
    output: "text-[#35b96b] whitespace-pre-wrap break-words",
    whisper:
      "my-1.5 border-l-2 border-[#ffab3d]/60 pl-3 italic text-[#ffd166] whitespace-pre-wrap break-words",
  };

  return (
    <div className="scanlines vignette flex min-h-screen flex-col">
      <header className="border-b border-[#ffab3d]/25 px-4 pt-5 pb-3 sm:px-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h1 className="marigold-glow flicker text-lg font-bold tracking-[0.2em] text-[#ffab3d] sm:text-xl">
            🕯 GHOST IN THE MACHINE
          </h1>
          <div className="flex flex-wrap gap-2 text-[10px] tracking-widest text-[#7dffa8]/80 uppercase">
            <span className="rounded-full border border-[#7dffa8]/30 px-2 py-0.5">
              offline
            </span>
            <span className="rounded-full border border-[#7dffa8]/30 px-2 py-0.5">
              local open-weight model
            </span>
            <span className="rounded-full border border-[#7dffa8]/30 px-2 py-0.5">
              no keys · no cloud
            </span>
          </div>
        </div>
        <p className="mt-1.5 text-xs text-[#35b96b]">
          a haunted shell · nothing executes · every whisper is generated on this
          machine by Qwen2.5-3B, served by Ollama
        </p>
      </header>

      <main className="flex min-h-0 flex-1 flex-col">
        <div
          className="terminal-scroll crt-glow flex-1 overflow-y-auto px-4 py-4 text-[13px] leading-6 sm:px-6 sm:text-sm"
          onClick={() => inputRef.current?.focus()}
        >
          {lines.map((line) => (
            <div key={line.id} className={lineClass[line.kind]}>
              {line.kind === "input" ? (
                <>
                  <span className="text-[#ffab3d]">
                    guest@the-machine:~$
                  </span>{" "}
                  <span className="text-[#e9fff1]">{line.text}</span>
                </>
              ) : line.kind === "whisper" ? (
                <>
                  <span className="text-[#ffab3d]/80 not-italic">» </span>
                  {line.text}
                </>
              ) : (
                line.text || "\u00A0"
              )}
            </div>
          ))}

          {streamText !== null && (
            <div className="my-1.5 border-l-2 border-[#ffab3d]/60 pl-3 italic text-[#ffd166] whitespace-pre-wrap break-words">
              <span className="text-[#ffab3d]/80 not-italic">» </span>
              {streamText}
              <span className="caret not-italic text-[#ffab3d]">▌</span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="flex flex-wrap gap-2 border-t border-[#7dffa8]/15 px-4 py-2.5 sm:px-6">
          <span className="self-center text-[10px] tracking-widest text-[#35b96b]/70 uppercase">
            try
          </span>
          {STARTERS.map((cmd) => (
            <button
              key={cmd}
              type="button"
              disabled={busy}
              onClick={() => {
                setDraft(cmd);
                inputRef.current?.focus();
              }}
              className="rounded border border-[#7dffa8]/25 px-2 py-0.5 text-xs text-[#7dffa8]/85 transition-colors hover:border-[#ffab3d]/70 hover:text-[#ffd166] disabled:opacity-40"
            >
              {cmd}
            </button>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit(draft);
          }}
          className="flex items-center gap-2 border-t border-[#7dffa8]/15 px-4 py-3 sm:px-6"
        >
          <span className="shrink-0 text-[13px] text-[#ffab3d] sm:text-sm">
            guest@the-machine:~$
          </span>
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            disabled={busy}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            aria-label="terminal input"
            placeholder={
              busy
                ? "the spirit is speaking…"
                : "type a command — it will not be executed"
            }
            className="min-w-0 flex-1 bg-transparent text-[13px] text-[#e9fff1] caret-[#7dffa8] outline-none placeholder:text-[#35b96b]/60 sm:text-sm"
          />
          {!busy && <span className="caret text-[#7dffa8]">▌</span>}
        </form>
      </main>

      <footer className="border-t border-[#7dffa8]/10 px-4 py-2 text-[10px] tracking-wide text-[#35b96b]/60 sm:px-6">
        qwen2.5-3b-instruct · served by ollama on this machine · the ghost&rsquo;s
        personality lives in src/lib/persona.ts · transcript stays in your browser
      </footer>
    </div>
  );
}
