# Ghost in the Machine — self-contained haunted shell.
# After this image is built, it runs with the internet OFF:
# the open-weight model (Qwen2.5-3B) lives inside the image.
FROM node:22-bookworm-slim

ENV NEXT_TELEMETRY_DISABLED=1 \
    OLLAMA_HOST=0.0.0.0:11434 \
    OLLAMA_MODELS=/models

RUN apt-get update \
  && apt-get install -y --no-install-recommends curl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Open-source local inference runtime (https://github.com/ollama/ollama)
RUN curl -fsSL https://ollama.com/install.sh | sh

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

# Bake the open-weight model into the image (needs network at build time only)
RUN mkdir -p /models \
  && (ollama serve >/tmp/ollama-build.log 2>&1 &) \
  && sleep 5 \
  && ollama pull qwen2.5:3b-instruct \
  && pkill ollama || true

EXPOSE 3000
CMD ["sh", "scripts/start.sh"]
