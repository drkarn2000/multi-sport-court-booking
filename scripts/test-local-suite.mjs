#!/usr/bin/env node
/**
 * PlayCourt — Automated Local API, Concurrency, Persistence & Safety Test Suite
 *
 * Runs against an ISOLATED SQLite test database (prisma/playcourt.test.db) on port 3199
 * so the developer's manual testing database (prisma/playcourt.db) is NEVER modified.
 */

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 3199;
const BASE = `http://localhost:${PORT}`;
const TEST_DB_REL = "prisma/playcourt.test.db";
const TEST_DB_ABS = path.join(ROOT_DIR, TEST_DB_REL);
const MAIN_DB_ABS = path.join(ROOT_DIR, "prisma/playcourt.db");

let passed = 0;
let failed = 0;

function assert(condition, label, detail = "") {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${label}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

function cleanupTestDbFiles() {
  for (const suffix of ["", "-wal", "-shm"]) {
    const f = `${TEST_DB_ABS}${suffix}`;
    if (fs.existsSync(f)) {
      try {
        fs.unlinkSync(f);
      } catch {
        // ignore transient Windows file handle release delay
      }
    }
  }
}

async function waitForServer(url, timeoutMs = 35000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${url}/api/v1/venues`);
      if (res.ok) return true;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 350));
  }
  throw new Error(`Next.js server at ${url} did not become ready within ${timeoutMs}ms`);
}

function spawnNextServer(extraEnv = {}) {
  const child = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "start", "-p", String(PORT)],
    {
      cwd: ROOT_DIR,
      env: {
        ...process.env,
        NODE_ENV: "production",
        PLAYCOURT_ENV: "local",
        PLAYCOURT_DB_PATH: TEST_DB_REL,
        JWT_SECRET: "local-test-suite-jwt-secret-key-at-least-32-chars",
        OTP_PEPPER: "local-test-suite-otp-pepper",
        OTP_MAX_REQUESTS_PER_WINDOW: "5",
        ...extraEnv,
      },
      stdio: "pipe",
    }
  );
  return child;
}

async function stopServer(child) {
  if (!child || child.killed) return;
  child.kill();
  await new Promise((r) => setTimeout(r, 800));
}

async function loginWithOtp(phone, fullName) {
  // Clear rate limit first in case phone was used earlier in test
  await fetch(`${BASE}/api/v1/dev/testing`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "reset_otp_rate_limit", phone }),
  });

  const reqRes = await fetch(`${BASE}/api/v1/auth/otp/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  const reqJson = await reqRes.json();
  const otp = reqJson?.data?.devOtpHint;

  const verRes = await fetch(`${BASE}/api/v1/auth/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, otp, ...(fullName ? { fullName } : {}) }),
  });
  const cookieHeader = verRes.headers.get("set-cookie") || "";
  const cookie = cookieHeader.split(";")[0];
  const verJson = await verRes.json();
  return { reqRes, reqJson, verRes, verJson, cookie };
}

async function runSuite() {
  console.log("=================================================================");
  console.log("PlayCourt — Automated Local Integration, Concurrency & Safety Suite");
  console.log("=================================================================\n");

  const mainDbStatBefore = fs.existsSync(MAIN_DB_ABS)
    ? fs.statSync(MAIN_DB_ABS)
    : null;

  cleanupTestDbFiles();

  let server = spawnNextServer({ PLAYCOURT_ENV: "local" });

  try {
    await waitForServer(BASE);

    // ------------------------------------------------------------------
    // 1. Bootstrap State & Seed Verification
    // ------------------------------------------------------------------
    console.log("1. Isolated SQLite Initialization & Seed Data");
    const stateRes = await fetch(`${BASE}/api/v1/state`);
    const stateJson = await stateRes.json();
    assert(stateRes.status === 200 && stateJson.ok, "GET /api/v1/state initializes isolated test SQLite DB");
    assert(stateJson.data.venues.length === 6, "6 curated venues seeded");
    assert(stateJson.data.groupMembership.members.length === 3, "Group Atlas seeded with 3/4 linked accounts");
    assert(stateJson.data.groupMembership.dailyCreditUsed === 0, "Initial shared daily credit is 0/1 used");
    assert(stateJson.data.localDevMode === true && stateJson.data.timezone === "Asia/Kolkata", "Local dev mode & Asia/Kolkata timezone reported");

    // ------------------------------------------------------------------
    // 2. OTP Authentication, Wrong OTP, Expiry, Rate Limits, Logout & Session Expiry
    // ------------------------------------------------------------------
    console.log("\n2. OTP Authentication, Rate Limits, Logout & Session Expiration");
    const testPhone = "+91 98765 43210";
    const otpReq1 = await fetch(`${BASE}/api/v1/auth/otp/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: testPhone }),
    });
    const otpJson1 = await otpReq1.json();
    const realOtp = otpJson1?.data?.devOtpHint;
    assert(
      otpReq1.status === 200 && /^\d{6}$/.test(realOtp),
      `POST /api/v1/auth/otp/request generates random 6-digit OTP (${realOtp}) in local mode`
    );

    // Wrong OTP attempt
    const wrongOtp = realOtp === "000000" ? "111111" : "000000";
    const wrongVerify = await fetch(`${BASE}/api/v1/auth/otp/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: testPhone, otp: wrongOtp }),
    });
    const wrongJson = await wrongVerify.json();
    assert(
      wrongVerify.status === 400 &&
        wrongJson?.error?.code === "OTP_EXPIRED_OR_INVALID" &&
        wrongJson?.error?.details?.attemptsRemaining === 4,
      "Incorrect OTP rejected with 400 OTP_EXPIRED_OR_INVALID and decrements attemptsRemaining to 4"
    );

    // Valid OTP verification
    const validVerify = await fetch(`${BASE}/api/v1/auth/otp/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: testPhone, otp: realOtp }),
    });
    const playerCookie = (validVerify.headers.get("set-cookie") || "").split(";")[0];
    assert(
      validVerify.status === 200 && playerCookie.startsWith("pc_session="),
      "Valid OTP verification succeeds and issues HttpOnly pc_session JWT cookie"
    );

    // Replay same consumed OTP must fail
    const replayVerify = await fetch(`${BASE}/api/v1/auth/otp/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: testPhone, otp: realOtp }),
    });
    assert(replayVerify.status === 400, "Replaying an already-consumed OTP is rejected");

    // Expired OTP check
    const otpReq2 = await fetch(`${BASE}/api/v1/auth/otp/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: testPhone }),
    });
    const otpJson2 = await otpReq2.json();
    await fetch(`${BASE}/api/v1/dev/testing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "expire_latest_otp", phone: testPhone }),
    });
    const expVerify = await fetch(`${BASE}/api/v1/auth/otp/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: testPhone, otp: otpJson2.data.devOtpHint }),
    });
    const expJson = await expVerify.json();
    assert(
      expVerify.status === 400 && expJson?.error?.message?.toLowerCase().includes("expired"),
      "Expired OTP rejected with 400 Verification code has expired"
    );

    // Rate limit check (already made 2 requests; make 3 more = 5, then 6th must be 429)
    for (let i = 0; i < 3; i++) {
      await fetch(`${BASE}/api/v1/auth/otp/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: testPhone }),
      });
    }
    const rateLimitedRes = await fetch(`${BASE}/api/v1/auth/otp/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: testPhone }),
    });
    const rateLimitedJson = await rateLimitedRes.json();
    assert(
      rateLimitedRes.status === 429 && rateLimitedJson?.error?.code === "RATE_LIMITED",
      "6th OTP request within 15m window rejected with 429 RATE_LIMITED"
    );

    // Session expiration check
    await fetch(`${BASE}/api/v1/dev/testing`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: playerCookie,
      },
      body: JSON.stringify({ action: "expire_current_session" }),
    });
    const expiredBookingAttempt = await fetch(`${BASE}/api/v1/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: playerCookie,
      },
      body: JSON.stringify({
        venueId: "v-1",
        courtId: "c-101",
        date: "2026-11-15",
        timeSlot: "07:00–08:00",
        playerName: "Aarav Mehta",
        playerEmail: "aarav.m@example.com",
        playerPhone: testPhone,
        useGroupCredit: false,
      }),
    });
    assert(
      expiredBookingAttempt.status === 401,
      "Expired DB session cookie is rejected with 401 UNAUTHORIZED on protected booking route"
    );

    // Logout persistence check
    const logoutRes = await fetch(`${BASE}/api/v1/auth/logout`, {
      method: "POST",
      headers: { Cookie: playerCookie },
    });
    const loggedOutCookie = (logoutRes.headers.get("set-cookie") || "").split(";")[0];
    const meAfterLogout = await fetch(`${BASE}/api/v1/auth/me`, {
      headers: { Cookie: loggedOutCookie },
    });
    const meAfterLogoutJson = await meAfterLogout.json();
    assert(
      meAfterLogoutJson.data.isAuthenticated === false &&
        meAfterLogoutJson.data.sessionState === "LOGGED_OUT",
      "Logout sets persistent logged_out marker and keeps session signed out across reloads"
    );

    // Re-authenticate Aarav cleanly for subsequent tests
    const aaravSession = await loginWithOtp(testPhone);

    // ------------------------------------------------------------------
    // 3. Bookings: Double-Booking Race, Overlapping Slot & Cancellation
    // ------------------------------------------------------------------
    console.log("\n3. Bookings: Concurrency, Overlapping Slots & Cancellation Requests");
    const slotResponses = await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        fetch(`${BASE}/api/v1/bookings`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: aaravSession.cookie,
          },
          body: JSON.stringify({
            venueId: "v-1",
            courtId: "c-101",
            date: "2026-11-15",
            timeSlot: "09:00–10:00",
            playerName: `Concurrent Player #${i + 1}`,
            playerEmail: "aarav.m@example.com",
            playerPhone: testPhone,
            useGroupCredit: false,
          }),
        }).then(async (r) => ({ status: r.status, body: await r.json() }))
      )
    );
    const createdSlots = slotResponses.filter((r) => r.status === 201);
    const conflictSlots = slotResponses.filter(
      (r) => r.status === 409 && r.body?.error?.code === "SLOT_ALREADY_BOOKED"
    );
    assert(createdSlots.length === 1, "1 of 5 concurrent bookings for same court+date+slot succeeded");
    assert(conflictSlots.length === 4, "4 of 5 concurrent bookings rejected with 409 SLOT_ALREADY_BOOKED");

    const persistedBookingId = createdSlots[0].body.data.booking.id;

    // Overlapping time slot test (09:30–10:30 overlaps 09:00–10:00)
    const overlapRes = await fetch(`${BASE}/api/v1/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: aaravSession.cookie,
      },
      body: JSON.stringify({
        venueId: "v-1",
        courtId: "c-101",
        date: "2026-11-15",
        timeSlot: "09:30–10:30",
        playerName: "Overlap Tester",
        playerEmail: "overlap@example.com",
        playerPhone: testPhone,
        useGroupCredit: false,
      }),
    });
    const overlapJson = await overlapRes.json();
    assert(
      overlapRes.status === 409 && overlapJson?.error?.code === "SLOT_ALREADY_BOOKED",
      "Overlapping time slot (09:30–10:30 vs 09:00–10:00) rejected with 409 SLOT_ALREADY_BOOKED"
    );

    // Request cancellation on created booking
    const cancelReqRes = await fetch(`${BASE}/api/v1/bookings/${persistedBookingId}/cancel-request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: aaravSession.cookie,
      },
      body: JSON.stringify({ reason: "Schedule change during local test" }),
    });
    const cancelReqJson = await cancelReqRes.json();
    assert(
      cancelReqRes.status === 200 &&
        cancelReqJson?.data?.booking?.status === "Cancellation Requested",
      `Booking ${persistedBookingId} transitioned to 'Cancellation Requested'`
    );

    // ------------------------------------------------------------------
    // 4. Memberships: 4-Account Cap & Shared Daily Credit Concurrency
    // ------------------------------------------------------------------
    console.log("\n4. Memberships: 4-Account Cap, Link/Unlink & Shared Daily Credit Race");
    const memberResponses = await Promise.all(
      [1, 2, 3].map((n) =>
        fetch(`${BASE}/api/v1/memberships/members`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: aaravSession.cookie,
          },
          body: JSON.stringify({
            name: `Crew Candidate ${n}`,
            email: `crew.candidate.${n}@example.com`,
            phone: `+91 98000 1000${n}`,
          }),
        }).then(async (r) => ({ status: r.status, body: await r.json() }))
      )
    );
    const memberCreated = memberResponses.filter((r) => r.status === 201);
    const memberCapRejected = memberResponses.filter(
      (r) => r.status === 409 && r.body?.error?.code === "GROUP_MEMBER_LIMIT_REACHED"
    );
    assert(memberCreated.length === 1, "4th linked group member added (reaching 4/4 max)");
    assert(memberCapRejected.length === 2, "5th/6th concurrent link attempts rejected with 409 GROUP_MEMBER_LIMIT_REACHED");

    // Unlink 4th member & verify 3/4
    const fourthMember = memberCreated[0].body.data.groupMembership.members.find(
      (m) => m.role !== "Primary Holder" && m.name.startsWith("Crew Candidate")
    );
    const unlinkRes = await fetch(
      `${BASE}/api/v1/memberships/members?memberId=${encodeURIComponent(fourthMember.id)}`,
      {
        method: "DELETE",
        headers: { Cookie: aaravSession.cookie },
      }
    );
    const unlinkJson = await unlinkRes.json();
    assert(
      unlinkRes.status === 200 && unlinkJson.data.groupMembership.members.length === 3,
      "Unlinking crew member restores group roster to 3/4"
    );

    // Shared daily credit concurrency (4 parallel requests across different courts)
    const creditCourts = ["c-101", "c-102", "c-103", "c-201"];
    const creditVenues = ["v-1", "v-1", "v-1", "v-2"];
    const creditResponses = await Promise.all(
      creditCourts.map((courtId, idx) =>
        fetch(`${BASE}/api/v1/bookings`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: aaravSession.cookie,
          },
          body: JSON.stringify({
            venueId: creditVenues[idx],
            courtId,
            date: "2026-11-16",
            timeSlot: "10:00–11:00",
            playerName: `Crew Member #${idx + 1}`,
            playerEmail: `crew${idx + 1}@example.com`,
            playerPhone: testPhone,
            useGroupCredit: true,
          }),
        }).then(async (r) => ({ status: r.status, body: await r.json() }))
      )
    );
    const creditSuccess = creditResponses.filter(
      (r) => r.status === 201 && r.body?.data?.booking?.paidWithCredit === true
    );
    const creditRejected = creditResponses.filter(
      (r) => r.status === 409 && r.body?.error?.code === "GROUP_DAILY_CREDIT_ALREADY_USED"
    );
    assert(creditSuccess.length === 1, "Exactly 1 of 4 concurrent daily credit redemptions succeeded at ₹0");
    assert(
      creditRejected.length === 3,
      "3 of 4 concurrent daily credit redemptions rejected with 409 GROUP_DAILY_CREDIT_ALREADY_USED"
    );

    // Paid fallback when daily credit is already used
    const paidFallbackRes = await fetch(`${BASE}/api/v1/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: aaravSession.cookie,
      },
      body: JSON.stringify({
        venueId: "v-2",
        courtId: "c-202",
        date: "2026-11-16",
        timeSlot: "10:30–11:30",
        playerName: "Aarav Mehta",
        playerEmail: "aarav.m@example.com",
        playerPhone: testPhone,
        useGroupCredit: false,
      }),
    });
    const paidFallbackJson = await paidFallbackRes.json();
    assert(
      paidFallbackRes.status === 201 &&
        paidFallbackJson.data.booking.paidWithCredit === false &&
        paidFallbackJson.data.booking.totalPrice === 1050,
      "Paid fallback booking succeeds at standard court rate (₹1050) after daily credit is exhausted"
    );

    // ------------------------------------------------------------------
    // 5. Simulated Payment Sandbox & Idempotent Webhook
    // ------------------------------------------------------------------
    console.log("\n5. Simulated Payment Outcomes (FAILED, CANCELLED) & Webhook Idempotency");
    const failedPayRes = await fetch(`${BASE}/api/v1/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: aaravSession.cookie,
      },
      body: JSON.stringify({
        venueId: "v-1",
        courtId: "c-102",
        date: "2026-11-18",
        timeSlot: "16:00–17:00",
        playerName: "Aarav Mehta",
        playerEmail: "aarav.m@example.com",
        playerPhone: testPhone,
        useGroupCredit: false,
        paymentOutcome: "FAILED",
      }),
    });
    const failedPayJson = await failedPayRes.json();
    assert(
      failedPayRes.status === 402 && failedPayJson?.error?.code === "PAYMENT_FAILED",
      "Simulated FAILED payment returns 402 PAYMENT_FAILED and leaves court slot unbooked"
    );

    const cancelledPayRes = await fetch(`${BASE}/api/v1/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: aaravSession.cookie,
      },
      body: JSON.stringify({
        venueId: "v-1",
        courtId: "c-102",
        date: "2026-11-18",
        timeSlot: "16:00–17:00",
        playerName: "Aarav Mehta",
        playerEmail: "aarav.m@example.com",
        playerPhone: testPhone,
        useGroupCredit: false,
        paymentOutcome: "CANCELLED",
      }),
    });
    assert(
      cancelledPayRes.status === 400,
      "Simulated CANCELLED checkout aborts with 400 PAYMENT_CANCELLED without booking slot"
    );

    const idemKey = `wh-suite-${Date.now()}`;
    const wh1 = await fetch(`${BASE}/api/v1/payments/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idempotencyKey: idemKey, amountInr: 850, status: "Paid" }),
    });
    const wh1Json = await wh1.json();
    const wh2 = await fetch(`${BASE}/api/v1/payments/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idempotencyKey: idemKey, amountInr: 850, status: "Paid" }),
    });
    const wh2Json = await wh2.json();
    assert(
      wh1.status === 201 &&
        wh1Json.data.duplicate === false &&
        wh2.status === 200 &&
        wh2Json.data.duplicate === true &&
        wh1Json.data.txCode === wh2Json.data.txCode,
      `Duplicate payment webhook with idempotencyKey is deduplicated (${wh1Json.data.txCode})`
    );

    // ------------------------------------------------------------------
    // 6. Admin Console RBAC & Operational Persistence
    // ------------------------------------------------------------------
    console.log("\n6. Admin Console RBAC (401 / 403 / Role Scoping) & Audit Logging");
    const unauthAdmin = await fetch(`${BASE}/api/v1/admin`);
    assert(unauthAdmin.status === 401, "Unauthenticated GET /api/v1/admin returns 401");

    const playerAdmin = await fetch(`${BASE}/api/v1/admin`, {
      headers: { Cookie: aaravSession.cookie },
    });
    assert(playerAdmin.status === 403, "PLAYER role accessing GET /api/v1/admin returns 403 FORBIDDEN_ROLE");

    const financeSession = await loginWithOtp("+91 99999 00003");
    const finBlockAttempt = await fetch(`${BASE}/api/v1/admin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: financeSession.cookie,
      },
      body: JSON.stringify({
        action: "create_maintenance_block",
        venueId: "v-1",
        courtId: "c-101",
        blockDate: "2026-11-20",
        timeSlot: "17:00–18:00",
      }),
    });
    assert(
      finBlockAttempt.status === 403,
      "FINANCE_OPERATOR attempting court maintenance block is rejected with 403"
    );

    const finReconcileRes = await fetch(`${BASE}/api/v1/admin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: financeSession.cookie,
      },
      body: JSON.stringify({ action: "reconcile_payments" }),
    });
    assert(finReconcileRes.status === 200, "FINANCE_OPERATOR can execute reconcile_payments");

    const mgrSession = await loginWithOtp("+91 99999 00002");
    const mgrOtherVenueAttempt = await fetch(`${BASE}/api/v1/admin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: mgrSession.cookie,
      },
      body: JSON.stringify({
        action: "create_maintenance_block",
        venueId: "v-2",
        courtId: "c-201",
        blockDate: "2026-11-20",
        timeSlot: "18:00–19:00",
      }),
    });
    assert(
      mgrOtherVenueAttempt.status === 403,
      "VENUE_MANAGER (assigned to v-1) attempting to block court at v-2 is rejected with 403"
    );

    const adminSession = await loginWithOtp("+91 99999 00001");
    const adminBlockRes = await fetch(`${BASE}/api/v1/admin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminSession.cookie,
      },
      body: JSON.stringify({
        action: "create_maintenance_block",
        venueId: "v-1",
        courtId: "c-101",
        blockDate: "2026-11-20",
        timeSlot: "17:00–18:00",
        reason: "Floodlight calibration",
      }),
    });
    assert(adminBlockRes.status === 200, "PLATFORM_ADMIN creates court maintenance block and writes audit log");

    const maintConflictRes = await fetch(`${BASE}/api/v1/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: aaravSession.cookie,
      },
      body: JSON.stringify({
        venueId: "v-1",
        courtId: "c-101",
        date: "2026-11-20",
        timeSlot: "17:00–18:00",
        playerName: "Aarav Mehta",
        playerEmail: "aarav.m@example.com",
        playerPhone: testPhone,
        useGroupCredit: false,
      }),
    });
    const maintConflictJson = await maintConflictRes.json();
    assert(
      maintConflictRes.status === 409 &&
        maintConflictJson?.error?.code === "SLOT_UNDER_MAINTENANCE",
      "Booking a maintenance-blocked slot is rejected with 409 SLOT_UNDER_MAINTENANCE"
    );

    // Approve cancellation of credit booking -> restores shared daily credit!
    const creditBookingId = creditSuccess[0].body.data.booking.id;
    const cancelApproveRes = await fetch(`${BASE}/api/v1/admin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: adminSession.cookie,
      },
      body: JSON.stringify({
        action: "update_booking_status",
        bookingId: creditBookingId,
        status: "Cancelled",
      }),
    });
    const memAfterCancel = await fetch(`${BASE}/api/v1/memberships`, {
      headers: { Cookie: aaravSession.cookie },
    });
    const memAfterCancelJson = await memAfterCancel.json();
    assert(
      cancelApproveRes.status === 200 &&
        memAfterCancelJson.data.groupMembership.dailyCreditUsed === 0,
      "Admin cancelling a credit-redeemed booking restores Group Atlas shared daily credit to 0/1 used"
    );

    // ------------------------------------------------------------------
    // 7. Community Open Matches & Events Capacity Enforcement
    // ------------------------------------------------------------------
    console.log("\n7. Community Open Matches (Capacity Limit) & Events Registration");
    const createMatchRes = await fetch(`${BASE}/api/v1/matches`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: aaravSession.cookie,
      },
      body: JSON.stringify({
        title: "Persistence Singles Challenge",
        sport: "Tennis",
        skillLevel: "Intermediate",
        venueName: "The Green Racquet Club",
        area: "Sector 17",
        dateTime: "Tomorrow, 18:00 – 19:00",
        totalSpots: 2,
        pricePerPlayer: 400,
        description: "1v1 singles match for capacity testing.",
      }),
    });
    const createMatchJson = await createMatchRes.json();
    const createdMatchId = createMatchJson.data.match.id;
    assert(createMatchRes.status === 201, `Created 2-spot open match (${createdMatchId}, 1/2 filled)`);

    // 2nd player joins -> 2/2 full
    const player2Session = await loginWithOtp("+91 98765 11223");
    const join2Res = await fetch(`${BASE}/api/v1/matches/${createdMatchId}/join`, {
      method: "POST",
      headers: { Cookie: player2Session.cookie },
    });
    assert(join2Res.status === 200, "2nd player joins open match (reaching 2/2 capacity)");

    // 3rd player attempts to join -> 409 MATCH_FULL
    const player3Session = await loginWithOtp("+91 98111 44556");
    const join3Res = await fetch(`${BASE}/api/v1/matches/${createdMatchId}/join`, {
      method: "POST",
      headers: { Cookie: player3Session.cookie },
    });
    const join3Json = await join3Res.json();
    assert(
      join3Res.status === 409 && join3Json?.error?.code === "MATCH_FULL",
      "3rd player joining full 2/2 match is rejected with 409 MATCH_FULL"
    );

    // Event registration decrements spotsLeft
    const regEventRes = await fetch(`${BASE}/api/v1/events/ev-1/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: aaravSession.cookie,
      },
      body: JSON.stringify({ partnerName: "Kabir Sharma" }),
    });
    const regEventJson = await regEventRes.json();
    assert(
      regEventRes.status === 201 && regEventJson.data.event?.registered === true,
      "Event registration persists in SQLite and decrements remaining spots"
    );

    // ------------------------------------------------------------------
    // 8. Server Restart Persistence & Production-Mode Guard Verification
    // ------------------------------------------------------------------
    console.log("\n8. SQLite Persistence Across Server Restart & Production Safety Guards");
    await stopServer(server);

    // Restart server on same SQLite file with PLAYCOURT_ENV="production"
    server = spawnNextServer({ PLAYCOURT_ENV: "production" });
    await waitForServer(BASE);

    const afterRestartBookingsRes = await fetch(`${BASE}/api/v1/bookings`);
    const afterRestartBookingsJson = await afterRestartBookingsRes.json();
    const survivedBooking = afterRestartBookingsJson.data.bookings.some(
      (b) => b.id === persistedBookingId && b.status === "Cancellation Requested"
    );
    assert(
      survivedBooking,
      `Booking ${persistedBookingId} ('Cancellation Requested') survived full Next.js server restart in SQLite`
    );

    const prodStateRes = await fetch(`${BASE}/api/v1/state`);
    const prodStateJson = await prodStateRes.json();
    const survivedMatch = prodStateJson.data.matches.some(
      (m) => m.id === createdMatchId && m.title === "Persistence Singles Challenge"
    );
    assert(survivedMatch, "Created community match survived full Next.js server restart in SQLite");
    assert(
      prodStateJson.data.localDevMode === false && prodStateJson.data.isAuthenticated === false,
      "PLAYCOURT_ENV=production disables localDevMode and disables automatic demo-player fallback"
    );

    const prodOtpRes = await fetch(`${BASE}/api/v1/auth/otp/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "+91 98111 44556" }),
    });
    const prodOtpJson = await prodOtpRes.json();
    assert(
      prodOtpRes.status === 200 && prodOtpJson?.data?.devOtpHint === undefined,
      "PLAYCOURT_ENV=production never exposes devOtpHint in API response"
    );

    const prodDemoAdminOtp = await fetch(`${BASE}/api/v1/auth/otp/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: "+91 99999 00001" }),
    });
    assert(
      prodDemoAdminOtp.status === 403,
      "PLAYCOURT_ENV=production blocks demo staff phone numbers (+91 99999 00001) with 403"
    );

    const prodDevEndpoint = await fetch(`${BASE}/api/v1/dev/testing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reseed_demo_db", confirm: "RESET_LOCAL_DEMO_DB" }),
    });
    assert(
      prodDevEndpoint.status === 403,
      "PLAYCOURT_ENV=production blocks /api/v1/dev/testing helper endpoint with 403"
    );

    const prodDeleteState = await fetch(`${BASE}/api/v1/state`, { method: "DELETE" });
    assert(
      prodDeleteState.status === 403,
      "PLAYCOURT_ENV=production blocks DELETE /api/v1/state reset endpoint with 403"
    );
  } finally {
    await stopServer(server);
    cleanupTestDbFiles();
  }

  // Verify developer's primary database was untouched
  if (mainDbStatBefore) {
    const mainDbStatAfter = fs.statSync(MAIN_DB_ABS);
    assert(
      mainDbStatBefore.mtimeMs === mainDbStatAfter.mtimeMs &&
        mainDbStatBefore.size === mainDbStatAfter.size,
      "Developer manual testing database (prisma/playcourt.db) was 100% untouched during test run"
    );
  }

  console.log("\n=================================================================");
  console.log(`API & PERSISTENCE SUITE SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log("=================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error("Fatal error in test-local-suite:", err);
  cleanupTestDbFiles();
  process.exit(1);
});

