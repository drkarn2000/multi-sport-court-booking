"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ArrowRight,
  Search,
  MapPin,
  Clock,
  Users,
  Sparkles,
  CheckCircle2,
  Trophy,
} from "lucide-react";
import { usePlayCourt } from "@/context/PlayCourtContext";
import { VenueCard } from "@/components/ui/VenueCard";
import { FadeUp, StaggerGrid, StaggerItem } from "@/components/ui/MotionPrimitives";
import { getSportTheme, getEventCategoryTheme } from "@/lib/sportColors";

const HERO_SPORT_STYLES: Record<string, { idle: string; active: string }> = {
  all: {
    idle: "bg-[#e3f2ea] text-[#102e22] border border-[#9fd0b4] hover:bg-[#cde8d9]",
    active: "bg-pc-green text-pc-lime shadow-sm border border-pc-green",
  },
  Tennis: {
    idle: "bg-[#d1fae5] text-[#064e3b] border border-[#6ee7b7] hover:bg-[#a7f3d0]",
    active: "bg-[#047857] text-white shadow-sm border border-[#047857]",
  },
  Padel: {
    idle: "bg-[#dbeafe] text-[#1e3a8a] border border-[#93c5fd] hover:bg-[#bfdbfe]",
    active: "bg-[#0369a1] text-white shadow-sm border border-[#0369a1]",
  },
  Badminton: {
    idle: "bg-[#ffedd5] text-[#7c2d12] border border-[#fdba74] hover:bg-[#fed7aa]",
    active: "bg-[#c2410c] text-white shadow-sm border border-[#c2410c]",
  },
  Squash: {
    idle: "bg-[#ede9fe] text-[#4c1d95] border border-[#c4b5fd] hover:bg-[#ddd6fe]",
    active: "bg-[#5b21b6] text-white shadow-sm border border-[#5b21b6]",
  },
};

