# Multi-stage Dockerfile for LegalConnect by CalmStacks (MVP)
# Stage 1: Build Frontend Assets
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Backend Application
FROM node:22-alpine AS backend-builder
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci
COPY backend/ ./
RUN npx tsc

# Stage 3: Production Runtime
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Install production dependencies only
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

# Copy compiled backend
COPY --from=backend-builder /app/backend/dist ./dist

# Copy built frontend assets to serve statically
COPY --from=frontend-builder /app/frontend/dist ./public

# Run as non-root user for security
USER node

EXPOSE 3000

CMD ["node", "--no-warnings", "dist/src/index.js"]
