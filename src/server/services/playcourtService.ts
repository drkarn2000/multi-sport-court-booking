import crypto from "node:crypto";
import { getDb, runImmediateTransaction } from "@/server/db";
import { AuthenticatedUser } from "@/server/auth/service";
import {
  assertLocalDevEnvironment,
  isLocalDevEnvironment,
} from "@/server/utils/env";
import { AppError, getTodayIstDate } from "@/server/utils/http";
import { domainMutex } from "@/server/utils/mutex";
import {
  BookingRecord,
  Court,
  GroupMembershipState,
  LinkedMember,
  MembershipPlan,
  OpenMatch,
  PlayEvent,
  PlayerProfileData,
  SportType,
  Venue,
} from "@/types/playcourt";

const SEEDED_BOOKING_IDS = new Set(["PC-10482", "PC-10485", "PC-10410"]);

/**
 * Parses a slot label like "10:00–11:00" or "10:30-11:30" into [startMinutes, endMinutes].
 */
export function parseSlotRangeMinutes(slot: string): [number, number] | null {
  const m = slot
    .trim()
    .match(/^(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const start = Number(m[1]) * 60 + Number(m[2]);
  const end = Number(m[3]) * 60 + Number(m[4]);
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return null;
  return [start, end];
}

export function doTimeSlotsOverlap(slotA: string, slotB: string): boolean {
  if (slotA.trim() === slotB.trim()) return true;
  const rA = parseSlotRangeMinutes(slotA);
  const rB = parseSlotRangeMinutes(slotB);
  if (!rA || !rB) return false;
  return rA[0] < rB[1] && rB[0] < rA[1];
}

/**
 * Queries all venues and courts, computing real-time slot availability from
 * active bookings and maintenance blocks.
 */
export function getVenuesWithLiveAvailability(dateFilter?: string): Venue[] {
  const db = getDb();

  const venueRows = db
    .prepare(
      `SELECT id, slug, name, area, city, address, sports_json, primary_sport,
              rating, review_count, price_per_hour, tag, image, gallery_json,
              description, opening_hours, facilities_json, participating_in_credits,
              operational_status, occupancy_pct
       FROM venues
       ORDER BY id ASC`
    )
    .all() as Array<{
    id: string;
    slug: string;
    name: string;
    area: string;
    city: string;
    address: string;
    sports_json: string;
    primary_sport: SportType;
    rating: number;
    review_count: number;
    price_per_hour: number;
    tag: string;
    image: string;
    gallery_json: string;
    description: string;
    opening_hours: string;
    facilities_json: string;
    participating_in_credits: number;
    operational_status: string;
    occupancy_pct: number;
  }>;

  const courtRows = db
    .prepare(
      `SELECT id, venue_id, name, sport, surface, indoor, price_per_hour, slots_template_json
       FROM courts
       ORDER BY id ASC`
    )
    .all() as Array<{
    id: string;
    venue_id: string;
    name: string;
    sport: SportType;
    surface: string;
    indoor: number;
    price_per_hour: number;
    slots_template_json: string;
  }>;

  // Query active bookings (either matching dateFilter if provided, or any runtime bookings created after initial seed)
  const activeBookingRows = db
    .prepare(
      `SELECT id, court_id, play_date, time_slot
       FROM bookings
       WHERE status IN ('Pending', 'Confirmed', 'Upcoming', 'Cancellation Requested')`
    )
    .all() as Array<{
    id: string;
    court_id: string;
    play_date: string;
    time_slot: string;
  }>;

  const maintenanceBlocks = db
    .prepare(
      `SELECT court_id, block_date, time_slot
       FROM court_maintenance_blocks`
    )
    .all() as Array<{
    court_id: string;
    block_date: string;
    time_slot: string;
  }>;

  const occupiedIntervalsByCourt = new Map<string, string[]>();
  const addOccupied = (courtId: string, timeSlot: string) => {
    const arr = occupiedIntervalsByCourt.get(courtId) || [];
    arr.push(timeSlot);
    occupiedIntervalsByCourt.set(courtId, arr);
  };

  for (const b of activeBookingRows) {
    if (dateFilter) {
      if (b.play_date === dateFilter) {
        addOccupied(b.court_id, b.time_slot);
      }
    } else if (!SEEDED_BOOKING_IDS.has(b.id)) {
      addOccupied(b.court_id, b.time_slot);
    }
  }

  for (const mb of maintenanceBlocks) {
    if (!dateFilter || mb.block_date === dateFilter) {
      addOccupied(mb.court_id, mb.time_slot);
    }
  }

  const courtsByVenue = new Map<string, Court[]>();
  for (const c of courtRows) {
    const rawSlots = JSON.parse(c.slots_template_json) as Array<{
      time: string;
      available: boolean;
      peak?: boolean;
    }>;

    const courtOccupied = occupiedIntervalsByCourt.get(c.id) || [];

    const liveSlots = rawSlots.map((s) => ({
      ...s,
      available:
        s.available &&
        !courtOccupied.some((occ) => doTimeSlotsOverlap(s.time, occ)),
    }));

    const courtObj: Court = {
      id: c.id,
      name: c.name,
      sport: c.sport,
      surface: c.surface,
      indoor: Boolean(c.indoor),
      pricePerHour: c.price_per_hour,
      slots: liveSlots,
    };

    const existing = courtsByVenue.get(c.venue_id) || [];
    existing.push(courtObj);
    courtsByVenue.set(c.venue_id, existing);
  }

  return venueRows.map((v) => ({
    id: v.id,
    slug: v.slug,
    name: v.name,
    area: v.area,
    city: v.city,
    address: v.address,
    sports: JSON.parse(v.sports_json) as SportType[],
    primarySport: v.primary_sport,
    rating: v.rating,
    reviewCount: v.review_count,
    pricePerHour: v.price_per_hour,
    tag: v.tag,
    image: v.image,
    gallery: JSON.parse(v.gallery_json) as string[],
    description: v.description,
    openingHours: v.opening_hours,
    facilities: JSON.parse(v.facilities_json) as string[],
    participatingInCredits: Boolean(v.participating_in_credits),
    courts: courtsByVenue.get(v.id) || [],
  }));
}

export function getMembershipPlansFromDb(): MembershipPlan[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, name, badge, price_inr, cycle, featured,
              max_linked_members, shared_daily_credits, description, features_json
       FROM membership_plans`
    )
    .all() as Array<{
    id: string;
    name: string;
    badge: string;
    price_inr: number;
    cycle: "month" | "year";
    featured: number;
    max_linked_members: number;
    shared_daily_credits: number;
    description: string;
    features_json: string;
  }>;

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    badge: r.badge,
    price: r.price_inr,
    cycle: r.cycle,
    featured: Boolean(r.featured),
    description: r.description,
    maxLinkedMembers: r.max_linked_members,
    sharedDailyCredits: r.shared_daily_credits,
    features: JSON.parse(r.features_json) as string[],
  }));
}

export function getGroupMembershipState(
  creditDate: string = getTodayIstDate()
): GroupMembershipState {
  const db = getDb();

  const groupRow = db
    .prepare(
      `SELECT g.id, g.code, g.name, g.plan_id, g.status, g.credit_locked,
              g.max_members, g.daily_credit_quota, g.renewal_date,
              p.name as plan_name
       FROM membership_groups g
       JOIN membership_plans p ON p.id = g.plan_id
       WHERE g.id = 'GRP-ATLAS-01'`
    )
    .get() as {
    id: string;
    code: string;
    name: string;
    plan_id: string;
    status: "Active" | "Payment Overdue" | "Inactive";
    credit_locked: number;
    max_members: number;
    daily_credit_quota: number;
    renewal_date: string;
    plan_name: string;
  };

  const memberRows = db
    .prepare(
      `SELECT id, user_id, name, email, phone, role, slot_number, avatar
       FROM membership_group_members
       WHERE group_id = ?
       ORDER BY slot_number ASC`
    )
    .all(groupRow.id) as Array<{
    id: string;
    user_id: string;
    name: string;
    email: string;
    phone: string;
    role: "Primary Holder" | "Linked Crew";
    slot_number: number;
    avatar: string;
  }>;

  // Check if a daily credit has been redeemed for today (or latest active redemption)
  const ledgerRow = db
    .prepare(
      `SELECT id, redeemed_by_user_id, redeemed_by_name, venue_name, time_slot
       FROM daily_credit_ledgers
       WHERE group_id = ? AND credit_date = ? AND status = 'REDEEMED'
       LIMIT 1`
    )
    .get(groupRow.id, creditDate) as
    | {
        id: string;
        redeemed_by_user_id: string;
        redeemed_by_name: string;
        venue_name: string;
        time_slot: string;
      }
    | undefined;

  const members: LinkedMember[] = memberRows.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    phone: m.phone,
    role: m.role,
    avatar: m.avatar,
    usedCreditToday: ledgerRow
      ? m.user_id === ledgerRow.redeemed_by_user_id ||
        m.name === ledgerRow.redeemed_by_name
      : false,
  }));

  return {
    groupId: groupRow.code,
    groupName: groupRow.name,
    planId: groupRow.plan_id,
    planName: groupRow.plan_name,
    status: groupRow.status,
    renewalDate: groupRow.renewal_date,
    maxMembers: groupRow.max_members,
    dailyCreditTotal: groupRow.daily_credit_quota,
    dailyCreditUsed: ledgerRow ? 1 : 0,
    creditUsedBy: ledgerRow?.redeemed_by_name,
    creditUsedVenue: ledgerRow?.venue_name,
    creditUsedTime: ledgerRow?.time_slot,
    members,
  };
}

export function getBookingsFromDb(): BookingRecord[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, venue_id, venue_name, venue_area, court_id, court_name,
              sport, play_date, time_slot, duration_minutes, player_name,
              player_email, player_phone, total_price, paid_with_credit,
              status, created_at, notes
       FROM bookings
       ORDER BY rowid DESC`
    )
    .all() as Array<{
    id: string;
    venue_id: string;
    venue_name: string;
    venue_area: string;
    court_id: string;
    court_name: string;
    sport: SportType;
    play_date: string;
    time_slot: string;
    duration_minutes: number;
    player_name: string;
    player_email: string;
    player_phone: string;
    total_price: number;
    paid_with_credit: number;
    status: BookingRecord["status"];
    created_at: string;
    notes: string | null;
  }>;

  return rows.map((r) => ({
    id: r.id,
    venueId: r.venue_id,
    venueName: r.venue_name,
    venueArea: r.venue_area,
    courtId: r.court_id,
    courtName: r.court_name,
    sport: r.sport,
    date: r.play_date,
    timeSlot: r.time_slot,
    durationMinutes: r.duration_minutes,
    playerName: r.player_name,
    playerEmail: r.player_email,
    playerPhone: r.player_phone,
    totalPrice: r.total_price,
    paidWithCredit: Boolean(r.paid_with_credit),
    status: r.status,
    createdAt: r.created_at,
    notes: r.notes || undefined,
  }));
}

export function getOpenMatchesFromDb(currentUserId?: string): OpenMatch[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, venue_id, venue_name, area, host_user_id, host_name, host_rating,
              title, sport, skill_level, date_time, total_spots, filled_spots,
              price_per_player, description
       FROM open_matches
       ORDER BY rowid DESC`
    )
    .all() as Array<{
    id: string;
    venue_id: string;
    venue_name: string;
    area: string;
    host_user_id: string;
    host_name: string;
    host_rating: number;
    title: string;
    sport: SportType;
    skill_level: "Beginner" | "Intermediate" | "Advanced";
    date_time: string;
    total_spots: number;
    filled_spots: number;
    price_per_player: number;
    description: string;
  }>;

  const joinedMatchIds = new Set<string>();
  if (currentUserId) {
    const joinedRows = db
      .prepare(
        "SELECT match_id FROM open_match_participants WHERE user_id = ?"
      )
      .all(currentUserId) as Array<{ match_id: string }>;
    for (const j of joinedRows) {
      joinedMatchIds.add(j.match_id);
    }
  }

  return rows.map((m) => ({
    id: m.id,
    title: m.title,
    sport: m.sport,
    skillLevel: m.skill_level,
    venueId: m.venue_id,
    venueName: m.venue_name,
    area: m.area,
    dateTime: m.date_time,
    totalSpots: m.total_spots,
    filledSpots: m.filled_spots,
    hostName: m.host_name,
    hostRating: m.host_rating,
    pricePerPlayer: m.price_per_player,
    joinedByCurrentUser: joinedMatchIds.has(m.id),
    description: m.description,
  }));
}

export function getEventsFromDb(currentUserId?: string): PlayEvent[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, venue_id, venue_name, title, category, sport, date_label,
              full_date, time_label, price, total_spots, spots_left, image,
              description, highlights_json, coach_or_organizer
       FROM events
       ORDER BY rowid ASC`
    )
    .all() as Array<{
    id: string;
    venue_id: string;
    venue_name: string;
    title: string;
    category: "Tournament" | "Coaching" | "Social";
    sport: SportType;
    date_label: string;
    full_date: string;
    time_label: string;
    price: number;
    total_spots: number;
    spots_left: number;
    image: string;
    description: string;
    highlights_json: string;
    coach_or_organizer: string;
  }>;

  const registeredEventIds = new Set<string>();
  if (currentUserId) {
    const regRows = db
      .prepare("SELECT event_id FROM event_registrations WHERE user_id = ?")
      .all(currentUserId) as Array<{ event_id: string }>;
    for (const r of regRows) {
      registeredEventIds.add(r.event_id);
    }
  }

  return rows.map((ev) => ({
    id: ev.id,
    title: ev.title,
    category: ev.category,
    sport: ev.sport,
    dateLabel: ev.date_label,
    fullDate: ev.full_date,
    time: ev.time_label,
    venueId: ev.venue_id,
    venueName: ev.venue_name,
    price: ev.price,
    totalSpots: ev.total_spots,
    spotsLeft: ev.spots_left,
    image: ev.image,
    description: ev.description,
    highlights: JSON.parse(ev.highlights_json) as string[],
    coachOrOrganizer: ev.coach_or_organizer,
    registered: registeredEventIds.has(ev.id),
  }));
}

