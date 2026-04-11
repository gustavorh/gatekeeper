# --- Build stage ---
  FROM public.ecr.aws/docker/library/node:20-alpine AS builder
  RUN apk add --no-cache libc6-compat
  WORKDIR /app
      
  # Instala deps (prod+dev) para poder compilar y correr CLI de drizzle si hace falta
  COPY package*.json ./
  RUN npm ci
      
  # Copia TS/Config y compila
  COPY tsconfig*.json ./
  COPY src ./src
  # Si tu app necesita archivos adicionales (p. ej. esquema drizzle), cópialos:
  COPY drizzle.config.ts ./
  COPY drizzle ./drizzle
      
  RUN npm run build
      
  # --- Runtime stage ---
  FROM public.ecr.aws/docker/library/node:20-alpine AS runner
  # Usuario no root
  RUN addgroup -S nodejs && adduser -S nodeuser -G nodejs
  WORKDIR /app
      
  # Copiamos solo lo necesario
  COPY --from=builder /app/node_modules ./node_modules
  COPY --from=builder /app/dist ./dist
  # Si tu app lee archivos estáticos (p. ej. drizzle/_meta) cópialos también:
  COPY --from=builder /app/drizzle ./drizzle
  COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
      
  ENV NODE_ENV=production
  ENV PORT=3030
  USER nodeuser
  EXPOSE 3030
      
  CMD ["node", "dist/main.js"]
      