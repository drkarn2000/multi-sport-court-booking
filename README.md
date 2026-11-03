# PlayCourt — Multi-Location Sports Court Booking Platform (Local Full-Stack)

PlayCourt is a full-stack multi-location sports court booking platform built with **Next.js 15 (App Router)**, **React 19**, **TypeScript**, **Tailwind CSS**, **Framer Motion**, **Lucide React**, and **Node.js Built-in SQLite (`node:sqlite` in WAL mode)**.

> **Current Stage:** Local Development & Manual Testing Readiness (Zero external cloud or live payment dependencies).
> See **[LOCAL_TESTING_GUIDE.md](./LOCAL_TESTING_GUIDE.md)** for the complete manual testing walkthrough, demo accounts, OTP instructions, and troubleshooting guide.

## Prerequisites

- **OS:** Windows 10 / 11 (PowerShell) or macOS / Linux
- **Node.js:** `v22.5.0` or newer (`v24.x` LTS recommended — required for built-in `node:sqlite`)
- **npm:** `v10+`

## Quick Start (Windows PowerShell)

```powershell
# 1. Install dependencies
npm install

# 2. Copy local environment defaults (if .env does not exist yet)
if (!(Test-Path .env)) { Copy-Item .env.example .env }

# 3. Initialize local SQLite database & start PlayCourt at http://localhost:3000
npm run dev
```

- **Customer Frontend:** `http://localhost:3000`
- **Admin Operations Console:** `http://localhost:3000/admin`
- **OTP / Account Login:** `http://localhost:3000/login`

## Useful Commands (PowerShell)

| Command | Purpose |
| :--- | :--- |
| `npm run dev` | Initializes `prisma/playcourt.db` (non-destructively) and starts the local dev server on port `3000` |
| `npm run db:init` | Creates missing SQLite tables and seeds initial demo data **only** if empty (never deletes your bookings) |
| `npm run db:reseed` | Deliberately resets and reseeds `prisma/playcourt.db` back to clean initial demo data (local dev only) |
| `npm run typecheck` | Runs `tsc --noEmit` across frontend and backend |
| `npm run build` | Builds optimized local Next.js bundle |
| `npm run test:api` | Runs isolated API, concurrency, RBAC, restart-persistence & production-guard tests (`prisma/playcourt.test.db`) |
| `npm run test:e2e` | Runs isolated Playwright headless browser E2E tests across all 11 routes (`prisma/playcourt.e2e.test.db`) |
| `npm test` | Runs `typecheck` + `test:api` + `test:e2e` without touching `prisma/playcourt.db` |

## Implemented Routes

- `/` — **Home**: Hero with quick sport/location search, stats band, featured venues with live slot pills, how it works, shared Crew Membership spotlight, community open matches preview, and upcoming events preview.
- `/venues` — **Find Courts**: Searchable and filterable court directory (sport, location, crew-credit eligibility, price/rating sorting) backed by SQLite.
- `/venues/[id]` — **Venue Details**: Interactive gallery, facilities, court surface selector, live date-aware slot availability (`/api/v1/venues/[id]?date=YYYY-MM-DD`), and reservation summary.
- `/booking` — **Booking Flow**: Full checkout flow with atomic double-booking & overlap protection, Group Membership daily shared credit (`1/1 Free Credit` vs paid fallback), and a **Simulated Payment Sandbox** (`SUCCESS`, `FAILED`, `CANCELLED`).
- `/memberships` — **Memberships**: Plan comparison and live **Group Atlas** roster management (up to 4 linked accounts, 1 shared daily credit in `Asia/Kolkata` timezone, and local dev reset controls).
- `/community` — **Community**: Skill- and sport-filtered open match board, capacity enforcement (`MATCH_FULL`), Join/Leave toggle, and Create Open Match modal.
- `/events` — **Events & Tournaments**: Filterable tournament, coaching clinic, and social mixer directory with live spot counter (`EVENT_FULL`) and registration modal.
- `/login` — **Login / Signup**: Real SHA-256 hashed random 6-digit OTP verification, 5-attempt lockout, 15-minute rate limit, HttpOnly JWT session cookies, and local-only test account quick-fill.
- `/profile` — **Player Profile**: Persisted profile edits, preferred sports, favourite venues, membership summary, session expiration tester, and upcoming/past bookings.
- `/bookings` — **My Bookings**: Upcoming and past reservations ledger with receipt modal and persisted cancellation request workflow.
- `/admin` — **Admin Operations Console**: Server-side RBAC-protected (`PLATFORM_ADMIN`, `VENUE_MANAGER`, `FINANCE_OPERATOR`) operations interface with live bookings, court maintenance blocks, payment reconciliation, duplicate webhook simulator, player suspension toggle, and `admin_audit_logs`.