export function getPlayerProfileFromDb(userId: string = "usr-aarav"): PlayerProfileData {
  const db = getDb();

  const userRow =
    (db
      .prepare("SELECT id, phone, email, full_name FROM users WHERE id = ?")
      .get(userId) as
      | { id: string; phone: string; email: string | null; full_name: string }
      | undefined) ||
    (db
      .prepare("SELECT id, phone, email, full_name FROM users WHERE id = 'usr-aarav'")
      .get() as { id: string; phone: string; email: string | null; full_name: string });

  const profileRow =
    (db
      .prepare(
        `SELECT city, member_since, preferred_sports_json, skill_levels_json,
                matches_played, hours_on_court
         FROM player_profiles WHERE user_id = ?`
      )
      .get(userRow.id) as
      | {
          city: string;
          member_since: string;
          preferred_sports_json: string;
          skill_levels_json: string;
          matches_played: number;
          hours_on_court: number;
        }
      | undefined) ||
    (db
      .prepare(
        `SELECT city, member_since, preferred_sports_json, skill_levels_json,
                matches_played, hours_on_court
         FROM player_profiles WHERE user_id = 'usr-aarav'`
      )
      .get() as {
      city: string;
      member_since: string;
      preferred_sports_json: string;
      skill_levels_json: string;
      matches_played: number;
      hours_on_court: number;
    });

  const favRows = db
    .prepare("SELECT venue_id FROM player_favourite_venues WHERE user_id = ?")
    .all(userRow.id) as Array<{ venue_id: string }>;

  return {
    id: userRow.id,
    name: userRow.full_name,
    email: userRow.email || "aarav.m@example.com",
    phone: userRow.phone,
    city: profileRow.city,
    memberSince: profileRow.member_since,
    preferredSports: JSON.parse(profileRow.preferred_sports_json) as SportType[],
    skillLevels: JSON.parse(profileRow.skill_levels_json) as Record<
      SportType,
      "Beginner" | "Intermediate" | "Advanced"
    >,
    matchesPlayed: profileRow.matches_played,
    hoursOnCourt: profileRow.hours_on_court,
    favouriteVenueIds: favRows.map((f) => f.venue_id),
  };
}

