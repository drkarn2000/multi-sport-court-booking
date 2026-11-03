"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  CheckCircle2,
  UserPlus,
  Trash2,
  RefreshCw,
  Info,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { usePlayCourt } from "@/context/PlayCourtContext";
import { FadeUp, StaggerGrid, StaggerItem } from "@/components/ui/MotionPrimitives";

const PLAN_THEMES = [
  {
    card: "pc-hover-card pc-surface-sky border-2",
    ribbon: "bg-gradient-to-r from-[#0369a1] via-[#06b6d4] to-[#2dd4bf]",
    badge: "bg-[#dbeafe] text-[#1e3a8a] border border-[#93c5fd]",
    check: "text-[#0369a1]",
    btn: "pc-pill-lift bg-[#0369a1] text-white hover:bg-[#075985]",
  },
  {
    card: "pc-hero-banner hover:-translate-y-2 hover:shadow-float transition-all duration-300",
    ribbon: "bg-gradient-to-r from-[#dff27a] via-[#10b981] to-[#38bdf8]",
    badge: "bg-pc-lime text-pc-deep",
    check: "text-pc-lime",
    btn: "pc-btn-lift bg-pc-lime text-pc-deep hover:bg-[#e7f88d]",
  },
  {
    card: "pc-hover-card pc-surface-violet border-2",
    ribbon: "bg-gradient-to-r from-[#5b21b6] via-[#8b5cf6] to-[#ec4899]",
    badge: "bg-[#ede9fe] text-[#4c1d95] border border-[#c4b5fd]",
    check: "text-[#5b21b6]",
    btn: "pc-pill-lift bg-[#5b21b6] text-white hover:bg-[#4c1d95]",
  },
];

const AVATAR_STYLES = [
  "bg-pc-green text-pc-lime",
  "bg-[#0369a1] text-white",
  "bg-[#c2410c] text-white",
  "bg-[#5b21b6] text-white",
];

