# Build context: repo root (run `docker build -f frontend/Dockerfile .`)

# ========= build =========
FROM node:20-alpine AS build
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /repo

# Workspace manifests + lockfile
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

RUN pnpm install --frozen-lockfile --filter ./frontend...

# Frontend sources
COPY frontend ./frontend

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

WORKDIR /repo/frontend
RUN pnpm run build

# ========= runtime =========
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8000
RUN apk add --no-cache wget

# Next standalone with outputFileTracingRoot mirrors the workspace layout under /standalone
COPY --from=build /repo/frontend/.next/standalone ./
COPY --from=build /repo/frontend/.next/static ./frontend/.next/static
COPY --from=build /repo/frontend/public ./frontend/public

EXPOSE 8000
CMD ["node", "frontend/server.js"]