export function getBootstrapState(
  user: AuthenticatedUser | null,
  dateFilter?: string,
  sessionState?: string
) {
  const effectiveUserId = user?.id || "usr-aarav";
  return {
    venues: getVenuesWithLiveAvailability(dateFilter),
    membershipPlans: getMembershipPlansFromDb(),
    groupMembership: getGroupMembershipState(),
    bookings: getBookingsFromDb(),
    matches: getOpenMatchesFromDb(effectiveUserId),
    events: getEventsFromDb(effectiveUserId),
    profile: getPlayerProfileFromDb(effectiveUserId),
    isAuthenticated: Boolean(user),
    currentUser: user,
    sessionState: sessionState || (user ? "ACTIVE_COOKIE" : "LOGGED_OUT"),
    serverDateIst: getTodayIstDate(),
    timezone: process.env.APP_TIMEZONE || "Asia/Kolkata",
    localDevMode: isLocalDevEnvironment(),
  };
}

export interface CreateBookingInput {
  venueId: string;
  courtId: string;
  date: string;
  timeSlot: string;
  playerName: string;
  playerEmail: string;
  playerPhone: string;
  useGroupCredit: boolean;
  notes?: string;
  paymentOutcome?: "SUCCESS" | "FAILED" | "CANCELLED";
  idempotencyKey?: string;
}

/**
 * Atomically creates a court booking and (if requested) redeems the shared daily group credit.
 *
 * Enforces strict race-condition invariants:
 * 1. Two users cannot book the same or overlapping (courtId, date, timeSlot) concurrently.
 * 2. Two linked group members cannot redeem the group's 1 daily credit on the same calendar date (`uq_group_daily_credit_once`).
 * 3. Supports local simulated payment outcomes (SUCCESS, FAILED, CANCELLED) and idempotency keys.
 */
