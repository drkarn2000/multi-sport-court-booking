# PlayCourt — Local Development & Manual Testing Guide

This guide documents everything needed to run, inspect, and manually test **PlayCourt** (`frontend + backend API routes + local SQLite WAL database`) 100% locally on **Windows PowerShell** with zero live cloud services, external SMS gateways, or real payment charges.

---

## 1. Prerequisites & Required Versions

- **Operating System:** Windows 10 / 11 (PowerShell 5.1 or PowerShell 7+)
- **Node.js:** **`v22.5.0` or newer** (`v24.x` LTS recommended; verified locally on **`v24.13.1`**)
  - *Why:* PlayCourt uses Node's built-in `node:sqlite` (`DatabaseSync`) in Write-Ahead Logging (`WAL`) mode with `BEGIN IMMEDIATE` serialized transactions, eliminating native C++ build-tool compilation issues on Windows.
- **npm:** `v10.0.0` or newer
- **Browser:** Microsoft Edge, Google Chrome, or Firefox (Microsoft Edge is also used automatically by the headless Playwright E2E suite).
- **External Accounts Required:** **None.** SMS OTP delivery and checkout payments run in clearly labeled local sandbox modes.

Verify your local toolchain in PowerShell:

```powershell
node -v
npm -v
```

---

## 2. Exact Windows PowerShell Commands

Run all commands from the project root (`d:\xampp\htdocs\multi_soport_court_booking`):

### First-Time Setup & Startup

```powershell
# 1. Navigate to the project directory
Set-Location d:\xampp\htdocs\multi_soport_court_booking

# 2. Install npm dependencies
npm install

# 3. Ensure local .env file exists (copies safe local defaults from .env.example if missing)
if (!(Test-Path .env)) { Copy-Item .env.example .env }

# 4. Initialize SQLite schema & seed demo data (ONLY if empty — never deletes existing bookings)
npm run db:init

# 5. Start the full-stack Next.js application (runs db:init automatically, then starts port 3000)
npm run dev
```

### Verification & Isolated Automated Test Commands

> **Data Safety Guarantee:** `npm run test:api`, `npm run test:e2e`, and `npm test` spin up temporary isolated SQLite databases (`prisma/playcourt.test.db` and `prisma/playcourt.e2e.test.db`) on ports `3199` / `3198` and clean them up afterward. **They never overwrite or modify your manual testing database (`prisma/playcourt.db`).**

```powershell
# TypeScript static type verification
npm run typecheck

# Production bundle compilation check (clean .next first if switching branches on Windows)
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue; npm run build

# Run isolated Backend API, Race-Condition Concurrency, Restart Persistence & Prod-Guard tests
npm run test:api

# Run isolated Playwright Headless Edge E2E tests across all 11 routes & 3 viewports
npm run test:e2e

# Run the complete verification pipeline (typecheck + test:api + test:e2e)
npm test
```

---

## 3. Local Application URLs

Once `npm run dev` reports `Ready on http://localhost:3000`:

| Surface / Page | Local URL | Purpose |
| :--- | :--- | :--- |
| **Home** | `http://localhost:3000/` | Sport/location hero search, featured venues, Group Atlas spotlight |
| **Find Courts** | `http://localhost:3000/venues` | Live sport, city, credit-eligibility & price/rating filters |
| **Venue Details** | `http://localhost:3000/venues/v-1` | Gallery, courts, date selector & live SQLite slot availability |
| **Booking Checkout** | `http://localhost:3000/booking` | Shared daily credit toggle, Simulated Payment Sandbox & confirmation |
| **Memberships** | `http://localhost:3000/memberships` | Plans, 4-account linked crew roster, IST daily credit ledger & reset |
| **Community** | `http://localhost:3000/community` | Open matches board, Join/Leave toggle & Create Match modal |
| **Events** | `http://localhost:3000/events` | Tournaments, coaching clinics, spot counter & registration modal |
| **Login / OTP** | `http://localhost:3000/login` | Phone + random 6-digit OTP verification & local test account picker |
| **Player Profile** | `http://localhost:3000/profile` | Editable profile, preferred sports, favourites & session expiry tester |
| **My Bookings** | `http://localhost:3000/bookings` | Upcoming/past reservations, receipt modal & cancellation requests |
| **Admin Console** | `http://localhost:3000/admin` | 14-module operations console with server-side RBAC & audit log |

