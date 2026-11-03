import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import {
  assertLocalDevEnvironment,
  isLocalDevEnvironment,
  resolveSqliteDbPath,
} from "@/server/utils/env";
import { AppError } from "@/server/utils/http";
import {
  INITIAL_VENUES,
  MEMBERSHIP_PLANS,
  INITIAL_GROUP_MEMBERSHIP,
  INITIAL_BOOKINGS,
  INITIAL_MATCHES,
  INITIAL_EVENTS,
  INITIAL_PLAYER_PROFILE,
} from "@/data/mockData";

const globalForDb = globalThis as unknown as {
  __playcourtDb?: DatabaseSync;
  __playcourtDbPath?: string;
};

export function getDb(): DatabaseSync {
  const dbPath = resolveSqliteDbPath();

  if (globalForDb.__playcourtDb && globalForDb.__playcourtDbPath === dbPath) {
    return globalForDb.__playcourtDb;
  }

  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const db = new DatabaseSync(dbPath);

  // Enable WAL mode, foreign keys, and busy timeout for high concurrency
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;
  `);

  initSchemaAndSeed(db);
  globalForDb.__playcourtDb = db;
  globalForDb.__playcourtDbPath = dbPath;
  return db;
}

/**
 * Helper to execute an atomic, serialized SQLite transaction using BEGIN IMMEDIATE.
 * BEGIN IMMEDIATE acquires a reserved write lock immediately at the start of the
 * transaction, preventing any concurrent writer from interleaving between SELECT and INSERT.
 */
export function runImmediateTransaction<T>(fn: (db: DatabaseSync) => T): T {
  const db = getDb();
  db.exec("BEGIN IMMEDIATE TRANSACTION");
  try {
    const result = fn(db);
    db.exec("COMMIT");
    return result;
  } catch (err) {
    try {
      db.exec("ROLLBACK");
    } catch {
      // ignore rollback error if already rolled back
    }
    throw err;
  }
}

function initSchemaAndSeed(db: DatabaseSync) {
  db.exec(`
    -- 1. USERS, OTP VERIFICATIONS & SESSIONS
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'PLAYER' CHECK (role IN ('PLAYER', 'PLATFORM_ADMIN', 'VENUE_MANAGER', 'FINANCE_OPERATOR')),
      status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'PENDING_INVITE')),
      assigned_venue_id TEXT,
      last_active_label TEXT NOT NULL DEFAULT '29 Oct 2026',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS otp_verifications (
      id TEXT PRIMARY KEY,
      phone TEXT NOT NULL,
      otp_hash TEXT NOT NULL,
      attempts INTEGER NOT NULL DEFAULT 0,
      max_attempts INTEGER NOT NULL DEFAULT 5,
      expires_at INTEGER NOT NULL,
      consumed_at INTEGER,
      request_ip TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS user_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT UNIQUE NOT NULL,
      expires_at INTEGER NOT NULL,
      revoked_at INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 2. PLAYER PROFILES & FAVOURITE VENUES
    CREATE TABLE IF NOT EXISTS player_profiles (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      city TEXT NOT NULL DEFAULT 'Chandigarh',
      member_since TEXT NOT NULL DEFAULT 'March 2025',
      preferred_sports_json TEXT NOT NULL,
      skill_levels_json TEXT NOT NULL,
      matches_played INTEGER NOT NULL DEFAULT 42,
      hours_on_court REAL NOT NULL DEFAULT 68,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS player_favourite_venues (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      venue_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, venue_id)
    );

    -- 3. MEMBERSHIP PLANS, LINKED GROUPS (MAX 4) & DAILY SHARED CREDIT LEDGER
    CREATE TABLE IF NOT EXISTS membership_plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      badge TEXT NOT NULL,
      price_inr INTEGER NOT NULL CHECK (price_inr >= 0),
      cycle TEXT NOT NULL CHECK (cycle IN ('month', 'year')),
      featured INTEGER NOT NULL DEFAULT 0,
      max_linked_members INTEGER NOT NULL CHECK (max_linked_members BETWEEN 1 AND 4),
      shared_daily_credits INTEGER NOT NULL CHECK (shared_daily_credits IN (0, 1)),
      description TEXT NOT NULL,
      features_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS membership_groups (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      plan_id TEXT NOT NULL REFERENCES membership_plans(id),
      owner_user_id TEXT NOT NULL REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'Active',
      credit_locked INTEGER NOT NULL DEFAULT 0,
      max_members INTEGER NOT NULL DEFAULT 4 CHECK (max_members BETWEEN 1 AND 4),
      daily_credit_quota INTEGER NOT NULL DEFAULT 1 CHECK (daily_credit_quota IN (0, 1)),
      renewal_date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS membership_group_members (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL REFERENCES membership_groups(id) ON DELETE CASCADE,
      user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'Linked Crew',
      slot_number INTEGER NOT NULL CHECK (slot_number BETWEEN 1 AND 4),
      avatar TEXT NOT NULL,
      linked_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (group_id, slot_number)
    );

    CREATE TABLE IF NOT EXISTS daily_credit_ledgers (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL REFERENCES membership_groups(id) ON DELETE CASCADE,
      credit_date TEXT NOT NULL,
      redeemed_by_user_id TEXT NOT NULL REFERENCES users(id),
      redeemed_by_name TEXT NOT NULL,
      booking_id TEXT UNIQUE,
      venue_id TEXT NOT NULL,
      venue_name TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'REDEEMED' CHECK (status IN ('REDEEMED', 'RESTORED')),
      redeemed_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- CRITICAL RACE-CONDITION INVARIANT #1:
    -- At most ONE active ('REDEEMED') daily credit per group per calendar date
    CREATE UNIQUE INDEX IF NOT EXISTS uq_group_daily_credit_once
      ON daily_credit_ledgers (group_id, credit_date)
      WHERE status = 'REDEEMED';

    -- 4. VENUES, COURTS, MAINTENANCE BLOCKS & BOOKINGS
    CREATE TABLE IF NOT EXISTS venues (
      id TEXT PRIMARY KEY,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      area TEXT NOT NULL,
      city TEXT NOT NULL,
      address TEXT NOT NULL,
      sports_json TEXT NOT NULL,
      primary_sport TEXT NOT NULL,
      rating REAL NOT NULL,
      review_count INTEGER NOT NULL,
      price_per_hour INTEGER NOT NULL,
      tag TEXT NOT NULL,
      image TEXT NOT NULL,
      gallery_json TEXT NOT NULL,
      description TEXT NOT NULL,
      opening_hours TEXT NOT NULL,
      facilities_json TEXT NOT NULL,
      participating_in_credits INTEGER NOT NULL DEFAULT 1,
      operational_status TEXT NOT NULL DEFAULT 'Open',
      occupancy_pct INTEGER NOT NULL DEFAULT 85
    );

    CREATE TABLE IF NOT EXISTS courts (
      id TEXT PRIMARY KEY,
      venue_id TEXT NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      sport TEXT NOT NULL,
      surface TEXT NOT NULL,
      indoor INTEGER NOT NULL DEFAULT 0,
      price_per_hour INTEGER NOT NULL,
      slots_template_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS court_maintenance_blocks (
      id TEXT PRIMARY KEY,
      venue_id TEXT NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
      court_id TEXT NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
      block_date TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      reason TEXT NOT NULL,
      created_by_user_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (court_id, block_date, time_slot)
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      venue_id TEXT NOT NULL REFERENCES venues(id),
      venue_name TEXT NOT NULL,
      venue_area TEXT NOT NULL,
      court_id TEXT NOT NULL REFERENCES courts(id),
      court_name TEXT NOT NULL,
      sport TEXT NOT NULL,
      play_date TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL DEFAULT 60,
      player_name TEXT NOT NULL,
      player_email TEXT NOT NULL,
      player_phone TEXT NOT NULL,
      total_price INTEGER NOT NULL,
      paid_with_credit INTEGER NOT NULL DEFAULT 0,
      group_id TEXT,
      status TEXT NOT NULL DEFAULT 'Confirmed',
      created_at TEXT NOT NULL,
      notes TEXT
    );

    -- CRITICAL RACE-CONDITION INVARIANT #2:
    -- Prevents concurrent double-booking of the same court, play_date, and time_slot
    CREATE UNIQUE INDEX IF NOT EXISTS uq_active_court_booking_slot
      ON bookings (court_id, play_date, time_slot)
      WHERE status IN ('Pending', 'Confirmed', 'Upcoming', 'Cancellation Requested');

    CREATE TABLE IF NOT EXISTS booking_cancellations (
      id TEXT PRIMARY KEY,
      booking_id TEXT UNIQUE NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
      requested_by_user_id TEXT NOT NULL REFERENCES users(id),
      reason TEXT NOT NULL,
      review_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (review_status IN ('PENDING', 'APPROVED', 'REJECTED')),
      reviewed_by_admin_id TEXT,
      credit_restored INTEGER NOT NULL DEFAULT 0,
      requested_at TEXT NOT NULL DEFAULT (datetime('now')),
      reviewed_at TEXT
    );

    -- 5. PAYMENTS, OPEN MATCHES, EVENTS, COMMERCE, OFFERS & AUDIT LOGS
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      tx_code TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id),
      customer_name TEXT NOT NULL,
      booking_id TEXT,
      purpose TEXT NOT NULL,
      amount_inr INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'Paid',
      idempotency_key TEXT UNIQUE NOT NULL,
      date_label TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS open_matches (
      id TEXT PRIMARY KEY,
      venue_id TEXT NOT NULL REFERENCES venues(id),
      venue_name TEXT NOT NULL,
      area TEXT NOT NULL,
      host_user_id TEXT NOT NULL REFERENCES users(id),
      host_name TEXT NOT NULL,
      host_rating REAL NOT NULL DEFAULT 4.8,
      title TEXT NOT NULL,
      sport TEXT NOT NULL,
      skill_level TEXT NOT NULL,
      date_time TEXT NOT NULL,
      total_spots INTEGER NOT NULL CHECK (total_spots BETWEEN 2 AND 12),
      filled_spots INTEGER NOT NULL DEFAULT 1 CHECK (filled_spots <= total_spots AND filled_spots >= 1),
      price_per_player INTEGER NOT NULL DEFAULT 250,
      description TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS open_match_participants (
      match_id TEXT NOT NULL REFERENCES open_matches(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      joined_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (match_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      venue_id TEXT NOT NULL REFERENCES venues(id),
      venue_name TEXT NOT NULL,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      sport TEXT NOT NULL,
      date_label TEXT NOT NULL,
      full_date TEXT NOT NULL,
      time_label TEXT NOT NULL,
      price INTEGER NOT NULL,
      total_spots INTEGER NOT NULL,
      spots_left INTEGER NOT NULL CHECK (spots_left >= 0 AND spots_left <= total_spots),
      image TEXT NOT NULL,
      description TEXT NOT NULL,
      highlights_json TEXT NOT NULL,
      coach_or_organizer TEXT NOT NULL,
      publish_status TEXT NOT NULL DEFAULT 'Published',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS event_registrations (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      partner_name TEXT,
      registered_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE (event_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS shop_orders (
      id TEXT PRIMARY KEY,
      order_code TEXT UNIQUE NOT NULL,
      customer_name TEXT NOT NULL,
      items_summary TEXT NOT NULL,
      total_inr INTEGER NOT NULL,
      fulfilment_status TEXT NOT NULL DEFAULT 'Processing',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS promotion_offers (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      details TEXT NOT NULL,
      offer_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Active',
      redemption_summary TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS platform_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS admin_audit_logs (
      id TEXT PRIMARY KEY,
      actor_user_id TEXT NOT NULL,
      actor_name TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      action TEXT NOT NULL,
      target_entity TEXT NOT NULL,
      target_id TEXT NOT NULL,
      summary TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Check if already seeded
  const existingVenue = db
    .prepare("SELECT COUNT(*) as cnt FROM venues")
    .get() as { cnt: number };
  if (existingVenue && existingVenue.cnt > 0) {
    if (isLocalDevEnvironment()) {
      ensureLocalStaffAccounts(db);
    }
    return;
  }

  seedInitialData(db);
}

function ensureLocalStaffAccounts(db: DatabaseSync) {
  const upsertStaff = db.prepare(`
    INSERT OR IGNORE INTO users (id, phone, email, full_name, role, status, assigned_venue_id, last_active_label)
    VALUES (?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
  `);
  upsertStaff.run(
    "usr-admin-priya",
    "+91 99999 00001",
    "priya@playcourt.demo",
    "Priya Sharma",
    "PLATFORM_ADMIN",
    null,
    "Just now"
  );
  upsertStaff.run(
    "usr-mgr-rohan",
    "+91 99999 00002",
    "rohan@playcourt.demo",
    "Rohan Gill",
    "VENUE_MANAGER",
    "v-1",
    "Today"
  );
  upsertStaff.run(
    "usr-fin-meera",
    "+91 99999 00003",
    "meera@playcourt.demo",
    "Meera Kaur",
    "FINANCE_OPERATOR",
    null,
    "Today"
  );
  db.prepare(
    "UPDATE users SET status = 'ACTIVE' WHERE id = 'usr-fin-meera' AND status = 'PENDING_INVITE'"
  ).run();
}

export function resetAndReseedDatabase() {
  assertLocalDevEnvironment("Demo database reseed");

  const dbPath = resolveSqliteDbPath();
  const normalizedWorkspace = path.resolve(process.cwd()).toLowerCase();
  const normalizedDbPath = path.resolve(dbPath).toLowerCase();

  if (
    !normalizedDbPath.startsWith(normalizedWorkspace) ||
    !normalizedDbPath.endsWith(".db")
  ) {
    throw new AppError(
      "FORBIDDEN_IN_PRODUCTION",
      "Refusing to reset database outside local SQLite workspace directory.",
      403
    );
  }

  const db = getDb();
  db.exec(`
    DELETE FROM admin_audit_logs;
    DELETE FROM platform_settings;
    DELETE FROM promotion_offers;
    DELETE FROM shop_orders;
    DELETE FROM event_registrations;
    DELETE FROM events;
    DELETE FROM open_match_participants;
    DELETE FROM open_matches;
    DELETE FROM payments;
    DELETE FROM booking_cancellations;
    DELETE FROM bookings;
    DELETE FROM court_maintenance_blocks;
    DELETE FROM courts;
    DELETE FROM venues;
    DELETE FROM daily_credit_ledgers;
    DELETE FROM membership_group_members;
    DELETE FROM membership_groups;
    DELETE FROM membership_plans;
    DELETE FROM player_favourite_venues;
    DELETE FROM player_profiles;
    DELETE FROM user_sessions;
    DELETE FROM otp_verifications;
    DELETE FROM users;
  `);
  seedInitialData(db);
}

function seedInitialData(db: DatabaseSync) {
  db.exec("BEGIN TRANSACTION");
  try {
    // 1. Seed Users (Players + Staff/Admins)
    const insertUser = db.prepare(`
      INSERT INTO users (id, phone, email, full_name, role, status, assigned_venue_id, last_active_label)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Primary Player: Aarav Mehta
    insertUser.run(
      "usr-aarav",
      "+91 98765 43210",
      "aarav.m@example.com",
      "Aarav Mehta",
      "PLAYER",
      "ACTIVE",
      null,
      "29 Oct 2026"
    );
    // Linked Crew Members
    insertUser.run(
      "usr-kabir",
      "+91 98765 11223",
      "kabir.s@example.com",
      "Kabir Sharma",
      "PLAYER",
      "ACTIVE",
      null,
      "28 Oct 2026"
    );
    insertUser.run(
      "usr-simran",
      "+91 98111 44556",
      "simran.k@example.com",
      "Simran Kaur",
      "PLAYER",
      "ACTIVE",
      null,
      "27 Oct 2026"
    );
    insertUser.run(
      "usr-ananya",
      "+91 98222 33445",
      "ananya.g@example.com",
      "Ananya Gill",
      "PLAYER",
      "SUSPENDED",
      null,
      "20 Oct 2026"
    );

    // Admin & Staff Accounts (seeded only in local development mode)
    if (isLocalDevEnvironment()) {
      insertUser.run(
        "usr-admin-priya",
        "+91 99999 00001",
        "priya@playcourt.demo",
        "Priya Sharma",
        "PLATFORM_ADMIN",
        "ACTIVE",
        null,
        "Just now"
      );
      insertUser.run(
        "usr-mgr-rohan",
        "+91 99999 00002",
        "rohan@playcourt.demo",
        "Rohan Gill",
        "VENUE_MANAGER",
        "ACTIVE",
        "v-1",
        "Today"
      );
      insertUser.run(
        "usr-fin-meera",
        "+91 99999 00003",
        "meera@playcourt.demo",
        "Meera Kaur",
        "FINANCE_OPERATOR",
        "ACTIVE",
        null,
        "Today"
      );
    }

    // 2. Seed Player Profile
    db.prepare(`
      INSERT INTO player_profiles (user_id, city, member_since, preferred_sports_json, skill_levels_json, matches_played, hours_on_court)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      INITIAL_PLAYER_PROFILE.id,
      INITIAL_PLAYER_PROFILE.city,
      INITIAL_PLAYER_PROFILE.memberSince,
      JSON.stringify(INITIAL_PLAYER_PROFILE.preferredSports),
      JSON.stringify(INITIAL_PLAYER_PROFILE.skillLevels),
      INITIAL_PLAYER_PROFILE.matchesPlayed,
      INITIAL_PLAYER_PROFILE.hoursOnCourt
    );

    // 3. Seed Venues & Courts
    const insertVenue = db.prepare(`
      INSERT INTO venues (
        id, slug, name, area, city, address, sports_json, primary_sport,
        rating, review_count, price_per_hour, tag, image, gallery_json,
        description, opening_hours, facilities_json, participating_in_credits,
        operational_status, occupancy_pct
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertCourt = db.prepare(`
      INSERT INTO courts (id, venue_id, name, sport, surface, indoor, price_per_hour, slots_template_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const occupancies = [91, 84, 78, 74, 68, 88];
    INITIAL_VENUES.forEach((v, idx) => {
      insertVenue.run(
        v.id,
        v.slug,
        v.name,
        v.area,
        v.city,
        v.address,
        JSON.stringify(v.sports),
        v.primarySport,
        v.rating,
        v.reviewCount,
        v.pricePerHour,
        v.tag,
        v.image,
        JSON.stringify(v.gallery),
        v.description,
        v.openingHours,
        JSON.stringify(v.facilities),
        v.participatingInCredits ? 1 : 0,
        "Open",
        occupancies[idx] || 80
      );

      for (const c of v.courts) {
        insertCourt.run(
          c.id,
          v.id,
          c.name,
          c.sport,
          c.surface,
          c.indoor ? 1 : 0,
          c.pricePerHour,
          JSON.stringify(c.slots)
        );
      }
    });

    // Favourite Venues
    const insertFav = db.prepare(
      "INSERT INTO player_favourite_venues (user_id, venue_id) VALUES (?, ?)"
    );
    for (const vid of INITIAL_PLAYER_PROFILE.favouriteVenueIds) {
      insertFav.run("usr-aarav", vid);
    }

    // 4. Seed Membership Plans & Group Atlas
    const insertPlan = db.prepare(`
      INSERT INTO membership_plans (
        id, name, badge, price_inr, cycle, featured,
        max_linked_members, shared_daily_credits, description, features_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const p of MEMBERSHIP_PLANS) {
      insertPlan.run(
        p.id,
        p.name,
        p.badge,
        p.price,
        p.cycle,
        p.featured ? 1 : 0,
        p.maxLinkedMembers,
        p.sharedDailyCredits,
        p.description,
        JSON.stringify(p.features)
      );
    }

    db.prepare(`
      INSERT INTO membership_groups (
        id, code, name, plan_id, owner_user_id, status,
        credit_locked, max_members, daily_credit_quota, renewal_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      INITIAL_GROUP_MEMBERSHIP.groupId,
      INITIAL_GROUP_MEMBERSHIP.groupId,
      INITIAL_GROUP_MEMBERSHIP.groupName,
      INITIAL_GROUP_MEMBERSHIP.planId,
      "usr-aarav",
      INITIAL_GROUP_MEMBERSHIP.status,
      0,
      INITIAL_GROUP_MEMBERSHIP.maxMembers,
      INITIAL_GROUP_MEMBERSHIP.dailyCreditTotal,
      INITIAL_GROUP_MEMBERSHIP.renewalDate
    );

    const insertGroupMember = db.prepare(`
      INSERT INTO membership_group_members (
        id, group_id, user_id, name, email, phone, role, slot_number, avatar
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const memberUserIds = ["usr-aarav", "usr-kabir", "usr-simran"];
    INITIAL_GROUP_MEMBERSHIP.members.forEach((m, idx) => {
      insertGroupMember.run(
        m.id,
        INITIAL_GROUP_MEMBERSHIP.groupId,
        memberUserIds[idx] || `usr-${m.id}`,
        m.name,
        m.email,
        m.phone,
        m.role,
        idx + 1,
        m.avatar
      );
    });

    // 5. Seed Initial Bookings
    const insertBooking = db.prepare(`
      INSERT INTO bookings (
        id, user_id, venue_id, venue_name, venue_area, court_id, court_name,
        sport, play_date, time_slot, duration_minutes, player_name, player_email,
        player_phone, total_price, paid_with_credit, group_id, status, created_at, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const b of INITIAL_BOOKINGS) {
      insertBooking.run(
        b.id,
        "usr-aarav",
        b.venueId,
        b.venueName,
        b.venueArea,
        b.courtId,
        b.courtName,
        b.sport,
        b.date,
        b.timeSlot,
        b.durationMinutes,
        b.playerName,
        b.playerEmail,
        b.playerPhone,
        b.totalPrice,
        b.paidWithCredit ? 1 : 0,
        b.paidWithCredit ? INITIAL_GROUP_MEMBERSHIP.groupId : null,
        b.status,
        b.createdAt,
        b.notes || null
      );
    }

    // 6. Seed Payments
    const insertPayment = db.prepare(`
      INSERT INTO payments (id, tx_code, user_id, customer_name, booking_id, purpose, amount_inr, status, idempotency_key, date_label)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertPayment.run("pay-1", "TX-93821", "usr-aarav", "Aarav Mehta", "PC-10482", "Court booking", 850, "Paid", "idem-93821", "28 Oct 2026");
    insertPayment.run("pay-2", "TX-93820", "usr-simran", "Simran Kaur", "PC-10481", "Court booking", 1200, "Pending", "idem-93820", "28 Oct 2026");
    insertPayment.run("pay-3", "TX-93819", "usr-ananya", "Isha Kapoor", null, "Subscription renewal", 2499, "Failed", "idem-93819", "27 Oct 2026");
    insertPayment.run("pay-4", "TX-93818", "usr-kabir", "Kabir Sharma", null, "Court booking", 700, "Paid", "idem-93818", "27 Oct 2026");

    // 7. Seed Open Matches
    const insertMatch = db.prepare(`
      INSERT INTO open_matches (
        id, venue_id, venue_name, area, host_user_id, host_name, host_rating,
        title, sport, skill_level, date_time, total_spots, filled_spots, price_per_player, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const m of INITIAL_MATCHES) {
      insertMatch.run(
        m.id,
        m.venueId,
        m.venueName,
        m.area,
        "usr-aarav",
        m.hostName,
        m.hostRating,
        m.title,
        m.sport,
        m.skillLevel,
        m.dateTime,
        m.totalSpots,
        m.filledSpots,
        m.pricePerPlayer,
        m.description
      );
    }

    // 8. Seed Events
    const insertEvent = db.prepare(`
      INSERT INTO events (
        id, venue_id, venue_name, title, category, sport, date_label, full_date,
        time_label, price, total_spots, spots_left, image, description,
        highlights_json, coach_or_organizer, publish_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const ev of INITIAL_EVENTS) {
      insertEvent.run(
        ev.id,
        ev.venueId,
        ev.venueName,
        ev.title,
        ev.category,
        ev.sport,
        ev.dateLabel,
        ev.fullDate,
        ev.time,
        ev.price,
        ev.totalSpots,
        ev.spotsLeft,
        ev.image,
        ev.description,
        JSON.stringify(ev.highlights),
        ev.coachOrOrganizer,
        "Published"
      );
    }

    // 9. Seed Shop Orders, Promotions & Audit Logs
    const insertOrder = db.prepare(`
      INSERT INTO shop_orders (id, order_code, customer_name, items_summary, total_inr, fulfilment_status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertOrder.run("ord-1", "ORD-2018", "Maya Foods", "Grip tape × 2", 600, "Ready for pickup");
    insertOrder.run("ord-2", "ORD-2017", "Aarav Mehta", "Sports drink × 3", 450, "Processing");
    insertOrder.run("ord-3", "ORD-2016", "Rohan Verma", "Court towel × 1", 700, "Completed");

    const insertOffer = db.prepare(`
      INSERT INTO promotion_offers (id, code, details, offer_type, status, redemption_summary)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertOffer.run("off-1", "WELCOME10", "10% off first booking", "Voucher", "Active", "328 redemptions");
    insertOffer.run("off-2", "MEMBERPLUS", "Free drink with booking", "Partner benefit", "Active", "91 redemptions");
    insertOffer.run("off-3", "AUTUMN25", "25% off event tickets", "Campaign", "Scheduled", "Starts 01 Nov");

    const insertAudit = db.prepare(`
      INSERT INTO admin_audit_logs (id, actor_user_id, actor_name, actor_role, action, target_entity, target_id, summary)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertAudit.run("aud-1", "usr-admin-priya", "Priya Sharma", "PLATFORM_ADMIN", "BOOKING_STATUS_VIEWED", "Booking", "PC-10482", "Booking status viewed · Admin · just now");
    insertAudit.run("aud-2", "usr-admin-priya", "Priya Sharma", "PLATFORM_ADMIN", "MEMBERSHIP_LEDGER_OPENED", "MembershipGroup", "GRP-ATLAS-01", "Membership ledger opened · Admin · 4 minutes ago");
    insertAudit.run("aud-3", "usr-fin-meera", "Meera Kaur", "FINANCE_OPERATOR", "PAYMENT_EXCEPTION_REVIEWED", "Payment", "TX-93819", "Payment exception reviewed · Finance · 18 minutes ago");

    db.exec("COMMIT");
  } catch (err) {
    db.exec("ROLLBACK");
    throw err;
  }
}

