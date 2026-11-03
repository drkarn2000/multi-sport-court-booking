import crypto from "node:crypto";
import { NextRequest } from "next/server";
import { requireAdminRole } from "@/server/auth/service";
import { getDb, runImmediateTransaction } from "@/server/db";
import {
  createBookingAtomic,
  doTimeSlotsOverlap,
  getAdminDashboardData,
  recordAdminAuditLog,
} from "@/server/services/playcourtService";
import {
  AppError,
  apiError,
  apiSuccess,
  getTodayIstDate,
} from "@/server/utils/http";

export async function GET() {
  try {
    const adminUser = await requireAdminRole([
      "PLATFORM_ADMIN",
      "VENUE_MANAGER",
      "FINANCE_OPERATOR",
    ]);

    const dashboardData = getAdminDashboardData();
    return apiSuccess({
      adminUser,
      ...dashboardData,
    });
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminUser = await requireAdminRole([
      "PLATFORM_ADMIN",
      "VENUE_MANAGER",
      "FINANCE_OPERATOR",
    ]);

    const body = await req.json();
    const action = String(body.action || "record_audit");

    if (action === "create_admin_booking") {
      if (adminUser.role === "FINANCE_OPERATOR") {
        throw new AppError(
          "FORBIDDEN_ROLE",
          "Finance Operators do not have permission to create manual court bookings.",
          403
        );
      }

      const db = getDb();
      const venueIdInput = String(body.venueId || "");
      const venueNameInput = String(body.venueName || "The Green Racquet Club");
      const venueRow =
        (venueIdInput
          ? (db
              .prepare("SELECT id, name FROM venues WHERE id = ?")
              .get(venueIdInput) as { id: string; name: string } | undefined)
          : undefined) ||
        (db
          .prepare("SELECT id, name FROM venues WHERE name = ? LIMIT 1")
          .get(venueNameInput) as { id: string; name: string } | undefined) ||
        (db
          .prepare("SELECT id, name FROM venues LIMIT 1")
          .get() as { id: string; name: string });

      const courtIdInput = String(body.courtId || "");
      const courtNameInput = String(body.courtName || "");
      const courtRow =
        (courtIdInput
          ? (db
              .prepare("SELECT id, name FROM courts WHERE id = ? AND venue_id = ?")
              .get(courtIdInput, venueRow.id) as
              | { id: string; name: string }
              | undefined)
          : undefined) ||
        (courtNameInput
          ? (db
              .prepare(
                "SELECT id, name FROM courts WHERE venue_id = ? AND name LIKE ? LIMIT 1"
              )
              .get(venueRow.id, `%${courtNameInput}%`) as
              | { id: string; name: string }
              | undefined)
          : undefined) ||
        (db
          .prepare("SELECT id, name FROM courts WHERE venue_id = ? LIMIT 1")
          .get(venueRow.id) as { id: string; name: string });

      const playDate = String(body.date || getTodayIstDate());
      const timeSlot = String(body.timeSlot || "10:00–11:00");
      const playerName = String(body.playerName || "Walk-in Player").trim();

      const { booking } = await createBookingAtomic(adminUser, {
        venueId: venueRow.id,
        courtId: courtRow.id,
        date: playDate,
        timeSlot,
        playerName,
        playerEmail: "walkin@playcourt.local",
        playerPhone: "+91 98000 11111",
        useGroupCredit: false,
        notes: `Manual walk-in reservation created by ${adminUser.fullName} (${adminUser.role}).`,
      });

      recordAdminAuditLog(
        adminUser,
        "ADMIN_BOOKING_CREATED",
        "Booking",
        booking.id,
        `Manual booking ${booking.id} (${courtRow.name} · ${timeSlot}) created · ${adminUser.fullName} · just now`
      );
    } else if (action === "create_maintenance_block") {
      if (adminUser.role === "FINANCE_OPERATOR") {
        throw new AppError(
          "FORBIDDEN_ROLE",
          "Finance Operators cannot create court maintenance blocks.",
          403
        );
      }

      const venueIdInput = String(body.venueId || "");
      const venueName = String(body.venueName || "The Green Racquet Club");
      const courtIdInput = String(body.courtId || "");
      const courtName = String(body.courtName || "Center Court 1 (Clay)");
      const timeSlot = String(body.timeSlot || "13:00–14:00");
      const reason = String(body.reason || "Surface maintenance").trim();
      const blockDate = String(body.blockDate || getTodayIstDate());

      runImmediateTransaction((db) => {
        const venueRow =
          (venueIdInput
            ? (db
                .prepare("SELECT id, name FROM venues WHERE id = ?")
                .get(venueIdInput) as { id: string; name: string } | undefined)
            : undefined) ||
          (db
            .prepare("SELECT id, name FROM venues WHERE name = ? LIMIT 1")
            .get(venueName) as { id: string; name: string } | undefined) ||
          (db
            .prepare("SELECT id, name FROM venues LIMIT 1")
            .get() as { id: string; name: string });

        const courtRow =
          (courtIdInput
            ? (db
                .prepare(
                  "SELECT id, venue_id, name FROM courts WHERE id = ? AND venue_id = ?"
                )
                .get(courtIdInput, venueRow.id) as
                | { id: string; venue_id: string; name: string }
                | undefined)
            : undefined) ||
          (db
            .prepare(
              "SELECT id, venue_id, name FROM courts WHERE name = ? LIMIT 1"
            )
            .get(courtName) as
            | { id: string; venue_id: string; name: string }
            | undefined) ||
          (db
            .prepare(
              "SELECT id, venue_id, name FROM courts WHERE venue_id = ? LIMIT 1"
            )
            .get(venueRow.id) as {
            id: string;
            venue_id: string;
            name: string;
          });

        // Verify Venue Manager venue assignment scope if applicable
        if (
          adminUser.role === "VENUE_MANAGER" &&
          adminUser.assignedVenueId &&
          courtRow.venue_id !== adminUser.assignedVenueId
        ) {
          throw new AppError(
            "FORBIDDEN_ROLE",
            `Venue Managers can only block courts at their assigned venue (${adminUser.assignedVenueId}).`,
            403
          );
        }

        // Reject if an active booking already overlaps this maintenance window
        const activeOnDate = db
          .prepare(
            `SELECT id, time_slot FROM bookings
             WHERE court_id = ? AND play_date = ?
               AND status IN ('Pending', 'Confirmed', 'Upcoming', 'Cancellation Requested')`
          )
          .all(courtRow.id, blockDate) as Array<{
          id: string;
          time_slot: string;
        }>;

        const conflictingBooking = activeOnDate.find((b) =>
          doTimeSlotsOverlap(timeSlot, b.time_slot)
        );
        if (conflictingBooking) {
          throw new AppError(
            "SLOT_ALREADY_BOOKED",
            `Cannot block ${courtRow.name} for ${timeSlot} on ${blockDate}: active booking ${conflictingBooking.id} (${conflictingBooking.time_slot}) exists.`,
            409
          );
        }

        db.prepare(
          `INSERT OR REPLACE INTO court_maintenance_blocks (
             id, venue_id, court_id, block_date, time_slot, reason, created_by_user_id
           ) VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).run(
          `mb-${crypto.randomUUID().slice(0, 8)}`,
          courtRow.venue_id,
          courtRow.id,
          blockDate,
          timeSlot,
          reason,
          adminUser.id
        );
      });

      recordAdminAuditLog(
        adminUser,
        "COURT_SLOT_BLOCKED",
        "CourtMaintenanceBlock",
        courtName,
        `Blocked ${courtName} (${blockDate} · ${timeSlot}) · ${adminUser.fullName} · just now`
      );
    } else if (action === "remove_maintenance_block") {
      if (adminUser.role === "FINANCE_OPERATOR") {
        throw new AppError(
          "FORBIDDEN_ROLE",
          "Finance Operators cannot modify court maintenance blocks.",
          403
        );
      }
      const blockId = String(body.blockId || "");
      const db = getDb();
      db.prepare("DELETE FROM court_maintenance_blocks WHERE id = ?").run(
        blockId
      );
      recordAdminAuditLog(
        adminUser,
        "COURT_BLOCK_REMOVED",
        "CourtMaintenanceBlock",
        blockId,
        `Maintenance block ${blockId} cleared · ${adminUser.fullName} · just now`
      );
    } else if (action === "reconcile_payments") {
      if (adminUser.role === "VENUE_MANAGER") {
        throw new AppError(
          "FORBIDDEN_ROLE",
          "Venue Managers cannot reconcile financial gateway exceptions.",
          403
        );
      }

      const db = getDb();
      db.prepare(
        "UPDATE payments SET status = 'Paid' WHERE status IN ('Pending', 'Failed')"
      ).run();

      recordAdminAuditLog(
        adminUser,
        "PAYMENT_BATCH_RECONCILED",
        "Payment",
        "BATCH",
        `Payment reconciliation completed · ${adminUser.fullName} (${adminUser.role}) · just now`
      );
    } else if (action === "update_booking_status") {
      if (adminUser.role === "FINANCE_OPERATOR") {
        throw new AppError(
          "FORBIDDEN_ROLE",
          "Finance Operators cannot change court booking operational status.",
          403
        );
      }

      const bookingId = String(body.bookingId || "");
      const status = String(body.status || "Confirmed");
      const db = getDb();
      db.prepare("UPDATE bookings SET status = ? WHERE id = ?").run(
        status,
        bookingId
      );

      if (status === "Cancelled") {
        db.prepare(
          "UPDATE daily_credit_ledgers SET status = 'RESTORED' WHERE booking_id = ?"
        ).run(bookingId);
        db.prepare(
          `UPDATE booking_cancellations
           SET review_status = 'APPROVED', reviewed_by_admin_id = ?, credit_restored = 1, reviewed_at = datetime('now')
           WHERE booking_id = ?`
        ).run(adminUser.id, bookingId);
      }

      recordAdminAuditLog(
        adminUser,
        "BOOKING_STATUS_UPDATED",
        "Booking",
        bookingId,
        `Booking ${bookingId} marked ${status} · ${adminUser.fullName} · just now`
      );
    } else if (action === "toggle_player_status") {
      if (adminUser.role !== "PLATFORM_ADMIN") {
        throw new AppError(
          "FORBIDDEN_ROLE",
          "Only Platform Admins can suspend or reactivate player accounts.",
          403
        );
      }

      const email = String(body.email || "");
      const db = getDb();
      const row = db
        .prepare("SELECT id, full_name, status FROM users WHERE email = ?")
        .get(email) as
        | { id: string; full_name: string; status: string }
        | undefined;
      if (!row) {
        throw new AppError("NOT_FOUND", "Player account not found.", 404);
      }
      const nextStatus = row.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
      db.prepare("UPDATE users SET status = ? WHERE id = ?").run(
        nextStatus,
        row.id
      );

      recordAdminAuditLog(
        adminUser,
        "PLAYER_STATUS_CHANGED",
        "User",
        row.id,
        `Player ${row.full_name} marked ${nextStatus} · ${adminUser.fullName} · just now`
      );
    } else if (action === "create_event") {
      if (adminUser.role === "FINANCE_OPERATOR") {
        throw new AppError(
          "FORBIDDEN_ROLE",
          "Finance Operators cannot publish events or coaching sessions.",
          403
        );
      }

      const title = String(body.title || "Evening Club Mixer").trim();
      const category = String(body.category || "Social");
      const fullDate = String(body.fullDate || "15 Nov 2026");
      const totalSpots = Math.max(4, Number(body.totalSpots) || 16);

      const db = getDb();
      const evId = `ev-${Date.now()}`;
      db.prepare(
        `INSERT INTO events (
           id, venue_id, venue_name, title, category, sport, date_label, full_date,
           time_label, price, total_spots, spots_left, image, description,
           highlights_json, coach_or_organizer, publish_status
         ) VALUES (?, 'v-1', 'The Green Racquet Club', ?, ?, 'Tennis', ?, ?, '18:00 – 20:00', 499, ?, ?, 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1000&h=650&fit=crop', 'Created from Admin Operations Console.', '["Live admin-created event","Refreshments included"]', 'PlayCourt Ops', 'Published')`
      ).run(evId, title, category, fullDate, fullDate, totalSpots, totalSpots);

      recordAdminAuditLog(
        adminUser,
        "EVENT_CREATED",
        "Event",
        evId,
        `Published event "${title}" (${totalSpots} spots) · ${adminUser.fullName} · just now`
      );
    } else if (action === "save_settings") {
      if (adminUser.role !== "PLATFORM_ADMIN") {
        throw new AppError(
          "FORBIDDEN_ROLE",
          "Only Platform Admins can modify platform-wide settings.",
          403
        );
      }

      const db = getDb();
      db.prepare(
        `INSERT OR REPLACE INTO platform_settings (key, value, updated_at)
         VALUES ('last_saved_by', ?, datetime('now'))`
      ).run(adminUser.fullName);

      recordAdminAuditLog(
        adminUser,
        "PLATFORM_SETTINGS_SAVED",
        "PlatformSettings",
        "GLOBAL",
        `Platform configuration saved · ${adminUser.fullName} · just now`
      );
    } else {
      const targetEntity = String(body.targetEntity || "AdminConsole");
      const targetId = String(body.targetId || "OP");
      const summary = String(
        body.summary ||
          `${action} executed · ${adminUser.fullName} · just now`
      );
      recordAdminAuditLog(adminUser, action, targetEntity, targetId, summary);
    }

    return apiSuccess({
      adminUser,
      ...getAdminDashboardData(),
    });
  } catch (err) {
    return apiError(err);
  }
}
