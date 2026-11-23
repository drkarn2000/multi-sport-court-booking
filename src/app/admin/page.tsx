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
  Calendar,
  DollarSign,
  Users,
  Activity,
  Sparkles,
  CreditCard,
  Trophy,
  Zap,
  ShoppingBag,
  Tag,
  FileBarChart,
  UserCheck,
  Settings as SettingsIcon,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  Building2,
  BarChart3,
  TrendingUp,
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

const MODULE_ICONS: Record<
  AdminPageKey,
  React.ComponentType<{ className?: string }>
> = {
  overview: BarChart3,
  bookings: Calendar,
  schedule: Clock,
  venues: Building2,
  players: Users,
  memberships: Sparkles,
  payments: CreditCard,
  community: Trophy,
  events: Zap,
  commerce: ShoppingBag,
  offers: Tag,
  reports: FileBarChart,
  team: UserCheck,
  settings: SettingsIcon,
};

const MODULE_COLORS: Record<
  AdminPageKey,
  { bg: string; text: string; activeBg: string }
> = {
  overview: { bg: "bg-emerald-500/20", text: "text-emerald-400", activeBg: "bg-gradient-to-r from-emerald-600 to-teal-600" },
  bookings: { bg: "bg-sky-500/20", text: "text-sky-400", activeBg: "bg-gradient-to-r from-sky-600 to-blue-600" },
  schedule: { bg: "bg-purple-500/20", text: "text-purple-400", activeBg: "bg-gradient-to-r from-purple-600 to-indigo-600" },
  venues: { bg: "bg-amber-500/20", text: "text-amber-400", activeBg: "bg-gradient-to-r from-amber-600 to-orange-600" },
  players: { bg: "bg-pink-500/20", text: "text-pink-400", activeBg: "bg-gradient-to-r from-pink-600 to-rose-600" },
  memberships: { bg: "bg-lime-500/20", text: "text-lime-400", activeBg: "bg-gradient-to-r from-lime-600 to-emerald-600" },
  payments: { bg: "bg-teal-500/20", text: "text-teal-400", activeBg: "bg-gradient-to-r from-teal-600 to-cyan-600" },
  community: { bg: "bg-indigo-500/20", text: "text-indigo-400", activeBg: "bg-gradient-to-r from-indigo-600 to-purple-600" },
  events: { bg: "bg-orange-500/20", text: "text-orange-400", activeBg: "bg-gradient-to-r from-orange-600 to-amber-600" },
  commerce: { bg: "bg-rose-500/20", text: "text-rose-400", activeBg: "bg-gradient-to-r from-rose-600 to-pink-600" },
  offers: { bg: "bg-fuchsia-500/20", text: "text-fuchsia-400", activeBg: "bg-gradient-to-r from-fuchsia-600 to-purple-600" },
  reports: { bg: "bg-blue-500/20", text: "text-blue-400", activeBg: "bg-gradient-to-r from-blue-600 to-indigo-600" },
  team: { bg: "bg-emerald-500/20", text: "text-emerald-400", activeBg: "bg-gradient-to-r from-emerald-600 to-teal-600" },
  settings: { bg: "bg-slate-500/20", text: "text-slate-400", activeBg: "bg-gradient-to-r from-slate-600 to-zinc-600" },
};

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
      "3 alerts",
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
      ? "bg-gradient-to-r from-amber-100 to-orange-100 text-amber-900 border border-amber-300 shadow-sm"
      : isDanger
      ? "bg-gradient-to-r from-rose-100 to-red-100 text-rose-900 border border-rose-300 shadow-sm"
      : isNeutral
      ? "bg-gradient-to-r from-slate-100 to-zinc-100 text-slate-700 border border-slate-300 shadow-sm"
      : "bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-900 border border-emerald-300 shadow-sm";

    const dotCls = isWarn
      ? "bg-amber-500 animate-pulse"
      : isDanger
      ? "bg-rose-500"
      : isNeutral
      ? "bg-slate-400"
      : "bg-emerald-500 animate-pulse";

    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-extrabold transition-all duration-200 hover:scale-105 hover:shadow-sm cursor-default ${cls}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${dotCls}`} />
        <span>{s}</span>
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
    <div className="min-h-screen bg-[#f8faf9] text-[#18251f] text-[14px]">
      {/* FIXED LEFT SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 w-[265px] bg-gradient-to-b from-[#0f291f] via-[#122b21] to-[#0c1f17] text-white p-5 overflow-y-auto z-40 transition-transform duration-200 border-r border-emerald-900/50 shadow-2xl ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="pb-5 mb-3 border-b border-white/15 flex items-center justify-between">
          <div>
            <div className="text-[20px] font-black tracking-tight flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-pc-lime text-pc-deep grid place-items-center text-sm font-black shadow-md">
                P
              </span>
              <span>playcourt</span>
            </div>
            <span className="inline-block text-[10px] tracking-[1.6px] text-pc-lime/90 font-extrabold mt-1 uppercase">
              OPERATIONS CONSOLE
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg bg-white/10 text-white/70 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <Link
          href="/"
          className="group mt-2 mb-4 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-pc-lime text-[12px] font-black hover:from-emerald-500/30 hover:to-teal-500/30 hover:scale-[1.02] transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Customer App</span>
        </Link>

        <div className="text-[10.5px] tracking-[1.4px] text-emerald-400/80 pt-3 pb-2 px-3 font-black uppercase">
          WORKSPACE
        </div>
        <nav className="grid gap-1.5">
          {(
            [
              ["overview", "Overview"],
              ["bookings", "Bookings"],
              ["schedule", "Court schedule"],
              ["venues", "Venues & courts"],
              ["players", "Players"],
              ["memberships", "Memberships"],
            ] as [AdminPageKey, string][]
          ).map(([key, text]) => {
            const IconComp = MODULE_ICONS[key] || Activity;
            const col = MODULE_COLORS[key];
            const isAct = page === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => navigateModule(key)}
                className={`group px-3 py-2 rounded-xl text-left text-[13px] transition-all duration-200 flex items-center justify-between ${
                  isAct
                    ? `${col.activeBg} text-white font-black shadow-md shadow-emerald-950/40 translate-x-1`
                    : "text-[#c2d4ca] hover:bg-white/10 hover:text-white hover:translate-x-1"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-7 h-7 rounded-lg grid place-items-center transition-transform duration-200 group-hover:scale-110 ${
                      isAct ? "bg-white/20 text-white" : `${col.bg} ${col.text}`
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                  </span>
                  <span className="font-bold">{text}</span>
                </div>
                {key === "bookings" && (
                  <span
                    className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                      isAct
                        ? "bg-white text-emerald-900"
                        : "bg-emerald-500/20 text-emerald-300"
                    }`}
                  >
                    {adminData.bookings.length}
                  </span>
                )}
              </button>
            );
          })}

          <div className="text-[10.5px] tracking-[1.4px] text-sky-400/80 pt-4 pb-2 px-3 font-black uppercase">
            REVENUE & MATCHES
          </div>
          {(
            [
              ["payments", "Payments"],
              ["community", "Community & matches"],
              ["events", "Events & coaching"],
              ["commerce", "Shop & orders"],
              ["offers", "Offers & vouchers"],
            ] as [AdminPageKey, string][]
          ).map(([key, text]) => {
            const IconComp = MODULE_ICONS[key] || Activity;
            const col = MODULE_COLORS[key];
            const isAct = page === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => navigateModule(key)}
                className={`group px-3 py-2 rounded-xl text-left text-[13px] transition-all duration-200 flex items-center justify-between ${
                  isAct
                    ? `${col.activeBg} text-white font-black shadow-md shadow-emerald-950/40 translate-x-1`
                    : "text-[#c2d4ca] hover:bg-white/10 hover:text-white hover:translate-x-1"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-7 h-7 rounded-lg grid place-items-center transition-transform duration-200 group-hover:scale-110 ${
                      isAct ? "bg-white/20 text-white" : `${col.bg} ${col.text}`
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                  </span>
                  <span className="font-bold">{text}</span>
                </div>
              </button>
            );
          })}

          <div className="text-[10.5px] tracking-[1.4px] text-purple-400/80 pt-4 pb-2 px-3 font-black uppercase">
            INSIGHTS & CONTROL
          </div>
          {(
            [
              ["reports", "Reports & Analytics"],
              ["team", "Staff & permissions"],
              ["settings", "Settings & audit log"],
            ] as [AdminPageKey, string][]
          ).map(([key, text]) => {
            const IconComp = MODULE_ICONS[key] || Activity;
            const col = MODULE_COLORS[key];
            const isAct = page === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => navigateModule(key)}
                className={`group px-3 py-2 rounded-xl text-left text-[13px] transition-all duration-200 flex items-center justify-between ${
                  isAct
                    ? `${col.activeBg} text-white font-black shadow-md shadow-emerald-950/40 translate-x-1`
                    : "text-[#c2d4ca] hover:bg-white/10 hover:text-white hover:translate-x-1"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-7 h-7 rounded-lg grid place-items-center transition-transform duration-200 group-hover:scale-110 ${
                      isAct ? "bg-white/20 text-white" : `${col.bg} ${col.text}`
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                  </span>
                  <span className="font-bold">{text}</span>
                </div>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* MAIN WORKSPACE */}
      <div className="lg:ml-[265px]">
        {/* Sticky Top Bar */}
        <header className="h-[72px] flex items-center justify-between px-4 sm:px-8 bg-white/95 backdrop-blur-md border-b border-emerald-100 shadow-sm sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-1.5 text-[#5f7569] text-[11px] font-bold">
                <span className="text-emerald-700 font-extrabold">PlayCourt</span>
                <span>/</span>
                <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full font-extrabold">{label}</span>
              </div>
              <div className="font-black text-[17px] text-[#11241a] tracking-tight">{title}</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="hidden md:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-100 via-orange-100 to-amber-100 text-amber-950 text-[11px] font-black border border-amber-300 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              {adminUser
                ? `RBAC Active: ${adminUser.fullName} (${adminUser.role})`
                : "Interactive Operations Preview"}
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
                className="hidden sm:inline-block px-3 py-1.5 rounded-xl border-2 border-emerald-400 bg-emerald-50 text-emerald-950 text-[11.5px] font-black hover:bg-emerald-100 transition-colors shadow-sm cursor-pointer"
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
              className="pc-pill-lift hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50 text-[12px] font-extrabold text-emerald-900 hover:from-emerald-100 hover:to-teal-100 shadow-sm hover:shadow hover:-translate-y-0.5 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Customer App ↗</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                setModalTitle("Help & support");
                setModalType("help");
              }}
              className="pc-pill-lift inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-sky-300 bg-gradient-to-r from-sky-50 to-indigo-50 text-[12px] font-extrabold text-sky-900 hover:from-sky-100 hover:to-indigo-100 shadow-sm hover:shadow hover:-translate-y-0.5 transition-all"
            >
              <HelpCircle className="w-4 h-4 text-sky-600" />
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
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10.5px] font-black tracking-wider uppercase mb-1 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    LIVE OPERATIONS DASHBOARD
                  </div>
                  <h1 className="text-[28px] font-black tracking-[-0.8px] text-[#0f281e] my-1">
                    Good evening, team 👋
                  </h1>
                  <div className="text-[#556b60] text-[13.5px] font-medium">
                    Here’s real-time court activity, revenue &amp; player reservations today.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setModalTitle("Create booking");
                    setModalType("createBooking");
                  }}
                  className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-[13px] shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/35 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                >
                  <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                  <span>Create booking</span>
                </button>
              </div>

              {/* 4 Colorful Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* 1. Today's Bookings */}
                <div className="group rounded-2xl p-5 bg-gradient-to-br from-[#ecfdf5] via-[#f0fdf4] to-[#d1fae5]/60 border border-emerald-300 shadow-sm hover:shadow-xl hover:shadow-emerald-500/15 hover:-translate-y-1.5 transition-all duration-300 cursor-default">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12.5px] font-bold text-emerald-800 uppercase tracking-wider">Today's bookings</span>
                    <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white grid place-items-center shadow-md shadow-emerald-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      <Calendar className="w-5 h-5" />
                    </span>
                  </div>
                  <div className="text-[32px] font-black tracking-tight text-emerald-950 my-1 group-hover:text-emerald-700 transition-colors">
                    128
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-[11.5px] font-extrabold text-emerald-800 bg-emerald-200/70 px-2.5 py-0.5 rounded-full mt-1">
                    <span>↑ 12.8%</span>
                    <span className="font-medium opacity-80">vs last Saturday</span>
                  </div>
                </div>

                {/* 2. Gross Revenue */}
                <div className="group rounded-2xl p-5 bg-gradient-to-br from-[#eff6ff] via-[#f0f9ff] to-[#dbeafe]/60 border border-blue-300 shadow-sm hover:shadow-xl hover:shadow-blue-500/15 hover:-translate-y-1.5 transition-all duration-300 cursor-default">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12.5px] font-bold text-blue-800 uppercase tracking-wider">Gross revenue</span>
                    <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 text-white grid place-items-center shadow-md shadow-blue-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      <DollarSign className="w-5 h-5" />
                    </span>
                  </div>
                  <div className="text-[32px] font-black tracking-tight text-blue-950 my-1 group-hover:text-blue-700 transition-colors">
                    ₹1,84,650
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-[11.5px] font-extrabold text-blue-800 bg-blue-200/70 px-2.5 py-0.5 rounded-full mt-1">
                    <span>↑ 8.4%</span>
                    <span className="font-medium opacity-80">this week</span>
                  </div>
                </div>

                {/* 3. Court Occupancy */}
                <div className="group rounded-2xl p-5 bg-gradient-to-br from-[#faf5ff] via-[#fdf4ff] to-[#f3e8ff]/60 border border-purple-300 shadow-sm hover:shadow-xl hover:shadow-purple-500/15 hover:-translate-y-1.5 transition-all duration-300 cursor-default">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12.5px] font-bold text-purple-800 uppercase tracking-wider">Court occupancy</span>
                    <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-400 text-white grid place-items-center shadow-md shadow-purple-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      <Activity className="w-5 h-5" />
                    </span>
                  </div>
                  <div className="text-[32px] font-black tracking-tight text-purple-950 my-1 group-hover:text-purple-700 transition-colors">
                    78.4%
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-[11.5px] font-extrabold text-purple-800 bg-purple-200/70 px-2.5 py-0.5 rounded-full mt-1">
                    <span>19 active</span>
                    <span className="font-medium opacity-80">courts</span>
                  </div>
                </div>

                {/* 4. Active Memberships */}
                <div className="group rounded-2xl p-5 bg-gradient-to-br from-[#fffbeb] via-[#fffdf0] to-[#fef3c7]/60 border border-amber-300 shadow-sm hover:shadow-xl hover:shadow-amber-500/15 hover:-translate-y-1.5 transition-all duration-300 cursor-default">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12.5px] font-bold text-amber-800 uppercase tracking-wider">Active memberships</span>
                    <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white grid place-items-center shadow-md shadow-amber-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      <Sparkles className="w-5 h-5" />
                    </span>
                  </div>
                  <div className="text-[32px] font-black tracking-tight text-amber-950 my-1 group-hover:text-amber-700 transition-colors">
                    1,246
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-[11.5px] font-extrabold text-amber-900 bg-amber-200/70 px-2.5 py-0.5 rounded-full mt-1 truncate max-w-full">
                    <span>{groupMembership.groupName}</span>
                    <span className="font-medium opacity-80">({groupMembership.members.length}/4 active)</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-5 mb-6">
                {/* Bar Chart Card */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  <div className="p-4.5 bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/50 border-b border-emerald-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-700 grid place-items-center font-bold">
                        <BarChart3 className="w-4 h-4" />
                      </span>
                      <div>
                        <h3 className="text-[14px] font-black text-slate-800 m-0">
                          Revenue performance
                        </h3>
                        <small className="text-slate-500 font-semibold">
                          Daily gross revenue · Last 7 days
                        </small>
                      </div>
                    </div>
                    <select className="border border-emerald-200 bg-white rounded-lg px-2.5 py-1.5 text-[12px] font-bold text-emerald-900 cursor-pointer shadow-sm hover:border-emerald-400">
                      <option>Last 7 days</option>
                      <option>Last 30 days</option>
                    </select>
                  </div>
                  <div className="p-5">
                    <div className="h-[185px] flex items-end gap-3.5 border-b border-slate-100 pb-2">
                      {[
                        [48, "from-emerald-400 to-teal-600", "text-emerald-700"],
                        [62, "from-teal-400 to-cyan-600", "text-teal-700"],
                        [43, "from-sky-400 to-blue-600", "text-sky-700"],
                        [76, "from-indigo-400 to-purple-600", "text-indigo-700"],
                        [58, "from-purple-400 to-pink-600", "text-purple-700"],
                        [88, "from-rose-400 to-orange-500", "text-rose-700"],
                        [70, "from-amber-400 to-emerald-500", "text-amber-700"],
                      ].map(([v, grad, txtCol], i) => (
                        <div
                          key={i}
                          className="group/bar flex-1 h-full flex flex-col justify-end items-center gap-1.5 cursor-pointer"
                        >
                          <span className={`opacity-0 group-hover/bar:opacity-100 -translate-y-1 text-[11px] font-black transition-all ${txtCol}`}>
                            {v}%
                          </span>
                          <div
                            style={{ height: `${v}%` }}
                            className={`w-4/5 rounded-t-lg bg-gradient-to-t ${grad} group-hover/bar:scale-x-110 group-hover/bar:brightness-110 transition-all duration-200 origin-bottom shadow-sm`}
                          />
                          <small className="text-[11px] font-bold text-slate-500 group-hover/bar:text-slate-800 transition-colors">
                            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][i]}
                          </small>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Alerts Card */}
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  <div className="p-4.5 bg-gradient-to-r from-rose-50/80 via-white to-amber-50/50 border-b border-rose-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-700 grid place-items-center font-bold">
                        <AlertCircle className="w-4 h-4" />
                      </span>
                      <h3 className="text-[14px] font-black text-slate-800 m-0">
                        Needs attention
                      </h3>
                    </div>
                    {statusBadge("3 alerts")}
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-rose-50 via-white to-rose-50/30 border border-rose-200 hover:border-rose-400 transition-all hover:shadow-sm">
                      <strong className="text-[13px] text-rose-950 block font-bold">
                        Payment needs retry
                      </strong>
                      <p className="text-[11.5px] text-slate-600 my-1 font-medium">
                        TX-93819 · Isha Kapoor · ₹2,499
                      </p>
                      <button
                        type="button"
                        onClick={() => navigateModule("payments")}
                        className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-black text-[11.5px] shadow-sm hover:shadow hover:scale-105 transition-all"
                      >
                        <span>Review payment</span>
                        <span>→</span>
                      </button>
                    </div>

                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-50 via-white to-amber-50/30 border border-amber-200 hover:border-amber-400 transition-all hover:shadow-sm">
                      <strong className="text-[13px] text-amber-950 block font-bold">
                        Court maintenance block
                      </strong>
                      <p className="text-[11.5px] text-slate-600 my-1 font-medium">
                        Central Arena · Court 03 · 14:00–16:00
                      </p>
                      <button
                        type="button"
                        onClick={() => navigateModule("schedule")}
                        className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-[11.5px] shadow-sm hover:shadow hover:scale-105 transition-all"
                      >
                        <span>Open schedule</span>
                        <span>→</span>
                      </button>
                    </div>

                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-50 via-white to-indigo-50/30 border border-indigo-200 hover:border-indigo-400 transition-all hover:shadow-sm">
                      <strong className="text-[13px] text-indigo-950 block font-bold">
                        Membership renewal overdue
                      </strong>
                      <p className="text-[11.5px] text-slate-600 my-1 font-medium">
                        Riverside Trio · Shared daily credit locked
                      </p>
                      <button
                        type="button"
                        onClick={() => navigateModule("memberships")}
                        className="mt-1 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-black text-[11.5px] shadow-sm hover:shadow hover:scale-105 transition-all"
                      >
                        <span>Review membership</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Bookings Table */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="p-4.5 bg-gradient-to-r from-slate-50 via-emerald-50/30 to-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-700 grid place-items-center font-bold">
                      <Calendar className="w-4 h-4" />
                    </span>
                    <h3 className="text-[15px] font-black text-slate-800 m-0">Recent bookings</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateModule("bookings")}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-extrabold text-[12px] border border-emerald-300 transition-all shadow-sm hover:scale-105"
                  >
                    <span>View all bookings</span>
                    <span>→</span>
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-gradient-to-r from-slate-100 via-emerald-50/40 to-slate-100 text-slate-700 text-[11px] font-black uppercase tracking-wider border-b border-slate-200">
                        {[
                          "Booking",
                          "Player",
                          "Venue",
                          "Court",
                          "Time",
                          "Amount",
                          "Status",
                        ].map((h) => (
                          <th key={h} className="text-left py-3.5 px-4.5">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {adminData.bookings.slice(0, 4).map((r, idx) => (
                        <tr
                          key={idx}
                          className="border-b border-slate-100 hover:bg-gradient-to-r hover:from-emerald-50/60 hover:to-teal-50/40 transition-colors text-[13px]"
                        >
                          {r.map((v, j) => (
                            <td key={j} className="py-3.5 px-4.5">
                              {j === 0 ? (
                                <strong className="text-emerald-950 font-bold">{v}</strong>
                              ) : isStatusValue(v) ? (
                                statusBadge(v)
                              ) : (
                                <span className="text-slate-700 font-medium">{v}</span>
                              )}
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
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-900 text-[10.5px] font-black tracking-wider uppercase mb-1 shadow-sm">
                    <Clock className="w-3.5 h-3.5 text-purple-600" />
                    COURT SCHEDULE &amp; OCCUPANCY
                  </div>
                  <h1 className="text-[28px] font-black tracking-[-0.8px] text-[#0f281e] my-1">
                    Court schedule
                  </h1>
                  <div className="text-[#556b60] text-[13.5px] font-medium">{desc}</div>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setModalTitle("Block court for maintenance");
                      setModalType("blockMaintenance");
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-[12.5px] shadow-md shadow-amber-500/25 hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
                  >
                    <span>＋ Block maintenance</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setModalTitle("Create booking");
                      setModalType("createBooking");
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-[12.5px] shadow-md shadow-emerald-500/25 hover:shadow-lg hover:scale-105 active:scale-95 transition-all"
                  >
                    <span>＋ Manual booking</span>
                  </button>
                </div>
              </div>

              {/* 4 Colorful Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="group rounded-2xl p-5 bg-gradient-to-br from-[#ecfdf5] via-[#f0fdf4] to-[#d1fae5]/60 border border-emerald-300 shadow-sm hover:shadow-xl hover:shadow-emerald-500/15 hover:-translate-y-1.5 transition-all duration-300 cursor-default">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12.5px] font-bold text-emerald-800 uppercase tracking-wider">Available now</span>
                    <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white grid place-items-center shadow-md shadow-emerald-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      <CheckCircle2 className="w-5 h-5" />
                    </span>
                  </div>
                  <div className="text-[32px] font-black tracking-tight text-emerald-950 my-1 group-hover:text-emerald-700 transition-colors">
                    7 courts
                  </div>
                  <div className="text-emerald-800 text-[11.5px] font-bold">
                    Across all venues
                  </div>
                </div>

                <div className="group rounded-2xl p-5 bg-gradient-to-br from-[#eff6ff] via-[#f0f9ff] to-[#dbeafe]/60 border border-blue-300 shadow-sm hover:shadow-xl hover:shadow-blue-500/15 hover:-translate-y-1.5 transition-all duration-300 cursor-default">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12.5px] font-bold text-blue-800 uppercase tracking-wider">Booked today</span>
                    <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 text-white grid place-items-center shadow-md shadow-blue-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      <Activity className="w-5 h-5" />
                    </span>
                  </div>
                  <div className="text-[32px] font-black tracking-tight text-blue-950 my-1 group-hover:text-blue-700 transition-colors">
                    78.4%
                  </div>
                  <div className="text-blue-800 text-[11.5px] font-bold">
                    Occupancy rate
                  </div>
                </div>

                <div className="group rounded-2xl p-5 bg-gradient-to-br from-[#fffbeb] via-[#fffdf0] to-[#fef3c7]/60 border border-amber-300 shadow-sm hover:shadow-xl hover:shadow-amber-500/15 hover:-translate-y-1.5 transition-all duration-300 cursor-default">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12.5px] font-bold text-amber-800 uppercase tracking-wider">Maintenance blocks</span>
                    <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white grid place-items-center shadow-md shadow-amber-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      <Clock className="w-5 h-5" />
                    </span>
                  </div>
                  <div className="text-[32px] font-black tracking-tight text-amber-950 my-1 group-hover:text-amber-700 transition-colors">
                    2
                  </div>
                  <div className="text-amber-800 text-[11.5px] font-bold">
                    Active today
                  </div>
                </div>

                <div className="group rounded-2xl p-5 bg-gradient-to-br from-[#faf5ff] via-[#fdf4ff] to-[#f3e8ff]/60 border border-purple-300 shadow-sm hover:shadow-xl hover:shadow-purple-500/15 hover:-translate-y-1.5 transition-all duration-300 cursor-default">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12.5px] font-bold text-purple-800 uppercase tracking-wider">Conflicts</span>
                    <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-400 text-white grid place-items-center shadow-md shadow-purple-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      <ShieldCheck className="w-5 h-5" />
                    </span>
                  </div>
                  <div className="text-[32px] font-black tracking-tight text-purple-950 my-1 group-hover:text-purple-700 transition-colors">
                    0
                  </div>
                  <div className="text-purple-800 text-[11.5px] font-bold">
                    All clear
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="p-4.5 bg-gradient-to-r from-purple-50/80 via-white to-indigo-50/40 border-b border-purple-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-700 grid place-items-center font-bold">
                      <Clock className="w-4 h-4" />
                    </span>
                    <h3 className="text-[15px] font-black text-slate-800 m-0">
                      Court Availability Matrix · Wednesday, 28 October 2026
                    </h3>
                  </div>
                  <span className="text-slate-500 font-semibold text-xs">
                    Select any cell to inspect or book
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-gradient-to-r from-slate-100 via-purple-50/30 to-slate-100 text-slate-700 text-[11px] font-black uppercase tracking-wider border-b border-slate-200">
                        <th className="text-left py-3.5 px-4.5">Court</th>
                        {[
                          "09:00",
                          "10:00",
                          "11:00",
                          "12:00",
                          "13:00",
                          "14:00",
                          "15:00",
                        ].map((t) => (
                          <th key={t} className="text-left py-3.5 px-4">
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
                          className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors"
                        >
                          <td className="py-3.5 px-4.5 font-bold text-[13px] text-slate-800">
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
                                  className={`px-3 py-1.5 rounded-xl border text-[11px] font-extrabold transition-all duration-200 hover:scale-105 hover:shadow-sm ${
                                    st === "Available"
                                      ? "bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-300 text-emerald-900 hover:bg-emerald-100 hover:border-emerald-400"
                                      : st === "Maintenance"
                                      ? "bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 text-amber-900 hover:bg-amber-100 hover:border-amber-400"
                                      : "bg-gradient-to-r from-sky-50 to-blue-50 border-sky-300 text-sky-900 hover:bg-sky-100 hover:border-sky-400"
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
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-900 text-[10.5px] font-black tracking-wider uppercase mb-1 shadow-sm">
                    <FileBarChart className="w-3.5 h-3.5 text-blue-600" />
                    PERFORMANCE &amp; LEDGER EXPORTS
                  </div>
                  <h1 className="text-[28px] font-black tracking-[-0.8px] text-[#0f281e] my-1">
                    Analytics &amp; reports
                  </h1>
                  <div className="text-[#556b60] text-[13.5px] font-medium">{desc}</div>
                </div>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-black text-[13px] shadow-lg shadow-blue-500/25 hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Export CSV</span>
                </button>
              </div>

              {/* 4 Colorful Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="group rounded-2xl p-5 bg-gradient-to-br from-[#ecfdf5] via-[#f0fdf4] to-[#d1fae5]/60 border border-emerald-300 shadow-sm hover:shadow-xl hover:shadow-emerald-500/15 hover:-translate-y-1.5 transition-all duration-300 cursor-default">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12.5px] font-bold text-emerald-800 uppercase tracking-wider">Revenue MTD</span>
                    <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white grid place-items-center shadow-md shadow-emerald-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      <DollarSign className="w-5 h-5" />
                    </span>
                  </div>
                  <div className="text-[32px] font-black tracking-tight text-emerald-950 my-1 group-hover:text-emerald-700 transition-colors">
                    ₹12.84L
                  </div>
                  <div className="text-emerald-800 text-[11.5px] font-bold">
                    +8.4% month-on-month
                  </div>
                </div>

                <div className="group rounded-2xl p-5 bg-gradient-to-br from-[#eff6ff] via-[#f0f9ff] to-[#dbeafe]/60 border border-blue-300 shadow-sm hover:shadow-xl hover:shadow-blue-500/15 hover:-translate-y-1.5 transition-all duration-300 cursor-default">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12.5px] font-bold text-blue-800 uppercase tracking-wider">Bookings MTD</span>
                    <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 text-white grid place-items-center shadow-md shadow-blue-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      <Calendar className="w-5 h-5" />
                    </span>
                  </div>
                  <div className="text-[32px] font-black tracking-tight text-blue-950 my-1 group-hover:text-blue-700 transition-colors">
                    2,841
                  </div>
                  <div className="text-blue-800 text-[11.5px] font-bold">
                    +12.8% month-on-month
                  </div>
                </div>

                <div className="group rounded-2xl p-5 bg-gradient-to-br from-[#faf5ff] via-[#fdf4ff] to-[#f3e8ff]/60 border border-purple-300 shadow-sm hover:shadow-xl hover:shadow-purple-500/15 hover:-translate-y-1.5 transition-all duration-300 cursor-default">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12.5px] font-bold text-purple-800 uppercase tracking-wider">Average booking</span>
                    <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-400 text-white grid place-items-center shadow-md shadow-purple-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      <CreditCard className="w-5 h-5" />
                    </span>
                  </div>
                  <div className="text-[32px] font-black tracking-tight text-purple-950 my-1 group-hover:text-purple-700 transition-colors">
                    ₹924
                  </div>
                  <div className="text-purple-800 text-[11.5px] font-bold">
                    Completed bookings
                  </div>
                </div>

                <div className="group rounded-2xl p-5 bg-gradient-to-br from-[#fffbeb] via-[#fffdf0] to-[#fef3c7]/60 border border-amber-300 shadow-sm hover:shadow-xl hover:shadow-amber-500/15 hover:-translate-y-1.5 transition-all duration-300 cursor-default">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12.5px] font-bold text-amber-800 uppercase tracking-wider">Repeat player rate</span>
                    <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white grid place-items-center shadow-md shadow-amber-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      <Users className="w-5 h-5" />
                    </span>
                  </div>
                  <div className="text-[32px] font-black tracking-tight text-amber-950 my-1 group-hover:text-amber-700 transition-colors">
                    64.8%
                  </div>
                  <div className="text-amber-800 text-[11.5px] font-bold">
                    Rolling 90 days
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5.5 hover:shadow-md transition-shadow">
                  <h3 className="text-[15px] font-black text-slate-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>Venue occupancy performance</span>
                  </h3>
                  <div className="space-y-3.5">
                    {(
                      [
                        ["The Green Racquet Club", 91, "from-emerald-400 to-teal-600"],
                        ["Baseline Padel House", 84, "from-sky-400 to-blue-600"],
                        ["Smash Social Arena", 78, "from-purple-400 to-indigo-600"],
                        ["Central Arena", 62, "from-amber-400 to-orange-600"],
                      ] as [string, number, string][]
                    ).map(([n, pct, grad]) => (
                      <div
                        key={n}
                        className="group/occ p-2.5 -mx-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-default"
                      >
                        <div className="flex justify-between text-[13px] mb-1.5">
                          <strong className="group-hover/occ:text-emerald-700 transition-colors">
                            {n}
                          </strong>
                          <span className="font-black text-slate-700">{pct}%</span>
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${pct}%` }}
                            className={`h-full bg-gradient-to-r ${grad} group-hover/occ:brightness-110 transition-all rounded-full`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5.5 hover:shadow-md transition-shadow">
                  <h3 className="text-[15px] font-black text-slate-800 mb-4 flex items-center gap-2">
                    <Download className="w-4 h-4 text-blue-600" />
                    <span>Report library</span>
                  </h3>
                  <div className="divide-y divide-slate-100">
                    {[
                      "Revenue & refunds ledger",
                      "Court booking utilisation",
                      "Group membership & daily credit audit",
                      "Community match participation",
                    ].map((rep) => (
                      <div
                        key={rep}
                        className="py-3 px-2.5 -mx-2.5 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between"
                      >
                        <div>
                          <strong className="text-[13px] block text-slate-800">{rep}</strong>
                          <span className="text-[11.5px] text-slate-500 font-medium">
                            CSV · Ready for export
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            showToast(`Demo report generated: ${rep}`)
                          }
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-black text-[12px] shadow-sm hover:shadow hover:scale-105 transition-all"
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
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-900 text-[10.5px] font-black tracking-wider uppercase mb-1 shadow-sm">
                    <SettingsIcon className="w-3.5 h-3.5 text-slate-600" />
                    SYSTEM CONTROLS &amp; AUDIT LOGS
                  </div>
                  <h1 className="text-[28px] font-black tracking-[-0.8px] text-[#0f281e] my-1">
                    Settings &amp; audit log
                  </h1>
                  <div className="text-[#556b60] text-[13.5px] font-medium">{desc}</div>
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
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-[13px] shadow-lg shadow-emerald-500/25 hover:scale-105 active:scale-95 transition-all"
                >
                  Save settings
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4 hover:shadow-md transition-shadow">
                  <h3 className="text-[15px] font-black text-slate-800 mb-2 flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                    <span>Platform configuration</span>
                  </h3>
                  {[
                    ["Platform name", "PlayCourt"],
                    ["Default currency", "INR — Indian Rupee (₹)"],
                    ["Default booking slot length", "60 minutes"],
                    ["Max linked accounts per group", "4 player accounts"],
                    ["Shared free group credits per day", "1 credit / day"],
                  ].map(([lbl, val]) => (
                    <div key={lbl}>
                      <label className="block text-[11.5px] font-black text-slate-700 mb-1.5 uppercase tracking-wide">
                        {lbl}
                      </label>
                      <input
                        defaultValue={val}
                        className="w-full p-2.5 rounded-xl border border-slate-300 text-[13px] focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500"
                      />
                    </div>
                  ))}
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[15px] font-black text-slate-800 m-0 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-600" />
                      <span>System health</span>
                    </h3>
                    {statusBadge("Demo mode")}
                  </div>
                  <div className="divide-y divide-slate-100">
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
                        className="py-3 px-2.5 -mx-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-default"
                      >
                        <strong className="text-[13px] block text-slate-800">{a}</strong>
                        <p className="text-[11.5px] text-slate-600 m-0 mt-0.5 font-medium">
                          {b}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 pt-4 border-t border-slate-100">
                    <h4 className="text-[12px] font-black text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Recent Audit Trail (admin_audit_logs)</span>
                    </h4>
                    <div className="space-y-1.5 text-[11.5px] text-slate-600">
                      {auditLogs.slice(0, 5).map((entry, idx) => (
                        <div
                          key={idx}
                          className="truncate px-2.5 py-1 -mx-2.5 rounded-lg hover:bg-emerald-50 hover:text-emerald-900 transition-colors cursor-default font-medium"
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
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-[10.5px] font-black tracking-wider uppercase mb-1 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{label}</span>
                  </div>
                  <h1 className="text-[28px] font-black tracking-[-0.8px] text-[#0f281e] my-1">
                    {title}
                  </h1>
                  <div className="text-[#556b60] text-[13.5px] font-medium">{desc}</div>
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
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-[13px] shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:scale-105 active:scale-95 transition-all shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {page === "payments"
                      ? "Reconcile transactions"
                      : `Add ${label.split(" ")[0]}`}
                  </span>
                </button>
              </div>

              {/* 3 Colorful Module Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="group rounded-2xl p-5 bg-gradient-to-br from-[#ecfdf5] via-[#f0fdf4] to-[#d1fae5]/60 border border-emerald-300 shadow-sm hover:shadow-xl hover:shadow-emerald-500/15 hover:-translate-y-1.5 transition-all duration-300 cursor-default">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12.5px] font-bold text-emerald-800 uppercase tracking-wider">Total records</span>
                    <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white grid place-items-center shadow-md shadow-emerald-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      <Layers className="w-5 h-5" />
                    </span>
                  </div>
                  <div className="text-[32px] font-black tracking-tight text-emerald-950 my-1 group-hover:text-emerald-700 transition-colors">
                    {(adminData[page] || []).length}
                  </div>
                  <div className="text-emerald-800 text-[11.5px] font-bold">
                    Active dataset
                  </div>
                </div>

                <div className="group rounded-2xl p-5 bg-gradient-to-br from-[#fff1f2] via-[#fff5f5] to-[#ffe4e6]/60 border border-rose-300 shadow-sm hover:shadow-xl hover:shadow-rose-500/15 hover:-translate-y-1.5 transition-all duration-300 cursor-default">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12.5px] font-bold text-rose-800 uppercase tracking-wider">Needs attention</span>
                    <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-red-400 text-white grid place-items-center shadow-md shadow-rose-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      <AlertCircle className="w-5 h-5" />
                    </span>
                  </div>
                  <div className="text-[32px] font-black tracking-tight text-rose-950 my-1 group-hover:text-rose-700 transition-colors">
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
                  <div className="text-rose-800 text-[11.5px] font-bold">
                    Review flagged items
                  </div>
                </div>

                <div className="group rounded-2xl p-5 bg-gradient-to-br from-[#eff6ff] via-[#f0f9ff] to-[#dbeafe]/60 border border-blue-300 shadow-sm hover:shadow-xl hover:shadow-blue-500/15 hover:-translate-y-1.5 transition-all duration-300 cursor-default">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12.5px] font-bold text-blue-800 uppercase tracking-wider">Last updated</span>
                    <span className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 text-white grid place-items-center shadow-md shadow-blue-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                      <Clock className="w-5 h-5" />
                    </span>
                  </div>
                  <div className="text-[32px] font-black tracking-tight text-blue-950 my-1 group-hover:text-blue-700 transition-colors">
                    Just now
                  </div>
                  <div className="text-blue-800 text-[11.5px] font-bold">
                    Interactive session
                  </div>
                </div>
              </div>

              {/* Filterable Data Table Card */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                <div className="p-4 bg-gradient-to-r from-slate-50 via-emerald-50/20 to-slate-50 border-b border-slate-200 flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[220px] group">
                    <Search className="w-4 h-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={`Search in ${label}...`}
                      className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-300 text-[13px] focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 transition-all bg-white shadow-sm"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="py-2 px-3.5 rounded-xl border border-slate-300 bg-white text-[13px] font-bold text-slate-700 cursor-pointer shadow-sm hover:border-emerald-400 transition-all"
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
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-sky-300 bg-gradient-to-r from-sky-50 to-indigo-50 hover:from-sky-100 hover:to-indigo-100 text-sky-900 font-black text-[12.5px] shadow-sm hover:shadow hover:scale-105 transition-all"
                  >
                    <Download className="w-3.5 h-3.5 text-sky-700" />
                    <span>Export CSV</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-gradient-to-r from-slate-100 via-emerald-50/40 to-slate-100 text-slate-700 text-[11px] font-black uppercase tracking-wider border-b border-slate-200">
                        {(TABLE_HEADERS[page] || ["Item", "Details"]).map(
                          (h) => (
                            <th key={h} className="text-left py-3.5 px-4.5">
                              {h}
                            </th>
                          )
                        )}
                        <th className="text-left py-3.5 px-4.5">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentRows.length > 0 ? (
                        currentRows.map((r, i) => (
                          <tr
                            key={i}
                            className="border-b border-slate-100 hover:bg-gradient-to-r hover:from-emerald-50/50 hover:to-teal-50/30 transition-colors text-[13px]"
                          >
                            {r.map((v, j) => (
                              <td key={j} className="py-3.5 px-4.5">
                                {j === 0 ? (
                                  <strong className="text-emerald-950 font-bold">{v}</strong>
                                ) : isStatusValue(v) ? (
                                  statusBadge(v)
                                ) : (
                                  <span className="text-slate-700 font-medium">{v}</span>
                                )}
                              </td>
                            ))}
                            <td className="py-3.5 px-4.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setModalRecord(r);
                                  setModalTitle("Record details");
                                  setModalType("record");
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-[12px] shadow-sm hover:shadow hover:scale-105 transition-all"
                              >
                                <span>View details</span>
                                <span>↗</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={8}
                            className="py-10 text-center text-slate-500 font-bold"
                          >
                            No matching records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 bg-slate-50/60 border-t border-slate-100 text-slate-500 font-medium text-[12px] flex items-center justify-between">
                  <span>Showing {currentRows.length} demo records</span>
                  <span className="text-emerald-700 font-bold">● Real-time search &amp; filter active</span>
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

