# 🕯 Ghost in the Machine

**A haunted shell where an open-weight model running entirely on your machine whispers eerie commentary on every command you type.**

Nothing executes. Type `sudo rm -rf /`, `git status`, `docker ps`, `man ghost` — whatever you like — and the terminal prints plausible (canned) output, then streams a one-or-two-sentence whisper from a local spirit about what you just did. The ghost is Qwen2.5-3B-Instruct, served by [Ollama](https://ollama.com), on your own hardware, with no API keys and no network calls. Built for Halloween / Día de los Muertos: the ghost is fond of marigolds, candles, and ofrendas.

## Quickstart

### Option A — Docker (everything included)

```bash
docker build -t ghost-in-the-machine .
docker run -p 3000:3000 ghost-in-the-machine
# open http://localhost:3000
```

The model is baked into the image. After the build, it runs with the internet off.

### Option B — from source

1. Install [Ollama](https://ollama.com/download) and pull the model:

   ```bash
   ollama pull qwen2.5:3b-instruct
   ollama serve   # if it isn't already running as a service
   ```

2. Install and run the app:

   ```bash
   npm install     # or: bun install
   npm run build
   npm start       # dev loop: npm run dev
   ```

3. Open http://localhost:3000 and start typing.

## Architecture

```
browser terminal (fake shell, canned output)
   │  POST /api/command  { command, history }
   ▼
Next.js API route (App Router, Node runtime)
   │  OpenAI-compatible /api/chat, streamed
   ▼
Ollama on localhost:11434
   │
   ▼
Qwen2.5-3B-Instruct (open weights) → whisper, streamed back token by token
```

- `src/components/Terminal.tsx` — the CRT terminal (scanlines, phosphor glow, streaming whispers, transcript in localStorage).
- `src/lib/commands.ts` — the fake shell: ~25 commands with plausible, lightly haunted output. Pure TS, runs in the browser. **No real command is ever executed.**
- `src/lib/persona.ts` — the ghost's entire personality, one system prompt.
- `src/app/api/command/route.ts` — thin streaming proxy to local Ollama (default model `qwen2.5:3b-instruct`, override with `OLLAMA_MODEL` / `OLLAMA_URL`).
- `scripts/start.sh` — wakes Ollama, ensures the model is pulled, serves the production build on `0.0.0.0:$PORT`.

## Why open innovation matters

This project is a ghost, so it felt right to build it out of things that refuse to die: open weights, open runtime, open source.

- **It runs with the lights and the internet off.** After setup, the entire experience — inference included — happens on your machine. Pull the ethernet cable and the ghost keeps whispering. A closed-API version of this app is definitionally online, and dies with its vendor's uptime.
- **Nothing you type leaves your machine.** That matters here more than usual: a shell transcript is one of the most intimate logs a person has. With a closed API, every command you type (and the story of what you were doing at 2am) would be posted to a third party. Here it round-trips through `localhost` and nowhere else.
- **It costs nothing per token.** The séance is free forever — no meter running while you play. The only cost was the download.
- **You can swap the ghost's brain.** Because Ollama exposes one stable API, changing `OLLAMA_MODEL` to any other open-weight model (Llama, Mistral, Gemma…) swaps the spirit in seconds. Try a bigger model and the ghost gets wittier; try a tiny one and it gets eerier. No closed provider gives you that dial.
- **You can edit the ghost's soul.** The entire personality is one readable file, `src/lib/persona.ts`. Make it gentler, scarier, bilingual, in character as a different dead thing — your edit is live on the next reload. Prompt-as-source-file is only possible when the model is yours.
- **No service has to keep existing for this to keep working.** Everything it depends on is open source and runs locally: [Ollama](https://github.com/ollama/ollama), [Next.js](https://github.com/vercel/next.js), [Qwen2.5](https://github.com/QwenLM/Qwen2.5) (Apache-2.0 weights). In ten years, in a bunker, this repo still runs.

Where the open approach beat a closed one, concretely: a closed-API build would need API keys in an env file, charge per whisper, stream your keystrokes to a vendor, and risk dying when the vendor changes pricing or shuts down this particular model. The open stack needs none of that — and the result is more charming for it: the ghost is *local*. That's the whole joke.

## Swapping models

```bash
OLLAMA_MODEL=llama3.2:3b sh ./scripts/start.sh   # a different spirit
OLLAMA_URL=http://my-other-box:11434 sh ./scripts/start.sh  # a different hauntings
```

## Notes

- The terminal is theater: output is canned, nothing executes, no shell is involved.
- The transcript lives in your browser's localStorage, never on a server.
- Personality and safety rails both live in `src/lib/persona.ts`.