---

## 4. Demo Accounts & Local OTP Instructions

### Seeded Local Test Accounts

| Persona | Phone Number | Role | Notes |
| :--- | :--- | :--- | :--- |
| **Aarav Mehta** *(Default Player)* | `+91 98765 43210` | `PLAYER` | Primary holder of **Group Atlas** (`GRP-ATLAS-01`) |
| **Kabir Sharma** *(Linked Crew #2)* | `+91 98765 11223` | `PLAYER` | Linked member in Group Atlas (`ACTIVE`) |
| **Simran Kaur** *(Linked Crew #3)* | `+91 98111 44556` | `PLAYER` | Linked member in Group Atlas (`ACTIVE`) |
| **Ananya Gill** *(Suspended Player)* | `+91 98222 33445` | `PLAYER` | `SUSPENDED` — OTP login returns `403` until unsuspended by Admin |
| **Priya Sharma** *(Platform Admin)* | `+91 99999 00001` | `PLATFORM_ADMIN` | Full access to all Admin Console actions, settings & player status |
| **Rohan Gill** *(Venue Manager)* | `+91 99999 00002` | `VENUE_MANAGER` | Assigned to `v-1` (*The Green Racquet Club*); blocked from Finance reconciliation |
| **Meera Kaur** *(Finance Operator)* | `+91 99999 00003` | `FINANCE_OPERATOR` | Can reconcile payments; blocked (`403`) from court blocks & bookings |

*(Staff accounts `+91 99999 00001..00003` are seeded and permitted **only** when `PLAYCOURT_ENV` is in local development mode; they are blocked in production mode.)*

### How Local OTP Authentication Works

1. Open `http://localhost:3000/login`.
2. Click one of the **Local Development Test Accounts** on the left panel (or enter any valid phone number) and click **Send Demo OTP Code**.
3. PlayCourt generates a **cryptographically random 6-digit OTP**, stores only its `SHA-256(pepper:phone:otp)` hash in `otp_verifications`, and in local mode (`PLAYCOURT_ENV="local"`):
   - Prints `[PlayCourt Local OTP] Phone: ... | Code: XXXXXX` in your **PowerShell terminal**, and
   - Displays the generated code inside the green **Local Dev OTP** box on Step 2 (pre-filling the 6 digit boxes for convenience).
4. **Never allowed in production:** There is **no** hardcoded/fixed OTP bypass. When `PLAYCOURT_ENV="production"`, `devOtpHint`, local test account buttons, demo staff phones, and `/api/v1/dev/testing` are completely disabled.

---

## 5. Step-by-Step Manual Test Checklist

Use this numbered checklist to verify both **expected pass** and **expected rejection/error** behaviors.

### A. Authentication, Rate Limits & Session Lifecycle

1. **Valid OTP Sign-In:**
   - Go to `/login`, select **Player (Aarav)** (`+91 98765 43210`), click **Send Demo OTP Code**, then click **Verify & Continue**.
   - **Expected Pass:** Redirects to `/profile`; HttpOnly `pc_session` cookie is set; session persists across browser refreshes.
2. **Incorrect OTP & Attempt Counter:**
   - On `/login`, request an OTP, click **Fill Wrong OTP (000000)** in the Local Dev helper box, and click **Verify & Continue**.
   - **Expected Rejection:** Red error banner displays `Incorrect 6-digit OTP code. 4 attempt(s) remaining.` After 5 wrong attempts, the OTP locks out and requires requesting a new code.
3. **Expired OTP:**
   - Request a fresh OTP on `/login`, click **Expire OTP Now** in the Local Dev helper box, then click **Verify & Continue**.
   - **Expected Rejection:** Red error banner displays `Verification code has expired. Please request a fresh 6-digit OTP.`
4. **OTP Rate Limiting (5 per 15 Minutes):**
   - Click **Resend code** repeatedly until you exceed 5 requests within 15 minutes for the same phone number.
   - **Expected Rejection:** Returns `429 Too Many OTP requests...` banner. Click **`[Local Dev] Reset rate-limit counter`** inside the banner (or **Reset Rate Limit**) to clear the window immediately and continue testing.
5. **Logout Persistence Across Reloads:**
   - Click **Sign Out** on `/profile` (or `/login`), then press `F5` to reload `/login`.
   - **Expected Pass:** You remain signed out (`No active session`); the app does not silently log you back in on reload.
6. **Session Expiration (`401`):**
   - Sign in via `/login` so an active cookie session exists, open `/profile`, and click **`[Local Dev] Expire Session Cookie`** in the top session bar. Then try creating a booking on `/booking`.
   - **Expected Rejection:** Checkout displays `Your session has expired. Please sign in again with your mobile number.` (`HTTP 401`).

### B. Court Availability, Bookings, Concurrency & Cancellations

7. **Search & Live Date-Aware Availability:**
   - On `/`, choose **Padel**, type `IT Park`, click **Find Courts**, open **Baseline Padel House**, and switch between dates (`Today`, `Tomorrow`, etc.).
   - **Expected Pass:** `/venues/v-2` fetches live date-specific slot availability from SQLite (`/api/v1/venues/v-2?date=YYYY-MM-DD`).
8. **Create Booking & Cross-Surface Persistence:**
   - Select an open court/slot on `/venues/v-2`, click **Continue to Booking Checkout**, and confirm.
   - **Expected Pass:** Confirmation receipt (`PC-104xx`) appears; the reservation is immediately visible in `/bookings` (**My Bookings**), `/admin` (**Bookings** table), and survives stopping/restarting `npm run dev`.
9. **Prevent Double Booking of the Same Court & Slot:**
   - Open two browser tabs to `/booking` with the **exact same Venue, Court, Date, and Time Slot** selected before confirming either. Confirm Tab 1, then confirm Tab 2.
   - **Expected Pass / Rejection:** Tab 1 succeeds (`201`); Tab 2 fails on checkout with a red banner (`Court ... overlaps an active reservation`, `HTTP 409 SLOT_ALREADY_BOOKED`), and the slot button turns `(Booked)` / disabled.
10. **Cancellation Request Workflow:**
    - Go to `/bookings`, click **Request Cancellation** on an upcoming booking, enter a reason, and submit.
    - **Expected Pass:** Status changes to `Cancellation Requested` in both `/bookings` and `/admin`.

### C. Memberships, 4-Account Cap & Shared Daily Credit (`Asia/Kolkata`)

11. **Link Up to 4 Accounts Maximum:**
    - Go to `/memberships`. Group Atlas starts with `3 / 4 Accounts Linked`. Fill in a 4th player name/email and click **＋ Link Account**.
    - **Expected Pass:** Roster updates to `4 / 4 Accounts Linked` and replaces the add form with the maximum-capacity notice (any direct API attempt to add a 5th member returns `409 GROUP_MEMBER_LIMIT_REACHED`). Click the trash icon next to a linked crew member to unlink back to `3 / 4`.
12. **Shared Daily Credit (`1/1`) & Automatic Paid Fallback (`0/1`):**
    - Verify the header pill reads `1/1 Crew Credit Ready` and `/memberships` shows the active ledger date (`YYYY-MM-DD`) and reset rule (`Resets at 00:00 Asia/Kolkata`).
    - Book a court at a participating venue (e.g. *The Green Racquet Club* or *Baseline Padel House*) with **Redeem 1/1 Shared Daily Credit** toggled ON.
    - **Expected Pass:** Booking confirms at **`₹0`**; header badge immediately updates to `0/1 Crew Credit Today`.
    - Click **Book Another Court** on the same day.
    - **Expected Pass:** Credit toggle is locked (`CREDIT USED TODAY`); total payable automatically falls back to the court's standard hourly rate (`₹850` / `₹1050`).
    - *(Note: *Zirakpur Turf & Smash Club* (`v-6`) is configured as non-participating in credits — selecting it shows `Non-Participating Venue` and uses paid rates.)*
13. **Local Credit Reset:**
    - On `/memberships`, click **Simulate: Reset Credit to Available** to restore `1 / 1 Available Today` without wiping bookings.

### D. Simulated Payment Sandbox & Idempotent Webhooks

14. **Simulated Bank Decline (`FAILED`) & Cancelled Checkout (`CANCELLED`):**
    - On `/booking` with a paid reservation (`Total Payable > ₹0`, i.e., toggle Group Credit OFF or use credit first), locate the amber **Simulated Payment Sandbox (Local Only)** box above the confirm button:
      - Choose **`Simulate Bank Failure (402 Decline + Log Failed TX)`** and submit.
        - **Expected Rejection:** Red error banner displays `Simulated bank decline (TX-FAIL-xxxxx). No court reservation was created`; court slot remains **open**, and the failed transaction appears in `/admin` -> **Payments**.
      - Choose **`Simulate Checkout Cancelled (Abort without booking)`** and submit.
        - **Expected Rejection:** Displays cancellation notice (`400`); court slot remains **open**.
      - Choose **`Simulate Success (Paid receipt + Confirm slot)`** and submit.
        - **Expected Pass:** Confirms booking and records `Paid` transaction `TX-938xx`.
15. **Duplicate Payment Webhook Idempotency:**
    - Open `/admin`, sign in as **Platform Admin (Priya)** via the top-right **Switch Staff Role** dropdown, go to **Payments**, click **Reconcile**, and click **Send Duplicate Webhook ×2**.
    - **Expected Pass:** Sends two `POST /api/v1/payments/webhook` payloads with the same `idempotencyKey`; displays `1st call -> HTTP 201 (duplicate=false) | 2nd replay -> HTTP 200 (duplicate=true)` with the exact same `TX-SIM-xxxxx` code and **zero** duplicate payment rows.

### E. Admin Console RBAC & Operational Persistence

16. **Unauthorized (`401`) & Forbidden Role (`403`) Verification:**
    - Open `/admin` before signing in as staff: top pill clearly warns **`DEMO INTERFACE · Unauthenticated Frontend Preview`**.
    - Use the top-right **Switch Staff Role (Local Dev)** selector:
      - Select **Sign in: Finance Operator (Meera)** (`FINANCE_OPERATOR`), go to **Court schedule**, click **Block maintenance**, and click **Save Maintenance Block**.
        - **Expected Rejection:** Red RBAC banner displays `Finance Operators cannot create court maintenance blocks.` (`HTTP 403`).
      - Select **Sign in: Venue Manager (Rohan)** (`VENUE_MANAGER`, assigned to `v-1`), open **Block maintenance**, select **Baseline Padel House (`v-2`)**, and submit.
        - **Expected Rejection:** Red RBAC banner displays `Venue Managers can only block courts at their assigned venue (v-1).` (`HTTP 403`).
17. **Persisted Maintenance Block Preventing Customer Booking:**
    - Switch to **Sign in: Platform Admin (Priya)** (`PLATFORM_ADMIN`), open **Court schedule** -> **Block maintenance**, block *The Green Racquet Club* · *Centre Court 01* on `Today` for `16:00–17:00`, and save.
    - Open `/venues/v-1` (or `/booking`) for `Today` on *Centre Court 01*.
    - **Expected Pass:** `16:00–17:00` is unavailable, and any API booking attempt for `16:00–17:00` returns `409 SLOT_UNDER_MAINTENANCE`. You can remove the block anytime from the **Block maintenance** modal (**Clear**) and see every action in **Settings & audit log**.

### F. Community Open Matches & Events

18. **Create, Join & Leave Open Matches (+ Capacity Limit):**
    - On `/community`, click **Create an open match**, set **Total Spots** to `2`, and publish.
    - Switch accounts on `/login` to **Kabir (`+91 98765 11223`)** and click **Request to join ↗** on that match (`2/2 Spots Filled` -> button turns `Match Full`).
    - Switch to **Simran (`+91 98111 44556`)** — button is disabled (`Match Full`, backend enforces `409 MATCH_FULL`).
19. **Event Registration & Remaining Spots:**
    - On `/events`, note the `X spots left` badge on any event, click **Details & Register**, and click **Confirm Demo Registration**.
    - **Expected Pass:** Badge decrements to `X - 1 spots left`, button updates to `✓ Registered`, and persists across page reloads.

---

## 6. How to Reset Local Demo Data Safely

- **Normal restarts (`Ctrl+C` -> `npm run dev`), `npm run db:init`, and `npm test` NEVER erase your local database.**
- When you intentionally want a clean slate back to the initial seeded state, use **either** of these explicit local-only methods:

**Method 1 — PowerShell CLI (Recommended):**

```powershell
npm run db:reseed
```

*(Internally runs `node scripts/db-cli.mjs reseed --confirm`. Refuses to run without `--confirm` or if `PLAYCOURT_ENV="production"`.)*

**Method 2 — Browser UI (Two-Step Confirmation):**
1. Open `http://localhost:3000/memberships` and scroll to the **Live Group Account & Shared Credit Ledger** card.
2. Click **`[Local Dev] Reseed Demo Database…`**, then click the red **`Confirm Reseed Local SQLite`** button.

---

## 7. Troubleshooting Common Local Issues

| Symptom | Cause | Fix (Windows PowerShell) |
| :--- | :--- | :--- |
| `Error: listen EADDRINUSE: address already in use :::3000` | Another Node/Next.js process is already running on port `3000`. | Find and stop the process:<br>`Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue \| ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }` |
| `Cannot find module 'node:sqlite'` | Node.js version is older than `v22.5.0`. | Upgrade to Node.js `v22.5+` or `v24.x` LTS (`winget install OpenJS.NodeJS.LTS`), reopen PowerShell, and verify `node -v`. |
| `ENOENT: no such file or directory, open '...\.next\...'` | Stale `.next` build cache on Windows after switching between `next dev` and `next build`. | Clear `.next` and restart:<br>`Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue; npm run dev` |
| `Too many OTP requests (5) in the last 15 minutes` | Hit the local OTP rate-limit test threshold. | Click **`[Local Dev] Reset rate-limit counter`** right inside the `/login` error banner, or run `npm run db:reseed` if you want a full reset. |
| `database is locked` (`SQLITE_BUSY`) | External SQLite viewer holding an exclusive write lock on `prisma/playcourt.db`. | Close any external DB browser write transaction; PlayCourt configures `WAL` mode + `busy_timeout = 5000ms` automatically. |

---

## 8. Simulated vs. Persisted Features & Razorpay Integration Notes

### Honest Feature Status Inventory

| Capability | Current Local Status | Details |
| :--- | :--- | :--- |
| **Venues, Courts, Bookings, Cancellations, Maintenance Blocks** | **Persisted in SQLite** | Stored in `prisma/playcourt.db` with `BEGIN IMMEDIATE` transactions & partial unique indexes. |
| **Group Memberships (4-Account Cap) & Daily Credit Ledger** | **Persisted in SQLite** | Enforced atomically in `membership_group_members` & `daily_credit_ledgers` (`Asia/Kolkata` date). |
| **OTP Hashing, Attempt Lockout, Rate Limit & JWT Sessions** | **Persisted in SQLite** | Real SHA-256 OTP hashes in `otp_verifications` + revocable sessions in `user_sessions`. |
| **SMS OTP Delivery (`SMS_PROVIDER="console"`)** | **Simulated Locally** | Logs OTP to PowerShell console & `/login` Local Dev inspector instead of sending paid SMS via Twilio/MSG91. |
| **Checkout Payments (`PAYMENT_PROVIDER="simulated"`)** | **Simulated Locally** | Sandbox selector (`SUCCESS` / `FAILED` / `CANCELLED`) + `/api/v1/payments/webhook` writes real rows to `payments` without charging cards/UPI. |
| **Community Matches, Events, Profile & Admin Audit Logs** | **Persisted in SQLite** | Full CRUD/toggle persistence across server restarts. |
| **Admin Shop Orders & Promo Vouchers (`commerce`, `offers`)** | **Seeded Read + Session Preview** | Seeded in SQLite (`shop_orders`, `promotion_offers`) for inspection/CSV export; full storefront cart & promo redemption checkout are Phase 3 items. |

### Future Live Payment Gateway Integration (Razorpay) — When Approved

No live payment keys are required right now. When you approve moving from local testing to staging/production:
1. Add `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET` to `.env` and set `PAYMENT_PROVIDER="razorpay"` and `PLAYCOURT_ENV="production"`.
2. Add an order-creation endpoint (`POST /api/v1/payments/razorpay/order`) that creates a pending Razorpay Order for `selectedCourt.pricePerHour * 100` paise when `effectivePrice > 0`.
3. Open Razorpay Checkout JS on `/booking`, then verify `x-razorpay-signature` via HMAC-SHA256 inside `POST /api/v1/payments/webhook` using the existing `idempotency_key` column on `payments` before finalizing the booking.

---

## 9. Verified Automated Test Summary

The following checks were executed and verified in this workspace without modifying `prisma/playcourt.db`:

| Command | Scope | Result |
| :--- | :--- | :--- |
| `npm run db:init` | Verifies SQLite WAL schema & preserves existing `prisma/playcourt.db` rows | **PASS (Exit 0)** |
| `npm run typecheck` | Full TypeScript strict check (`tsc --noEmit`) | **PASS (0 errors)** |
| `npm run build` | Next.js 15 production build across all 11 UI pages & 18 API routes | **PASS (29/29 generated)** |
| `npm run test:api` | Isolated `prisma/playcourt.test.db` suite: random OTP, wrong OTP, expired OTP, `429` rate limit, persistent logout, `401` session expiry, 5-way double-booking concurrency, slot overlap, 4-account group cap race, 4-way shared credit race, paid fallback, `402`/`400` simulated payments, duplicate webhook idempotency, Admin RBAC (`401`/`403`), match capacity (`MATCH_FULL`), **SQLite persistence across full server restart**, and **`PLAYCOURT_ENV=production` safety guards** | **PASS (46 / 46 assertions)** |
| `npm run test:e2e` | Isolated `prisma/playcourt.e2e.test.db` Playwright headless Microsoft Edge suite: all 11 routes + 404, Home -> Venue -> Credit Booking (`PC-10487`) -> Simulated Failed Payment -> Paid Fallback (`PC-10488`) -> 4/4 Linked Crew + Credit Reset -> Community Match Join & Create -> Event Registration -> Cancellation Request -> Persistent Logout & Random OTP Login -> Admin Staff Role Switcher + all 14 Admin modules + Walk-in Booking -> Desktop/Tablet/Mobile (`1440px`, `768px`, `375px`) zero horizontal overflow & zero console errors | **PASS (84 / 84 assertions)** |

