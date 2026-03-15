# shadcn/ui monorepo template

This is a Next.js monorepo template with shadcn/ui.

## Running with Docker Compose

The entire project runs with a single command:

```bash
docker compose up --build
```

This starts:

- **Web** (Next.js) at http://localhost:3000
- **Server** (NestJS API) at http://localhost:3001
- **DiceBear** (self-hosted avatar API) at http://localhost:3002

Avatars are served from the self-hosted DiceBear API. See [DiceBear self-hosting guide](https://www.dicebear.com/guides/host-the-http-api-yourself/).

### Environment variables

Create a `.env` file in the project root to override defaults:

```env
# Auth
CHAT_ROOM_USERNAME=chat
CHAT_ROOM_PASSWORD=room123

# JWT (use strong secrets in production)
JWT_SECRET=your-secret-here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Encryption (32 chars for AES-256)
ENCRYPTION_KEY=your-32-char-encryption-key
```

### Data persistence

Server data (SQLite DB and uploads) is stored in Docker volumes `server-data` and `server-uploads`.

## Local development

```bash
pnpm install
pnpm dev
```

## Adding components

To add components to your app, run the following command at the root of your `web` app:

```bash
pnpm dlx shadcn@latest add button -c apps/web
```

This will place the ui components in the `packages/ui/src/components` directory.

## Using components

To use the components in your app, import them from the `ui` package.

```tsx
import { Button } from "@workspace/ui/components/button";
```