export async function createBookingAtomic(
  user: AuthenticatedUser,
  input: CreateBookingInput
): Promise<{
  booking: BookingRecord;
  groupMembership: GroupMembershipState;
  paymentTxCode?: string;
  duplicateReplay?: boolean;
}> {
  const creditDate = getTodayIstDate();
  const lockKeys = [`court:${input.courtId}:${input.date}`];
  if (input.useGroupCredit) {
    lockKeys.push(`credit:GRP-ATLAS-01:${creditDate}`);
  }

  // Handle simulated user cancellation before acquiring DB write lock
  if (
    !input.useGroupCredit &&
    isLocalDevEnvironment() &&
    input.paymentOutcome === "CANCELLED"
  ) {
    throw new AppError(
      "PAYMENT_CANCELLED",
      "Payment checkout was cancelled in Simulated Local Sandbox. No amount was charged and the court slot remains available.",
      400
    );
  }

  return domainMutex.runExclusive(lockKeys, () => {
    // Handle simulated bank failure: record Failed transaction in payments table, then throw 402 without reserving slot
    if (
      !input.useGroupCredit &&
      isLocalDevEnvironment() &&
      input.paymentOutcome === "FAILED"
    ) {
      const db = getDb();
      const courtRow = db
        .prepare("SELECT price_per_hour FROM courts WHERE id = ?")
        .get(input.courtId) as { price_per_hour: number } | undefined;
      const failedTxCode = `TX-FAIL-${Date.now().toString().slice(-5)}`;
      db.prepare(
        `INSERT INTO payments (
           id, tx_code, user_id, customer_name, booking_id, purpose,
           amount_inr, status, idempotency_key, date_label
         ) VALUES (?, ?, ?, ?, NULL, 'Court booking (Declined)', ?, 'Failed', ?, ?)`
      ).run(
        `pay-${crypto.randomUUID().slice(0, 8)}`,
        failedTxCode,
        user.id,
        input.playerName,
        courtRow?.price_per_hour || 850,
        input.idempotencyKey || `idem-fail-${crypto.randomUUID()}`,
        creditDate
      );
      throw new AppError(
        "PAYMENT_FAILED",
        `Simulated bank decline (${failedTxCode}). No court reservation was created — check Admin Console → Payments to inspect the failed transaction.`,
        402,
        { txCode: failedTxCode }
      );
    }

    return runImmediateTransaction((db) => {
      // Idempotency check if client supplied an idempotencyKey
      if (input.idempotencyKey) {
        const existingPay = db
          .prepare(
            "SELECT booking_id, tx_code FROM payments WHERE idempotency_key = ? AND status = 'Paid'"
          )
          .get(input.idempotencyKey) as
          | { booking_id: string | null; tx_code: string }
          | undefined;

        if (existingPay?.booking_id) {
          const existingB = getBookingsFromDb().find(
            (b) => b.id === existingPay.booking_id
          );
          if (existingB) {
            return {
              booking: existingB,
              groupMembership: getGroupMembershipState(creditDate),
              paymentTxCode: existingPay.tx_code,
              duplicateReplay: true,
            };
          }
        }
      }

      const venueRow = db
        .prepare(
          "SELECT id, name, area, city, participating_in_credits, operational_status FROM venues WHERE id = ?"
        )
        .get(input.venueId) as
        | {
            id: string;
            name: string;
            area: string;
            city: string;
            participating_in_credits: number;
            operational_status: string;
          }
        | undefined;

      if (!venueRow) {
        throw new AppError("NOT_FOUND", "Selected venue was not found.", 404);
      }

      const courtRow = db
        .prepare(
          "SELECT id, venue_id, name, sport, price_per_hour FROM courts WHERE id = ? AND venue_id = ?"
        )
        .get(input.courtId, input.venueId) as
        | {
            id: string;
            venue_id: string;
            name: string;
            sport: SportType;
            price_per_hour: number;
          }
        | undefined;

      if (!courtRow) {
        throw new AppError(
          "NOT_FOUND",
          "Selected court was not found at this venue.",
          404
        );
      }

      // 1. Check Maintenance Blocks (exact match + time-range overlap)
      const maintenanceBlocksOnDate = db
        .prepare(
          `SELECT id, time_slot, reason FROM court_maintenance_blocks
           WHERE court_id = ? AND block_date = ?`
        )
        .all(input.courtId, input.date) as Array<{
        id: string;
        time_slot: string;
        reason: string;
      }>;

      const overlappingBlock = maintenanceBlocksOnDate.find((mb) =>
        doTimeSlotsOverlap(input.timeSlot, mb.time_slot)
      );

      if (overlappingBlock) {
        throw new AppError(
          "SLOT_UNDER_MAINTENANCE",
          `Court is blocked for maintenance during ${overlappingBlock.time_slot} (${overlappingBlock.reason}).`,
          409
        );
      }

      // 2. Check existing active bookings on (court_id, play_date) for exact or overlapping slot
      const activeBookingsOnDate = db
        .prepare(
          `SELECT id, time_slot, player_name FROM bookings
           WHERE court_id = ? AND play_date = ?
             AND status IN ('Pending', 'Confirmed', 'Upcoming', 'Cancellation Requested')`
        )
        .all(input.courtId, input.date) as Array<{
        id: string;
        time_slot: string;
        player_name: string;
      }>;

      const overlappingBooking = activeBookingsOnDate.find((b) =>
        doTimeSlotsOverlap(input.timeSlot, b.time_slot)
      );

      if (overlappingBooking) {
        throw new AppError(
          "SLOT_ALREADY_BOOKED",
          `Court ${courtRow.name} on ${input.date} overlaps an active reservation (${overlappingBooking.time_slot}, Ref: ${overlappingBooking.id}).`,
          409
        );
      }

      // Generate booking ID
      const countRow = db
        .prepare("SELECT COUNT(*) as cnt FROM bookings")
        .get() as { cnt: number };
      const bookingId = `PC-${10483 + countRow.cnt}`;
      let paidWithCredit = false;
      let finalPrice = courtRow.price_per_hour;

      // 3. Handle Shared Daily Credit Redemption (Atomic Ledger Insert)
      if (input.useGroupCredit) {
        if (!venueRow.participating_in_credits) {
          throw new AppError(
            "VENUE_NOT_CREDIT_ELIGIBLE",
            `${venueRow.name} does not participate in shared daily credits.`,
            422
          );
        }

        const groupRow = db
          .prepare(
            `SELECT id, name, status, credit_locked, daily_credit_quota
             FROM membership_groups
             WHERE id = 'GRP-ATLAS-01'`
          )
          .get() as {
          id: string;
          name: string;
          status: string;
          credit_locked: number;
          daily_credit_quota: number;
        };

        if (
          groupRow.status !== "Active" ||
          groupRow.credit_locked === 1 ||
          groupRow.daily_credit_quota <= 0
        ) {
          throw new AppError(
            "GROUP_CREDIT_LOCKED",
            "Group membership is not eligible for daily credit redemption.",
            403
          );
        }

        try {
          db.prepare(
            `INSERT INTO daily_credit_ledgers (
               id, group_id, credit_date, redeemed_by_user_id, redeemed_by_name,
               booking_id, venue_id, venue_name, time_slot, status
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'REDEEMED')`
          ).run(
            `dcl-${crypto.randomUUID().slice(0, 8)}`,
            groupRow.id,
            creditDate,
            user.id,
            input.playerName,
            bookingId,
            venueRow.id,
            venueRow.name,
            input.timeSlot
          );
          paidWithCredit = true;
          finalPrice = 0;
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          if (msg.includes("UNIQUE constraint failed")) {
            throw new AppError(
              "GROUP_DAILY_CREDIT_ALREADY_USED",
              "Today's shared group credit has already been redeemed by another linked member.",
              409
            );
          }
          throw err;
        }
      }

      const createdAt = creditDate;
      const notes =
        input.notes ||
        (paidWithCredit
          ? "Shared Group Atlas daily credit redeemed."
          : "Standard paid court reservation.");
      const venueArea = `${venueRow.area} · ${venueRow.city}`;

      // 4. Insert Booking (protected by uq_active_court_booking_slot)
      try {
        db.prepare(
          `INSERT INTO bookings (
             id, user_id, venue_id, venue_name, venue_area, court_id, court_name,
             sport, play_date, time_slot, duration_minutes, player_name,
             player_email, player_phone, total_price, paid_with_credit,
             group_id, status, created_at, notes
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 60, ?, ?, ?, ?, ?, ?, 'Confirmed', ?, ?)`
        ).run(
          bookingId,
          user.id,
          venueRow.id,
          venueRow.name,
          venueArea,
          courtRow.id,
          courtRow.name,
          courtRow.sport,
          input.date,
          input.timeSlot,
          input.playerName,
          input.playerEmail,
          input.playerPhone,
          finalPrice,
          paidWithCredit ? 1 : 0,
          paidWithCredit ? "GRP-ATLAS-01" : null,
          createdAt,
          notes
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("UNIQUE constraint failed")) {
          throw new AppError(
            "SLOT_ALREADY_BOOKED",
            `Court ${courtRow.name} at ${input.timeSlot} on ${input.date} was just booked by another player.`,
            409
          );
        }
        throw err;
      }

      // 5. Record Payment Transaction if Paid Booking
      let paymentTxCode: string | undefined;
      if (!paidWithCredit && finalPrice > 0) {
        paymentTxCode = `TX-${93822 + countRow.cnt}`;
        db.prepare(
          `INSERT INTO payments (
             id, tx_code, user_id, customer_name, booking_id, purpose,
             amount_inr, status, idempotency_key, date_label
           ) VALUES (?, ?, ?, ?, ?, 'Court booking (Simulated)', ?, 'Paid', ?, ?)`
        ).run(
          `pay-${crypto.randomUUID().slice(0, 8)}`,
          paymentTxCode,
          user.id,
          input.playerName,
          bookingId,
          finalPrice,
          input.idempotencyKey || `idem-${bookingId}`,
          creditDate
        );
      }

      const booking: BookingRecord = {
        id: bookingId,
        venueId: venueRow.id,
        venueName: venueRow.name,
        venueArea,
        courtId: courtRow.id,
        courtName: courtRow.name,
        sport: courtRow.sport,
        date: input.date,
        timeSlot: input.timeSlot,
        durationMinutes: 60,
        playerName: input.playerName,
        playerEmail: input.playerEmail,
        playerPhone: input.playerPhone,
        totalPrice: finalPrice,
        paidWithCredit,
        status: "Confirmed",
        createdAt,
        notes,
      };

      return {
        booking,
        groupMembership: getGroupMembershipState(creditDate),
        paymentTxCode,
      };
    });
  });
}

