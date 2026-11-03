"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  Plus,
  Download,
  HelpCircle,
  ArrowLeft,
  Search,
} from "lucide-react";
import { usePlayCourt } from "@/context/PlayCourtContext";

type AdminPageKey =
  | "overview"
  | "bookings"
  | "schedule"
  | "venues"
  | "players"
  | "memberships"
  | "payments"
  | "community"
  | "events"
  | "commerce"
  | "offers"
  | "reports"
  | "team"
  | "settings";

const META: Record<AdminPageKey, [string, string, string]> = {
  overview: [
    "Overview",
    "Operations overview",
    "Live snapshot of bookings, revenue and venue performance.",
  ],
  bookings: [
    "Bookings",
    "Booking operations",
    "Search, review and manage reservations across every venue.",
  ],
  schedule: [
    "Court schedule",
    "Court availability",
    "Review daily court utilisation, blocked slots and booking conflicts.",
  ],
  venues: [
    "Venues & courts",
    "Venue management",
    "Manage locations, courts, operating hours and availability.",
  ],
  players: [
    "Players",
    "Player directory",
    "Review player accounts, activity and account status.",
  ],
  memberships: [
    "Memberships",
    "Membership & shared credits",
    "Manage group subscriptions, linked players and daily credit history.",
  ],
  payments: [
    "Payments",
    "Payment operations",
    "Track transactions, failed payments, refunds and gateway exceptions.",
  ],
  community: [
    "Community & matches",
    "Community operations",
    "Moderate open matches, join requests and participant capacity.",
  ],
  events: [
    "Events & coaching",
    "Events and coaching",
    "Manage listings, capacity, registrations and cancellations.",
  ],
  commerce: [
    "Shop & orders",
    "Commerce operations",
    "Track products, inventory and fulfilment status.",
  ],
  offers: [
    "Offers & vouchers",
    "Promotions and benefits",
    "Manage voucher rules and redemption activity.",
  ],
  reports: [
    "Reports",
    "Analytics & reports",
    "Review operational performance and export demo reports.",
  ],
  team: [
    "Staff & permissions",
    "Team access control",
    "Manage staff access and role-based permissions.",
  ],
  settings: [
    "Settings & audit log",
    "Platform settings",
    "Review security settings, system health and admin history.",
  ],
};

