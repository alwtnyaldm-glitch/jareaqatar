# الجزيرة للتمويل والحلول المالية

موقع خدمات مالية عربي كامل مع تدفق طلبات تمويل متعدد الخطوات، لوحة إدارة لحظية بـ WebSocket، وتتبع جلسات المستخدمين.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — admin session secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Wouter routing + TailwindCSS v4 + Cairo Arabic font
- API: Express 5 + WebSocket (ws package)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/jazeera-finance/` — React frontend (Arabic RTL, navy/gold design)
  - `src/pages/` — all pages (Home, Apply flow, Admin)
  - `src/components/` — Navbar, Footer, StepIndicator, AdminLayout
  - `src/context/SessionContext.tsx` — user session tracking
- `artifacts/api-server/src/` — Express API backend
  - `routes/` — banks, applications, sessions, admin, settings
  - `lib/websocket.ts` — WebSocket broadcast server at `/api/ws`
- `lib/db/src/schema/` — Drizzle ORM schema (banks, applications, sessions, site_settings, financing_services)
- `lib/api-spec/` — OpenAPI spec (source of truth for all API contracts)
- `lib/api-client-react/` — Generated React Query hooks from Orval

## Architecture decisions

- WebSocket at `/api/ws` path so the reverse proxy routes it alongside API traffic
- Session IDs stored in localStorage; validated to guard against stale "undefined" values  
- Admin authentication uses express-session with SESSION_SECRET env var
- Admin can push users to any step in real-time via WebSocket broadcast
- Site settings (hero text, OTP labels, contact info, waiting message) fully editable from admin panel

## Product

**User flow (5 steps):**
1. `/apply` — Applicant info (individual or business)
2. `/apply/banks` — Choose bank from seeded list of Saudi banks
3. `/apply/credentials` — Enter bank username/password/security answer
4. `/apply/verify` — Enter OTP code
5. `/apply/waiting` — Wait for admin review (WebSocket listens for admin commands)

**Admin panel (`/admin`):**
- Login: admin / admin123 (configurable via env)
- Real-time dashboard with WebSocket connection indicator
- View live user sessions and which page they're on
- View all applications with full data (credentials, OTP codes, etc.)
- Push any user to any step instantly
- Mark applications valid/invalid/retry
- Add/edit/delete banks
- Edit all site text content (hero, OTP labels, waiting message, contact info)

## User preferences

- Full Arabic RTL interface
- Deep navy (#1e3a5f) + gold accent color scheme
- Cairo font throughout
- Admin credentials: admin / admin123

## Gotchas

- Run `pnpm --filter @workspace/api-spec run codegen` after changing the OpenAPI spec before editing frontend hooks
- WebSocket must be at `/api/ws` (not `/ws`) for the reverse proxy to route it
- Session IDs are validated client-side to guard against localStorage corruption
- Banks must be seeded manually (see seed script below or use the admin panel)

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- DB schema: `lib/db/src/schema/`
- OpenAPI spec: `lib/api-spec/openapi.yaml`
