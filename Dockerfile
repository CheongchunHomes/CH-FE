FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder

WORKDIR /app

ARG NEXT_PUBLIC_API_BASE_URL=/api
ARG NEXT_PUBLIC_AI_BASE_URL=/ai-api
ARG NEXT_PUBLIC_BACKEND_WS_URL=/api/ws/map-chat
ARG NEXT_PUBLIC_BACKEND_IMAGE_BASE_URL=/api
ARG NEXT_PUBLIC_KAKAO_MAP_KEY

ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_AI_BASE_URL=$NEXT_PUBLIC_AI_BASE_URL
ENV NEXT_PUBLIC_BACKEND_WS_URL=$NEXT_PUBLIC_BACKEND_WS_URL
ENV NEXT_PUBLIC_BACKEND_IMAGE_BASE_URL=$NEXT_PUBLIC_BACKEND_IMAGE_BASE_URL
ENV NEXT_PUBLIC_KAKAO_MAP_KEY=$NEXT_PUBLIC_KAKAO_MAP_KEY

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

CMD ["node", "server.js"]
