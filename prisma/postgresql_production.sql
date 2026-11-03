-- PlayCourt Production PostgreSQL 16+ Schema & Concurrency Constraints
-- Mirrors src/server/db/index.ts for managed PostgreSQL deployments

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS, OTP VERIFICATIONS & SESSIONS
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  phone VARCHAR(24) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  full_name VARCHAR(120) NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'PLAYER' CHECK (role IN ('PLAYER', 'PLATFORM_ADMIN', 'VENUE_MANAGER', 'FINANCE_OPERATOR')),
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'PENDING_INVITE')),
  assigned_venue_id TEXT,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS otp_verifications (
  id TEXT PRIMARY KEY,
  phone VARCHAR(24) NOT NULL,
  otp_hash VARCHAR(255) NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  expires_at TIMESTAMPTZ NOT NULL,
  consumed_at TIMESTAMPTZ,
  request_ip VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. PLAYER PROFILES & FAVOURITE VENUES
CREATE TABLE IF NOT EXISTS player_profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  city VARCHAR(80) NOT NULL DEFAULT 'Chandigarh',
  member_since VARCHAR(40) NOT NULL DEFAULT 'March 2025',
  preferred_sports_json TEXT NOT NULL,
  skill_levels_json TEXT NOT NULL,
  matches_played INT NOT NULL DEFAULT 42,
  hours_on_court NUMERIC(6,1) NOT NULL DEFAULT 68,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_favourite_venues (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  venue_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, venue_id)
);

-- 3. MEMBERSHIP PLANS, LINKED GROUPS (MAX 4) & DAILY SHARED CREDIT LEDGER
CREATE TABLE IF NOT EXISTS membership_plans (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  badge VARCHAR(64) NOT NULL,
  price_inr INT NOT NULL CHECK (price_inr >= 0),
  cycle VARCHAR(16) NOT NULL CHECK (cycle IN ('month', 'year')),
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  max_linked_members INT NOT NULL CHECK (max_linked_members BETWEEN 1 AND 4),
  shared_daily_credits INT NOT NULL CHECK (shared_daily_credits IN (0, 1)),
  description TEXT NOT NULL,
  features_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS membership_groups (
  id TEXT PRIMARY KEY,
  code VARCHAR(32) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  plan_id VARCHAR(64) NOT NULL REFERENCES membership_plans(id),
  owner_user_id TEXT NOT NULL REFERENCES users(id),
  status VARCHAR(32) NOT NULL DEFAULT 'Active',
  credit_locked BOOLEAN NOT NULL DEFAULT FALSE,
  max_members INT NOT NULL DEFAULT 4 CHECK (max_members BETWEEN 1 AND 4),
  daily_credit_quota INT NOT NULL DEFAULT 1 CHECK (daily_credit_quota IN (0, 1)),
  renewal_date VARCHAR(40) NOT NULL
);

CREATE TABLE IF NOT EXISTS membership_group_members (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES membership_groups(id) ON DELETE CASCADE,
  user_id TEXT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(24) NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'Linked Crew',
  slot_number INT NOT NULL CHECK (slot_number BETWEEN 1 AND 4),
  avatar VARCHAR(8) NOT NULL,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (group_id, slot_number)
);

CREATE TABLE IF NOT EXISTS daily_credit_ledgers (
  id TEXT PRIMARY KEY,
  group_id TEXT NOT NULL REFERENCES membership_groups(id) ON DELETE CASCADE,
  credit_date VARCHAR(16) NOT NULL,
  redeemed_by_user_id TEXT NOT NULL REFERENCES users(id),
  redeemed_by_name VARCHAR(120) NOT NULL,
  booking_id TEXT UNIQUE,
  venue_id TEXT NOT NULL,
  venue_name VARCHAR(160) NOT NULL,
  time_slot VARCHAR(32) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'REDEEMED' CHECK (status IN ('REDEEMED', 'RESTORED')),
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevents redeeming a group's shared daily credit more than once per calendar day
CREATE UNIQUE INDEX IF NOT EXISTS uq_group_daily_credit_once
  ON daily_credit_ledgers (group_id, credit_date)
  WHERE status = 'REDEEMED';

-- 4. VENUES, COURTS & BOOKINGS
CREATE TABLE IF NOT EXISTS venues (
  id VARCHAR(64) PRIMARY KEY,
  slug VARCHAR(140) UNIQUE NOT NULL,
  name VARCHAR(160) NOT NULL,
  area VARCHAR(120) NOT NULL,
  city VARCHAR(80) NOT NULL,
  address TEXT NOT NULL,
  sports_json TEXT NOT NULL,
  primary_sport VARCHAR(32) NOT NULL,
  rating NUMERIC(2,1) NOT NULL,
  review_count INT NOT NULL,
  price_per_hour INT NOT NULL,
  tag VARCHAR(64) NOT NULL,
  image TEXT NOT NULL,
  gallery_json TEXT NOT NULL,
  description TEXT NOT NULL,
  opening_hours VARCHAR(120) NOT NULL,
  facilities_json TEXT NOT NULL,
  participating_in_credits BOOLEAN NOT NULL DEFAULT TRUE,
  operational_status VARCHAR(32) NOT NULL DEFAULT 'Open',
  occupancy_pct INT NOT NULL DEFAULT 85
);

CREATE TABLE IF NOT EXISTS courts (
  id VARCHAR(64) PRIMARY KEY,
  venue_id VARCHAR(64) NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  name VARCHAR(140) NOT NULL,
  sport VARCHAR(32) NOT NULL,
  surface VARCHAR(100) NOT NULL,
  indoor BOOLEAN NOT NULL DEFAULT FALSE,
  price_per_hour INT NOT NULL,
  slots_template_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS bookings (
  id VARCHAR(32) PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  venue_id VARCHAR(64) NOT NULL REFERENCES venues(id),
  venue_name VARCHAR(160) NOT NULL,
  venue_area VARCHAR(140) NOT NULL,
  court_id VARCHAR(64) NOT NULL REFERENCES courts(id),
  court_name VARCHAR(140) NOT NULL,
  sport VARCHAR(32) NOT NULL,
  play_date VARCHAR(16) NOT NULL,
  time_slot VARCHAR(32) NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 60,
  player_name VARCHAR(120) NOT NULL,
  player_email VARCHAR(255) NOT NULL,
  player_phone VARCHAR(24) NOT NULL,
  total_price INT NOT NULL,
  paid_with_credit BOOLEAN NOT NULL DEFAULT FALSE,
  group_id TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'Confirmed',
  created_at VARCHAR(16) NOT NULL,
  notes TEXT
);

-- Prevents double booking of the same court, play_date, and time_slot concurrently
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_court_booking_slot
  ON bookings (court_id, play_date, time_slot)
  WHERE status IN ('Pending', 'Confirmed', 'Upcoming', 'Cancellation Requested');

