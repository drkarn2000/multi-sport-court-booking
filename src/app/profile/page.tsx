"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowUpRight,
  CheckCircle2,
  LogOut,
  Users,
} from "lucide-react";
import { usePlayCourt } from "@/context/PlayCourtContext";
import { SportType } from "@/types/playcourt";
import { FadeUp } from "@/components/ui/MotionPrimitives";
import { getSportTheme } from "@/lib/sportColors";

export default function PlayerProfilePage() {
  const {
    profile,
    groupMembership,
    bookings,
    venues,
    sessionState,
    localDevMode,
    refreshStateFromServer,
    showToast,
    updateProfile,
    logoutDemo,
  } = usePlayCourt();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [city, setCity] = useState(profile.city);

  useEffect(() => {
    setName(profile.name);
    setEmail(profile.email);
    setPhone(profile.phone);
    setCity(profile.city);
  }, [profile.name, profile.email, profile.phone, profile.city]);

  const handleSimulateSessionExpire = async () => {
    const r = await fetch("/api/v1/dev/testing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "expire_current_session" }),
    });
    const j = await r.json();
    if (r.ok) {
      await refreshStateFromServer();
      showToast("Session marked expired in SQLite — protected actions now require re-login");
    } else {
      showToast(j?.error?.message || "Sign in via /login OTP first to create a cookie session");
    }
  };

  const upcomingBookings = bookings.filter(
    (b) => b.status === "Upcoming" || b.status === "Confirmed"
  );
  const pastBookings = bookings.filter(
    (b) =>
      b.status === "Completed" ||
      b.status === "Cancelled" ||
      b.status === "Cancellation Requested"
  );

  const favVenues = venues.filter((v) =>
    profile.favouriteVenueIds.includes(v.id)
  );

  const togglePreferredSport = (sp: SportType) => {
    const exists = profile.preferredSports.includes(sp);
    const next = exists
      ? profile.preferredSports.filter((s) => s !== sp)
      : [...profile.preferredSports, sp];
    updateProfile({ preferredSports: next });
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: name.trim() || profile.name,
      email: email.trim() || profile.email,
      phone: phone.trim() || profile.phone,
      city: city.trim() || profile.city,
    });
    setEditing(false);
  };

  const creditAvailable =
    groupMembership.dailyCreditUsed < groupMembership.dailyCreditTotal;

  return (
    <main className="py-9 overflow-x-hidden">
      <div className="w-[min(1180px,calc(100%-32px))] mx-auto space-y-7">
        {/* 1. PROFILE HEADER BANNER */}
        <FadeUp className="pc-hover-card pc-hero-banner rounded-[28px] p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-pc-lime text-pc-deep font-black text-[24px] grid place-items-center shrink-0 hover:scale-105 hover:-rotate-3 transition-transform duration-300 cursor-default shadow-md">
              {profile.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)}
            </div>
            <div>
              <span className="inline-block bg-[#dcfce7] text-[#064e3b] px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">
                VERIFIED PLAYER PROFILE · MEMBER SINCE {profile.memberSince.toUpperCase()}
              </span>
              <h1 className="text-[26px] sm:text-[32px] font-black tracking-[-1.2px] text-white mt-1.5">
                {profile.name}
              </h1>
              <p className="text-[13px] text-[#e1f2e9] font-medium">
                {profile.email} · {profile.phone} · {profile.city}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setEditing(!editing)}
              className="pc-pill-lift px-4 py-2.5 rounded-full border border-[#7dd3fc] text-[12px] font-extrabold text-[#0c4a6e] bg-[#e0f2fe] hover:bg-[#bae6fd]"
            >
              {editing ? "Cancel Editing" : "Edit Profile"}
            </button>
            <Link
              href="/bookings"
              className="group pc-btn-lift inline-flex items-center gap-1 rounded-full bg-pc-lime text-pc-deep px-4 py-2.5 text-[12px] font-black hover:bg-[#e8f88c]"
            >
              <span>Manage Bookings</span>
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
            <Link
              href="/login"
              onClick={logoutDemo}
              className="pc-pill-lift inline-flex items-center gap-1 px-3.5 py-2.5 rounded-full text-[12px] font-extrabold text-[#881337] bg-[#ffe4e6] border border-[#fda4af] hover:bg-[#fecdd3]"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </Link>
            {localDevMode && sessionState === "ACTIVE_COOKIE" && (
              <button
                type="button"
                onClick={handleSimulateSessionExpire}
                className="pc-pill-lift px-3 py-2 rounded-full border border-amber-300 bg-[#fef3c7] text-[#78350f] text-[11px] font-extrabold hover:bg-[#fde68a]"
              >
                [Dev] Expire Session
              </button>
            )}
          </div>
        </FadeUp>

        {/* EDIT PROFILE DRAWER */}
        {editing && (
          <form
            onSubmit={handleSaveProfile}
            className="pc-modal-pop pc-surface-amber border-2 border-pc-green rounded-[24px] p-6 space-y-4 shadow-card"
          >
            <h2 className="text-[18px] font-black text-pc-text">
              Update Player Contact Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div>
                <label className="block text-[11px] font-extrabold text-pc-text mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#d9b45b] bg-white text-[13px] font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-pc-text mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#d9b45b] bg-white text-[13px] font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-pc-text mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#d9b45b] bg-white text-[13px] font-medium"
                />
              </div>
              <div>
                <label className="block text-[11px] font-extrabold text-pc-text mb-1">
                  Home City
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-[#d9b45b] bg-white text-[13px] font-medium"
                />
              </div>
            </div>
            <button
              type="submit"
              className="pc-btn-lift rounded-full bg-pc-green text-white px-5 py-2.5 text-[12px] font-extrabold hover:bg-pc-deep"
            >
              Save Changes
            </button>
          </form>
        )}

        {/* 2. STATS + SPORTS PREFERENCES + MEMBERSHIP SUMMARY */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.15fr] gap-6">
          {/* Sports Preferences & Player Stats */}
          <FadeUp className="pc-hover-card pc-surface-sky border-2 rounded-[24px] overflow-hidden flex flex-col justify-between">
            <div>
              <div className="h-1.5 w-full bg-gradient-to-r from-[#0369a1] via-[#06b6d4] to-[#10b981]" />
              <div className="p-6 pb-0">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#dbeafe] text-[#1e3a8a] border border-[#93c5fd] text-[10px] font-black tracking-[1.4px] uppercase">
                  ON-COURT IDENTITY
                </span>
                <h2 className="text-[20px] font-black text-pc-text mt-1.5 mb-3">
                  Sports Preferences & Skill Levels
                </h2>

                <p className="text-[12.5px] text-pc-muted font-medium mb-3">
                  Click any sport below to toggle your active playing preferences:
                </p>
                <div className="grid grid-cols-2 gap-2.5 mb-6">
                  {(["Tennis", "Padel", "Badminton", "Squash"] as SportType[]).map(
                    (sp) => {
                      const active = profile.preferredSports.includes(sp);
                      const st = getSportTheme(sp);
                      return (
                        <button
                          key={sp}
                          type="button"
                          onClick={() => togglePreferredSport(sp)}
                          className={`pc-hover-subcard p-3 rounded-xl border text-left flex items-center justify-between ${
                            active
                              ? `${st.cardBg} border-2 border-pc-green shadow-sm`
                              : "bg-white/85 hover:bg-white border-[#96d1ee] text-pc-muted"
                          }`}
                        >
                          <div>
                            <strong className="block text-[13.5px] font-extrabold text-pc-text">
                              {sp}
                            </strong>
                            <span className="text-[11px] font-semibold text-pc-muted">
                              Level: {profile.skillLevels[sp]}
                            </span>
                          </div>
                          {active && (
                            <CheckCircle2 className="w-4 h-4 text-pc-green shrink-0" />
                          )}
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 pt-4 border-t border-[#97d1ef] grid grid-cols-3 gap-3 text-center">
              <div className="group pc-hover-subcard pc-surface-mint p-3 rounded-xl border cursor-default">
                <strong className="text-[22px] font-black text-[#065f46] block">
                  {profile.matchesPlayed}
                </strong>
                <span className="text-[11px] font-bold text-pc-text">Matches Played</span>
              </div>
              <div className="group pc-hover-subcard pc-surface-amber p-3 rounded-xl border cursor-default">
                <strong className="text-[22px] font-black text-[#92400e] block">
                  {profile.hoursOnCourt}h
                </strong>
                <span className="text-[11px] font-bold text-pc-text">Court Hours</span>
              </div>
              <div className="group pc-hover-subcard pc-surface-violet p-3 rounded-xl border cursor-default">
                <strong className="text-[22px] font-black text-[#5b21b6] block">
                  {favVenues.length}
                </strong>
                <span className="text-[11px] font-bold text-pc-text">Saved Venues</span>
              </div>
            </div>
          </FadeUp>

          {/* Group Membership Summary Card */}
          <FadeUp
            delay={0.07}
            className="bg-pc-green text-white rounded-[24px] p-6 sm:p-7 flex flex-col justify-between hover:-translate-y-1.5 hover:shadow-float transition-all duration-300 border border-pc-lime/30"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="pc-pill-lift inline-flex items-center gap-1.5 bg-pc-lime text-pc-deep px-3 py-1 rounded-full text-[10px] font-black uppercase cursor-default">
                  <Sparkles className="w-3.5 h-3.5" />
                  {groupMembership.planName}
                </span>
                <span className="text-[11.5px] font-bold text-[#e1f2e9]">
                  Renews {groupMembership.renewalDate}
                </span>
              </div>

              <h2 className="text-[24px] font-black tracking-[-0.8px] text-white">
                {groupMembership.groupName} ({groupMembership.members.length} /{" "}
                {groupMembership.maxMembers} Linked Accounts)
              </h2>
              <p className="text-[12.5px] text-[#e1f2e9] mt-1 leading-relaxed">
                Eligible linked accounts share 1 free court booking credit per
                day across participating venues.
              </p>

              <div className="bg-[#0b271d]/55 border border-pc-lime/30 hover:border-pc-lime/60 transition-all duration-300 rounded-2xl p-4 my-4">
                <div className="flex items-center justify-between text-[12px] mb-1">
                  <span className="text-[#cfe5d9] font-semibold">
                    Today&apos;s Shared Daily Credit
                  </span>
                  <strong className="text-pc-lime font-black">
                    {creditAvailable ? "1 / 1 Available" : "0 / 1 Used Today"}
                  </strong>
                </div>
                <p className="text-[11.5px] text-[#e1f2e9]">
                  {creditAvailable
                    ? "Ready to apply at checkout for any participating venue today."
                    : `Redeemed today by ${
                        groupMembership.creditUsedBy || "a crew member"
                      }. Resets at midnight.`}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {groupMembership.members.map((m) => (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 hover:-translate-y-0.5 transition-all duration-200 px-3 py-1.5 rounded-xl text-[11.5px] font-bold text-white cursor-default"
                  >
                    <Users className="w-3.5 h-3.5 text-pc-lime" />
                    {m.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2.5 mt-6 pt-4 border-t border-white/15">
              <Link
                href="/memberships"
                className="group pc-btn-lift inline-flex items-center gap-1.5 bg-pc-lime text-pc-deep px-4 py-2.5 rounded-full text-[12px] font-extrabold hover:bg-[#e7f88d]"
              >
                <span>Manage Crew & Credits</span>
                <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
              <Link
                href="/booking"
                className="pc-pill-lift inline-flex items-center gap-1.5 border border-[#7dd3fc]/50 bg-[#0ea5e9]/20 text-white px-4 py-2.5 rounded-full text-[12px] font-extrabold hover:bg-[#0ea5e9]/35"
              >
                <span>Book with Credit</span>
              </Link>
            </div>
          </FadeUp>
        </div>

        {/* 3. UPCOMING BOOKINGS & BOOKING HISTORY PREVIEW */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Reservations */}
          <FadeUp className="pc-hover-card pc-surface-mint border-2 rounded-[24px] overflow-hidden">
            <div className="h-1.5 w-full bg-gradient-to-r from-[#1e503e] via-[#10b981] to-[#a3e635]" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#d1fae5] text-[#065f46] border border-[#6ee7b7] text-[10px] font-black tracking-[1.4px] uppercase">
                    NEXT ON COURT
                  </span>
                  <h2 className="text-[20px] font-black text-pc-text mt-1">
                    Upcoming Bookings ({upcomingBookings.length})
                  </h2>
                </div>
                <Link
                  href="/bookings"
                  className="pc-pill-lift px-3.5 py-1.5 rounded-full bg-pc-green text-white hover:bg-pc-deep text-[12px] font-extrabold"
                >
                  All bookings ↗
                </Link>
              </div>

              <div className="space-y-3">
                {upcomingBookings.slice(0, 3).map((b) => (
                  <div
                    key={b.id}
                    className="group pc-hover-subcard p-4 rounded-2xl bg-white/90 hover:bg-white border border-[#96ccb0] flex items-center justify-between gap-4 shadow-sm"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-black text-pc-green">
                          {b.id}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-[#dcfce7] text-[#064e3b] border border-[#86efac] text-[10px] font-extrabold">
                          {b.status}
                        </span>
                        {b.paidWithCredit && (
                          <span className="px-2 py-0.5 rounded-full bg-pc-lime text-pc-deep text-[10px] font-black">
                            Crew Credit
                          </span>
                        )}
                      </div>
                      <h3 className="font-extrabold text-[14.5px] text-pc-text group-hover:text-pc-green transition-colors">
                        {b.venueName} · {b.courtName}
                      </h3>
                      <p className="text-[12px] text-pc-muted font-medium mt-0.5">
                        {b.date} · {b.timeSlot} · ₹{b.totalPrice}
                      </p>
                    </div>
                    <Link
                      href="/bookings"
                      className="pc-pill-lift px-3.5 py-2 rounded-full border border-pc-green bg-[#dcfce7] text-[#064e3b] text-[11.5px] font-extrabold hover:bg-pc-green hover:text-white shrink-0"
                    >
                      Details
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>

          {/* Booking History */}
          <FadeUp
            delay={0.07}
            className="pc-hover-card pc-surface-amber border-2 rounded-[24px] overflow-hidden"
          >
            <div className="h-1.5 w-full bg-gradient-to-r from-[#b45309] via-[#f59e0b] to-[#dff27a]" />
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#fef3c7] text-[#78350f] border border-[#fcd34d] text-[10px] font-black tracking-[1.4px] uppercase">
                    PAST ACTIVITY
                  </span>
                  <h2 className="text-[20px] font-black text-pc-text mt-1">
                    Booking History ({pastBookings.length})
                  </h2>
                </div>
                <Link
                  href="/venues"
                  className="pc-pill-lift px-3.5 py-1.5 rounded-full bg-[#92400e] text-white hover:bg-[#78350f] text-[12px] font-extrabold"
                >
                  Book again ↗
                </Link>
              </div>

              <div className="space-y-3">
                {pastBookings.slice(0, 3).map((b) => (
                  <div
                    key={b.id}
                    className="group pc-hover-subcard p-4 rounded-2xl bg-white/90 hover:bg-white border border-[#e5c46b] flex items-center justify-between gap-4 shadow-sm"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-extrabold text-[#78350f]">
                          {b.id}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-[#fef3c7] text-[#78350f] border border-[#fcd34d] text-[10px] font-extrabold">
                          {b.status}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-[14.5px] text-pc-text group-hover:text-pc-green transition-colors">
                        {b.venueName} · {b.courtName}
                      </h3>
                      <p className="text-[12px] text-pc-muted font-medium mt-0.5">
                        {b.date} · {b.timeSlot} ·{" "}
                        {b.paidWithCredit ? "₹0 (Crew Credit)" : `₹${b.totalPrice}`}
                      </p>
                    </div>
                    <Link
                      href={`/booking?venueId=${b.venueId}&courtId=${b.courtId}`}
                      className="pc-btn-lift px-3.5 py-2 rounded-full bg-pc-green hover:bg-pc-deep text-white text-[11.5px] font-extrabold shrink-0"
                    >
                      Rebook
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </FadeUp>
        </div>
      </div>
    </main>
  );
}
