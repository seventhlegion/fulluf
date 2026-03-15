# Build stage - from monorepo root
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.0.6 --activate
WORKDIR /app

# Copy workspace config and lockfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build web (depends on @workspace/ui)
# Pass build-time env for API URL (baked into client)
ARG NEXT_PUBLIC_API_URL=http://localhost:3001
ARG NEXT_PUBLIC_AVATAR_API_URL=http://localhost:3002
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_AVATAR_API_URL=$NEXT_PUBLIC_AVATAR_API_URL

RUN pnpm --filter web build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

ENV PORT=3000
EXPOSE 3000

# Copy built Next.js app (standalone structure: apps/web/server.js)
COPY --from=base /app/apps/web/.next/standalone ./
COPY --from=base /app/apps/web/public ./apps/web/public
COPY --from=base /app/apps/web/.next/static ./apps/web/.next/static

CMD ["node", "apps/web/server.js"]
