# Copilot / AI Agent Instructions — Xordon (developer-facing)

Short summary
- Goal: help an AI coding agent be productive immediately by summarizing the architecture, developer workflows, and project-specific conventions.

Architecture & big picture 🔧
- Frontend: React + TypeScript + Vite + Tailwind + Radix UI. Entry: `src/main.tsx`, UI components under `src/components/` and `src/components/ui/`.
- Backend: PHP monolith served via the built-in PHP server (`php -S 127.0.0.1:8001 router.php`), code under `backend/` and `backend/public`.
- DB: MySQL (local dev expects a running MySQL instance; migrations are SQL under `backend/migrations/`).
- Integration: Vite proxies `/api`, `/operations` and some `/webforms-api` routes to the backend (see `vite.config.ts`). Frontend talks to backend via `src/lib/api.ts` (preferred HTTP client wrapper).

Key files & places to look 📁
- API wrapper: `src/lib/api.ts` — add client methods here when adding endpoints (examples: `getAiAgents`, `createAiAgent`, `/ai/generate`).
- React hooks: `src/hooks/*` — data fetching & mutation hooks built with TanStack React Query (e.g., `useAiAgents`, `useAiSettings`).
- AI UI: `src/components/AISettings.tsx` (provider defaults, models, channel defaults), `src/pages/ai/Agents.tsx` (CRUD UI for AI agents).
- Dev scripts: `scripts/start-dev.js` (picks dev port and launches Vite), `start-dev.ps1` (PowerShell helper that launches PHP backend + Vite). See `DEVELOPMENT_SETUP.md` and `QUICK_START.md` for usage notes.
- Migrations and helpers: `backend/scripts/run_all_migrations.php`, `backend/public/run_migration.php`, and `backend/migrations/*.sql`.
- Tests: `src/__tests__/*` (Vitest). Example: `AiAgents.spec.tsx` mocks `useAiAgents` using `vi.mock(...)`.

Developer workflows (concrete commands) ▶️
- Start full dev environment (Windows, recommended):
  - `.\



































If anything above is unclear or you'd like more examples (e.g., adding a full AI provider integration or an API method + hook + test), tell me which area and I'll expand or add a short sample PR-ready patch. ✅- If you need access to secret provider keys or upstream cloud models, request environment/workspace owner help — do not commit secrets to the repo.- If a migration touches many tables or needs data backfills, ask a senior dev before applying to production.When to ask for human help 🙋- When changing backend routes: update `src/lib/api.ts`, add React Query hooks in `src/hooks/`, and add tests for both backend and frontend layers.- Vite by default uses `strictPort` (configured for 5173). `scripts/start-dev.js` launches Vite with an explicit `--port` if it finds a free one.- MySQL must be running locally for the PHP backend (start-dev checks it using PDO). If you see database errors, run migrations and verify DB credentials.- Port mismatch: some docs reference port `8000` (legacy mock server), but the current PHP backend dev default is **8001** and Vite proxies to `127.0.0.1:8001` (see `vite.config.ts`). Prefer `8001` for local dev.Common pitfalls & gotchas ⚠️- Adding providers: update AI settings schema (frontend `AISettings` + backend settings storage). Tests often simulate provider connectivity (UI currently simulates tests with a delay).- UI: `src/components/AISettings.tsx` defines provider defaults and channel defaults (models such as `gpt-4o-mini`, `claude-3-haiku-20240307`). Settings are persisted using `api.updateSettings({ ai: ... })`.- Endpoints: `/ai/agents` (GET/POST/PUT/DELETE), `/ai/generate` (POST) — see `src/lib/api.ts` for client methods.AI-specific notes 🤖- Tests: use `vi.mock()` to mock hooks & API calls; emulate minimal state for UI tests (see `AiAgents.spec.tsx` and `AiAgents.e2e.spec.tsx`).- Vite proxy: frontend calls `/api/...` and Vite rewrites to backend by stripping `/api`. When adding new backend base paths, update `vite.config.ts` if needed.- UI components follow a shared `src/components/ui` pattern (Radix primitives + local wrappers). Reuse these components for consistent styling and accessiblity.- Prefer using React Query hooks (`src/hooks`) that wrap `api.*` calls rather than calling `api` directly in components.- Always add a typed client method to `src/lib/api.ts` for any new backend endpoint and keep return types accurate.Project-specific patterns & conventions ⚙️  - `npm run lint` (ESLint on `src/**/*.{ts,tsx}`)- Lint:  - `npm test` (Vitest); run one file: `npx vitest run src/__tests__/AiAgents.spec.tsx`.- Run tests:  - `php backend/scripts/run_all_migrations.php` or `php scripts/run_migration.php migrations/<file>.sql` (see module docs)- Run migrations:  - `php -S 127.0.0.1:8001 router.php` (or run `start-backend.ps1`)- Start backend only:  - `npm run dev` (scripts/start-dev.js will try to pick an available port when invoked directly)- Start frontend only:un-dev.ps1` or `.\start-dev.ps1` (starts PHP backend on 8001 and Vite; checks MySQL)