# Build context: repo root (run `docker build -f backend/Dockerfile .`)

# --- Build stage ---
FROM public.ecr.aws/docker/library/node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN corepack enable
WORKDIR /repo

# Workspace manifests + lockfile
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY backend/package.json ./backend/
COPY frontend/package.json ./frontend/

# Install backend deps (prod+dev) via workspace
RUN pnpm install --frozen-lockfile --filter ./backend...

# Backend sources
COPY backend/tsconfig*.json ./backend/
COPY backend/nest-cli.json ./backend/
COPY backend/src ./backend/src
COPY backend/drizzle.config.ts ./backend/
COPY backend/drizzle ./backend/drizzle

WORKDIR /repo/backend
RUN pnpm run build

# Self-contained deploy artifact (flat node_modules, no symlinks)
WORKDIR /repo
RUN pnpm --filter=./backend deploy /out

# --- Runtime stage ---
FROM public.ecr.aws/docker/library/node:20-alpine AS runner
RUN addgroup -S nodejs && adduser -S nodeuser -G nodejs
WORKDIR /app

COPY --from=builder --chown=nodeuser:nodejs /out ./

ENV NODE_ENV=production
ENV PORT=3030
USER nodeuser
EXPOSE 3030

CMD ["node", "dist/main.js"]
