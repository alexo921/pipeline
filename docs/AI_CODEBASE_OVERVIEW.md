# AI Codebase Overview

This document gives LLM-based assistants a concise, up-to-date map of the codebase after the removal of the legacy LLM server, Rasa pip-chatbot, and ChromaDB services.

## High-level Architecture

- Web dashboard (Next.js, app/ router): `frontend/web-dashboard`
  - Runs in Docker via `docker-compose.yml` service `web-dashboard`
  - Talks to the API via `NEXT_PUBLIC_API_URL` (production: https://api.pipelineworkforce.com). In local compose, the API is exposed on port 3001.
  - Global styling: `app/globals.css`; layout: `app/layout.tsx`.
  - Important UI components: `app/components/layout/Navbar.tsx`, `app/components/layout/MobileMenu.tsx`.

- API backend (NestJS): `backend/api`
  - Dockerized service name: `api`
  - Entrypoint: `dist/src/main.js` (built from `src/main.ts`)
  - Database: Postgres (service `postgres`), Prisma ORM (`backend/api/prisma`)
  - Redis (service `redis`) for queues/caching
  - Port: 3001

- Infra (Docker Compose): `docker-compose.yml`
  - Services kept: `postgres`, `redis`, `api`, `web-dashboard`
  - Removed services: `llm-server`, `pip-chatbot`, `chromadb`

## Environment and Config

- Frontend env set in `frontend/web-dashboard/next.config.ts` (injects `NEXT_PUBLIC_API_URL`).
- Backend uses `ConfigModule` (Nest) and `.env` for `DATABASE_URL`, Redis host/port.

## Common Tasks

- Start stack (remaining services):
  - `docker-compose up -d` (exposes web on 3000, api on 3001)

- Build frontend locally:
  - `cd frontend/web-dashboard && npm ci && npm run build && npm run start -p 3000`

- Build API locally:
  - `cd backend/api && npm ci && npm run build && node dist/src/main.js`

## Conventions

- Next.js 15 app router, colocated API routes in `app/api/*` for frontend-only endpoints/proxies.
- NestJS modular structure under `backend/api/src/*` (auth, job, analytics, intake-forms, etc.).
- Prisma schema at `backend/api/prisma/schema.prisma` with Postgres connection via `DATABASE_URL`.

## Recent Changes (context for AI)

- 2025-10-15: Removed `llm-server`, `pip-chatbot`, and `chromadb` from `docker-compose.yml`. Frontend and API remain containerized alongside Postgres and Redis.
- Updated `backend/api/Dockerfile` to run `node dist/src/main.js` directly.
- Navigation cleanup: removed Hire Talent / Find Jobs / Find Work tabs in navbar/mobile menu.

## Pointers for the Assistant

- If you need to call the backend from the web app, use `lib/api-utils.ts#getApiUrl` or rely on `NEXT_PUBLIC_API_URL`.
- When creating new backend modules, wire them in `app.module.ts` and expose routes with `/api/*` prefix.
- Check `docker-compose.yml` first whenever adding dependencies between services.


