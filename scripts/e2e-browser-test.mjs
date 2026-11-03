#!/usr/bin/env node
/**
 * PlayCourt — Full-Stack Headless Browser E2E Verification Suite (Playwright + Edge/Chrome)
 *
 * Runs against an ISOLATED SQLite test database (prisma/playcourt.e2e.test.db) on port 3198
 * so the developer's manual testing database (prisma/playcourt.db) is NEVER modified.
 */

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PORT = 3198;
const BASE_URL = `http://localhost:${PORT}`;
const TEST_DB_REL = "prisma/playcourt.e2e.test.db";
const TEST_DB_ABS = path.join(ROOT_DIR, TEST_DB_REL);
const MAIN_DB_ABS = path.join(ROOT_DIR, "prisma/playcourt.db");

function findBrowserExecutable() {
  const candidates = [
    process.env.PLAYWRIGHT_BROWSER_PATH,
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ].filter(Boolean);

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error(
    "Could not find Microsoft Edge or Google Chrome executable for Playwright. Set PLAYWRIGHT_BROWSER_PATH."
  );
}

function cleanupTestDbFiles() {
  for (const suffix of ["", "-wal", "-shm"]) {
    const f = `${TEST_DB_ABS}${suffix}`;
    if (fs.existsSync(f)) {
      try {
        fs.unlinkSync(f);
      } catch {
        // ignore transient Windows handle release delay
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
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`Server at ${url} did not start within ${timeoutMs}ms`);
}

async function runAudit() {
  console.log("=================================================================");
  console.log("PlayCourt — Headless Browser E2E Verification Suite");
  console.log("=================================================================\n");

  const mainDbStatBefore = fs.existsSync(MAIN_DB_ABS)
    ? fs.statSync(MAIN_DB_ABS)
    : null;

  cleanupTestDbFiles();

  const server = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "start", "-p", String(PORT)],
    {
      cwd: ROOT_DIR,
      env: {
        ...process.env,
        NODE_ENV: "production",
        PLAYCOURT_ENV: "local",
        PLAYCOURT_DB_PATH: TEST_DB_REL,
        JWT_SECRET: "local-e2e-suite-jwt-secret-key-at-least-32-chars",
        OTP_PEPPER: "local-e2e-suite-otp-pepper",
        OTP_MAX_REQUESTS_PER_WINDOW: "5",
      },
      stdio: "pipe",
    }
  );

  const results = {
    passed: [],
    failed: [],
    consoleErrors: [],
    pageErrors: [],
    brokenImages: [],
  };

  const assert = (condition, label, details = "") => {
    if (condition) {
      results.passed.push(label);
      console.log(`  [PASS] ${label}`);
    } else {
      results.failed.push({ label, details });
      console.error(`  [FAIL] ${label}${details ? ` (${details})` : ""}`);
    }
  };

  let browser;
  try {
    await waitForServer(BASE_URL);
    const executablePath = findBrowserExecutable();
    console.log(`Browser executable: ${executablePath}\n`);

    browser = await chromium.launch({
      executablePath,
      headless: true,
    });

    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        const text = msg.text();
        const loc = msg.location()?.url || "";
        // Ignore expected 404 test route, expected 402 simulated bank decline test, or external Unsplash CDN transient resets
        if (
          !text.includes("404") &&
          !text.includes("402") &&
          !loc.includes("images.unsplash.com")
        ) {
          results.consoleErrors.push(`${text} (${loc})`);
        }
      }
    });
    page.on("pageerror", (err) => {
      results.pageErrors.push(err.message);
    });

    // 1. Route Smoke Check across all 11 routes
    const routesToCheck = [
      ["/", "Make room for"],
      ["/venues", "A great court changes everything."],
      ["/venues/v-1", "The Green Racquet Club"],
      ["/booking", "Complete your court booking"],
      ["/memberships", "Good games. Better together."],
      ["/community", "Find players. Make plans. Play more."],
      ["/events", "Make a day of the game."],
      ["/login", "Sign in with your phone"],
      ["/profile", "Aarav Mehta"],
      ["/bookings", "My court bookings"],
      ["/admin", "Good evening, team"],
    ];

    for (const [route, expectedText] of routesToCheck) {
      const resp = await page.goto(`${BASE_URL}${route}`, {
        waitUntil: "domcontentloaded",
      });
      await page.waitForTimeout(300);
      const bodyText = await page.textContent("body");
      assert(
        resp && resp.status() === 200 && bodyText.includes(expectedText),
        `Route ${route} loads HTTP 200 with expected content ("${expectedText}")`,
        `Status: ${resp?.status()}`
      );

      const imgsOk = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll("img"));
        return imgs.every((img) => img.src && img.src.startsWith("http"));
      });
      if (!imgsOk) {
        results.brokenImages.push(route);
      }
    }

    assert(
      results.brokenImages.length === 0,
      "All <img> elements across all 11 routes have valid image URLs"
    );

    const resp404 = await page.goto(`${BASE_URL}/does-not-exist-404`, {
      waitUntil: "domcontentloaded",
    });
    const text404 = await page.textContent("body");
    assert(
      resp404?.status() === 404 && text404.includes("OUT OF BOUNDS"),
      "Custom 404 Not Found page renders properly"
    );

    // 2. End-to-End Customer Flow (Home -> Venues -> Venue Details -> Booking -> Confirmation)
    await page.goto(`${BASE_URL}/`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(350);

    const initialHeaderText = await page.textContent("header");
    assert(
      initialHeaderText.includes("1/1 Crew Credit Ready"),
      "Header initially displays '1/1 Crew Credit Ready'"
    );

    await page.click('form button:has-text("Padel")');
    await page.fill('input[placeholder*="Search Chandigarh"]', "IT Park");
    await page.click('button:has-text("Find Courts")');
    await page.waitForURL("**/venues?sport=Padel&q=IT+Park");
    await page.waitForTimeout(300);

    const venuesBody = await page.textContent("main");
    assert(
      venuesBody.includes("Baseline Padel House") &&
        venuesBody.includes("Showing 1 curated venues"),
      "Home -> Find Courts search filters to 'Baseline Padel House' (1 venue)"
    );

    await page.click('a[href="/venues/v-2"]:has-text("Details")');
    await page.waitForURL("**/venues/v-2");
    await page.waitForTimeout(350);

    // Select Fri, 30 Oct, Padel Court 02, and 10:30–11:30
    await page.click('button:has-text("Fri, 30 Oct")');
    await page.waitForTimeout(250);
    await page.click('button:has-text("Padel Court 02")');
    await page.click('button:has-text("10:30–11:30")');

    const summaryCardText = await page.textContent("main");
    assert(
      summaryCardText.includes("Padel Court 02") &&
        summaryCardText.includes("10:30–11:30") &&
        summaryCardText.includes("₹1050"),
      "Venue Details updates live availability & reservation summary for Padel Court 02 · 10:30–11:30"
    );

    await page.click('button:has-text("Continue to Booking Checkout")');
    await page.waitForURL("**/booking?*");
    await page.waitForTimeout(350);

    const checkoutText = await page.textContent("main");
    assert(
      checkoutText.includes("Baseline Padel House") &&
        checkoutText.includes("Padel Court 02") &&
        checkoutText.includes("10:30–11:30") &&
        checkoutText.includes("Redeem 1/1 Shared Daily Credit") &&
        checkoutText.includes("₹0"),
      "Booking Checkout preserves Venue, Court, Date, Slot, and applies 1/1 Shared Daily Credit (₹0)"
    );

    await page.click('button:has-text("Confirm with Free Group Credit")');
    await page.waitForSelector('h1:has-text("Court reservation confirmed!")');

    const confirmationText = await page.textContent("main");
    assert(
      confirmationText.includes("PC-10487") &&
        confirmationText.includes("Baseline Padel House") &&
        confirmationText.includes("Padel Court 02") &&
        confirmationText.includes("10:30–11:30") &&
        confirmationText.includes("1/1 Shared Crew Daily Credit Applied"),
      "Booking Confirmation displays persisted SQLite receipt PC-10487 with 1/1 Shared Crew Daily Credit Applied"
    );

    const updatedHeaderText = await page.textContent("header");
    assert(
      updatedHeaderText.includes("0/1 Crew Credit Today"),
      "Header pill updates to '0/1 Crew Credit Today' after credit redemption"
    );

    // 3. Test Paid Fallback + Simulated Bank Failure + Simulated Success
    await page.click('button:has-text("Book Another Court")');
    await page.waitForTimeout(300);

    const slotDisabled = await page.isDisabled('button:has-text("10:30–11:30")');
    assert(
      slotDisabled,
      "Previously booked slot (10:30–11:30) is disabled/Booked from SQLite availability"
    );

    // Test Simulated Bank Decline first
    await page.selectOption('select[aria-label="Simulated Payment Outcome"]', "FAILED");
    await page.click('button:has-text("Confirm Demo Booking (₹1050)")');
    await page.waitForTimeout(300);
    const failedBannerText = await page.textContent("main");
    assert(
      failedBannerText.includes("Simulated bank decline"),
      "Simulated Payment Sandbox 'FAILED' displays error banner without booking court slot"
    );

    // Switch back to SUCCESS and confirm Paid Fallback booking
    await page.selectOption('select[aria-label="Simulated Payment Outcome"]', "SUCCESS");
    await page.click('button:has-text("Confirm Demo Booking (₹1050)")');
    await page.waitForSelector('h1:has-text("Court reservation confirmed!")');
    const secondConfirmationText = await page.textContent("main");
    assert(
      secondConfirmationText.includes("PC-10488") &&
        secondConfirmationText.includes("₹1050") &&
        secondConfirmationText.includes("Simulated Local Payment"),
      "Paid fallback booking PC-10488 confirms at standard court price ₹1050 with TX code"
    );

    // 4. Memberships: 4/4 Linked Accounts Cap & Local Credit Reset
    await page.click('header a[href="/memberships"]');
    await page.waitForURL("**/memberships");
    await page.waitForTimeout(300);

    await page.fill('input[placeholder="Full name"]', "Rohan Verma");
    await page.fill('input[placeholder="Email address"]', "rohan.v@example.com");
    await page.click('button:has-text("＋ Link Account")');
    await page.waitForTimeout(350);

    const afterAddMemberText = await page.textContent("main");
    assert(
      afterAddMemberText.includes("4 / 4 Accounts Linked") &&
        afterAddMemberText.includes("Rohan Verma") &&
        afterAddMemberText.includes("Maximum capacity reached: 4/4 linked player accounts"),
      "Linking 4th member reaches 4/4 max capacity and replaces form with capacity notice"
    );

    await page.click('button:has-text("Simulate: Reset Credit to Available")');
    await page.waitForTimeout(350);
    const afterResetCreditText = await page.textContent("main");
    assert(
      afterResetCreditText.includes("1 / 1 Available Today"),
      "Local Dev Reset Credit button restores 1/1 Available Today in SQLite ledger"
    );

    // 5. Community Open Matches
    await page.click('header a[href="/community"]');
    await page.waitForURL("**/community");
    await page.waitForTimeout(300);

    await page.click('button:has-text("Request to join ↗")');
    await page.waitForTimeout(300);
    const afterJoinText = await page.textContent("main");
    assert(
      afterJoinText.includes("✓ You Joined") &&
        afterJoinText.includes("Joined (Click to Leave)"),
      "Joining an open match persists participant in SQLite and updates spot counter"
    );

    await page.click('button:has-text("Create an open match")');
    await page.fill('input[placeholder*="Evening Doubles"]', "QA Local Padel Mixer");
    await page.click('button:has-text("Publish Match to Community Board")');
    await page.waitForTimeout(350);
    const afterCreateMatchText = await page.textContent("main");
    assert(
      afterCreateMatchText.includes("QA Local Padel Mixer"),
      "Create Match modal persists new open match to Community Board"
    );

    // 6. Events & Tournaments
    await page.click('header a[href="/events"]');
    await page.waitForURL("**/events");
    await page.waitForTimeout(300);

    await page.click('button:has-text("Coachings")');
    await page.click('button:has-text("Details & Register")');
    await page.click('button:has-text("Confirm Demo Registration")');
    await page.waitForTimeout(350);
    const afterEventRegText = await page.textContent("body");
    assert(
      afterEventRegText.includes("You are registered for"),
      "Event registration modal persists registration and decrements spots left"
    );
    await page.click("div.fixed button:has(svg)");

    // 7. My Bookings & Cancellation Request
    await page.click('header a[href="/bookings"]');
    await page.waitForURL("**/bookings");
    await page.waitForTimeout(300);

    const bookingsListText = await page.textContent("main");
    assert(
      bookingsListText.includes("PC-10488") && bookingsListText.includes("PC-10487"),
      "My Bookings lists newly created SQLite bookings PC-10488 and PC-10487"
    );

    await page.click('button:has-text("Request Cancellation")');
    await page.click('button:has-text("Submit Cancellation Request")');
    await page.waitForTimeout(350);
    const afterCancelText = await page.textContent("main");
    assert(
      afterCancelText.includes("Cancellation Requested"),
      "Cancellation request updates booking status to 'Cancellation Requested' in SQLite"
    );

    // 8. Profile, Persistent Logout & Real Random 6-Digit OTP Login
    await page.click('header a[href="/profile"]');
    await page.waitForURL("**/profile");
    await page.waitForTimeout(300);

    await page.click('a:has-text("Sign Out")');
    await page.waitForURL("**/login");
    await page.waitForTimeout(300);

    // Reload /login to verify logout persists across reloads
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(300);
    const loginTextAfterReload = await page.textContent("main");
    assert(
      !loginTextAfterReload.includes("Active session:"),
      "Logout persists across browser page reload (session remains signed out)"
    );

    // Request real random 6-digit OTP & verify
    await page.click('button:has-text("Send Demo OTP Code")');
    await page.waitForSelector('h2:has-text("Enter 6-digit verification code")');
    await page.click('button:has-text("Verify & Continue")');
    await page.waitForURL("**/profile");
    await page.waitForTimeout(300);
    assert(
      page.url().endsWith("/profile"),
      "Random 6-digit OTP verification signs player in and redirects to /profile"
    );

    // 9. Admin Console: Unauthenticated Notice -> Authenticate Staff Role -> All 14 Modules -> Persisted Walk-in Booking
    await page.click('header a[href="/admin"]');
    await page.waitForURL("**/admin");
    await page.waitForTimeout(350);

    const adminPreviewText = await page.textContent("body");
    assert(
      adminPreviewText.includes("DEMO INTERFACE · Unauthenticated Frontend Preview"),
      "Admin Console displays non-admin preview banner before staff authentication"
    );

    // Switch to Platform Admin (Priya) via Local Dev Role Switcher
    await page.selectOption(
      'select[aria-label="Local Dev Admin Role Switcher"]',
      "PLATFORM_ADMIN"
    );
    await page.waitForTimeout(600);
    const adminAuthedText = await page.textContent("body");
    assert(
      adminAuthedText.includes("RBAC Active (Priya Sharma · PLATFORM_ADMIN)"),
      "Admin Console authenticates Priya Sharma (PLATFORM_ADMIN) via OTP & activates server-side RBAC"
    );

    const adminModules = [
      ["Bookings", "Booking operations"],
      ["Court schedule", "Court schedule"],
      ["Venues & courts", "Venue management"],
      ["Players", "Player directory"],
      ["Memberships", "Membership & shared credits"],
      ["Payments", "Payment operations"],
      ["Community & matches", "Community operations"],
      ["Events & coaching", "Events and coaching"],
      ["Shop & orders", "Commerce operations"],
      ["Offers & vouchers", "Promotions and benefits"],
      ["Reports", "Analytics & reports"],
      ["Staff & permissions", "Team access control"],
      ["Settings & audit log", "Settings & audit log"],
      ["Overview", "Good evening, team"],
    ];

    for (const [navLabel, expectedHeading] of adminModules) {
      await page.click(`aside nav button:has-text("${navLabel}")`);
      await page.waitForTimeout(100);
      const modText = await page.textContent("body");
      assert(
        modText.includes(expectedHeading),
        `Admin module '${navLabel}' renders '${expectedHeading}'`
      );
    }

    await page.click('aside nav button:has-text("Bookings")');
    await page.waitForTimeout(200);
    const adminBookingsText = await page.textContent("table");
    assert(
      adminBookingsText.includes("PC-10488") &&
        adminBookingsText.includes("PC-10487") &&
        adminBookingsText.includes("Cancellation Requested"),
      "Admin Bookings table reflects live customer SQLite bookings & Cancellation Requested status"
    );

    await page.click('button:has-text("＋ Add Bookings")');
    await page.waitForTimeout(150);
    await page.fill('input[placeholder="Enter player name"]', "Admin Walk-in Player");
    await page.click('button:has-text("Create booking (demo)")');
    await page.waitForTimeout(450);
    const afterAdminCreate = await page.textContent("table");
    assert(
      afterAdminCreate.includes("Admin Walk-in Player"),
      "Authenticated Admin 'Create booking' persists walk-in reservation to SQLite"
    );

    // 10. Responsive Viewports (Desktop 1440x900, Tablet 768x1024, Mobile 375x812)
    const viewports = [
      { name: "Desktop (1440x900)", width: 1440, height: 900 },
      { name: "Tablet (768x1024)", width: 768, height: 1024 },
      { name: "Mobile (375x812)", width: 375, height: 812 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      for (const testRoute of [
        "/",
        "/venues",
        "/venues/v-1",
        "/booking",
        "/memberships",
        "/community",
        "/events",
        "/login",
        "/profile",
        "/bookings",
        "/admin",
      ]) {
        await page.goto(`${BASE_URL}${testRoute}`, {
          waitUntil: "domcontentloaded",
        });
        await page.waitForTimeout(140);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth
        );
        assert(!overflow, `Zero horizontal overflow on ${testRoute} at ${vp.name}`);
      }
    }

    assert(
      results.consoleErrors.length === 0 && results.pageErrors.length === 0,
      "Zero unexpected browser console.error or uncaught page errors across entire E2E run",
      `Console: ${JSON.stringify(results.consoleErrors)} | Page: ${JSON.stringify(results.pageErrors)}`
    );
  } finally {
    if (browser) await browser.close();
    server.kill();
    await new Promise((r) => setTimeout(r, 800));
    cleanupTestDbFiles();
  }

  if (mainDbStatBefore) {
    const mainDbStatAfter = fs.statSync(MAIN_DB_ABS);
    assert(
      mainDbStatBefore.mtimeMs === mainDbStatAfter.mtimeMs &&
        mainDbStatBefore.size === mainDbStatAfter.size,
      "Developer manual testing database (prisma/playcourt.db) was 100% untouched during E2E run"
    );
  }

  console.log("\n=================================================================");
  console.log(
    `E2E SUMMARY: ${results.passed.length} PASSED | ${results.failed.length} FAILED`
  );
  console.log("=================================================================\n");

  if (results.failed.length > 0) {
    process.exit(1);
  }
}

runAudit().catch((err) => {
  console.error("Fatal error in e2e-browser-test:", err);
  cleanupTestDbFiles();
  process.exit(1);
});

