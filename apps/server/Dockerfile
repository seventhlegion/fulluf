# Build stage - from monorepo root
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@9.0.6 --activate
WORKDIR /app

# Copy workspace config and lockfile
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY apps/server/ ./apps/server/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build server (no UI dependency)
RUN pnpm --filter server build

# Production stage - preserve full workspace so pnpm symlinks resolve
FROM node:20-alpine AS runner
WORKDIR /app

# Copy full workspace (symlinks in apps/server/node_modules expect ../../../../node_modules/.pnpm)
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./
COPY --from=base /app/apps/server ./apps/server

# Create data dirs at runtime location
RUN mkdir -p apps/server/data apps/server/uploads

ENV NODE_ENV=production
EXPOSE 3001

WORKDIR /app/apps/server
CMD ["node", "dist/main.js"]