export default function HomePage() {
  const router = useRouter();
  const { venues, matches, events, groupMembership } = usePlayCourt();
  const [selectedSport, setSelectedSport] = useState<string>("all");
  const [locationQuery, setLocationQuery] = useState<string>("");

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedSport !== "all") params.set("sport", selectedSport);
    if (locationQuery.trim()) params.set("q", locationQuery.trim());
    router.push(`/venues?${params.toString()}`);
  };

  const featuredVenues = venues.slice(0, 3);
  const previewMatches = matches.slice(0, 3);
  const previewEvents = events.slice(0, 3);

  const sportsList: { label: string; value: string; count: string }[] = [
    { label: "All Sports", value: "all", count: "24+ courts" },
    { label: "Tennis", value: "Tennis", count: "10 courts" },
    { label: "Padel", value: "Padel", count: "7 courts" },
    { label: "Badminton", value: "Badminton", count: "5 courts" },
    { label: "Squash", value: "Squash", count: "3 courts" },
  ];

  const memberAvatarColors = [
    "bg-[#dff27a] text-[#12382b]",
    "bg-[#bae6fd] text-[#0c4a6e]",
    "bg-[#fed7aa] text-[#7c2d12]",
    "bg-[#ddd6fe] text-[#4c1d95]",
  ];

  return (
    <main className="overflow-x-hidden">
      {/* 1. HERO SECTION + QUICK SPORT & LOCATION BAR */}
      <section className="pt-9 pb-14 relative bg-gradient-to-br from-[#d5eee0] via-[#eaf5d5] to-[#d5edf1] border-b border-[#b5d6c3]">
        <div className="w-[min(1180px,calc(100%-32px))] mx-auto relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center gap-11">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
            >
              <span className="inline-block bg-pc-green text-pc-lime px-3.5 py-1.5 rounded-full text-[10px] font-black tracking-[1.4px] uppercase pc-pill-lift cursor-default shadow-sm">
                ● YOUR GAME. YOUR COMMUNITY.
              </span>
              <h1 className="text-[clamp(42px,5.4vw,68px)] font-black tracking-[-3.2px] leading-[0.99] my-5 text-pc-text">
                Make room for{" "}
                <em className="not-italic text-pc-green underline decoration-[#a3e635] decoration-[6px] underline-offset-4">
                  your next
                </em>{" "}
                great game.
              </h1>
              <p className="text-pc-muted font-medium leading-[1.8] max-w-[510px] text-[15px]">
                Discover outstanding courts, bring up to four players into one
                shared membership, and get more time doing what you love. Your
                next match is closer than you think.
              </p>

              {/* Sport Selector Pills + Search Bar */}
              <form
                onSubmit={handleQuickSearch}
                className="mt-6 bg-gradient-to-br from-[#f3fbf6] via-[#eff8ea] to-[#eaf6f7] p-3.5 rounded-2xl border-2 border-[#94ccb0] shadow-card hover:shadow-float hover:border-pc-green transition-all duration-300 max-w-[540px]"
              >
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2.5 mb-2.5 border-b border-[#b8dac6] no-scrollbar">
                  {sportsList.map((sp) => {
                    const st = HERO_SPORT_STYLES[sp.value] || HERO_SPORT_STYLES.all;
                    return (
                      <button
                        key={sp.value}
                        type="button"
                        onClick={() => setSelectedSport(sp.value)}
                        className={`pc-pill-lift px-3 py-1.5 rounded-full text-[11.5px] font-extrabold shrink-0 ${
                          selectedSport === sp.value ? st.active : st.idle
                        }`}
                      >
                        {sp.label}
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1 group">
                    <MapPin className="w-4 h-4 text-pc-green transition-colors absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={locationQuery}
                      onChange={(e) => setLocationQuery(e.target.value)}
                      placeholder="Search Chandigarh, Mohali, Sector 17, IT Park..."
                      className="w-full pl-9 pr-3 py-2.5 text-[13px] font-medium rounded-xl bg-white/95 border border-[#9ccbb2] text-pc-text focus:outline-none focus:border-pc-green"
                    />
                  </div>
                  <button
                    type="submit"
                    className="group pc-btn-lift inline-flex items-center justify-center gap-1.5 bg-pc-green hover:bg-pc-deep text-white font-extrabold text-[12.5px] px-5 py-2.5 rounded-xl shrink-0"
                  >
                    <Search className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                    <span>Find Courts</span>
                  </button>
                </div>
              </form>

              <div className="flex flex-wrap items-center gap-3 mt-5">
                <Link
                  href="/venues"
                  className="group pc-btn-lift inline-flex items-center gap-1.5 rounded-full bg-pc-green text-white px-5 py-3 text-[12.5px] font-extrabold hover:bg-pc-deep"
                >
                  <span>Explore courts</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
                <Link
                  href="/community"
                  className="group pc-pill-lift inline-flex items-center gap-1.5 rounded-full border-2 border-[#0369a1]/30 bg-[#e0f2fe] hover:bg-[#bae6fd] text-[#0c4a6e] px-5 py-3 text-[12.5px] font-extrabold"
                >
                  <span>Find a match</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              <div className="text-pc-text text-[12px] mt-5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#fef3c7] border border-[#fcd34d] shadow-sm cursor-default">
                <span className="text-[#b45309] tracking-widest font-black">
                  ★★★★★
                </span>
                <span>
                  <strong className="font-black text-[#78350f]">
                    12,000+ players
                  </strong>{" "}
                  <span className="text-[#78350f]/90 font-semibold">
                    finding their court across Tricity
                  </span>
                </span>
              </div>
            </motion.div>

            {/* Right Visual with Colorful Floating Badges */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="relative"
            >
              <div className="group overflow-hidden rounded-[30px_30px_100px_30px] shadow-2xl border-4 border-pc-lime/80">
                <img
                  src="https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=1200&h=1400&fit=crop"
                  alt="Professional floodlit tennis court"
                  className="w-full h-[340px] sm:h-[465px] object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
              </div>
              <div className="pc-float-slow absolute top-5 left-2 sm:-left-5 pc-surface-mint px-4 py-3.5 rounded-2xl shadow-float text-[12px] border-2 border-[#6ee7b7] hover:shadow-xl transition-all duration-300 cursor-default">
                <span className="text-[#065f46] text-[10px] font-black uppercase tracking-wider">
                  AVAILABLE TODAY
                </span>
                <strong className="block text-[18px] font-black text-pc-text my-0.5">
                  24 courts nearby
                </strong>
                <span className="inline-block bg-pc-green text-pc-lime px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider">
                  LIVE SLOT PREVIEW
                </span>
              </div>

              <div className="pc-float-delayed absolute bottom-6 right-2 sm:-right-4 pc-surface-amber px-4 py-3.5 rounded-2xl shadow-float text-[12px] border-2 border-[#fcd34d] hover:shadow-xl transition-all duration-300 cursor-default">
                <span className="text-[#92400e] text-[10px] font-black uppercase tracking-wider">
                  CREW MEMBERSHIP
                </span>
                <strong className="block text-[17px] font-black text-pc-text my-0.5">
                  ★ 4 Players · 1 Daily Credit
                </strong>
                <span className="text-[#78350f] font-semibold text-[11px]">
                  Shared across participating clubs
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2. STATS BAND */}
      <section className="bg-gradient-to-r from-[#103024] via-[#1e503e] to-[#134c47] text-white py-7 border-b border-white/15">
        <StaggerGrid className="w-[min(1180px,calc(100%-32px))] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StaggerItem>
            <div className="group rounded-2xl p-4 bg-[#10b981]/15 border border-[#6ee7b7]/30 hover:bg-[#10b981]/25 hover:-translate-y-1 transition-all duration-300 cursor-default">
              <strong className="text-[28px] font-black block text-pc-lime group-hover:scale-105 origin-left transition-transform">
                120+
              </strong>
              <span className="text-[#e2f3ea] text-[12px] font-semibold">
                Premium partner venues
              </span>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className="group rounded-2xl p-4 bg-[#38bdf8]/15 border border-[#7dd3fc]/30 hover:bg-[#38bdf8]/25 hover:-translate-y-1 transition-all duration-300 cursor-default">
              <strong className="text-[28px] font-black block text-[#bae6fd] group-hover:scale-105 origin-left transition-transform">
                850+
              </strong>
              <span className="text-[#e2f3ea] text-[12px] font-semibold">
                Championship courts to explore
              </span>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className="group rounded-2xl p-4 bg-[#f59e0b]/15 border border-[#fcd34d]/35 hover:bg-[#f59e0b]/25 hover:-translate-y-1 transition-all duration-300 cursor-default">
              <strong className="text-[28px] font-black block text-[#fde68a] group-hover:scale-105 origin-left transition-transform">
                Up to 4
              </strong>
              <span className="text-[#e2f3ea] text-[12px] font-semibold">
                Linked crew accounts per group
              </span>
            </div>
          </StaggerItem>
          <StaggerItem>
            <div className="group rounded-2xl p-4 bg-[#a78bfa]/15 border border-[#ddd6fe]/35 hover:bg-[#a78bfa]/25 hover:-translate-y-1 transition-all duration-300 cursor-default">
              <strong className="text-[28px] font-black block text-[#ede9fe] group-hover:scale-105 origin-left transition-transform">
                4.9/5
              </strong>
              <span className="text-[#e2f3ea] text-[12px] font-semibold">
                Verified player satisfaction
              </span>
            </div>
          </StaggerItem>
        </StaggerGrid>
      </section>

      {/* 3. FEATURED VENUES */}
      <section className="py-14">
        <div className="w-[min(1180px,calc(100%-32px))] mx-auto">
          <FadeUp className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-[#d1fae5] text-[#065f46] border border-[#6ee7b7] text-[10px] font-black tracking-[1.5px] uppercase">
                HANDPICKED FOR YOU
              </span>
              <h2 className="text-[clamp(28px,3.5vw,42px)] font-black tracking-[-1.8px] leading-[1.08] mt-2 text-pc-text">
                Courts worth showing up for.
              </h2>
            </div>
            <Link
              href="/venues"
              className="group pc-pill-lift inline-flex items-center gap-1 text-[13px] font-extrabold text-pc-deep px-4 py-2.5 rounded-full bg-pc-lime border border-[#b5d656] hover:bg-[#e7f88d] w-fit shadow-sm"
            >
              <span>Explore all {venues.length} venues</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </FadeUp>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredVenues.map((venue) => (
              <VenueCard
                key={venue.id}
                venue={venue}
                showAvailabilityPreview={true}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 4. HOW IT WORKS + MEMBERSHIP SHARED CREDIT HIGHLIGHT */}
      <section className="pc-band-vivid py-14">
        <div className="w-[min(1180px,calc(100%-32px))] mx-auto">
          <FadeUp className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-7">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-[#fef3c7] text-[#78350f] border border-[#fcd34d] text-[10px] font-black tracking-[1.5px] uppercase">
                MORE THAN A BOOKING
              </span>
              <h2 className="text-[clamp(28px,3.5vw,42px)] font-black tracking-[-1.8px] leading-[1.08] mt-2 text-pc-text">
                Everything your game needs.
              </h2>
            </div>
            <p className="text-pc-muted font-medium text-[14px] max-w-md">
              From spontaneous evening doubles to shared crew memberships that
              keep your squad playing daily.
            </p>
          </FadeUp>

          <StaggerGrid className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-9">
            <StaggerItem>
              <article className="group pc-hover-card pc-surface-mint h-full border rounded-[20px] overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="h-1.5 w-full bg-gradient-to-r from-[#1e503e] via-[#10b981] to-[#a3e635]" />
                  <div className="p-6">
                    <div className="bg-[#065f46] text-[#dff27a] group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 w-11 h-11 rounded-[13px] grid place-items-center shadow-sm">
                      <Clock className="w-5 h-5" />
                    </div>
                    <h3 className="text-[18px] font-extrabold mt-4 mb-2 text-pc-text group-hover:text-pc-green transition-colors">
                      1. Instant court booking
                    </h3>
                    <p className="text-pc-muted font-medium text-[13px] leading-[1.75]">
                      Compare verified surfaces, lighting, and live hourly time
                      slots across Tennis, Padel, Badminton, and Squash.
                    </p>
                  </div>
                </div>
                <div className="px-6 pb-6">
                  <Link
                    href="/venues"
                    className="group/link inline-flex items-center gap-1 text-[12.5px] font-extrabold text-[#065f46] hover:underline"
                  >
                    <span>Find a court</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </article>
            </StaggerItem>

            <StaggerItem>
              <article className="group pc-hover-card pc-surface-amber h-full border rounded-[20px] overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="h-1.5 w-full bg-gradient-to-r from-[#b45309] via-[#f59e0b] to-[#dff27a]" />
                  <div className="p-6">
                    <div className="bg-[#92400e] text-[#fef3c7] group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 w-11 h-11 rounded-[13px] grid place-items-center shadow-sm">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h3 className="text-[18px] font-extrabold mt-4 mb-2 text-pc-text group-hover:text-[#92400e] transition-colors">
                      2. Shared Crew Credits (Up to 4)
                    </h3>
                    <p className="text-pc-muted font-medium text-[13px] leading-[1.75]">
                      Link up to four player accounts under one Crew Membership.
                      Eligible linked accounts share one free booking credit per day
                      across participating venues.
                    </p>
                  </div>
                </div>
                <div className="px-6 pb-6">
                  <Link
                    href="/memberships"
                    className="group/link inline-flex items-center gap-1 text-[12.5px] font-extrabold text-[#92400e] hover:underline"
                  >
                    <span>Explore Crew plans</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </article>
            </StaggerItem>

            <StaggerItem>
              <article className="group pc-hover-card pc-surface-sky h-full border rounded-[20px] overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="h-1.5 w-full bg-gradient-to-r from-[#0369a1] via-[#06b6d4] to-[#2dd4bf]" />
                  <div className="p-6">
                    <div className="bg-[#0369a1] text-white group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 w-11 h-11 rounded-[13px] grid place-items-center shadow-sm">
                      <Users className="w-5 h-5" />
                    </div>
                    <h3 className="text-[18px] font-extrabold mt-4 mb-2 text-pc-text group-hover:text-[#0369a1] transition-colors">
                      3. Play with your people
                    </h3>
                    <p className="text-pc-muted font-medium text-[13px] leading-[1.75]">
                      Short one player for doubles? Host an open match or join games
                      filtered by Beginner, Intermediate, or Advanced level.
                    </p>
                  </div>
                </div>
                <div className="px-6 pb-6">
                  <Link
                    href="/community"
                    className="group/link inline-flex items-center gap-1 text-[12.5px] font-extrabold text-[#0369a1] hover:underline"
                  >
                    <span>Meet local players</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </article>
            </StaggerItem>
          </StaggerGrid>

          {/* Membership Spotlight Banner */}
          <FadeUp>
            <div className="pc-hero-banner rounded-[26px] p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-6 items-center hover:-translate-y-1 hover:shadow-float transition-all duration-300">
              <div>
                <span className="inline-block bg-pc-lime text-pc-deep px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase pc-pill-lift cursor-default">
                  SHARED GROUP MEMBERSHIP
                </span>
                <h3 className="text-[24px] sm:text-[30px] font-black tracking-[-1px] mt-3 mb-2 text-white">
                  One crew. Four linked players. One shared daily court credit.
                </h3>
                <p className="text-[#e2f2ea] text-[13.5px] leading-[1.75] max-w-xl">
                  Our Crew Membership connects up to 4 friends or family members.
                  Every calendar day, the group receives 1 eligible free court
                  booking credit usable at participating venues—with automatic
                  paid booking fallback if the daily credit has already been used.
                </p>
                <div className="flex flex-wrap gap-3 mt-5">
                  <Link
                    href="/memberships"
                    className="group pc-btn-lift inline-flex items-center gap-1.5 bg-pc-lime text-pc-deep px-5 py-2.5 rounded-full text-[12px] font-extrabold hover:bg-[#e7f88d]"
                  >
                    <span>View Crew Plans & Credit Rules</span>
                    <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </Link>
                  <Link
                    href="/booking"
                    className="pc-pill-lift inline-flex items-center gap-1.5 border border-[#7dd3fc]/50 bg-[#0ea5e9]/20 text-white px-5 py-2.5 rounded-full text-[12px] font-extrabold hover:bg-[#0ea5e9]/35"
                  >
                    <span>Try Booking with Credit</span>
                  </Link>
                </div>
              </div>

              <div className="bg-[#0b271d]/65 backdrop-blur-md border border-pc-lime/30 hover:border-pc-lime/60 transition-all duration-300 rounded-2xl p-5">
                <div className="flex items-center justify-between text-xs pb-3 border-b border-white/15">
                  <span className="font-extrabold text-pc-lime">
                    LIVE DEMO GROUP: {groupMembership.groupName}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#dcfce7] text-[#064e3b] font-black text-[11px]">
                    {groupMembership.members.length} / {groupMembership.maxMembers} Linked
                  </span>
                </div>
                <div className="my-3.5">
                  <div className="text-[11px] text-[#cfe4d8] uppercase font-bold">
                    Today&apos;s Shared Credit Status
                  </div>
                  <div className="text-[20px] font-black mt-0.5 flex items-center gap-2 text-white">
                    <CheckCircle2 className="w-5 h-5 text-pc-lime" />
                    <span>
                      {groupMembership.dailyCreditTotal -
                        groupMembership.dailyCreditUsed}{" "}
                      of {groupMembership.dailyCreditTotal} Free Credit Available
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/15">
                  {groupMembership.members.map((m, i) => (
                    <div
                      key={m.id}
                      className="flex items-center gap-1.5 bg-white/12 hover:bg-white/25 hover:-translate-y-0.5 transition-all duration-200 px-2.5 py-1.5 rounded-lg text-[11px] text-white cursor-default"
                    >
                      <span
                        className={`w-5 h-5 rounded-full font-black text-[10px] grid place-items-center ${
                          memberAvatarColors[i % memberAvatarColors.length]
                        }`}
                      >
                        {m.avatar}
                      </span>
                      <span className="font-bold">
                        {m.name.split(" ")[0]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* 5. COMMUNITY & EVENTS PREVIEW + CTA */}
      <section className="py-14">
        <div className="w-[min(1180px,calc(100%-32px))] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-14">
            {/* Community Open Matches Preview */}
            <FadeUp>
              <div className="pc-hover-card pc-surface-coral h-full border rounded-[24px] overflow-hidden">
                <div className="h-1.5 w-full bg-gradient-to-r from-[#ea580c] via-[#f59e0b] to-[#10b981]" />
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#ffedd5] text-[#9a3412] border border-[#fdba74] text-[10px] font-black tracking-[1.4px] uppercase">
                        COMMUNITY BOARD
                      </span>
                      <h3 className="text-[22px] font-black tracking-[-0.8px] text-pc-text mt-1">
                        Open matches near you
                      </h3>
                    </div>
                    <Link
                      href="/community"
                      className="pc-pill-lift px-3.5 py-1.5 rounded-full bg-pc-green text-white hover:bg-pc-deep text-[12px] font-extrabold"
                    >
                      All matches ↗
                    </Link>
                  </div>
                  <div className="space-y-2.5">
                    {previewMatches.map((m) => {
                      const st = getSportTheme(m.sport);
                      return (
                        <div
                          key={m.id}
                          className="group/row p-3.5 rounded-2xl bg-white/80 hover:bg-white border border-[#f2c9ae] transition-all duration-200 flex items-center justify-between gap-4 shadow-sm"
                        >
                          <div>
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-1 ${st.pill}`}
                            >
                              {m.sport} · {m.skillLevel}
                            </span>
                            <h4 className="font-extrabold text-[15px] text-pc-text group-hover/row:text-pc-green transition-colors">
                              {m.title}
                            </h4>
                            <p className="text-[12px] text-pc-muted font-medium">
                              {m.venueName} · {m.dateTime} ·{" "}
                              <strong className="text-[#9a3412] font-extrabold">
                                {m.totalSpots - m.filledSpots} spots open
                              </strong>
                            </p>
                          </div>
                          <Link
                            href="/community"
                            className="pc-pill-lift px-3.5 py-2 rounded-full border border-pc-green bg-[#dcfce7] text-[#064e3b] text-[11.5px] font-extrabold hover:bg-pc-green hover:text-white shrink-0"
                          >
                            Join ↗
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </FadeUp>

            {/* Upcoming Events Preview */}
            <FadeUp delay={0.08}>
              <div className="pc-hover-card pc-surface-violet h-full border rounded-[24px] overflow-hidden">
                <div className="h-1.5 w-full bg-gradient-to-r from-[#6d28d9] via-[#ec4899] to-[#f59e0b]" />
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#ede9fe] text-[#4c1d95] border border-[#c4b5fd] text-[10px] font-black tracking-[1.4px] uppercase">
                        TOURNAMENTS & CLINICS
                      </span>
                      <h3 className="text-[22px] font-black tracking-[-0.8px] text-pc-text mt-1">
                        Upcoming experiences
                      </h3>
                    </div>
                    <Link
                      href="/events"
                      className="pc-pill-lift px-3.5 py-1.5 rounded-full bg-[#5b21b6] text-white hover:bg-[#4c1d95] text-[12px] font-extrabold"
                    >
                      All events ↗
                    </Link>
                  </div>
                  <div className="space-y-2.5">
                    {previewEvents.map((ev) => {
                      const ct = getEventCategoryTheme(ev.category);
                      return (
                        <div
                          key={ev.id}
                          className="group/row p-3.5 rounded-2xl bg-white/80 hover:bg-white border border-[#cfc0f5] transition-all duration-200 flex items-center justify-between gap-4 shadow-sm"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="bg-pc-lime text-pc-deep border border-[#bddb65] px-2.5 py-2 rounded-xl text-center min-w-[54px] group-hover/row:scale-105 group-hover/row:-rotate-2 transition-transform duration-200 shadow-sm">
                              <span className="block text-[10px] font-black leading-none">
                                {ev.dateLabel.split(" ")[0]}
                              </span>
                              <strong className="block text-[16px] font-black leading-tight">
                                {ev.dateLabel.split(" ")[1]}
                              </strong>
                            </div>
                            <div>
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-1 ${ct.pill}`}
                              >
                                {ev.category} · {ev.sport}
                              </span>
                              <h4 className="font-extrabold text-[15px] text-pc-text group-hover/row:text-pc-green transition-colors">
                                {ev.title}
                              </h4>
                              <p className="text-[12px] text-pc-muted font-medium">
                                {ev.venueName} · ₹{ev.price}/person ·{" "}
                                <strong className="text-[#4c1d95]">
                                  {ev.spotsLeft} spots left
                                </strong>
                              </p>
                            </div>
                          </div>
                          <Link
                            href="/events"
                            className="pc-pill-lift px-3.5 py-2 rounded-full bg-pc-green text-white text-[11.5px] font-extrabold hover:bg-pc-deep shrink-0"
                          >
                            Register
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </FadeUp>
          </div>

          {/* Bottom CTA */}
          <FadeUp>
            <div className="pc-hover-card pc-surface-lime border-2 rounded-[26px] p-7 sm:p-9 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-card">
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-pc-green text-pc-lime text-[10px] font-black uppercase tracking-wider mb-2">
                  READY TO PLAY TODAY
                </span>
                <h2 className="text-[26px] sm:text-[32px] font-black tracking-[-1.2px] text-pc-text mb-1">
                  Your next match starts here.
                </h2>
                <p className="text-pc-muted font-medium text-[14px]">
                  Pick a court, invite your crew, and make time for the game today.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/venues"
                  className="group pc-btn-lift inline-flex items-center gap-1.5 rounded-full bg-pc-green text-white px-6 py-3.5 text-[12.5px] font-extrabold hover:bg-pc-deep"
                >
                  <span>Find a court</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
                <Link
                  href="/memberships"
                  className="group pc-pill-lift inline-flex items-center gap-1.5 rounded-full bg-[#fef3c7] border border-[#f59e0b] text-[#78350f] px-5 py-3.5 text-[12.5px] font-extrabold hover:bg-[#fde68a]"
                >
                  <Trophy className="w-4 h-4 text-[#b45309] group-hover:scale-110 transition-transform" />
                  <span>View Memberships</span>
                </Link>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>
    </main>
  );
}
