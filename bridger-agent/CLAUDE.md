# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start Next.js dev server (http://localhost:3000)
npm run build            # Production build
npm run lint             # ESLint

npm run prisma:migrate:dev  # Run/create DB migrations (SQLite)
npm run prisma:studio       # Open Prisma Studio UI
npm run prisma:format       # Format schema.prisma
```

No test runner is configured yet.

## Architecture

This is a **Next.js 15 App Router** project that connects to an external Python agent service.

### Data Flow

```
Browser (React) → Apollo Client → /api/graphql (GraphQL Yoga) → Prisma (SQLite) + Python agent (http://localhost:8000/agent)
```

1. The client (`src/app/page.tsx`, `"use client"`) uses **Apollo Client** (`src/client/graphql/apollo-client.ts`) to call the GraphQL endpoint.
2. GraphQL Yoga handles requests at `src/app/api/graphql/route.ts` — schema and resolvers are defined inline there.
3. Resolver logic lives in `src/server/modules/greet/api.ts`. The `greetings` resolver creates a `Greet` record in SQLite via Prisma, then POSTs to an external agent at `http://localhost:8000/agent` and returns its response.
4. **Database**: Prisma with SQLite (`prisma/dev.db`). Schema at `prisma/schema.prisma`.

### Key Conventions

- **GraphQL queries** are co-located with their component: `GreetButton.api.ts` holds the GQL document, `GreetButton.tsx` uses it.
- **Prisma singleton** in `src/lib/db.ts` uses a `globalThis` guard to avoid multiple instances during hot reload.
- New server-side modules go under `src/server/modules/<feature>/api.ts`; client components under `src/components/<Feature>/`.

### External Dependency

The `greetings` resolver calls `http://localhost:8000/agent` (the LangGraph Python server in `../langgraph-server/`). Both services must be running for the full flow to work.