export default function MembershipsPage() {
  const {
    membershipPlans,
    groupMembership,
    serverDateIst,
    timezone,
    localDevMode,
    addGroupMember,
    removeGroupMember,
    selectMembershipPlan,
    simulateDailyCreditToggle,
    reseedDemoDatabaseAsync,
  } = usePlayCourt();

  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberPhone, setNewMemberPhone] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !newMemberEmail.trim()) return;
    const ok = addGroupMember(
      newMemberName.trim(),
      newMemberEmail.trim(),
      newMemberPhone.trim() || "+91 98000 00000"
    );
    if (ok) {
      setNewMemberName("");
      setNewMemberEmail("");
      setNewMemberPhone("");
    }
  };

  const creditAvailable =
    groupMembership.dailyCreditUsed < groupMembership.dailyCreditTotal;

  return (
    <main className="overflow-x-hidden">
      {/* 1. PAGE HERO */}
      <section className="pt-8 pb-6">
        <div className="w-[min(1180px,calc(100%-32px))] mx-auto">
          <div className="pc-hero-banner rounded-[28px] p-6 sm:p-9 grid grid-cols-1 lg:grid-cols-[1.05fr_0.85fr] gap-8 items-center">
            <FadeUp>
              <div className="text-[#cfe5d9] text-[12px] mb-2 font-medium">
                <Link href="/" className="hover:text-pc-lime hover:underline">
                  Home
                </Link>{" "}
                / <span className="text-pc-lime font-bold">Memberships</span>
              </div>
              <span className="inline-block bg-pc-lime text-pc-deep px-3 py-1 rounded-full text-[10px] font-black tracking-[1.5px] uppercase">
                PLAY MORE, TOGETHER
              </span>
              <h1 className="text-[clamp(32px,4vw,46px)] font-black tracking-[-2px] leading-[1.06] my-3 text-white">
                Good games. Better together.
              </h1>
              <p className="text-[#e1f2e9] leading-[1.75] text-[15px] max-w-xl">
                Bring up to four players into one connected membership, share one
                eligible free daily court booking credit across participating
                venues, and spend less time splitting court fees.
              </p>
            </FadeUp>
            <FadeUp delay={0.08}>
              <div className="group overflow-hidden rounded-[22px] shadow-xl border-2 border-pc-lime/45">
                <img
                  src="https://images.unsplash.com/photo-1526232761682-d26e03ac148e?w=1000&h=650&fit=crop"
                  alt="Friends enjoying sport together"
                  className="w-full h-[235px] sm:h-[260px] object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* 2. MEMBERSHIP PLANS */}
      <section className="py-10">
        <div className="w-[min(1180px,calc(100%-32px))] mx-auto">
          <FadeUp className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-[#fef3c7] text-[#78350f] border border-[#fcd34d] text-[10px] font-black tracking-[1.5px] uppercase">
                SIMPLE OPTIONS
              </span>
              <h2 className="text-[clamp(26px,3.2vw,38px)] font-black tracking-[-1.6px] mt-2 text-pc-text">
                Find the plan for your crew.
              </h2>
            </div>
            <p className="text-pc-muted font-semibold text-[12.5px]">
              Illustrative pricing for frontend demonstration · Switch plans
              anytime
            </p>
          </FadeUp>

          <StaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {membershipPlans.map((plan, index) => {
              const isCurrent = groupMembership.planId === plan.id;
              const pt = plan.featured
                ? PLAN_THEMES[1]
                : PLAN_THEMES[index % PLAN_THEMES.length];
              return (
                <StaggerItem key={plan.id}>
                  <div
                    className={`h-full rounded-[24px] overflow-hidden flex flex-col justify-between ${pt.card}`}
                  >
                    <div>
                      <div className={`h-2 w-full ${pt.ribbon}`} />
                      <div className="p-6 sm:p-7 pb-0">
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`text-[10px] font-black tracking-[1.4px] uppercase px-2.5 py-1 rounded-full ${pt.badge}`}
                          >
                            {plan.badge}
                          </span>
                          {isCurrent && (
                            <span
                              className={`text-[10.5px] font-extrabold px-2.5 py-0.5 rounded-full ${
                                plan.featured
                                  ? "bg-white/20 text-white"
                                  : "bg-[#dcfce7] text-[#064e3b] border border-[#6ee7b7]"
                              }`}
                            >
                              Active Demo Plan
                            </span>
                          )}
                        </div>

                        <h3
                          className={`text-[22px] font-black mt-3 ${
                            plan.featured ? "text-white" : "text-pc-text"
                          }`}
                        >
                          {plan.name}
                        </h3>
                        <div
                          className={`text-[36px] font-black my-3 tracking-[-1px] ${
                            plan.featured ? "text-pc-lime" : "text-pc-text"
                          }`}
                        >
                          ₹{plan.price.toLocaleString("en-IN")}{" "}
                          <small
                            className={`text-[12px] font-bold ${
                              plan.featured ? "text-[#e1f2e9]" : "text-pc-muted"
                            }`}
                          >
                            / {plan.cycle}
                          </small>
                        </div>
                        <p
                          className={`text-[13px] font-medium leading-[1.75] mb-4 ${
                            plan.featured ? "text-[#e2f2ea]" : "text-pc-muted"
                          }`}
                        >
                          {plan.description}
                        </p>

                        <ul className="space-y-2.5 text-[12.5px] mb-6">
                          {plan.features.map((feat) => (
                            <li
                              key={feat}
                              className="flex items-start gap-2 hover:translate-x-1 transition-transform duration-200"
                            >
                              <CheckCircle2
                                className={`w-4 h-4 shrink-0 mt-0.5 ${pt.check}`}
                              />
                              <span
                                className={`font-semibold ${
                                  plan.featured ? "text-white" : "text-pc-text"
                                }`}
                              >
                                {feat}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="p-6 sm:p-7 pt-0">
                      <button
                        type="button"
                        onClick={() => selectMembershipPlan(plan.id)}
                        className={`w-full py-3 px-4 rounded-full text-[12.5px] font-extrabold ${pt.btn}`}
                      >
                        {isCurrent
                          ? `Current Plan: ${plan.name}`
                          : `Choose ${plan.name}`}
                      </button>
                    </div>
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerGrid>
        </div>
      </section>

      {/* 3. INTERACTIVE GROUP & SHARED DAILY CREDIT SIMULATOR */}
      <section id="rules" className="py-12 pc-band-vivid">
        <div className="w-[min(1180px,calc(100%-32px))] mx-auto">
          <FadeUp className="mb-6">
            <span className="inline-block px-3 py-1 rounded-full bg-pc-green text-pc-lime text-[10px] font-black tracking-[1.5px] uppercase">
              LIVE GROUP ACCOUNT & SHARED CREDIT LEDGER
            </span>
            <h2 className="text-[clamp(26px,3.2vw,38px)] font-black tracking-[-1.6px] mt-2 text-pc-text">
              Manage your linked crew & daily credit
            </h2>
            <p className="text-pc-muted font-medium text-[14px] max-w-2xl">
              Test how PlayCourt handles up to 4 linked player accounts and the
              1 shared free booking credit per day rule. Changes here update the
              header badge and booking checkout immediately.
            </p>
          </FadeUp>

          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-6">
            {/* Left: Linked Crew Roster (Up to 4 accounts) */}
            <FadeUp className="pc-hover-card pc-surface-mint border-2 rounded-[24px] overflow-hidden">
              <div className="h-2 w-full bg-gradient-to-r from-[#1e503e] via-[#10b981] to-[#38bdf8]" />
              <div className="p-6">
                <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-[#9ed4b3]">
                  <div>
                    <span className="text-[10.5px] font-black uppercase text-[#065f46]">
                      GROUP ID: {groupMembership.groupId}
                    </span>
                    <h3 className="text-[20px] font-black text-pc-text">
                      {groupMembership.groupName} — Linked Players
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-pc-green text-pc-lime text-[12px] font-black">
                    {groupMembership.members.length} / 4 Accounts Linked
                  </span>
                </div>

                <div className="space-y-3 mb-5">
                  {groupMembership.members.map((member, idx) => (
                    <div
                      key={member.id}
                      className="group pc-hover-subcard flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-white/90 hover:bg-white border border-[#96ccb0] shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full font-black text-[13px] grid place-items-center shrink-0 group-hover:scale-105 group-hover:-rotate-3 transition-transform ${
                            AVATAR_STYLES[idx % AVATAR_STYLES.length]
                          }`}
                        >
                          {member.avatar}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="text-[14px] font-extrabold text-pc-text">
                              {member.name}
                            </strong>
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#064e3b] border border-[#86efac]">
                              {member.role}
                            </span>
                          </div>
                          <p className="text-[11.5px] text-pc-muted font-medium">
                            {member.email} · {member.phone}
                          </p>
                        </div>
                      </div>

                      {member.role !== "Primary Holder" && (
                        <button
                          type="button"
                          onClick={() => removeGroupMember(member.id)}
                          title="Unlink player"
                          className="p-2 rounded-xl text-rose-700 hover:bg-rose-100 hover:scale-110 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add Linked Player Form (if < 4) */}
                {groupMembership.members.length < 4 ? (
                  <form
                    onSubmit={handleAddMember}
                    className="pc-hover-subcard pc-surface-lime border-2 rounded-2xl p-4"
                  >
                    <div className="text-[12px] font-extrabold text-pc-text mb-2.5 flex items-center gap-1.5">
                      <UserPlus className="w-4 h-4 text-pc-green" />
                      <span>
                        Link a 4th crew member ({4 - groupMembership.members.length}{" "}
                        slot remaining)
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <input
                        type="text"
                        required
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        placeholder="Full name"
                        className="p-2.5 rounded-xl border border-[#8cc5a6] bg-white text-[12.5px] font-medium"
                      />
                      <input
                        type="email"
                        required
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        placeholder="Email address"
                        className="p-2.5 rounded-xl border border-[#8cc5a6] bg-white text-[12.5px] font-medium"
                      />
                      <button
                        type="submit"
                        className="pc-btn-lift rounded-xl bg-pc-green text-white font-extrabold text-[12px] py-2.5 px-4 hover:bg-pc-deep"
                      >
                        ＋ Link Account
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="pc-hover-subcard bg-[#fef3c7] border border-[#fcd34d] rounded-2xl p-3.5 text-[12px] text-[#78350f] font-semibold flex items-center justify-between">
                    <span>
                      Maximum capacity reached:{" "}
                      <strong className="font-black text-[#451a03]">
                        4/4 linked player accounts
                      </strong>{" "}
                      active in {groupMembership.groupName}.
                    </span>
                  </div>
                )}
              </div>
            </FadeUp>

            {/* Right: Shared Daily Credit Status & Rules Card */}
            <FadeUp
              delay={0.08}
              className="pc-hover-card pc-surface-amber border-2 rounded-[24px] overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="h-2 w-full bg-gradient-to-r from-[#b45309] via-[#f59e0b] to-[#10b981]" />
                <div className="p-6 pb-0">
                  <div className="flex items-center justify-between gap-2 pb-4 mb-4 border-b border-[#e5c46b]">
                    <div>
                      <span className="text-[10.5px] font-black uppercase text-[#92400e]">
                        DAILY SHARED CREDIT LEDGER · {serverDateIst} ({timezone})
                      </span>
                      <h3 className="text-[20px] font-black text-pc-text">
                        Today&apos;s Credit Availability
                      </h3>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-[11.5px] font-black border ${
                        creditAvailable
                          ? "bg-[#dcfce7] text-[#064e3b] border-[#6ee7b7]"
                          : "bg-[#ffedd5] text-[#7c2d12] border-[#fdba74]"
                      }`}
                    >
                      {creditAvailable
                        ? "1 / 1 Available Today"
                        : "0 / 1 Remaining Today"}
                    </span>
                  </div>

                  <div className="pc-hover-subcard p-4 rounded-2xl bg-white/90 border border-[#e5c46b] mb-5 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] font-extrabold text-[#78350f]">
                        Daily Group Quota
                      </span>
                      <strong className="text-[15px] font-black text-pc-text">
                        1 Free Court Credit / Calendar Day
                      </strong>
                    </div>
                    <div className="w-full h-3 rounded-full bg-[#e5e7eb] overflow-hidden mb-2.5">
                      <div
                        className={`h-full transition-all duration-300 ${
                          creditAvailable
                            ? "w-full bg-gradient-to-r from-[#1e503e] to-[#10b981]"
                            : "w-1/12 bg-amber-500"
                        }`}
                      />
                    </div>
                    <p className="text-[12px] text-pc-muted font-medium leading-relaxed">
                      {creditAvailable ? (
                        <>
                          No member of{" "}
                          <strong className="text-pc-text font-extrabold">
                            {groupMembership.groupName}
                          </strong>{" "}
                          has used today&apos;s credit yet. Any of your{" "}
                          {groupMembership.members.length} linked players may claim
                          it for a free 60-minute booking today.
                        </>
                      ) : (
                        <>
                          Today&apos;s shared credit was claimed by{" "}
                          <strong className="text-pc-text font-extrabold">
                            {groupMembership.creditUsedBy || "Aarav Mehta"}
                          </strong>{" "}
                          at{" "}
                          <strong className="text-pc-text font-extrabold">
                            {groupMembership.creditUsedVenue ||
                              "The Green Racquet Club"}
                          </strong>{" "}
                          ({groupMembership.creditUsedTime || "18:00–19:00"}). Next
                          daily credit resets at midnight.
                        </>
                      )}
                    </p>
                  </div>

                  {/* Clear Rules Breakdown */}
                  <div className="space-y-2.5 text-[12.5px] text-pc-muted font-medium mb-6">
                    <div className="group flex items-start gap-2 hover:translate-x-1 transition-transform duration-200 cursor-default">
                      <Info className="w-4 h-4 text-[#0369a1] group-hover:scale-110 transition-transform shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-pc-text font-extrabold">
                          Up to 4 Linked Accounts:
                        </strong>{" "}
                        A group may link up to four individual player profiles.
                      </span>
                    </div>
                    <div className="group flex items-start gap-2 hover:translate-x-1 transition-transform duration-200 cursor-default">
                      <Sparkles className="w-4 h-4 text-[#b45309] group-hover:scale-110 transition-transform shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-pc-text font-extrabold">
                          One Shared Daily Credit:
                        </strong>{" "}
                        Eligible linked accounts share one free booking credit per
                        calendar day across participating venues (not one per
                        person).
                      </span>
                    </div>
                    <div className="group flex items-start gap-2 hover:translate-x-1 transition-transform duration-200 cursor-default">
                      <ShieldCheck className="w-4 h-4 text-pc-green group-hover:scale-110 transition-transform shrink-0 mt-0.5" />
                      <span>
                        <strong className="text-pc-text font-extrabold">
                          Automatic Paid Fallback:
                        </strong>{" "}
                        Once the daily group credit is redeemed, any additional
                        bookings on the same day smoothly switch to standard
                        hourly court pricing.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-4 border-t border-[#e5c46b] flex flex-wrap items-center gap-3">
                {localDevMode && (
                  <button
                    type="button"
                    onClick={simulateDailyCreditToggle}
                    className="group pc-pill-lift inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-[#b45309]/40 bg-white/95 text-[12px] font-extrabold text-[#78350f] hover:bg-[#fef3c7]"
                  >
                    <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-500" />
                    <span>
                      {creditAvailable
                        ? "Simulate: Mark Credit Used Today"
                        : "Simulate: Reset Credit to Available"}
                    </span>
                  </button>
                )}
                <Link
                  href="/booking"
                  className="group pc-btn-lift inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-pc-green text-white text-[12px] font-extrabold hover:bg-pc-deep"
                >
                  <span>Book with Group Credit</span>
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
                {localDevMode && (
                  <div className="w-full pt-2 mt-1 border-t border-dashed border-[#d9b45b] flex flex-wrap items-center justify-between gap-2 text-[11.5px]">
                    <span className="text-[#78350f] font-semibold">
                      Active ledger date: <strong>{serverDateIst}</strong> · Resets at 00:00 {timezone}
                    </span>
                    {!confirmReset ? (
                      <button
                        type="button"
                        onClick={() => setConfirmReset(true)}
                        className="font-extrabold text-[#9a3412] hover:underline"
                      >
                        [Local Dev] Reseed Demo Database…
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            await reseedDemoDatabaseAsync();
                            setConfirmReset(false);
                          }}
                          className="pc-btn-lift px-3 py-1 rounded-full bg-red-600 text-white font-extrabold"
                        >
                          Confirm Reseed Local SQLite
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmReset(false)}
                          className="pc-pill-lift px-2.5 py-1 rounded-full border border-[#d9b45b] bg-white font-bold text-pc-text"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </FadeUp>
          </div>
        </div>
      </section>
    </main>
  );
}
