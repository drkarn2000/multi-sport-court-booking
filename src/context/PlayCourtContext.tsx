"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import {
  Venue,
  GroupMembershipState,
  BookingRecord,
  OpenMatch,
  PlayEvent,
  PlayerProfileData,
  MembershipPlan,
  SportType,
} from "@/types/playcourt";
import {
  INITIAL_VENUES,
  INITIAL_GROUP_MEMBERSHIP,
  INITIAL_BOOKINGS,
  INITIAL_MATCHES,
  INITIAL_EVENTS,
  INITIAL_PLAYER_PROFILE,
  MEMBERSHIP_PLANS,
} from "@/data/mockData";

export interface SessionUserSummary {
  id: string;
  phone: string;
  email: string;
  fullName: string;
  role: "PLAYER" | "PLATFORM_ADMIN" | "VENUE_MANAGER" | "FINANCE_OPERATOR";
  status: string;
  assignedVenueId: string | null;
}

export interface CreateBookingPayload {
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

export interface CreateBookingResult {
  ok: boolean;
  booking?: BookingRecord;
  paymentTxCode?: string;
  duplicateReplay?: boolean;
  error?: string;
  code?: string;
}

interface PlayCourtContextType {
  venues: Venue[];
  membershipPlans: MembershipPlan[];
  groupMembership: GroupMembershipState;
  bookings: BookingRecord[];
  matches: OpenMatch[];
  events: PlayEvent[];
  profile: PlayerProfileData;
  isAuthenticated: boolean;
  currentUser: SessionUserSummary | null;
  sessionState: string;
  serverDateIst: string;
  timezone: string;
  localDevMode: boolean;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  refreshStateFromServer: (date?: string) => Promise<void>;
  loadAvailabilityForDate: (date: string) => Promise<void>;
  toggleFavouriteVenue: (venueId: string) => void;
  createBooking: (payload: CreateBookingPayload) => BookingRecord;
  createBookingAsync: (payload: CreateBookingPayload) => Promise<CreateBookingResult>;
  requestCancelBooking: (bookingId: string, reason?: string) => void;
  addGroupMember: (name: string, email: string, phone: string) => boolean;
  removeGroupMember: (memberId: string) => void;
  selectMembershipPlan: (planId: string) => void;
  simulateDailyCreditToggle: () => void;
  reseedDemoDatabaseAsync: () => Promise<boolean>;
  createOpenMatch: (match: {
    title: string;
    sport: SportType;
    skillLevel: "Beginner" | "Intermediate" | "Advanced";
    venueName: string;
    area: string;
    dateTime: string;
    totalSpots: number;
    pricePerPlayer: number;
    description: string;
  }) => void;
  joinOpenMatch: (matchId: string) => void;
  registerForEvent: (eventId: string, partnerName?: string) => void;
  updateProfile: (updated: Partial<PlayerProfileData>) => void;
  requestOtpAsync: (phone: string) => Promise<{
    ok: boolean;
    devOtpHint?: string;
    requestsUsedInWindow?: number;
    maxRequestsPerWindow?: number;
    error?: string;
    code?: string;
  }>;
  verifyOtpAsync: (params: {
    phone: string;
    otp: string;
    fullName?: string;
    email?: string;
  }) => Promise<{
    ok: boolean;
    user?: SessionUserSummary;
    error?: string;
    code?: string;
  }>;
  loginDemo: (phone: string, name?: string) => void;
  logoutDemo: () => void;
}

const PlayCourtContext = createContext<PlayCourtContextType | undefined>(
  undefined
);

export function PlayCourtProvider({ children }: { children: React.ReactNode }) {
  const [venues, setVenues] = useState<Venue[]>(INITIAL_VENUES);
  const [membershipPlans, setMembershipPlans] =
    useState<MembershipPlan[]>(MEMBERSHIP_PLANS);
  const [groupMembership, setGroupMembership] = useState<GroupMembershipState>(
    INITIAL_GROUP_MEMBERSHIP
  );
  const [bookings, setBookings] = useState<BookingRecord[]>(INITIAL_BOOKINGS);
  const [matches, setMatches] = useState<OpenMatch[]>(INITIAL_MATCHES);
  const [events, setEvents] = useState<PlayEvent[]>(INITIAL_EVENTS);
  const [profile, setProfile] = useState<PlayerProfileData>(
    INITIAL_PLAYER_PROFILE
  );
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<SessionUserSummary | null>(
    null
  );
  const [sessionState, setSessionState] = useState<string>(
    "DEFAULT_DEMO_PLAYER"
  );
  const [serverDateIst, setServerDateIst] = useState<string>("2026-10-29");
  const [timezone, setTimezone] = useState<string>("Asia/Kolkata");
  const [localDevMode, setLocalDevMode] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  }, []);

  const applyServerBootstrap = useCallback((d: Record<string, unknown>) => {
    if (Array.isArray(d.venues)) setVenues(d.venues as Venue[]);
    if (Array.isArray(d.membershipPlans)) {
      setMembershipPlans(d.membershipPlans as MembershipPlan[]);
    }
    if (d.groupMembership) {
      setGroupMembership(d.groupMembership as GroupMembershipState);
    }
    if (Array.isArray(d.bookings)) setBookings(d.bookings as BookingRecord[]);
    if (Array.isArray(d.matches)) setMatches(d.matches as OpenMatch[]);
    if (Array.isArray(d.events)) setEvents(d.events as PlayEvent[]);
    if (d.profile) setProfile(d.profile as PlayerProfileData);
    if (typeof d.isAuthenticated === "boolean") {
      setIsAuthenticated(d.isAuthenticated);
    }
    if ("currentUser" in d) {
      setCurrentUser((d.currentUser as SessionUserSummary | null) ?? null);
    }
    if (typeof d.sessionState === "string") setSessionState(d.sessionState);
    if (typeof d.serverDateIst === "string") setServerDateIst(d.serverDateIst);
    if (typeof d.timezone === "string") setTimezone(d.timezone);
    if (typeof d.localDevMode === "boolean") setLocalDevMode(d.localDevMode);
  }, []);

  const refreshStateFromServer = useCallback(
    async (date?: string) => {
      try {
        const qs = date ? `?date=${encodeURIComponent(date)}` : "";
        const res = await fetch(`/api/v1/state${qs}`, { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (json?.success && json?.data) {
          applyServerBootstrap(json.data);
        }
      } catch {
        // Keep current state if network temporarily unavailable
      }
    },
    [applyServerBootstrap]
  );

  const loadAvailabilityForDate = useCallback(async (date: string) => {
    try {
      const res = await fetch(
        `/api/v1/venues?date=${encodeURIComponent(date)}`,
        { cache: "no-store" }
      );
      if (!res.ok) return;
      const json = await res.json();
      if (json?.success && Array.isArray(json.data?.venues)) {
        setVenues(json.data.venues);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    void refreshStateFromServer();
  }, [refreshStateFromServer]);

  const toggleFavouriteVenue = useCallback(
    (venueId: string) => {
      const exists = profile.favouriteVenueIds.includes(venueId);
      setProfile((prev) => ({
        ...prev,
        favouriteVenueIds: exists
          ? prev.favouriteVenueIds.filter((id) => id !== venueId)
          : [...prev.favouriteVenueIds, venueId],
      }));

      void fetch("/api/v1/profile/favourites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId }),
      })
        .then(async (r) => ({ ok: r.ok, json: await r.json() }))
        .then(({ ok, json }) => {
          if (ok && json?.success && json.data?.favouriteVenueIds) {
            setProfile((prev) => ({
              ...prev,
              favouriteVenueIds: json.data.favouriteVenueIds,
            }));
            showToast(
              json.data.saved
                ? "Venue saved to your favourites"
                : "Removed from saved venues"
            );
          } else if (json?.error) {
            showToast(json.error.message);
            void refreshStateFromServer();
          }
        })
        .catch(() => {});
    },
    [profile.favouriteVenueIds, showToast, refreshStateFromServer]
  );

  const createBookingAsync = useCallback(
    async (payload: CreateBookingPayload): Promise<CreateBookingResult> => {
      try {
        const res = await fetch("/api/v1/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();

        if (res.ok && json?.success && json.data?.booking) {
          const created: BookingRecord = json.data.booking;
          if (json.data.groupMembership) {
            setGroupMembership(json.data.groupMembership);
          }
          if (Array.isArray(json.data.venues)) {
            setVenues(json.data.venues);
          }
          setBookings((prev) => [
            created,
            ...prev.filter((b) => b.id !== created.id),
          ]);
          showToast(
            created.paidWithCredit
              ? `Booking ${created.id} confirmed with Group Daily Credit!`
              : `Booking ${created.id} confirmed!`
          );
          return {
            ok: true,
            booking: created,
            paymentTxCode: json.data.paymentTxCode,
            duplicateReplay: json.data.duplicateReplay,
          };
        }

        // Refresh availability if conflict occurred
        await loadAvailabilityForDate(payload.date);
        await refreshStateFromServer(payload.date);

        const errMsg =
          json?.error?.message || "Could not complete court reservation.";
        const errCode = json?.error?.code || "BOOKING_ERROR";
        showToast(errMsg);
        return {
          ok: false,
          error: errMsg,
          code: errCode,
        };
      } catch {
        return {
          ok: false,
          error: "Network error while communicating with local booking API.",
          code: "INTERNAL_ERROR",
        };
      }
    },
    [loadAvailabilityForDate, refreshStateFromServer, showToast]
  );

  const createBooking = useCallback(
    (payload: CreateBookingPayload): BookingRecord => {
      const venue =
        venues.find((v) => v.id === payload.venueId) || venues[0];
      const court =
        venue.courts.find((c) => c.id === payload.courtId) || venue.courts[0];
      const canUseCredit =
        payload.useGroupCredit &&
        groupMembership.status === "Active" &&
        groupMembership.dailyCreditUsed < groupMembership.dailyCreditTotal &&
        venue.participatingInCredits;

      const tempRecord: BookingRecord = {
        id: `PC-${10483 + bookings.length}`,
        venueId: venue.id,
        venueName: venue.name,
        venueArea: `${venue.area} · ${venue.city}`,
        courtId: court.id,
        courtName: court.name,
        sport: court.sport,
        date: payload.date,
        timeSlot: payload.timeSlot,
        durationMinutes: 60,
        playerName: payload.playerName,
        playerEmail: payload.playerEmail,
        playerPhone: payload.playerPhone,
        totalPrice: canUseCredit ? 0 : court.pricePerHour,
        paidWithCredit: canUseCredit,
        status: "Confirmed",
        createdAt: serverDateIst,
      };
      void createBookingAsync({ ...payload, useGroupCredit: canUseCredit });
      return tempRecord;
    },
    [venues, groupMembership, bookings.length, serverDateIst, createBookingAsync]
  );

  const requestCancelBooking = useCallback(
    (bookingId: string, reason?: string) => {
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId
            ? {
                ...b,
                status: "Cancellation Requested",
                notes: reason
                  ? `Cancellation reason: ${reason}`
                  : "Cancellation requested by player.",
              }
            : b
        )
      );

      void fetch(
        `/api/v1/bookings/${encodeURIComponent(bookingId)}/cancel-request`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason }),
        }
      )
        .then(async (r) => ({ ok: r.ok, json: await r.json() }))
        .then(({ ok, json }) => {
          if (ok && json?.success && json.data?.bookings) {
            setBookings(json.data.bookings);
            showToast(`Cancellation request submitted for ${bookingId}`);
          } else if (json?.error) {
            showToast(json.error.message);
            void refreshStateFromServer();
          }
        })
        .catch(() => {});
    },
    [showToast, refreshStateFromServer]
  );

  const addGroupMember = useCallback(
    (name: string, email: string, phone: string): boolean => {
      if (groupMembership.members.length >= 4) {
        showToast(
          "Group limit reached: A group may link up to 4 player accounts."
        );
        return false;
      }

      const initials = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      const tempId = `m-${Date.now()}`;
      setGroupMembership((prev) => ({
        ...prev,
        members: [
          ...prev.members,
          {
            id: tempId,
            name,
            email,
            phone,
            role: "Linked Crew",
            avatar: initials || "PL",
            usedCreditToday: false,
          },
        ],
      }));

      void fetch("/api/v1/memberships/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone }),
      })
        .then(async (r) => ({ ok: r.ok, json: await r.json() }))
        .then(({ ok, json }) => {
          if (ok && json?.success && json.data?.groupMembership) {
            setGroupMembership(json.data.groupMembership);
            showToast(
              `${name} linked to ${groupMembership.groupName} (${json.data.groupMembership.members.length}/4 accounts)`
            );
          } else if (json?.error) {
            showToast(json.error.message);
            void refreshStateFromServer();
          }
        })
        .catch(() => {});

      return true;
    },
    [
      groupMembership.members.length,
      groupMembership.groupName,
      showToast,
      refreshStateFromServer,
    ]
  );

  const removeGroupMember = useCallback(
    (memberId: string) => {
      setGroupMembership((prev) => ({
        ...prev,
        members: prev.members.filter((m) => m.id !== memberId),
      }));

      void fetch("/api/v1/memberships/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      })
        .then(async (r) => ({ ok: r.ok, json: await r.json() }))
        .then(({ ok, json }) => {
          if (ok && json?.success && json.data?.groupMembership) {
            setGroupMembership(json.data.groupMembership);
            showToast("Player unlinked from group membership");
          } else if (json?.error) {
            showToast(json.error.message);
            void refreshStateFromServer();
          }
        })
        .catch(() => {});
    },
    [showToast, refreshStateFromServer]
  );

  const selectMembershipPlan = useCallback(
    (planId: string) => {
      const chosen = membershipPlans.find((p) => p.id === planId);
      if (!chosen) return;
      setGroupMembership((prev) => ({
        ...prev,
        planId: chosen.id,
        planName: chosen.name,
        dailyCreditTotal: chosen.sharedDailyCredits,
        maxMembers: chosen.maxLinkedMembers,
      }));

      void fetch("/api/v1/memberships", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "select_plan", planId }),
      })
        .then((r) => r.json())
        .then((json) => {
          if (json?.success && json.data?.groupMembership) {
            setGroupMembership(json.data.groupMembership);
            showToast(`Switched active plan to ${chosen.name}`);
          } else if (json?.error) {
            showToast(json.error.message);
          }
        })
        .catch(() => {});
    },
    [membershipPlans, showToast]
  );

  const simulateDailyCreditToggle = useCallback(() => {
    void fetch("/api/v1/memberships", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "simulate_credit_toggle" }),
    })
      .then(async (r) => ({ ok: r.ok, json: await r.json() }))
      .then(({ ok, json }) => {
        if (ok && json?.success && json.data?.groupMembership) {
          const gm: GroupMembershipState = json.data.groupMembership;
          setGroupMembership(gm);
          showToast(
            gm.dailyCreditUsed > 0
              ? "Local Dev: Today's shared group credit marked claimed by Kabir Sharma"
              : "Local Dev: Shared daily credit restored to 1/1 available for today"
          );
        } else if (json?.error) {
          showToast(json.error.message);
        }
      })
      .catch(() => {});
  }, [showToast]);

  const reseedDemoDatabaseAsync = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/v1/dev/testing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reseed_demo_db",
          confirm: "RESET_LOCAL_DEMO_DB",
        }),
      });
      const json = await res.json();
      if (res.ok && json?.success && json.data?.state) {
        applyServerBootstrap(json.data.state);
        showToast("Local demo database safely reseeded to clean initial state");
        return true;
      }
      showToast(json?.error?.message || "Database reset blocked");
      return false;
    } catch {
      showToast("Failed to reseed local demo database");
      return false;
    }
  }, [applyServerBootstrap, showToast]);

  const createOpenMatch = useCallback(
    (payload: {
      title: string;
      sport: SportType;
      skillLevel: "Beginner" | "Intermediate" | "Advanced";
      venueName: string;
      area: string;
      dateTime: string;
      totalSpots: number;
      pricePerPlayer: number;
      description: string;
    }) => {
      void fetch("/api/v1/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
        .then(async (r) => ({ ok: r.ok, json: await r.json() }))
        .then(({ ok, json }) => {
          if (ok && json?.success && json.data?.matches) {
            setMatches(json.data.matches);
            showToast("Your open match is now live on the Community Board!");
          } else if (json?.error) {
            showToast(json.error.message);
          }
        })
        .catch(() => {});
    },
    [showToast]
  );

  const joinOpenMatch = useCallback(
    (matchId: string) => {
      void fetch(`/api/v1/matches/${encodeURIComponent(matchId)}/join`, {
        method: "POST",
      })
        .then(async (r) => ({ ok: r.ok, json: await r.json() }))
        .then(({ ok, json }) => {
          if (ok && json?.success && json.data?.matches) {
            setMatches(json.data.matches);
            showToast(
              json.data.joined
                ? `Join confirmed for "${json.data.match.title}"!`
                : "You have left this open match."
            );
          } else if (json?.error) {
            showToast(json.error.message);
          }
        })
        .catch(() => {});
    },
    [showToast]
  );

  const registerForEvent = useCallback(
    (eventId: string, partnerName?: string) => {
      void fetch(`/api/v1/events/${encodeURIComponent(eventId)}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnerName }),
      })
        .then(async (r) => ({ ok: r.ok, json: await r.json() }))
        .then(({ ok, json }) => {
          if (ok && json?.success && json.data?.events) {
            setEvents(json.data.events);
            showToast(
              `Registration confirmed for ${json.data.event?.title || "event"}!`
            );
          } else if (json?.error) {
            showToast(json.error.message);
          }
        })
        .catch(() => {});
    },
    [showToast]
  );

  const updateProfile = useCallback(
    (updated: Partial<PlayerProfileData>) => {
      setProfile((prev) => ({ ...prev, ...updated }));

      void fetch("/api/v1/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      })
        .then(async (r) => ({ ok: r.ok, json: await r.json() }))
        .then(({ ok, json }) => {
          if (ok && json?.success && json.data?.profile) {
            setProfile(json.data.profile);
            showToast("Player profile saved to local database");
          } else if (json?.error) {
            showToast(json.error.message);
            void refreshStateFromServer();
          }
        })
        .catch(() => {});
    },
    [showToast, refreshStateFromServer]
  );

  const requestOtpAsync = useCallback(async (phone: string) => {
    try {
      const res = await fetch("/api/v1/auth/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const json = await res.json();
      if (res.ok && json?.success && json.data) {
        return {
          ok: true,
          devOtpHint: json.data.devOtpHint,
          requestsUsedInWindow: json.data.requestsUsedInWindow,
          maxRequestsPerWindow: json.data.maxRequestsPerWindow,
        };
      }
      return {
        ok: false,
        error: json?.error?.message || "Failed to request OTP",
        code: json?.error?.code,
      };
    } catch {
      return {
        ok: false,
        error: "Network error requesting OTP",
        code: "INTERNAL_ERROR",
      };
    }
  }, []);

  const verifyOtpAsync = useCallback(
    async (params: {
      phone: string;
      otp: string;
      fullName?: string;
      email?: string;
    }) => {
      try {
        const res = await fetch("/api/v1/auth/otp/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
        });
        const json = await res.json();
        if (res.ok && json?.success && json.data?.user) {
          setIsAuthenticated(true);
          setCurrentUser(json.data.user);
          setSessionState("ACTIVE_COOKIE");
          if (json.data.profile) {
            setProfile(json.data.profile);
          }
          await refreshStateFromServer();
          showToast(
            `Signed in as ${json.data.user.fullName} (${json.data.user.role})`
          );
          return { ok: true, user: json.data.user };
        }
        return {
          ok: false,
          error: json?.error?.message || "OTP verification failed",
          code: json?.error?.code,
        };
      } catch {
        return {
          ok: false,
          error: "Network error verifying OTP",
          code: "INTERNAL_ERROR",
        };
      }
    },
    [refreshStateFromServer, showToast]
  );

  const loginDemo = useCallback(
    (phone: string, name?: string) => {
      void (async () => {
        const reqRes = await requestOtpAsync(phone || "+91 98765 43210");
        if (reqRes.ok && reqRes.devOtpHint) {
          await verifyOtpAsync({
            phone: phone || "+91 98765 43210",
            otp: reqRes.devOtpHint,
            fullName: name,
          });
        }
      })();
    },
    [requestOtpAsync, verifyOtpAsync]
  );

  const logoutDemo = useCallback(() => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setSessionState("LOGGED_OUT");
    showToast("Signed out — session revoked");

    void fetch("/api/v1/auth/logout", {
      method: "POST",
    }).catch(() => {});
  }, [showToast]);

  return (
    <PlayCourtContext.Provider
      value={{
        venues,
        membershipPlans,
        groupMembership,
        bookings,
        matches,
        events,
        profile,
        isAuthenticated,
        currentUser,
        sessionState,
        serverDateIst,
        timezone,
        localDevMode,
        toastMessage,
        showToast,
        refreshStateFromServer,
        loadAvailabilityForDate,
        toggleFavouriteVenue,
        createBooking,
        createBookingAsync,
        requestCancelBooking,
        addGroupMember,
        removeGroupMember,
        selectMembershipPlan,
        simulateDailyCreditToggle,
        reseedDemoDatabaseAsync,
        createOpenMatch,
        joinOpenMatch,
        registerForEvent,
        updateProfile,
        requestOtpAsync,
        verifyOtpAsync,
        loginDemo,
        logoutDemo,
      }}
    >
      {children}
    </PlayCourtContext.Provider>
  );
}

export function usePlayCourt() {
  const ctx = useContext(PlayCourtContext);
  if (!ctx) {
    throw new Error("usePlayCourt must be used within a PlayCourtProvider");
  }
  return ctx;
}