export function requestBookingCancellation(
  user: AuthenticatedUser,
  bookingId: string,
  reason?: string
): BookingRecord {
  return runImmediateTransaction((db) => {
    const existing = db
      .prepare("SELECT id, status FROM bookings WHERE id = ?")
      .get(bookingId) as { id: string; status: string } | undefined;

    if (!existing) {
      throw new AppError("NOT_FOUND", `Booking ${bookingId} not found.`, 404);
    }

    const noteText = reason
      ? `Cancellation reason: ${reason}`
      : "Cancellation requested by player.";

    db.prepare(
      `UPDATE bookings
       SET status = 'Cancellation Requested', notes = ?
       WHERE id = ?`
    ).run(noteText, bookingId);

    db.prepare(
      `INSERT OR REPLACE INTO booking_cancellations (
         id, booking_id, requested_by_user_id, reason, review_status
       ) VALUES (?, ?, ?, ?, 'PENDING')`
    ).run(
      `can-${bookingId}`,
      bookingId,
      user.id,
      reason || "Requested by player"
    );

    const updated = getBookingsFromDb().find((b) => b.id === bookingId);
    if (!updated) {
      throw new AppError("NOT_FOUND", "Updated booking not found.", 404);
    }
    return updated;
  });
}

/**
 * Atomically links a new player account to Group Atlas (strictly max 4 accounts).
 * Protected by mutex + BEGIN IMMEDIATE + slot_number CHECK (1..4) and UNIQUE(group_id, slot_number).
 */
export async function addGroupMemberAtomic(params: {
  name: string;
  email: string;
  phone: string;
}): Promise<{ member: LinkedMember; groupMembership: GroupMembershipState }> {
  return domainMutex.runExclusive(["group-members:GRP-ATLAS-01"], () => {
    return runImmediateTransaction((db) => {
      const existingMembers = db
        .prepare(
          `SELECT id, slot_number, email, phone
           FROM membership_group_members
           WHERE group_id = 'GRP-ATLAS-01'
           ORDER BY slot_number ASC`
        )
        .all() as Array<{
        id: string;
        slot_number: number;
        email: string;
        phone: string;
      }>;

      if (existingMembers.length >= 4) {
        throw new AppError(
          "GROUP_MEMBER_LIMIT_REACHED",
          "Group limit reached: A group may link up to 4 player accounts.",
          409
        );
      }

      const usedSlots = new Set(existingMembers.map((m) => m.slot_number));
      let nextSlot = 1;
      while (usedSlots.has(nextSlot) && nextSlot <= 4) {
        nextSlot++;
      }

      if (nextSlot > 4) {
        throw new AppError(
          "GROUP_MEMBER_LIMIT_REACHED",
          "Group limit reached: All 4 slots in this group are occupied.",
          409
        );
      }

      const initials = params.name
        .trim()
        .split(/\s+/)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      // Ensure a user record exists for this linked member
      let userRow = db
        .prepare("SELECT id FROM users WHERE phone = ? OR email = ?")
        .get(params.phone.trim(), params.email.trim()) as
        | { id: string }
        | undefined;

      if (!userRow) {
        const newUserId = `usr-${crypto.randomUUID().slice(0, 8)}`;
        db.prepare(
          `INSERT INTO users (id, phone, email, full_name, role, status, last_active_label)
           VALUES (?, ?, ?, ?, 'PLAYER', 'ACTIVE', 'Today')`
        ).run(
          newUserId,
          params.phone.trim(),
          params.email.trim(),
          params.name.trim()
        );
        userRow = { id: newUserId };
      }

      const memberId = `m-${Date.now()}-${nextSlot}`;
      try {
        db.prepare(
          `INSERT INTO membership_group_members (
             id, group_id, user_id, name, email, phone, role, slot_number, avatar
           ) VALUES (?, 'GRP-ATLAS-01', ?, ?, ?, ?, 'Linked Crew', ?, ?)`
        ).run(
          memberId,
          userRow.id,
          params.name.trim(),
          params.email.trim(),
          params.phone.trim(),
          nextSlot,
          initials || "PL"
        );
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("UNIQUE") || msg.includes("CHECK")) {
          throw new AppError(
            "GROUP_MEMBER_LIMIT_REACHED",
            "Group limit reached or player already linked to a group.",
            409
          );
        }
        throw err;
      }

      const member: LinkedMember = {
        id: memberId,
        name: params.name.trim(),
        email: params.email.trim(),
        phone: params.phone.trim(),
        role: "Linked Crew",
        avatar: initials || "PL",
        usedCreditToday: false,
      };

      return {
        member,
        groupMembership: getGroupMembershipState(),
      };
    });
  });
}

