# ── Stage 1: build ──────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --prefer-offline

COPY . .
RUN npm run build

# ── Stage 2: runtime ────────────────────────────────────────────
FROM node:20-alpine AS runner

# Security: run as non-root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Only copy production deps + compiled output
COPY package*.json ./
RUN npm ci --omit=dev --prefer-offline

COPY --from=builder /app/dist ./dist

# Upload directory (mounted as volume in production)
RUN mkdir -p uploads/temp && chown -R appuser:appgroup uploads

USER appuser

EXPOSE 3001

ENV NODE_ENV=production

CMD ["node", "dist/server.js"]
