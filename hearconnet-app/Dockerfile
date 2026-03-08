# ─────────────────────────────────────────────────────────────────────────────
# HearConnect – Frontend Dockerfile  (React → Nginx multi-stage build)
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy manifests first for better layer caching
COPY package.json ./

# Install *all* deps (including devDeps needed by vite build)
RUN npm install

# Build-time env vars injected via --build-arg in docker-compose / CLI.
# These are baked into the JS bundle at build time (Vite requirement).
ARG VITE_API_URL=http://localhost:8000
ARG VITE_WS_URL=ws://localhost:8000/ws/sign
ARG VITE_HEALTH_URL=http://localhost:8000/health
ARG VITE_FPS=12

ENV VITE_API_URL=$VITE_API_URL \
    VITE_WS_URL=$VITE_WS_URL \
    VITE_HEALTH_URL=$VITE_HEALTH_URL \
    VITE_FPS=$VITE_FPS

# Copy source and build
COPY . .
RUN npm run build

# ── Stage 2: Serve ────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine

# Remove default Nginx page
RUN rm -rf /usr/share/nginx/html/*

# Copy Vite production build from stage 1
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom Nginx config (SPA routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
