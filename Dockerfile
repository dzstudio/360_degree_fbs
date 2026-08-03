# Stage 1: Build frontend
FROM node:22-slim AS frontend-build
WORKDIR /build/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build backend
FROM node:22-slim AS backend-build
WORKDIR /build/backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
RUN npx prisma generate
RUN npm run build

# Stage 3: Production
FROM node:22-slim AS backend
WORKDIR /app/backend

COPY --from=backend-build /build/backend/package*.json ./
RUN npm ci --omit=dev && npm install tsx@^4

COPY --from=backend-build /build/backend/node_modules/.prisma ./node_modules/.prisma
COPY --from=backend-build /build/backend/node_modules/prisma ./node_modules/prisma
COPY --from=backend-build /build/backend/node_modules/@prisma/engines ./node_modules/@prisma/engines

COPY --from=backend-build /build/backend/dist ./dist
COPY --from=backend-build /build/backend/prisma ./prisma

COPY --from=frontend-build /build/frontend/dist ../frontend/dist

COPY backend/docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

RUN mkdir -p /app/data /app/uploads /app/logs

ENV NODE_ENV=production
ENV PORT=5176

EXPOSE 5176

CMD ["./docker-entrypoint.sh"]