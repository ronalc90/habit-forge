# ============================================
# HabitForge - Dockerfile Multi-stage
# Autor: Ronald
# ============================================

# --- Stage 1: Build ---
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# --- Stage 2: Production ---
FROM node:22-alpine

# Crear usuario no-root para seguridad
RUN addgroup -S app && adduser -S app -G app

# Instalar wget para healthcheck
RUN apk add --no-cache wget

WORKDIR /app

# Copiar artefactos de build
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json .

# Asignar permisos al usuario app
RUN chown -R app:app /app

# Cambiar a usuario no-root
USER app

# main.ts escucha en PORT (por defecto 3000); fijarlo para que coincida con EXPOSE
ENV PORT=3002

EXPOSE 3002

# Health check contra el endpoint publico GET /api/v1/health
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT:-3002}/api/v1/health" || exit 1

CMD ["node", "dist/main.js"]