export function removeGroupMemberFromDb(memberId: string): GroupMembershipState {
  return runImmediateTransaction((db) => {
    const member = db
      .prepare(
        "SELECT id, role FROM membership_group_members WHERE id = ? AND group_id = 'GRP-ATLAS-01'"
      )
      .get(memberId) as { id: string; role: string } | undefined;

    if (!member) {
      throw new AppError("NOT_FOUND", "Linked member not found.", 404);
    }

    if (member.role === "Primary Holder") {
      throw new AppError(
        "VALIDATION_ERROR",
        "Primary holder cannot be removed from their own group.",
        400
      );
    }

    db.prepare("DELETE FROM membership_group_members WHERE id = ?").run(
      memberId
    );

    return getGroupMembershipState();
  });
}

export function selectMembershipPlanInDb(planId: string): GroupMembershipState {
  return runImmediateTransaction((db) => {
    const plan = db
      .prepare(
        "SELECT id, max_linked_members, shared_daily_credits FROM membership_plans WHERE id = ?"
      )
      .get(planId) as
      | {
          id: string;
          max_linked_members: number;
          shared_daily_credits: number;
        }
      | undefined;

    if (!plan) {
      throw new AppError("NOT_FOUND", `Plan ${planId} not found.`, 404);
    }

    db.prepare(
      `UPDATE membership_groups
       SET plan_id = ?, max_members = ?, daily_credit_quota = ?
       WHERE id = 'GRP-ATLAS-01'`
    ).run(plan.id, plan.max_linked_members, plan.shared_daily_credits);

    return getGroupMembershipState();
  });
}

export function toggleDailyCreditSimulationInDb(): GroupMembershipState {
  assertLocalDevEnvironment("Simulated daily credit toggle");
  const creditDate = getTodayIstDate();
  return runImmediateTransaction((db) => {
    const existing = db
      .prepare(
        `SELECT id FROM daily_credit_ledgers
         WHERE group_id = 'GRP-ATLAS-01' AND credit_date = ? AND status = 'REDEEMED'`
      )
      .get(creditDate) as { id: string } | undefined;

    if (existing) {
      db.prepare(
        "UPDATE daily_credit_ledgers SET status = 'RESTORED' WHERE id = ?"
      ).run(existing.id);
    } else {
      db.prepare(
        `INSERT INTO daily_credit_ledgers (
           id, group_id, credit_date, redeemed_by_user_id, redeemed_by_name,
           booking_id, venue_id, venue_name, time_slot, status
         ) VALUES (?, 'GRP-ATLAS-01', ?, 'usr-kabir', 'Kabir Sharma', NULL, 'v-1', 'The Green Racquet Club', '18:00–19:00', 'REDEEMED')`
      ).run(`dcl-sim-${Date.now()}`, creditDate);
    }

    return getGroupMembershipState(creditDate);
  });
}

export function createOpenMatchInDb(
  user: AuthenticatedUser,
  payload: {
    title: string;
    sport: SportType;
    skillLevel: "Beginner" | "Intermediate" | "Advanced";
    venueName: string;
    area: string;
    dateTime: string;
    totalSpots: number;
    pricePerPlayer: number;
    description: string;
  }
): OpenMatch {
  return runImmediateTransaction((db) => {
    const venueRow =
      (db
        .prepare("SELECT id, name, area FROM venues WHERE name = ?")
        .get(payload.venueName) as
        | { id: string; name: string; area: string }
        | undefined) ||
      (db
        .prepare("SELECT id, name, area FROM venues LIMIT 1")
        .get() as { id: string; name: string; area: string });

    const matchId = `m-${Date.now()}`;
    db.prepare(
      `INSERT INTO open_matches (
         id, venue_id, venue_name, area, host_user_id, host_name, host_rating,
         title, sport, skill_level, date_time, total_spots, filled_spots,
         price_per_player, description
       ) VALUES (?, ?, ?, ?, ?, ?, 4.9, ?, ?, ?, ?, ?, 1, ?, ?)`
    ).run(
      matchId,
      venueRow.id,
      payload.venueName,
      payload.area || venueRow.area,
      user.id,
      user.fullName,
      payload.title,
      payload.sport,
      payload.skillLevel,
      payload.dateTime,
      payload.totalSpots,
      payload.pricePerPlayer,
      payload.description
    );

    db.prepare(
      "INSERT OR IGNORE INTO open_match_participants (match_id, user_id) VALUES (?, ?)"
    ).run(matchId, user.id);

    return {
      id: matchId,
      title: payload.title,
      sport: payload.sport,
      skillLevel: payload.skillLevel,
      venueId: venueRow.id,
      venueName: payload.venueName,
      area: payload.area || venueRow.area,
      dateTime: payload.dateTime,
      totalSpots: payload.totalSpots,
      filledSpots: 1,
      hostName: user.fullName,
      hostRating: 4.9,
      pricePerPlayer: payload.pricePerPlayer,
      joinedByCurrentUser: true,
      description: payload.description,
    };
  });
}

export function toggleJoinOpenMatchInDb(
  user: AuthenticatedUser,
  matchId: string
): { match: OpenMatch; joined: boolean } {
  return runImmediateTransaction((db) => {
    const matchRow = db
      .prepare(
        "SELECT id, total_spots, filled_spots FROM open_matches WHERE id = ?"
      )
      .get(matchId) as
      | { id: string; total_spots: number; filled_spots: number }
      | undefined;

    if (!matchRow) {
      throw new AppError("NOT_FOUND", "Match not found.", 404);
    }

    const existingJoin = db
      .prepare(
        "SELECT match_id FROM open_match_participants WHERE match_id = ? AND user_id = ?"
      )
      .get(matchId, user.id) as { match_id: string } | undefined;

    let joined = false;
    if (existingJoin) {
      db.prepare(
        "DELETE FROM open_match_participants WHERE match_id = ? AND user_id = ?"
      ).run(matchId, user.id);
      const nextSpots = Math.max(1, matchRow.filled_spots - 1);
      db.prepare("UPDATE open_matches SET filled_spots = ? WHERE id = ?").run(
        nextSpots,
        matchId
      );
      joined = false;
    } else {
      if (matchRow.filled_spots >= matchRow.total_spots) {
        throw new AppError(
          "MATCH_FULL",
          "This open match has reached maximum player capacity.",
          409
        );
      }
      db.prepare(
        "INSERT INTO open_match_participants (match_id, user_id) VALUES (?, ?)"
      ).run(matchId, user.id);
      db.prepare(
        "UPDATE open_matches SET filled_spots = filled_spots + 1 WHERE id = ?"
      ).run(matchId);
      joined = true;
    }

    const updated = getOpenMatchesFromDb(user.id).find((m) => m.id === matchId)!;
    return { match: updated, joined };
  });
}