const INITIAL_ADMIN_DATA: Record<string, string[][]> = {
  bookings: [
    [
      "PC-10482",
      "Aarav Mehta",
      "Riverside Sports Club",
      "Tennis Court 02",
      "10:00–11:00",
      "₹850",
      "Confirmed",
    ],
    [
      "PC-10481",
      "Simran Kaur",
      "Northside Courts",
      "Padel Court 01",
      "10:30–11:30",
      "₹1,200",
      "Pending",
    ],
    [
      "PC-10480",
      "Kabir Sharma",
      "Riverside Sports Club",
      "Tennis Court 04",
      "11:00–12:00",
      "₹700",
      "Confirmed",
    ],
    [
      "PC-10479",
      "Ananya Gill",
      "Central Arena",
      "Badminton Court 03",
      "11:00–12:00",
      "₹500",
      "Cancelled",
    ],
    [
      "PC-10478",
      "Rohan Verma",
      "Northside Courts",
      "Tennis Court 02",
      "12:00–13:00",
      "₹900",
      "Confirmed",
    ],
    [
      "PC-10477",
      "Isha Kapoor",
      "Central Arena",
      "Padel Court 01",
      "09:00–10:00",
      "₹1,100",
      "Failed",
    ],
  ],
  venues: [
    ["The Green Racquet Club", "Chandigarh", "8 courts", "Open", "91%"],
    ["Baseline Padel House", "Chandigarh", "6 courts", "Open", "84%"],
    ["Smash Social Arena", "Mohali", "6 courts", "Open", "78%"],
    ["Central Arena", "Panchkula", "5 courts", "Maintenance", "62%"],
  ],
  players: [
    ["Aarav Mehta", "aarav.m@example.com", "Active", "Group Atlas", "28 Oct 2026"],
    ["Simran Kaur", "simran.k@example.com", "Active", "Group Atlas", "27 Oct 2026"],
    ["Kabir Sharma", "kabir.s@example.com", "Active", "Group Atlas", "26 Oct 2026"],
    ["Ananya Gill", "ananya.g@example.com", "Suspended", "Solo", "20 Oct 2026"],
  ],
  memberships: [
    [
      "Group Atlas",
      "3 / 4 linked members",
      "Monthly",
      "Active",
      "12 Nov 2026",
      "1/1 credit available",
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
  ],
  payments: [
    ["TX-93821", "Aarav Mehta", "Court booking", "₹850", "Paid", "28 Oct 2026"],
    ["TX-93820", "Simran Kaur", "Court booking", "₹1,200", "Pending", "28 Oct 2026"],
    [
      "TX-93819",
      "Isha Kapoor",
      "Subscription renewal",
      "₹2,499",
      "Failed",
      "27 Oct 2026",
    ],
    ["TX-93818", "Kabir Sharma", "Court booking", "₹700", "Paid", "27 Oct 2026"],
  ],
  community: [
    [
      "Open doubles · Intermediate",
      "The Green Racquet Club",
      "Today, 18:00",
      "2 / 4",
      "Open",
    ],
    [
      "Weekend rally · Beginner",
      "Baseline Padel House",
      "Tomorrow, 10:00",
      "3 / 4",
      "Almost full",
    ],
    [
      "Competitive singles",
      "Northside Tennis Studio",
      "Sunday, 08:00",
      "1 / 2",
      "Open",
    ],
  ],
  events: [
    ["Weekend Doubles Open", "Tournament", "07 Nov 2026", "24 / 32", "Published"],
    ["Tennis Fundamentals", "Coaching", "10 Nov 2026", "8 / 12", "Published"],
    ["Junior Tennis Camp", "Coaching", "22 Nov 2026", "18 / 20", "Draft"],
  ],
  commerce: [
    ["ORD-2018", "Maya Foods", "Grip tape × 2", "₹600", "Ready for pickup"],
    ["ORD-2017", "Aarav Mehta", "Sports drink × 3", "₹450", "Processing"],
    ["ORD-2016", "Rohan Verma", "Court towel × 1", "₹700", "Completed"],
  ],
  offers: [
    [
      "WELCOME10",
      "10% off first booking",
      "Voucher",
      "Active",
      "328 redemptions",
    ],
    [
      "MEMBERPLUS",
      "Free drink with booking",
      "Partner benefit",
      "Active",
      "91 redemptions",
    ],
    [
      "AUTUMN25",
      "25% off event tickets",
      "Campaign",
      "Scheduled",
      "Starts 01 Nov",
    ],
  ],
  team: [
    ["Priya Sharma", "priya@playcourt.demo", "Platform admin", "All venues", "Active"],
    ["Rohan Gill", "rohan@playcourt.demo", "Venue manager", "Riverside", "Active"],
    [
      "Meera Kaur",
      "meera@playcourt.demo",
      "Finance operator",
      "All venues",
      "Pending invite",
    ],
  ],
};

const TABLE_HEADERS: Record<string, string[]> = {
  bookings: [
    "Booking ID",
    "Player",
    "Venue",
    "Court",
    "Time slot",
    "Amount",
    "Status",
  ],
  venues: ["Venue", "Location", "Courts", "Operational status", "Occupancy"],
  players: [
    "Player",
    "Email",
    "Account status",
    "Membership group",
    "Last active",
  ],
  memberships: [
    "Group / plan",
    "Linked players",
    "Cycle",
    "Subscription status",
    "Renewal date",
    "Credit status",
  ],
  payments: [
    "Transaction",
    "Customer",
    "Purpose",
    "Amount",
    "Payment status",
    "Date",
  ],
  community: ["Match", "Venue", "Start time", "Players", "Match status"],
  events: ["Listing", "Type", "Date", "Registrations", "Status"],
  commerce: ["Order", "Customer", "Items", "Total", "Fulfilment status"],
  offers: ["Code", "Offer details", "Type", "Status", "Redemption summary"],
  team: ["Staff member", "Email", "Role", "Assigned venue", "Access status"],
};

export default function AdminDashboardPage() {
  const {
    showToast,
    groupMembership,
    bookings: contextBookings,
    venues: contextVenues,
    serverDateIst,
    localDevMode,
    requestOtpAsync,
    verifyOtpAsync,
    logoutDemo,
    refreshStateFromServer,
  } = usePlayCourt();

  const [page, setPage] = useState<AdminPageKey>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminData, setAdminData] =
    useState<Record<string, string[][]>>(INITIAL_ADMIN_DATA);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");

  // Modal state
  const [modalTitle, setModalTitle] = useState<string | null>(null);
  const [modalType, setModalType] = useState<
    | "record"
    | "createBooking"
    | "blockMaintenance"
    | "genericForm"
    | "slot"
    | "help"
    | "reconcile"
    | null
  >(null);
  const [modalRecord, setModalRecord] = useState<string[] | null>(null);
  const [genericFields, setGenericFields] = useState<string[]>([]);
  const [slotInfo, setSlotInfo] = useState<[string, string, string] | null>(
    null
  );

  // Create Booking Admin Modal State
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newVenue, setNewVenue] = useState("The Green Racquet Club");
  const [newCourt, setNewCourt] = useState("Center Court 1 (Clay)");
  const [newDate, setNewDate] = useState("2026-10-30");
  const [newTime, setNewTime] = useState("11:30–12:30");

  // Maintenance Block Modal State
  const [maintVenueId, setMaintVenueId] = useState("v-1");
  const [maintCourtId, setMaintCourtId] = useState("c-101");
  const [maintDate, setMaintDate] = useState("2026-10-30");
  const [maintSlot, setMaintSlot] = useState("17:00–18:00");
  const [maintReason, setMaintReason] = useState("Scheduled surface maintenance");
  const [maintenanceBlocks, setMaintenanceBlocks] = useState<
    Array<{
      id: string;
      venue_name: string;
      court_name: string;
      block_date: string;
      time_slot: string;
      reason: string;
    }>
  >([]);

  // Server-side Admin RBAC & Audit Logs State
  const [adminUser, setAdminUser] = useState<{
    id: string;
    fullName: string;
    role: string;
  } | null>(null);
  const [rbacBannerError, setRbacBannerError] = useState<string | null>(null);
  const [webhookTestLog, setWebhookTestLog] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<string[]>([
    "Booking status viewed · Admin · just now",
    "Membership ledger opened · Admin · 4 minutes ago",
    "Payment exception reviewed · Finance · 18 minutes ago",
  ]);

  const fetchAdminData = useCallback(async (forceDirect = false) => {
    try {
      if (!forceDirect) {
        const meRes = await fetch("/api/v1/auth/me", { cache: "no-store" });
        if (!meRes.ok) return;
        const meJson = await meRes.json();
        const role = meJson?.data?.strictAdminSessionUser?.role;
        if (
          !role ||
          !["PLATFORM_ADMIN", "VENUE_MANAGER", "FINANCE_OPERATOR"].includes(
            role
          )
        ) {
          setAdminUser(null);
          return;
        }
      }

      const res = await fetch("/api/v1/admin", { cache: "no-store" });
      const json = await res.json();
      if (res.ok && json?.success && json.data) {
        setAdminUser(json.data.adminUser);
        setRbacBannerError(null);
        if (json.data.tables) setAdminData(json.data.tables);
        if (json.data.maintenanceBlocks) {
          setMaintenanceBlocks(json.data.maintenanceBlocks);
        }
        if (json.data.auditLogs) setAuditLogs(json.data.auditLogs);
      } else if (json?.error) {
        setAdminUser(null);
        setRbacBannerError(
          `HTTP ${res.status} (${json.error.code}): ${json.error.message}`
        );
      }
    } catch {
      // fallback to local preview state
    }
  }, []);

  useEffect(() => {
    void fetchAdminData(false);
  }, [fetchAdminData]);

  const handleAuthenticateStaffRole = async (phone: string) => {
    setRbacBannerError(null);
    const otpReq = await requestOtpAsync(phone);
    if (!otpReq.ok || !otpReq.devOtpHint) {
      showToast(otpReq.error || "Could not request local dev staff OTP");
      return;
    }
    const verifyRes = await verifyOtpAsync({
      phone,
      otp: otpReq.devOtpHint,
    });
    if (verifyRes.ok) {
      await fetchAdminData(true);
    } else {
      showToast(verifyRes.error || "Failed to authenticate staff session");
    }
  };

  const handleTestUnauthorizedApiCall = async () => {
    const res = await fetch("/api/v1/admin", { cache: "no-store" });
    const json = await res.json();
    if (!res.ok) {
      const msg = `Server RBAC Guard Verified — HTTP ${res.status} (${json?.error?.code}): ${json?.error?.message}`;
      setRbacBannerError(msg);
      showToast(`Rejected with HTTP ${res.status} ${json?.error?.code}`);
    } else {
      setRbacBannerError(null);
      showToast(`Authorized (${json.data.adminUser.role})`);
    }
  };

  const executeAdminAction = async (
    payload: Record<string, unknown>,
    successMsg: string
  ): Promise<boolean> => {
    setRbacBannerError(null);
    const res = await fetch("/api/v1/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (res.ok && json?.success && json.data) {
      if (json.data.tables) setAdminData(json.data.tables);
      if (json.data.maintenanceBlocks) {
        setMaintenanceBlocks(json.data.maintenanceBlocks);
      }
      if (json.data.auditLogs) setAuditLogs(json.data.auditLogs);
      await refreshStateFromServer();
      showToast(successMsg);
      return true;
    }
    const errMsg = `HTTP ${res.status} (${json?.error?.code || "ERROR"}): ${json?.error?.message || "Action rejected"}`;
    setRbacBannerError(errMsg);
    showToast(json?.error?.message || "Admin action rejected by server RBAC");
    return false;
  };

  const [label, title, desc] = META[page];

  const statusBadge = (s: string) => {
    const isWarn = [
      "Pending",
      "Cancellation Requested",
      "Payment overdue",
      "Almost full",
      "Processing",
      "Scheduled",
      "Ready for pickup",
      "Pending invite",
      "1/1 credit used today",
    ].includes(s);
    const isDanger = [
      "Failed",
      "Cancelled",
      "Suspended",
      "Maintenance",
      "Credit locked",
    ].includes(s);
    const isNeutral = ["Draft", "Refunded"].includes(s);

    const cls = isWarn
      ? "bg-[#fff2d6] text-[#97630a]"
      : isDanger
      ? "bg-[#fdeaea] text-[#ad3d40]"
      : isNeutral
      ? "bg-[#edf0ee] text-[#65736a]"
      : "bg-[#e8f5ed] text-[#28714d]";

    return (
      <span
        className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-extrabold transition-transform duration-150 hover:scale-105 cursor-default ${cls}`}
      >
        {s}
      </span>
    );
  };

  const isStatusValue = (v: string) =>
    [
      "Confirmed",
      "Pending",
      "Cancellation Requested",
      "Cancelled",
      "Failed",
      "Active",
      "Suspended",
      "Payment overdue",
      "Paid",
      "Open",
      "Almost full",
      "Published",
      "Draft",
      "Processing",
      "Completed",
      "Maintenance",
      "Scheduled",
      "Ready for pickup",
      "Pending invite",
      "1/1 credit available",
      "1/1 credit used today",
      "Credit locked",
    ].includes(v);

  const navigateModule = (target: AdminPageKey) => {
    setPage(target);
    setQuery("");
    setStatusFilter("All statuses");
    setSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleExportCSV = () => {
    const rows = adminData[page] || adminData.bookings;
    const csv = rows
      .map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `playcourt-${page}-demo.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("CSV export downloaded");
  };

  const handleSaveAdminBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUser) {
      const ok = await executeAdminAction(
        {
          action: "create_admin_booking",
          playerName: newPlayerName.trim() || "Walk-in Demo Player",
          venueName: newVenue,
          courtName: newCourt,
          date: newDate || serverDateIst,
          timeSlot: newTime,
        },
        "Manual walk-in booking persisted to SQLite & audit log"
      );
      if (ok) {
        setModalType(null);
        setNewPlayerName("");
        navigateModule("bookings");
      }
      return;
    }

    // Unauthenticated preview fallback
    const id = `PC-${10483 + adminData.bookings.length}`;
    const nextRow = [
      id,
      newPlayerName.trim() || "Walk-in Demo Player",
      newVenue,
      newCourt,
      newTime,
      "₹850",
      "Confirmed",
    ];
    setAdminData((prev) => ({
      ...prev,
      bookings: [nextRow, ...prev.bookings],
    }));
    setModalType(null);
    setNewPlayerName("");
    navigateModule("bookings");
    showToast(`Manual admin booking created (Preview): ${id}`);
  };

  const handleSaveMaintenanceBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const chosenVenue =
      contextVenues.find((v) => v.id === maintVenueId) || contextVenues[0];
    const chosenCourt =
      chosenVenue.courts.find((c) => c.id === maintCourtId) ||
      chosenVenue.courts[0];

    const ok = await executeAdminAction(
      {
        action: "create_maintenance_block",
        venueId: chosenVenue.id,
        venueName: chosenVenue.name,
        courtId: chosenCourt.id,
        courtName: chosenCourt.name,
        blockDate: maintDate,
        timeSlot: maintSlot,
        reason: maintReason,
      },
      `Blocked ${chosenCourt.name} (${maintDate} · ${maintSlot})`
    );
    if (ok) {
      setModalType(null);
    }
  };

  const handleTestDuplicateWebhook = async () => {
    const idemKey = `idem-manual-${Date.now()}`;
    const payload = {
      idempotencyKey: idemKey,
      customerName: "Aarav Mehta",
      amountInr: 850,
      status: "Paid",
    };
    const r1 = await fetch("/api/v1/payments/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((r) => r.json());
    const r2 = await fetch("/api/v1/payments/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((r) => r.json());

    setWebhookTestLog(
      `1st delivery: duplicate=${String(r1.data?.duplicate)} (${r1.data?.txCode}) | 2nd replay: duplicate=${String(r2.data?.duplicate)} (Ignored safely)`
    );
    if (adminUser) await fetchAdminData(true);
    showToast("Verified idempotent duplicate webhook handling");
  };

  const openGenericForm = (formTitle: string, fields: string[]) => {
    setModalTitle(formTitle);
    setGenericFields(fields);
    setModalType("genericForm");
  };

  const currentRows = useMemo(() => {
    let ds = adminData[page] || [];
    if (page === "bookings") {
      const liveBookingRows = contextBookings.map((b) => [
        b.id,
        b.playerName,
        b.venueName,
        b.courtName.split(" (")[0],
        b.timeSlot,
        b.paidWithCredit ? "₹0 (Credit)" : `₹${b.totalPrice}`,
        b.status === "Upcoming" ? "Confirmed" : b.status,
      ]);
      const existingIds = new Set(liveBookingRows.map((r) => r[0]));
      ds = [
        ...liveBookingRows,
        ...ds.filter((r) => !existingIds.has(r[0])),
      ];
    }
    return ds.filter((r) => {
      const matchesQ = r
        .join(" ")
        .toLowerCase()
        .includes(query.trim().toLowerCase());
      const matchesStatus =
        statusFilter === "All statuses" || r.includes(statusFilter);
      return matchesQ && matchesStatus;
    });
  }, [adminData, page, query, statusFilter, contextBookings]);

  return (
    <div className="min-h-screen bg-[#f5f7f5] text-[#18251f] text-[14px]">
      {/* FIXED LEFT SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 w-[250px] bg-[#12251d] text-white p-5 overflow-y-auto z-40 transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="pb-5 mb-2 border-b border-white/15 flex items-center justify-between">
          <div>
            <div className="text-[19px] font-extrabold tracking-tight flex items-center gap-2">
              <span className="text-pc-lime">◈</span> playcourt
            </div>
            <span className="block text-[10px] tracking-[1.5px] text-[#a7b9ae] font-semibold mt-0.5">
              OPERATIONS CONSOLE
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white/70 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <Link
          href="/"
          className="group mt-3 mb-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 text-pc-lime text-[11.5px] font-bold hover:bg-white/20 hover:translate-x-0.5 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Customer App</span>
        </Link>

        <div className="text-[10px] tracking-[1.4px] text-[#82988b] pt-4 pb-2 px-3 font-extrabold">
          WORKSPACE
        </div>
        <nav className="grid gap-1">
          {(
            [
              ["overview", "▦  Overview"],
              ["bookings", `▣  Bookings`],
              ["schedule", "▦  Court schedule"],
              ["venues", "⌂  Venues & courts"],
              ["players", "♙  Players"],
              ["memberships", "♧  Memberships"],
            ] as [AdminPageKey, string][]
          ).map(([key, text]) => (
            <button
              key={key}
              type="button"
              onClick={() => navigateModule(key)}
              className={`px-3 py-2.5 rounded-lg text-left text-[13px] transition-all duration-200 flex items-center justify-between ${
                page === key
                  ? "bg-[#d9f0e2] text-[#174b35] font-extrabold shadow-sm hover:bg-[#e7f7ee] hover:translate-x-0.5"
                  : "text-[#b5c4bb] hover:bg-white/10 hover:text-white hover:translate-x-1"
              }`}
            >
              <span>{text}</span>
              {key === "bookings" && (
                <span className="text-[11px] font-bold opacity-80">
                  {adminData.bookings.length}
                </span>
              )}
            </button>
          ))}

          <div className="text-[10px] tracking-[1.4px] text-[#82988b] pt-5 pb-2 px-3 font-extrabold">
            REVENUE
          </div>
          {(
            [
              ["payments", "▤  Payments"],
              ["community", "◎  Community & matches"],
              ["events", "✳  Events & coaching"],
              ["commerce", "▱  Shop & orders"],
              ["offers", "◇  Offers & vouchers"],
            ] as [AdminPageKey, string][]
          ).map(([key, text]) => (
            <button
              key={key}
              type="button"
              onClick={() => navigateModule(key)}
              className={`px-3 py-2.5 rounded-lg text-left text-[13px] transition-all duration-200 ${
                page === key
                  ? "bg-[#d9f0e2] text-[#174b35] font-extrabold shadow-sm hover:bg-[#e7f7ee] hover:translate-x-0.5"
                  : "text-[#b5c4bb] hover:bg-white/10 hover:text-white hover:translate-x-1"
              }`}
            >
              {text}
            </button>
          ))}

          <div className="text-[10px] tracking-[1.4px] text-[#82988b] pt-5 pb-2 px-3 font-extrabold">
            INSIGHTS & CONTROL
          </div>
          {(
            [
              ["reports", "▥  Reports"],
              ["team", "♧  Staff & permissions"],
              ["settings", "⚙  Settings & audit log"],
            ] as [AdminPageKey, string][]
          ).map(([key, text]) => (
            <button
              key={key}
              type="button"
              onClick={() => navigateModule(key)}
              className={`px-3 py-2.5 rounded-lg text-left text-[13px] transition-all duration-200 ${
                page === key
                  ? "bg-[#d9f0e2] text-[#174b35] font-extrabold shadow-sm hover:bg-[#e7f7ee] hover:translate-x-0.5"
                  : "text-[#b5c4bb] hover:bg-white/10 hover:text-white hover:translate-x-1"
              }`}
            >
              {text}
            </button>
          ))}
        </nav>
      </aside>

      {/* MAIN WORKSPACE */}
      <div className="lg:ml-[250px]">
        {/* Sticky Top Bar */}
        <header className="h-[70px] flex items-center justify-between px-4 sm:px-8 bg-white border-b border-[#e3eae5] sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg border border-[#e3eae5] bg-white"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div>
              <small className="text-[#718078] text-[11.5px]">
                PlayCourt / <span>{label}</span>
              </small>
              <div className="font-extrabold text-[15px]">{title}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#fff2d6] text-[#97630a] text-[11px] font-extrabold border border-[#f2dcab]">
              {adminUser
                ? `DEMO INTERFACE · RBAC Active (${adminUser.fullName} · ${adminUser.role})`
                : "DEMO INTERFACE · Unauthenticated Frontend Preview"}
            </span>
            {localDevMode && (
              <select
                aria-label="Local Dev Admin Role Switcher"
                value={adminUser?.role || "NONE"}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "PLATFORM_ADMIN") {
                    void handleAuthenticateStaffRole("+91 99999 00001");
                  } else if (val === "VENUE_MANAGER") {
                    void handleAuthenticateStaffRole("+91 99999 00002");
                  } else if (val === "FINANCE_OPERATOR") {
                    void handleAuthenticateStaffRole("+91 99999 00003");
                  } else if (val === "PLAYER") {
                    void handleAuthenticateStaffRole("+91 98765 43210").then(
                      () => {
                        setAdminUser(null);
                      }
                    );
                  } else {
                    logoutDemo();
                    setAdminUser(null);
                  }
                }}
                className="hidden sm:inline-block px-2.5 py-1.5 rounded-lg border border-[#176b4d] bg-[#eef7f2] text-[#174b35] text-[11.5px] font-extrabold"
              >
                <option value="NONE">Switch Staff Role (Local Dev)…</option>
                <option value="PLATFORM_ADMIN">
                  Sign in: Platform Admin (Priya)
                </option>
                <option value="VENUE_MANAGER">
                  Sign in: Venue Manager (Rohan)
                </option>
                <option value="FINANCE_OPERATOR">
                  Sign in: Finance Operator (Meera)
                </option>
                <option value="PLAYER">
                  Sign in: Player Aarav (Test 403)
                </option>
                <option value="LOGOUT">Sign Out (Test 401)</option>
              </select>
            )}
            <Link
              href="/"
              className="pc-pill-lift hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#e3eae5] hover:border-[#176b4d] bg-white text-[12px] font-bold text-[#24382d] hover:bg-[#f5f7f5]"
            >
              Customer Storefront ↗
            </Link>
            <button
              type="button"
              onClick={() => {
                setModalTitle("Help & support");
                setModalType("help");
              }}
              className="pc-pill-lift inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#e3eae5] hover:border-[#176b4d] bg-white text-[12px] font-bold text-[#24382d] hover:bg-[#f5f7f5]"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#176b4d]" />
              <span>Help & support</span>
            </button>
          </div>
        </header>

        {/* Page Container */}
        <section className="max-w-[1500px] p-4 sm:p-7 mx-auto">
          {localDevMode && (
            <div className="pc-admin-card mb-5 p-3.5 rounded-xl bg-white border border-[#e3eae5] flex flex-wrap items-center justify-between gap-3 text-[12px]">
              <div>
                <strong className="text-[#174b35]">
                  Local RBAC Testing Status:
                </strong>{" "}
                {adminUser ? (
                  <span>
                    Authenticated as <strong>{adminUser.fullName}</strong> (
                    <code>{adminUser.role}</code>) — Admin mutations persist to{" "}
                    <code>prisma/playcourt.db</code> &amp; write to{" "}
                    <code>admin_audit_logs</code>.
                  </span>
                ) : (
                  <span className="text-[#718078]">
                    Unauthenticated / Non-Staff Session — Use the{" "}
                    <strong>Switch Staff Role</strong> selector above (or{" "}
                    <Link href="/login" className="underline text-[#176b4d] font-bold">
                      /login
                    </Link>
                    ) to unlock database-persisted admin mutations.
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={handleTestUnauthorizedApiCall}
                className="pc-pill-lift px-3 py-1.5 rounded-lg border border-[#e3eae5] hover:border-[#176b4d] bg-[#fafbfa] font-bold text-[11.5px] hover:bg-[#eef7f2]"
              >
                Verify GET /api/v1/admin Access
              </button>
            </div>
          )}

          {rbacBannerError && (
            <div className="mb-5 p-3.5 rounded-xl bg-[#fdeaea] border border-[#f2c2c4] text-[#9b2c2f] text-[12.5px] font-bold flex items-center justify-between gap-3">
              <span>{rbacBannerError}</span>
              <button
                type="button"
                onClick={() => setRbacBannerError(null)}
                className="text-xs underline"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* 1. OVERVIEW MODULE */}
          {page === "overview" && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div>
                  <div className="text-[#176b4d] text-[10px] tracking-[1.5px] font-extrabold uppercase">
                    PLAYCOURT / OPERATIONS
                  </div>
                  <h1 className="text-[26px] font-extrabold tracking-[-0.7px] my-1">
                    Good evening, team 👋
                  </h1>
                  <div className="text-[#718078]">
                    Here’s what’s happening across your venues today.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setModalTitle("Create booking");
                    setModalType("createBooking");
                  }}
                  className="group pc-btn-lift inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-[#176b4d] hover:bg-[#12543c] text-white font-bold text-[13px]"
                >
                  <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                  <span>Create booking</span>
                </button>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
                {[
                  ["Today's bookings", "128", "↑ 12.8% vs last Saturday"],
                  ["Gross revenue", "₹1,84,650", "↑ 8.4% this week"],
                  ["Court occupancy", "78.4%", "19 active courts"],
                  [
                    "Active memberships",
                    "1,246",
                    `${groupMembership.groupName} (${groupMembership.members.length}/4) active`,
                  ],
                ].map(([k, val, sub]) => (
                  <div
                    key={k}
                    className="group pc-admin-card bg-white border border-[#e3eae5] rounded-[13px] p-4 shadow-admin cursor-default"
                  >
                    <small className="text-[#718078]">{k}</small>
                    <div className="text-[25px] font-extrabold my-2 group-hover:text-[#176b4d] transition-colors">
                      {val}
                    </div>
                    <div className="text-[#176b4d] text-[11px] font-bold">
                      {sub}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-4 mb-5">
                {/* Bar Chart Card */}
                <div className="pc-admin-card bg-white border border-[#e3eae5] rounded-[13px] shadow-admin">
                  <div className="p-4 border-b border-[#e3eae5] flex items-center justify-between">
                    <div>
                      <h3 className="text-[14px] font-bold m-0">
                        Revenue performance
                      </h3>
                      <small className="text-[#718078]">
                        Daily gross revenue · Last 7 days
                      </small>
                    </div>
                    <select className="border border-[#e3eae5] rounded-lg px-2.5 py-1.5 text-[12px] font-bold cursor-pointer">
                      <option>Last 7 days</option>
                      <option>Last 30 days</option>
                    </select>
                  </div>
                  <div className="p-5">
                    <div className="h-[175px] flex items-end gap-3 border-b border-[#e3eae5] pb-2">
                      {[48, 62, 43, 76, 58, 88, 70].map((v, i) => (
                        <div
                          key={i}
                          className="group/bar flex-1 h-full flex flex-col justify-end items-center gap-1.5 cursor-pointer"
                        >
                          <span className="opacity-0 group-hover/bar:opacity-100 -translate-y-0.5 text-[10px] font-extrabold text-[#176b4d] transition-all">
                            {v}%
                          </span>
                          <div
                            style={{ height: `${v}%` }}
                            className="w-3/5 rounded-t-md bg-gradient-to-b from-[#65b78a] to-[#176b4d] group-hover/bar:from-[#7cd3a3] group-hover/bar:to-[#1e8762] group-hover/bar:scale-x-110 transition-all duration-200 origin-bottom shadow-sm"
                          />
                          <small className="text-[10px] text-[#718078] group-hover/bar:text-[#174b35] group-hover/bar:font-bold transition-colors">
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i]}
                          </small>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Alerts Card */}
                <div className="pc-admin-card bg-white border border-[#e3eae5] rounded-[13px] shadow-admin">
                  <div className="p-4 border-b border-[#e3eae5] flex items-center justify-between">
                    <h3 className="text-[14px] font-bold m-0">
                      Needs attention
                    </h3>
                    {statusBadge("3 alerts")}
                  </div>
                  <div className="p-4 divide-y divide-[#edf1ee]">
                    <div className="py-2.5 px-2.5 -mx-2.5 rounded-lg hover:bg-[#f6faf7] transition-colors first:pt-2">
                      <strong className="text-[12.5px] block">
                        Payment needs retry
                      </strong>
                      <p className="text-[11.5px] text-[#718078] my-1">
                        TX-93819 · Isha Kapoor · ₹2,499
                      </p>
                      <button
                        type="button"
                        onClick={() => navigateModule("payments")}
                        className="text-[#176b4d] font-extrabold text-[12px] hover:translate-x-1 transition-transform inline-block"
                      >
                        Review payment →
                      </button>
                    </div>
                    <div className="py-2.5 px-2.5 -mx-2.5 rounded-lg hover:bg-[#f6faf7] transition-colors">
                      <strong className="text-[12.5px] block">
                        Court maintenance block
                      </strong>
                      <p className="text-[11.5px] text-[#718078] my-1">
                        Central Arena · Court 03 · 14:00–16:00
                      </p>
                      <button
                        type="button"
                        onClick={() => navigateModule("schedule")}
                        className="text-[#176b4d] font-extrabold text-[12px] hover:translate-x-1 transition-transform inline-block"
                      >
                        Open schedule →
                      </button>
                    </div>
                    <div className="py-2.5 px-2.5 -mx-2.5 rounded-lg hover:bg-[#f6faf7] transition-colors last:pb-2">
                      <strong className="text-[12.5px] block">
                        Membership renewal overdue
                      </strong>
                      <p className="text-[11.5px] text-[#718078] my-1">
                        Riverside Trio · Shared daily credit temporarily locked
                      </p>
                      <button
                        type="button"
                        onClick={() => navigateModule("memberships")}
                        className="text-[#176b4d] font-extrabold text-[12px] hover:translate-x-1 transition-transform inline-block"
                      >
                        Review membership →
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Bookings Table */}
              <div className="pc-admin-card bg-white border border-[#e3eae5] rounded-[13px] shadow-admin overflow-hidden">
                <div className="p-4 border-b border-[#e3eae5] flex items-center justify-between">
                  <h3 className="text-[14px] font-bold m-0">Recent bookings</h3>
                  <button
                    type="button"
                    onClick={() => navigateModule("bookings")}
                    className="text-[#176b4d] font-extrabold text-[12px] hover:translate-x-1 transition-transform"
                  >
                    View all bookings →
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-[#fafbfa] text-[#718078] text-[10px] uppercase tracking-wider border-b border-[#e3eae5]">
                        {[
                          "Booking",
                          "Player",
                          "Venue",
                          "Court",
                          "Time",
                          "Amount",
                          "Status",
                        ].map((h) => (
                          <th key={h} className="text-left py-3 px-4">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {adminData.bookings.slice(0, 4).map((r, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-[#edf1ee] hover:bg-[#eef7f2] transition-colors text-[12.5px]"
                        >
                          {r.map((v, j) => (
                            <td key={j} className="py-3 px-4">
                              {isStatusValue(v) ? statusBadge(v) : v}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* 2. COURT SCHEDULE MATRIX */}
          {page === "schedule" && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div>
                  <div className="text-[#176b4d] text-[10px] tracking-[1.5px] font-extrabold uppercase">
                    PLAYCOURT / OPERATIONS
                  </div>
                  <h1 className="text-[26px] font-extrabold tracking-[-0.7px] my-1">
                    Court schedule
                  </h1>
                  <div className="text-[#718078]">{desc}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setModalTitle("Block court for maintenance");
                      setModalType("blockMaintenance");
                    }}
                    className="pc-btn-lift px-3.5 py-2.5 rounded-lg bg-[#176b4d] hover:bg-[#12543c] text-white font-bold text-[12.5px]"
                  >
                    ＋ Block maintenance
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalTitle("Create booking");
                      setModalType("createBooking");
                    }}
                    className="pc-pill-lift px-3.5 py-2.5 rounded-lg border border-[#e3eae5] hover:border-[#176b4d] bg-white font-bold text-[12.5px]"
                  >
                    ＋ Manual booking
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
                {[
                  ["Available now", "7 courts", "Across all venues"],
                  ["Booked today", "78.4%", "Occupancy rate"],
                  ["Maintenance blocks", "2", "Today"],
                  ["Conflicts", "0", "No unresolved conflicts"],
                ].map(([k, val, sub]) => (
                  <div
                    key={k}
                    className="group pc-admin-card bg-white border border-[#e3eae5] rounded-[13px] p-4 shadow-admin cursor-default"
                  >
                    <small className="text-[#718078]">{k}</small>
                    <div className="text-[25px] font-extrabold my-2 group-hover:text-[#176b4d] transition-colors">
                      {val}
                    </div>
                    <div className="text-[#176b4d] text-[11px] font-bold">
                      {sub}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pc-admin-card bg-white border border-[#e3eae5] rounded-[13px] shadow-admin overflow-hidden">
                <div className="p-4 border-b border-[#e3eae5] flex items-center justify-between">
                  <h3 className="text-[14px] font-bold m-0">
                    Wednesday, 28 October 2026
                  </h3>
                  <small className="text-[#718078]">
                    Select any time cell to inspect or book
                  </small>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-[#fafbfa] text-[#718078] text-[10px] uppercase tracking-wider border-b border-[#e3eae5]">
                        <th className="text-left py-3 px-4">Court</th>
                        {[
                          "09:00",
                          "10:00",
                          "11:00",
                          "12:00",
                          "13:00",
                          "14:00",
                          "15:00",
                        ].map((t) => (
                          <th key={t} className="text-left py-3 px-4">
                            {t}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        "The Green Racquet · Tennis 01",
                        "The Green Racquet · Tennis 02",
                        "Baseline House · Padel 01",
                        "Smash Social · Badminton 03",
                      ].map((courtName, i) => (
                        <tr
                          key={courtName}
                          className="border-b border-[#edf1ee] hover:bg-[#f8fbf9] transition-colors"
                        >
                          <td className="py-3 px-4 font-bold text-[12.5px]">
                            {courtName}
                          </td>
                          {[
                            "09:00",
                            "10:00",
                            "11:00",
                            "12:00",
                            "13:00",
                            "14:00",
                            "15:00",
                          ].map((timeStr, j) => {
                            const st =
                              (i + j) % 3 === 0
                                ? "Available"
                                : i === 3 && j === 5
                                ? "Maintenance"
                                : "Booked";
                            return (
                              <td key={timeStr} className="py-2.5 px-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSlotInfo([courtName, timeStr, st]);
                                    setModalTitle("Court slot details");
                                    setModalType("slot");
                                  }}
                                  className={`pc-pill-lift px-2.5 py-1.5 rounded-lg border text-[11px] font-bold ${
                                    st === "Available"
                                      ? "bg-[#e8f5ed] border-[#cce6d6] text-[#176b4d] hover:bg-[#d5ede0]"
                                      : st === "Maintenance"
                                      ? "bg-[#fdeaea] border-[#f5c8c8] text-[#ad3d40]"
                                      : "bg-white border-[#e3eae5] hover:border-[#176b4d] text-[#24382d]"
                                  }`}
                                >
                                  {st === "Available" ? "＋ Free" : st}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* 3. REPORTS MODULE */}
          {page === "reports" && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div>
                  <div className="text-[#176b4d] text-[10px] tracking-[1.5px] font-extrabold uppercase">
                    PLAYCOURT / OPERATIONS
                  </div>
                  <h1 className="text-[26px] font-extrabold tracking-[-0.7px] my-1">
                    Analytics & reports
                  </h1>
                  <div className="text-[#718078]">{desc}</div>
                </div>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="pc-btn-lift inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-[#176b4d] hover:bg-[#12543c] text-white font-bold text-[12.5px]"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
                {[
                  ["Revenue MTD", "₹12.84L", "+8.4% month-on-month"],
                  ["Bookings MTD", "2,841", "+12.8% month-on-month"],
                  ["Average booking", "₹924", "Completed bookings"],
                  ["Repeat player rate", "64.8%", "Rolling 90 days"],
                ].map(([k, val, sub]) => (
                  <div
                    key={k}
                    className="group pc-admin-card bg-white border border-[#e3eae5] rounded-[13px] p-4 shadow-admin cursor-default"
                  >
                    <small className="text-[#718078]">{k}</small>
                    <div className="text-[25px] font-extrabold my-2 group-hover:text-[#176b4d] transition-colors">
                      {val}
                    </div>
                    <div className="text-[#176b4d] text-[11px] font-bold">
                      {sub}
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="pc-admin-card bg-white border border-[#e3eae5] rounded-[13px] shadow-admin p-5">
                  <h3 className="text-[14px] font-bold mb-4">
                    Venue occupancy performance
                  </h3>
                  <div className="space-y-3">
                    {(
                      [
                        ["The Green Racquet Club", 91],
                        ["Baseline Padel House", 84],
                        ["Smash Social Arena", 78],
                        ["Central Arena", 62],
                      ] as [string, number][]
                    ).map(([n, pct]) => (
                      <div
                        key={n}
                        className="group/occ p-2 -mx-2 rounded-lg hover:bg-[#f6faf7] transition-colors cursor-default"
                      >
                        <div className="flex justify-between text-[12.5px] mb-1">
                          <strong className="group-hover/occ:text-[#176b4d] transition-colors">
                            {n}
                          </strong>
                          <span className="font-bold">{pct}%</span>
                        </div>
                        <div className="h-2 bg-[#edf1ee] rounded-full overflow-hidden">
                          <div
                            style={{ width: `${pct}%` }}
                            className="h-full bg-[#26744f] group-hover/occ:bg-[#1e8c59] transition-colors rounded-full"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pc-admin-card bg-white border border-[#e3eae5] rounded-[13px] shadow-admin p-5">
                  <h3 className="text-[14px] font-bold mb-3">Report library</h3>
                  <div className="divide-y divide-[#edf1ee]">
                    {[
                      "Revenue & refunds ledger",
                      "Court booking utilisation",
                      "Group membership & daily credit audit",
                      "Community match participation",
                    ].map((rep) => (
                      <div
                        key={rep}
                        className="py-3 px-2.5 -mx-2.5 rounded-lg hover:bg-[#f6faf7] transition-colors flex items-center justify-between"
                      >
                        <div>
                          <strong className="text-[12.5px] block">{rep}</strong>
                          <span className="text-[11px] text-[#718078]">
                            CSV · Demo report
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            showToast(`Demo report generated: ${rep}`)
                          }
                          className="pc-pill-lift px-3 py-1 rounded-md bg-[#eef7f2] text-[#176b4d] font-extrabold text-[12px]"
                        >
                          Generate ↓
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 4. SETTINGS & AUDIT LOG MODULE */}
          {page === "settings" && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div>
                  <div className="text-[#176b4d] text-[10px] tracking-[1.5px] font-extrabold uppercase">
                    PLAYCOURT / OPERATIONS
                  </div>
                  <h1 className="text-[26px] font-extrabold tracking-[-0.7px] my-1">
                    Settings & audit log
                  </h1>
                  <div className="text-[#718078]">{desc}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (adminUser) {
                      void executeAdminAction(
                        { action: "save_settings" },
                        "Platform settings saved & logged in admin_audit_logs"
                      );
                    } else {
                      showToast("Settings saved in demo session only");
                    }
                  }}
                  className="pc-btn-lift px-4 py-2.5 rounded-lg bg-[#176b4d] hover:bg-[#12543c] text-white font-bold text-[12.5px]"
                >
                  Save settings
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
                <div className="pc-admin-card bg-white border border-[#e3eae5] rounded-[13px] shadow-admin p-5 space-y-3.5">
                  <h3 className="text-[14px] font-bold mb-2">
                    Platform configuration
                  </h3>
                  {[
                    ["Platform name", "PlayCourt"],
                    ["Default currency", "INR — Indian Rupee (₹)"],
                    ["Default booking slot length", "60 minutes"],
                    ["Max linked accounts per group", "4 player accounts"],
                    ["Shared free group credits per day", "1 credit / day"],
                  ].map(([lbl, val]) => (
                    <div key={lbl}>
                      <label className="block text-[11px] font-extrabold mb-1">
                        {lbl}
                      </label>
                      <input
                        defaultValue={val}
                        className="w-full p-2.5 rounded-lg border border-[#e3eae5] text-[12.5px]"
                      />
                    </div>
                  ))}
                </div>

                <div className="pc-admin-card bg-white border border-[#e3eae5] rounded-[13px] shadow-admin p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[14px] font-bold m-0">System health</h3>
                    {statusBadge("Demo mode")}
                  </div>
                  <div className="divide-y divide-[#edf1ee]">
                    {[
                      ["Database", "SQLite WAL + PostgreSQL 16 DDL Ready"],
                      ["Payment gateway", "Idempotent Ledger + Webhook Contract"],
                      ["SMS / OTP delivery", "Hashed 6-digit OTP + JWT Session"],
                      [
                        "Shared group credit rule",
                        "4 linked accounts · 1 daily credit enforced via uq_group_daily_credit_once",
                      ],
                    ].map(([a, b]) => (
                      <div
                        key={a}
                        className="py-3 px-2.5 -mx-2.5 rounded-lg hover:bg-[#f6faf7] transition-colors cursor-default"
                      >
                        <strong className="text-[12.5px] block">{a}</strong>
                        <p className="text-[11.5px] text-[#718078] m-0 mt-0.5">
                          {b}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#edf1ee]">
                    <h4 className="text-[12px] font-extrabold text-[#176b4d] uppercase tracking-wider mb-2">
                      Recent Audit Trail (admin_audit_logs)
                    </h4>
                    <div className="space-y-1.5 text-[11.5px] text-[#718078]">
                      {auditLogs.slice(0, 5).map((entry, idx) => (
                        <div
                          key={idx}
                          className="truncate px-2 py-1 -mx-2 rounded hover:bg-[#f6faf7] hover:text-[#174b35] transition-colors cursor-default"
                        >
                          • {entry}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 5. STANDARD TABLE MODULES (bookings, venues, players, memberships, payments, community, events, commerce, offers, team) */}
          {!["overview", "schedule", "reports", "settings"].includes(page) && (
            <>
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div>
                  <div className="text-[#176b4d] text-[10px] tracking-[1.5px] font-extrabold uppercase">
                    PLAYCOURT / OPERATIONS
                  </div>
                  <h1 className="text-[26px] font-extrabold tracking-[-0.7px] my-1">
                    {title}
                  </h1>
                  <div className="text-[#718078]">{desc}</div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (page === "bookings") {
                      setModalTitle("Create booking");
                      setModalType("createBooking");
                    } else if (page === "payments") {
                      setModalTitle("Transaction reconciliation");
                      setModalType("reconcile");
                    } else {
                      openGenericForm(`Create ${label.toLowerCase()} record`, [
                        "Title / Name",
                        "Location / Email",
                        "Status / Category",
                      ]);
                    }
                  }}
                  className="pc-btn-lift px-4 py-2.5 rounded-lg bg-[#176b4d] hover:bg-[#12543c] text-white font-bold text-[12.5px] shrink-0"
                >
                  {page === "payments"
                    ? "Reconcile transactions"
                    : `＋ Add ${label.split(" ")[0]}`}
                </button>
              </div>

              {/* Module Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-5">
                <div className="group pc-admin-card bg-white border border-[#e3eae5] rounded-[13px] p-4 shadow-admin cursor-default">
                  <small className="text-[#718078]">Records</small>
                  <div className="text-[25px] font-extrabold my-1.5 group-hover:text-[#176b4d] transition-colors">
                    {(adminData[page] || []).length}
                  </div>
                  <div className="text-[#176b4d] text-[11px] font-bold">
                    Illustrative demo data
                  </div>
                </div>
                <div className="group pc-admin-card bg-white border border-[#e3eae5] rounded-[13px] p-4 shadow-admin cursor-default">
                  <small className="text-[#718078]">Needs attention</small>
                  <div className="text-[25px] font-extrabold my-1.5 group-hover:text-[#176b4d] transition-colors">
                    {
                      (adminData[page] || []).filter((r) =>
                        [
                          "Pending",
                          "Failed",
                          "Suspended",
                          "Payment overdue",
                          "Maintenance",
                        ].includes(r[r.length - 1])
                      ).length
                    }
                  </div>
                  <div className="text-[#176b4d] text-[11px] font-bold">
                    Review flagged records
                  </div>
                </div>
                <div className="group pc-admin-card bg-white border border-[#e3eae5] rounded-[13px] p-4 shadow-admin cursor-default">
                  <small className="text-[#718078]">Last updated</small>
                  <div className="text-[25px] font-extrabold my-1.5 group-hover:text-[#176b4d] transition-colors">
                    Just now
                  </div>
                  <div className="text-[#176b4d] text-[11px] font-bold">
                    Interactive demo session
                  </div>
                </div>
              </div>

              {/* Filterable Data Table Card */}
              <div className="pc-admin-card bg-white border border-[#e3eae5] rounded-[13px] shadow-admin overflow-hidden">
                <div className="p-3.5 border-b border-[#e3eae5] flex flex-wrap items-center gap-2.5">
                  <div className="relative flex-1 min-w-[210px] group">
                    <Search className="w-4 h-4 text-[#718078] group-focus-within:text-[#176b4d] transition-colors absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={`Search ${page}...`}
                      className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#e3eae5] text-[12.5px]"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="p-2 rounded-lg border border-[#e3eae5] bg-white text-[12.5px] cursor-pointer"
                  >
                    <option>All statuses</option>
                    {[
                      "Confirmed",
                      "Pending",
                      "Cancelled",
                      "Failed",
                      "Active",
                      "Suspended",
                      "Payment overdue",
                      "Paid",
                      "Open",
                      "Almost full",
                      "Published",
                      "Draft",
                      "Processing",
                      "Completed",
                      "Maintenance",
                      "Scheduled",
                    ].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="pc-pill-lift px-3.5 py-2 rounded-lg border border-[#e3eae5] hover:border-[#176b4d] bg-white font-bold text-[12px]"
                  >
                    ↓ Export CSV
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-[#fafbfa] text-[#718078] text-[10px] uppercase tracking-wider border-b border-[#e3eae5]">
                        {(TABLE_HEADERS[page] || ["Item", "Details"]).map(
                          (h) => (
                            <th key={h} className="text-left py-3 px-4">
                              {h}
                            </th>
                          )
                        )}
                        <th className="text-left py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentRows.length > 0 ? (
                        currentRows.map((r, i) => (
                          <tr
                            key={i}
                            className="border-b border-[#edf1ee] hover:bg-[#eef7f2] transition-colors text-[12.5px]"
                          >
                            {r.map((v, j) => (
                              <td key={j} className="py-3 px-4">
                                {j === 0 ? (
                                  <strong>{v}</strong>
                                ) : isStatusValue(v) ? (
                                  statusBadge(v)
                                ) : (
                                  v
                                )}
                              </td>
                            ))}
                            <td className="py-3 px-4">
                              <button
                                type="button"
                                onClick={() => {
                                  setModalRecord(r);
                                  setModalTitle("Record details");
                                  setModalType("record");
                                }}
                                className="pc-pill-lift px-2.5 py-1 rounded-md hover:bg-[#d9f0e2] text-[#176b4d] font-extrabold text-[12px]"
                              >
                                View details ↗
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={8}
                            className="py-8 text-center text-[#718078]"
                          >
                            No matching records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-3.5 text-[#718078] text-[11.5px]">
                  Showing {currentRows.length} demo records · Filters work on
                  this page
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {/* ADMIN MODALS */}
      {modalType && (
        <div
          className="fixed inset-0 z-50 bg-[#0d2119]/65 backdrop-blur-[2px] grid place-items-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalType(null);
          }}
        >
          <div className="pc-modal-pop bg-white rounded-[14px] w-[min(540px,100%)] overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-[#e3eae5] flex items-center justify-between">
              <strong className="text-[15px]">{modalTitle}</strong>
              <button
                type="button"
                onClick={() => setModalType(null)}
                className="pc-pill-lift px-2.5 py-1 rounded-lg border border-[#e3eae5] hover:bg-[#f2f6f3] text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {modalType === "record" && modalRecord && (
              <>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {modalRecord.map((val, idx) => (
                      <div
                        key={idx}
                        className="pc-hover-subcard border border-[#e3eae5] p-3 rounded-lg"
                      >
                        <small className="text-[#718078] block text-[10.5px]">
                          {(TABLE_HEADERS[page] || [])[idx] ||
                            `Field ${idx + 1}`}
                        </small>
                        <strong className="text-[13px] mt-0.5 block">
                          {val}
                        </strong>
                      </div>
                    ))}
                  </div>
                  <p className="text-[#718078] text-[12px] m-0">
                    Illustrative data. Production actions must enforce role
                    permissions and write an audit log.
                  </p>
                </div>
                <div className="px-5 py-3.5 bg-[#fafbfa] border-t border-[#e3eae5] flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-3.5 py-2 rounded-lg border border-[#e3eae5] bg-white font-bold text-xs"
                  >
                    Close
                  </button>
                  {page === "bookings" && adminUser && (
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await executeAdminAction(
                          {
                            action: "update_booking_status",
                            bookingId: modalRecord[0],
                            status: "Cancelled",
                          },
                          `Booking ${modalRecord[0]} cancelled & credit restored if applicable`
                        );
                        if (ok) setModalType(null);
                      }}
                      className="px-3.5 py-2 rounded-lg bg-[#ad3d40] text-white font-bold text-xs"
                    >
                      Approve Cancel / Mark Cancelled
                    </button>
                  )}
                  {page === "players" && adminUser && (
                    <button
                      type="button"
                      onClick={async () => {
                        const ok = await executeAdminAction(
                          {
                            action: "toggle_player_status",
                            email: modalRecord[1],
                          },
                          `Updated account status for ${modalRecord[0]}`
                        );
                        if (ok) setModalType(null);
                      }}
                      className="px-3.5 py-2 rounded-lg bg-amber-700 text-white font-bold text-xs"
                    >
                      Toggle Active / Suspended
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      if (page === "bookings" && adminUser) {
                        const ok = await executeAdminAction(
                          {
                            action: "update_booking_status",
                            bookingId: modalRecord[0],
                            status: "Confirmed",
                          },
                          `Booking ${modalRecord[0]} marked Confirmed`
                        );
                        if (ok) setModalType(null);
                      } else {
                        setModalType(null);
                        showToast("Record updated in demo session");
                      }
                    }}
                    className="px-3.5 py-2 rounded-lg bg-[#176b4d] text-white font-bold text-xs"
                  >
                    Approve / Save
                  </button>
                </div>
              </>
            )}

            {modalType === "createBooking" && (
              <form onSubmit={handleSaveAdminBooking}>
                <div className="p-5 space-y-3">
                  <div>
                    <label className="block text-[11px] font-extrabold mb-1">
                      Player name
                    </label>
                    <input
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      placeholder="Enter player name"
                      className="w-full p-2.5 rounded-lg border border-[#e3eae5]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold mb-1">
                      Venue
                    </label>
                    <select
                      value={newVenue}
                      onChange={(e) => setNewVenue(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-[#e3eae5] bg-white"
                    >
                      <option>The Green Racquet Club</option>
                      <option>Baseline Padel House</option>
                      <option>Smash Social Arena</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-extrabold mb-1">
                        Court
                      </label>
                      <select
                        value={newCourt}
                        onChange={(e) => setNewCourt(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-[#e3eae5] bg-white"
                      >
                        <option>Tennis Court 01</option>
                        <option>Tennis Court 02</option>
                        <option>Padel Court 01</option>
                        <option>Badminton Court 03</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold mb-1">
                        Time slot
                      </label>
                      <select
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-[#e3eae5] bg-white"
                      >
                        <option>09:00–10:00</option>
                        <option>10:00–11:00</option>
                        <option>11:00–12:00</option>
                        <option>18:00–19:00</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="px-5 py-3.5 bg-[#fafbfa] border-t border-[#e3eae5] flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-3.5 py-2 rounded-lg border border-[#e3eae5] bg-white font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-lg bg-[#176b4d] text-white font-bold text-xs"
                  >
                    Create booking (demo)
                  </button>
                </div>
              </form>
            )}

            {modalType === "slot" && slotInfo && (
              <>
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="border border-[#e3eae5] p-3 rounded-lg">
                      <small className="text-[#718078] block">Court</small>
                      <strong>{slotInfo[0]}</strong>
                    </div>
                    <div className="border border-[#e3eae5] p-3 rounded-lg">
                      <small className="text-[#718078] block">Time</small>
                      <strong>{slotInfo[1]}</strong>
                    </div>
                    <div className="border border-[#e3eae5] p-3 rounded-lg">
                      <small className="text-[#718078] block">Status</small>
                      <strong>{slotInfo[2]}</strong>
                    </div>
                  </div>
                  <p className="text-[#718078] text-[12px] m-0">
                    Demo availability only. Production booking must recheck the
                    database to prevent double booking.
                  </p>
                </div>
                <div className="px-5 py-3.5 bg-[#fafbfa] border-t border-[#e3eae5] flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-3.5 py-2 rounded-lg border border-[#e3eae5] bg-white font-bold text-xs"
                  >
                    Close
                  </button>
                  {slotInfo[2] === "Available" && (
                    <button
                      type="button"
                      onClick={() => {
                        setModalTitle("Create booking");
                        setModalType("createBooking");
                      }}
                      className="px-3.5 py-2 rounded-lg bg-[#176b4d] text-white font-bold text-xs"
                    >
                      Create booking
                    </button>
                  )}
                </div>
              </>
            )}

            {modalType === "genericForm" && (
              <>
                <div className="p-5 space-y-3">
                  {genericFields.map((f) => (
                    <div key={f}>
                      <label className="block text-[11px] font-extrabold mb-1">
                        {f}
                      </label>
                      <input
                        placeholder={`Enter ${f.toLowerCase()}`}
                        className="w-full p-2.5 rounded-lg border border-[#e3eae5]"
                      />
                    </div>
                  ))}
                </div>
                <div className="px-5 py-3.5 bg-[#fafbfa] border-t border-[#e3eae5] flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-3.5 py-2 rounded-lg border border-[#e3eae5] bg-white font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalType(null);
                      showToast("Action saved in this demo session only");
                    }}
                    className="px-3.5 py-2 rounded-lg bg-[#176b4d] text-white font-bold text-xs"
                  >
                    Save (demo)
                  </button>
                </div>
              </>
            )}

            {modalType === "blockMaintenance" && (
              <form onSubmit={handleSaveMaintenanceBlock}>
                <div className="p-5 space-y-3">
                  <div>
                    <label className="block text-[11px] font-extrabold mb-1">
                      Venue
                    </label>
                    <select
                      value={maintVenueId}
                      onChange={(e) => {
                        const vid = e.target.value;
                        setMaintVenueId(vid);
                        const v = contextVenues.find((x) => x.id === vid);
                        if (v?.courts[0]) setMaintCourtId(v.courts[0].id);
                      }}
                      className="w-full p-2.5 rounded-lg border border-[#e3eae5] bg-white"
                    >
                      {contextVenues.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.city})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-extrabold mb-1">
                        Court
                      </label>
                      <select
                        value={maintCourtId}
                        onChange={(e) => setMaintCourtId(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-[#e3eae5] bg-white"
                      >
                        {(
                          contextVenues.find((x) => x.id === maintVenueId)
                            ?.courts || contextVenues[0].courts
                        ).map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold mb-1">
                        Block Date
                      </label>
                      <input
                        type="date"
                        required
                        value={maintDate}
                        onChange={(e) => setMaintDate(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-[#e3eae5]"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-extrabold mb-1">
                        Time Slot / Window
                      </label>
                      <select
                        value={maintSlot}
                        onChange={(e) => setMaintSlot(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-[#e3eae5] bg-white"
                      >
                        <option>07:00–08:00</option>
                        <option>09:00–10:00</option>
                        <option>10:30–11:30</option>
                        <option>17:00–18:00</option>
                        <option>18:00–19:00</option>
                        <option>19:00–20:00</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-extrabold mb-1">
                        Reason
                      </label>
                      <input
                        required
                        value={maintReason}
                        onChange={(e) => setMaintReason(e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-[#e3eae5]"
                      />
                    </div>
                  </div>
                  {maintenanceBlocks.length > 0 && (
                    <div className="pt-2 border-t border-[#edf1ee] space-y-1.5">
                      <div className="text-[11px] font-extrabold text-[#176b4d]">
                        Active Persisted Maintenance Blocks ({maintenanceBlocks.length})
                      </div>
                      {maintenanceBlocks.slice(0, 4).map((mb) => (
                        <div
                          key={mb.id}
                          className="flex items-center justify-between text-[11.5px] bg-[#f8fbf9] p-2 rounded border border-[#e3eae5]"
                        >
                          <span>
                            {mb.court_name} · {mb.block_date} ({mb.time_slot})
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              void executeAdminAction(
                                {
                                  action: "remove_maintenance_block",
                                  blockId: mb.id,
                                },
                                "Maintenance block cleared"
                              )
                            }
                            className="text-red-700 font-bold underline"
                          >
                            Clear
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="px-5 py-3.5 bg-[#fafbfa] border-t border-[#e3eae5] flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-3.5 py-2 rounded-lg border border-[#e3eae5] bg-white font-bold text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-lg bg-[#176b4d] text-white font-bold text-xs"
                  >
                    Save Maintenance Block
                  </button>
                </div>
              </form>
            )}

            {modalType === "reconcile" && (
              <>
                <div className="p-5 space-y-3">
                  <p className="text-[#718078] text-[12.5px] m-0">
                    Reconcile pending/failed gateway records in SQLite or test
                    idempotent duplicate webhook replay below.
                  </p>
                  <div className="border border-[#e3eae5] p-3 rounded-lg">
                    <strong className="block">TX-93819 · Failed</strong>
                    <small className="text-[#718078]">
                      Subscription renewal · ₹2,499
                    </small>
                  </div>
                  <div className="border border-[#e3eae5] p-3 rounded-lg">
                    <strong className="block">TX-93820 · Pending</strong>
                    <small className="text-[#718078]">
                      Booking payment · ₹1,200
                    </small>
                  </div>
                  {localDevMode && (
                    <div className="p-3 rounded-lg bg-[#f4f8ee] border border-[#cde0b8] space-y-2 text-[11.5px]">
                      <div className="flex items-center justify-between">
                        <strong>Webhook Idempotency Simulator</strong>
                        <button
                          type="button"
                          onClick={handleTestDuplicateWebhook}
                          className="px-2.5 py-1 rounded bg-[#176b4d] text-white font-bold"
                        >
                          Send Duplicate Webhook ×2
                        </button>
                      </div>
                      {webhookTestLog && (
                        <div className="text-[#2f4b1a] font-semibold">
                          {webhookTestLog}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="px-5 py-3.5 bg-[#fafbfa] border-t border-[#e3eae5] flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-3.5 py-2 rounded-lg border border-[#e3eae5] bg-white font-bold text-xs"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (adminUser) {
                        const ok = await executeAdminAction(
                          { action: "reconcile_payments" },
                          "Pending & Failed payments reconciled to Paid"
                        );
                        if (ok) setModalType(null);
                      } else {
                        setModalType(null);
                        showToast("Transactions marked reviewed (Preview)");
                      }
                    }}
                    className="px-3.5 py-2 rounded-lg bg-[#176b4d] text-white font-bold text-xs"
                  >
                    Mark reviewed / Reconcile
                  </button>
                </div>
              </>
            )}

            {modalType === "help" && (
              <>
                <div className="p-5 space-y-2 text-[13px]">
                  <p className="m-0">
                    Use the left navigation to open each operations module.
                    Search, status filters, record details, demo forms and CSV
                    export work in this console.
                  </p>
                  <p className="text-[#718078] m-0">
                    This is front-end demo data only, not connected to a
                    production database, authentication, payments or SMS
                    provider.
                  </p>
                </div>
                <div className="px-5 py-3.5 bg-[#fafbfa] border-t border-[#e3eae5] flex justify-end">
                  <button
                    type="button"
                    onClick={() => setModalType(null)}
                    className="px-3.5 py-2 rounded-lg bg-[#176b4d] text-white font-bold text-xs"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