export function registerForEventInDb(
  user: AuthenticatedUser,
  eventId: string,
  partnerName?: string
): PlayEvent {
  return runImmediateTransaction((db) => {
    const eventRow = db
      .prepare("SELECT id, title, spots_left FROM events WHERE id = ?")
      .get(eventId) as
      | { id: string; title: string; spots_left: number }
      | undefined;

    if (!eventRow) {
      throw new AppError("NOT_FOUND", "Event not found.", 404);
    }

    const existingReg = db
      .prepare(
        "SELECT id FROM event_registrations WHERE event_id = ? AND user_id = ?"
      )
      .get(eventId, user.id) as { id: string } | undefined;

    if (existingReg) {
      return getEventsFromDb(user.id).find((e) => e.id === eventId)!;
    }

    if (eventRow.spots_left <= 0) {
      throw new AppError(
        "EVENT_FULL",
        `${eventRow.title} has no remaining spots.`,
        409
      );
    }

    db.prepare(
      `INSERT INTO event_registrations (id, event_id, user_id, partner_name)
       VALUES (?, ?, ?, ?)`
    ).run(
      `reg-${crypto.randomUUID().slice(0, 8)}`,
      eventId,
      user.id,
      partnerName || null
    );

    db.prepare(
      "UPDATE events SET spots_left = spots_left - 1 WHERE id = ?"
    ).run(eventId);

    return getEventsFromDb(user.id).find((e) => e.id === eventId)!;
  });
}

export function updatePlayerProfileInDb(
  user: AuthenticatedUser,
  patch: Partial<PlayerProfileData>
): PlayerProfileData {
  return runImmediateTransaction((db) => {
    const current = getPlayerProfileFromDb(user.id);

    const nextName = patch.name?.trim() || current.name;
    const nextEmail = patch.email?.trim() || current.email;
    const nextCity = patch.city?.trim() || current.city;
    const nextPreferredSports = patch.preferredSports || current.preferredSports;
    const nextSkillLevels = patch.skillLevels || current.skillLevels;

    db.prepare("UPDATE users SET full_name = ?, email = ? WHERE id = ?").run(
      nextName,
      nextEmail,
      current.id
    );

    db.prepare(
      `UPDATE player_profiles
       SET city = ?, preferred_sports_json = ?, skill_levels_json = ?, updated_at = datetime('now')
       WHERE user_id = ?`
    ).run(
      nextCity,
      JSON.stringify(nextPreferredSports),
      JSON.stringify(nextSkillLevels),
      current.id
    );

    return getPlayerProfileFromDb(current.id);
  });
}

export function toggleFavouriteVenueInDb(
  user: AuthenticatedUser,
  venueId: string
): { saved: boolean; favouriteVenueIds: string[] } {
  return runImmediateTransaction((db) => {
    const existing = db
      .prepare(
        "SELECT venue_id FROM player_favourite_venues WHERE user_id = ? AND venue_id = ?"
      )
      .get(user.id, venueId) as { venue_id: string } | undefined;

    let saved = false;
    if (existing) {
      db.prepare(
        "DELETE FROM player_favourite_venues WHERE user_id = ? AND venue_id = ?"
      ).run(user.id, venueId);
      saved = false;
    } else {
      db.prepare(
        "INSERT INTO player_favourite_venues (user_id, venue_id) VALUES (?, ?)"
      ).run(user.id, venueId);
      saved = true;
    }

    const profile = getPlayerProfileFromDb(user.id);
    return { saved, favouriteVenueIds: profile.favouriteVenueIds };
  });
}

/**
 * Records an immutable entry in `admin_audit_logs` and returns the latest audit log list.
 */
export function recordAdminAuditLog(
  adminUser: AuthenticatedUser,
  action: string,
  targetEntity: string,
  targetId: string,
  summary: string
) {
  const db = getDb();
  db.prepare(
    `INSERT INTO admin_audit_logs (
       id, actor_user_id, actor_name, actor_role, action, target_entity, target_id, summary
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    `aud-${Date.now()}-${crypto.randomUUID().slice(0, 4)}`,
    adminUser.id,
    adminUser.fullName,
    adminUser.role,
    action,
    targetEntity,
    targetId,
    summary
  );
}

/**
 * Returns live operational tables and audit logs for the Admin Console.
 */
export function getAdminDashboardData() {
  const db = getDb();

  const bookings = getBookingsFromDb().map((b) => [
    b.id,
    b.playerName,
    b.venueName,
    b.courtName,
    b.timeSlot,
    b.paidWithCredit ? "Credit (₹0)" : `₹${b.totalPrice.toLocaleString("en-IN")}`,
    b.status,
  ]);

  const venueRows = db
    .prepare(
      `SELECT v.id, v.name, v.city, v.operational_status, v.occupancy_pct,
              (SELECT COUNT(*) FROM courts c WHERE c.venue_id = v.id) as court_count
       FROM venues v
       ORDER BY v.id ASC`
    )
    .all() as Array<{
    id: string;
    name: string;
    city: string;
    operational_status: string;
    occupancy_pct: number;
    court_count: number;
  }>;

  const venues = venueRows.map((v) => [
    v.name,
    v.city,
    `${v.court_count} courts`,
    v.operational_status,
    `${v.occupancy_pct}%`,
  ]);

  const playerRows = db
    .prepare(
      `SELECT u.id, u.full_name, u.email, u.status, u.last_active_label,
              mg.name as group_name
       FROM users u
       LEFT JOIN membership_group_members mgm ON mgm.user_id = u.id
       LEFT JOIN membership_groups mg ON mg.id = mgm.group_id
       WHERE u.role = 'PLAYER'
       ORDER BY u.rowid ASC`
    )
    .all() as Array<{
    id: string;
    full_name: string;
    email: string | null;
    status: string;
    last_active_label: string;
    group_name: string | null;
  }>;

  const players = playerRows.map((p) => [
    p.full_name,
    p.email || "player@example.com",
    p.status === "SUSPENDED" ? "Suspended" : "Active",
    p.group_name || "Solo",
    p.last_active_label,
  ]);

  const groupState = getGroupMembershipState();
  const memberships = [
    [
      groupState.groupName,
      `${groupState.members.length} / ${groupState.maxMembers} linked members`,
      "Monthly",
      groupState.status,
      groupState.renewalDate,
      groupState.dailyCreditUsed > 0
        ? "1/1 credit used today"
        : "1/1 credit available",
    ],
    [
      "Northside Four",
      "4 / 4 linked members",
      "Annual",
      "Active",
      "02 Nov 2027",
      "1/1 credit used today",
    ],
    [
      "Riverside Trio",
      "3 / 4 linked members",
      "Monthly",
      "Payment overdue",
      "18 Oct 2026",
      "Credit locked",
    ],
  ];

  const paymentRows = db
    .prepare(
      `SELECT tx_code, customer_name, purpose, amount_inr, status, date_label
       FROM payments
       ORDER BY rowid DESC`
    )
    .all() as Array<{
    tx_code: string;
    customer_name: string;
    purpose: string;
    amount_inr: number;
    status: string;
    date_label: string;
  }>;

  const payments = paymentRows.map((p) => [
    p.tx_code,
    p.customer_name,
    p.purpose,
    `₹${p.amount_inr.toLocaleString("en-IN")}`,
    p.status,
    p.date_label,
  ]);

  const community = getOpenMatchesFromDb().map((m) => [
    `${m.title} · ${m.skillLevel}`,
    m.venueName,
    m.dateTime,
    `${m.filledSpots} / ${m.totalSpots}`,
    m.filledSpots >= m.totalSpots ? "Full" : "Open",
  ]);

  const events = getEventsFromDb().map((ev) => [
    ev.title,
    ev.category,
    ev.fullDate,
    `${ev.totalSpots - ev.spotsLeft} / ${ev.totalSpots}`,
    "Published",
  ]);

  const orderRows = db
    .prepare(
      `SELECT order_code, customer_name, items_summary, total_inr, fulfilment_status
       FROM shop_orders
       ORDER BY rowid ASC`
    )
    .all() as Array<{
    order_code: string;
    customer_name: string;
    items_summary: string;
    total_inr: number;
    fulfilment_status: string;
  }>;

  const commerce = orderRows.map((o) => [
    o.order_code,
    o.customer_name,
    o.items_summary,
    `₹${o.total_inr.toLocaleString("en-IN")}`,
    o.fulfilment_status,
  ]);

  const offerRows = db
    .prepare(
      `SELECT code, details, offer_type, status, redemption_summary
       FROM promotion_offers
       ORDER BY rowid ASC`
    )
    .all() as Array<{
    code: string;
    details: string;
    offer_type: string;
    status: string;
    redemption_summary: string;
  }>;

  const offers = offerRows.map((o) => [
    o.code,
    o.details,
    o.offer_type,
    o.status,
    o.redemption_summary,
  ]);

  const staffRows = db
    .prepare(
      `SELECT full_name, email, role, assigned_venue_id, status
       FROM users
       WHERE role IN ('PLATFORM_ADMIN', 'VENUE_MANAGER', 'FINANCE_OPERATOR')
       ORDER BY rowid ASC`
    )
    .all() as Array<{
    full_name: string;
    email: string | null;
    role: string;
    assigned_venue_id: string | null;
    status: string;
  }>;

  const team = staffRows.map((s) => [
    s.full_name,
    s.email || "staff@playcourt.demo",
    s.role === "PLATFORM_ADMIN"
      ? "Platform Admin"
      : s.role === "VENUE_MANAGER"
        ? "Venue Manager"
        : "Finance Operator",
    s.assigned_venue_id ? "The Green Racquet Club" : "All venues",
    s.status === "PENDING_INVITE" ? "Pending invite" : "Active",
  ]);

  const maintenanceRows = db
    .prepare(
      `SELECT mb.id, v.name as venue_name, c.name as court_name,
              mb.block_date, mb.time_slot, mb.reason
       FROM court_maintenance_blocks mb
       JOIN venues v ON v.id = mb.venue_id
       JOIN courts c ON c.id = mb.court_id
       ORDER BY mb.rowid DESC`
    )
    .all() as Array<{
    id: string;
    venue_name: string;
    court_name: string;
    block_date: string;
    time_slot: string;
    reason: string;
  }>;

  const auditRows = db
    .prepare(
      `SELECT summary FROM admin_audit_logs ORDER BY rowid DESC LIMIT 25`
    )
    .all() as Array<{ summary: string }>;

  return {
    tables: {
      bookings,
      venues,
      players,
      memberships,
      payments,
      community,
      events,
      commerce,
      offers,
      team,
    },
    maintenanceBlocks: maintenanceRows,
    auditLogs: auditRows.map((a) => a.summary),
  };
}

/**
 * Simulated Payment Webhook / Notification Handler with strict Idempotency.
 */
export function processSimulatedPaymentWebhook(params: {
  idempotencyKey: string;
  txCode?: string;
  customerName: string;
  amountInr: number;
  status: "Paid" | "Failed";
  bookingId?: string;
}) {
  assertLocalDevEnvironment("Simulated payment webhook");

  return runImmediateTransaction((db) => {
    const existing = db
      .prepare(
        "SELECT id, tx_code, status, amount_inr FROM payments WHERE idempotency_key = ?"
      )
      .get(params.idempotencyKey) as
      | { id: string; tx_code: string; status: string; amount_inr: number }
      | undefined;

    if (existing) {
      return {
        duplicate: true,
        txCode: existing.tx_code,
        status: existing.status,
        message: `Duplicate payment notification (${params.idempotencyKey}) ignored safely via idempotency key.`,
      };
    }

    const txCode =
      params.txCode || `TX-SIM-${Date.now().toString().slice(-5)}`;
    db.prepare(
      `INSERT INTO payments (
         id, tx_code, user_id, customer_name, booking_id, purpose,
         amount_inr, status, idempotency_key, date_label
       ) VALUES (?, ?, 'usr-aarav', ?, ?, 'Simulated webhook notification', ?, ?, ?, ?)`
    ).run(
      `pay-${crypto.randomUUID().slice(0, 8)}`,
      txCode,
      params.customerName,
      params.bookingId || null,
      params.amountInr,
      params.status,
      params.idempotencyKey,
      getTodayIstDate()
    );

    return {
      duplicate: false,
      txCode,
      status: params.status,
      message: `Payment notification ${txCode} (${params.status}) recorded in ledger.`,
    };
  });
}

