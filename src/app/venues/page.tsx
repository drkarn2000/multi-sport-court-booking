"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Sparkles,
  ArrowUpRight,
  RotateCcw,
} from "lucide-react";
import { usePlayCourt } from "@/context/PlayCourtContext";
import { VenueCard } from "@/components/ui/VenueCard";
import { FadeUp } from "@/components/ui/MotionPrimitives";

const FILTER_SPORT_PILLS: Record<string, { idle: string; active: string }> = {
  all: {
    idle: "bg-white/90 text-pc-text border border-[#9ccab0] hover:bg-[#dcfce7]",
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

function VenuesSearchParamsSync({
  onSync,
}: {
  onSync: (q: string, sport: string) => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    onSync(searchParams.get("q") || "", searchParams.get("sport") || "all");
  }, [searchParams, onSync]);

  return null;
}

export default function VenuesPage() {
  const { venues } = usePlayCourt();

  const [query, setQuery] = useState("");
  const [sportFilter, setSportFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recommended");
  const [creditOnly, setCreditOnly] = useState(false);

  const handleSyncParams = React.useCallback((q: string, sport: string) => {
    setQuery(q);
    setSportFilter(sport);
  }, []);

  const filteredVenues = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = venues.filter((v) => {
      const matchesSport =
        sportFilter === "all" ||
        v.sports.some((s) => s.toLowerCase() === sportFilter.toLowerCase());
      const matchesCity =
        cityFilter === "all" ||
        v.city.toLowerCase() === cityFilter.toLowerCase();
      const matchesCredit = !creditOnly || v.participatingInCredits;
      const matchesQuery =
        !q ||
        `${v.name} ${v.area} ${v.city} ${v.sports.join(" ")}`
          .toLowerCase()
          .includes(q);
      return matchesSport && matchesCity && matchesCredit && matchesQuery;
    });

    if (sortBy === "price-asc") {
      return [...list].sort((a, b) => a.pricePerHour - b.pricePerHour);
    }
    if (sortBy === "price-desc") {
      return [...list].sort((a, b) => b.pricePerHour - a.pricePerHour);
    }
    if (sortBy === "rating") {
      return [...list].sort((a, b) => b.rating - a.rating);
    }
    return list;
  }, [venues, query, sportFilter, cityFilter, sortBy, creditOnly]);

  const resetFilters = () => {
    setQuery("");
    setSportFilter("all");
    setCityFilter("all");
    setSortBy("recommended");
    setCreditOnly(false);
  };

  return (
    <main className="overflow-x-hidden">
      <Suspense fallback={null}>
        <VenuesSearchParamsSync onSync={handleSyncParams} />
      </Suspense>

      {/* 1. PAGE HERO */}
      <section className="pt-8 pb-5">
        <div className="w-[min(1180px,calc(100%-32px))] mx-auto">
          <div className="pc-hero-banner rounded-[28px] p-6 sm:p-9 grid grid-cols-1 lg:grid-cols-[1.05fr_0.85fr] gap-8 items-center">
            <FadeUp>
              <div className="text-[#cfe5d9] text-[12px] mb-2 font-medium">
                <Link href="/" className="hover:text-pc-lime hover:underline">
                  Home
                </Link>{" "}
                / <span className="text-pc-lime font-bold">Find Courts</span>
              </div>
              <span className="inline-block bg-pc-lime text-pc-deep px-3 py-1 rounded-full text-[10px] font-black tracking-[1.5px] uppercase">
                FIND YOUR PLAYING SPACE
              </span>
              <h1 className="text-[clamp(32px,4vw,46px)] font-black tracking-[-2px] leading-[1.06] my-3 text-white">
                A great court changes everything.
              </h1>
              <p className="text-[#e1f2e9] leading-[1.75] text-[15px] max-w-xl">
                Explore championship surfaces across Chandigarh, Mohali, and
                Zirakpur. Compare sports, hourly pricing, live court slots, and
                Crew Membership credit eligibility.
              </p>
            </FadeUp>
            <FadeUp delay={0.08}>
              <div className="group overflow-hidden rounded-[22px] shadow-xl border-2 border-pc-lime/45">
                <img
                  src="https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=1000&h=650&fit=crop"
                  alt="Tennis court ready for a match"
                  className="w-full h-[230px] sm:h-[255px] object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* 2. FILTER BAR & RESULTS */}
      <section className="py-6">
        <div className="w-[min(1180px,calc(100%-32px))] mx-auto">
          <FadeUp className="pc-surface-mint border-2 rounded-2xl p-4 sm:p-5 shadow-card hover:shadow-float transition-all duration-300 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto] gap-3 items-center">
              {/* Search input */}
              <div className="relative group">
                <Search className="w-4 h-4 text-pc-green transition-colors absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search venue, Sector 17, IT Park, sport..."
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#92c6a9] text-[13px] font-medium text-pc-text bg-white/95 focus:outline-none focus:border-pc-green"
                />
              </div>

              {/* Sport filter */}
              <select
                value={sportFilter}
                onChange={(e) => setSportFilter(e.target.value)}
                aria-label="Filter by sport"
                className="px-3.5 py-2.5 rounded-xl border border-[#92c6a9] text-[13px] font-bold text-pc-text bg-white/95 focus:outline-none focus:border-pc-green cursor-pointer"
              >
                <option value="all">All sports</option>
                <option value="Tennis">Tennis</option>
                <option value="Padel">Padel</option>
                <option value="Badminton">Badminton</option>
                <option value="Squash">Squash</option>
              </select>

              {/* Location/City filter */}
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                aria-label="Filter by location"
                className="px-3.5 py-2.5 rounded-xl border border-[#92c6a9] text-[13px] font-bold text-pc-text bg-white/95 focus:outline-none focus:border-pc-green cursor-pointer"
              >
                <option value="all">All locations (Tricity)</option>
                <option value="Chandigarh">Chandigarh</option>
                <option value="Mohali">Mohali & New Chandigarh</option>
                <option value="Zirakpur">Zirakpur</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort venues"
                className="px-3.5 py-2.5 rounded-xl border border-[#92c6a9] text-[13px] font-bold text-pc-text bg-white/95 focus:outline-none focus:border-pc-green cursor-pointer"
              >
                <option value="recommended">Sort: Recommended</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Highest Rated (★)</option>
              </select>

              {/* Reset */}
              <button
                type="button"
                onClick={resetFilters}
                className="group pc-pill-lift inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-[#f59e0b] bg-[#fef3c7] text-[12px] font-extrabold text-[#78350f] hover:bg-[#fde68a]"
              >
                <RotateCcw className="w-3.5 h-3.5 group-hover:-rotate-90 transition-transform duration-300" />
                <span>Reset</span>
              </button>
            </div>

            {/* Secondary quick pill row */}
            <div className="flex flex-wrap items-center justify-between gap-3 mt-3.5 pt-3.5 border-t border-[#9fd4b3] text-[12px]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-pc-text font-extrabold inline-flex items-center gap-1">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-pc-green" /> Quick filters:
                </span>
                {["all", "Tennis", "Padel", "Badminton", "Squash"].map((sp) => {
                  const st = FILTER_SPORT_PILLS[sp] || FILTER_SPORT_PILLS.all;
                  return (
                    <button
                      key={sp}
                      type="button"
                      onClick={() => setSportFilter(sp)}
                      className={`pc-pill-lift px-3 py-1 rounded-full text-[11.5px] font-extrabold ${
                        sportFilter === sp ? st.active : st.idle
                      }`}
                    >
                      {sp === "all" ? "All Sports" : sp}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setCreditOnly(!creditOnly)}
                  className={`group pc-pill-lift inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11.5px] font-extrabold border ${
                    creditOnly
                      ? "bg-pc-deep text-pc-lime border-pc-deep shadow-sm"
                      : "bg-[#fef3c7] text-[#78350f] border-[#fcd34d] hover:bg-[#fde68a]"
                  }`}
                >
                  <Sparkles className="w-3 h-3 group-hover:rotate-12 transition-transform" />
                  <span>Crew Credit Eligible Only</span>
                </button>
              </div>

              <span className="text-pc-text font-semibold">
                Showing <strong className="font-black text-pc-green">{filteredVenues.length}</strong>{" "}
                curated venues · Click any time pill to book
              </span>
            </div>
          </FadeUp>

          {/* VENUE GRID OR EMPTY STATE */}
          {filteredVenues.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredVenues.map((venue) => (
                <VenueCard
                  key={venue.id}
                  venue={venue}
                  showAvailabilityPreview={true}
                />
              ))}
            </div>
          ) : (
            <FadeUp className="pc-hover-card pc-surface-amber border-2 rounded-[22px] p-12 text-center my-4">
              <MapPin className="w-9 h-9 text-[#b45309] mx-auto mb-3" />
              <h3 className="text-[20px] font-black text-pc-text mb-1">
                No matching courts found
              </h3>
              <p className="text-pc-muted font-medium text-[13.5px] max-w-md mx-auto mb-5">
                We couldn&apos;t find any venues matching &ldquo;{query}&rdquo; with
                the selected sport or location filters.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="group pc-btn-lift inline-flex items-center gap-1.5 rounded-full bg-pc-green text-white px-5 py-2.5 text-[12px] font-extrabold hover:bg-pc-deep"
              >
                <RotateCcw className="w-3.5 h-3.5 group-hover:-rotate-90 transition-transform duration-300" />
                <span>Reset all filters</span>
              </button>
            </FadeUp>
          )}
        </div>
      </section>

      {/* 3. BOTTOM QUICK BOOK CTA */}
      <section className="py-10">
        <div className="w-[min(1180px,calc(100%-32px))] mx-auto">
          <FadeUp className="pc-hover-card pc-surface-amber border-2 rounded-[24px] p-7 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-card">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#92400e] text-[#fef3c7] text-[10px] font-black uppercase tracking-wider mb-1.5">
                INSTANT CHECKOUT
              </span>
              <h2 className="text-[24px] sm:text-[28px] font-black tracking-[-1px] text-pc-text mb-1">
                Found your court?
              </h2>
              <p className="text-pc-muted font-medium text-[13.5px]">
                Choose a date and time slot, or apply your Group Atlas daily
                free booking credit at checkout.
              </p>
            </div>
            <Link
              href="/booking"
              className="group pc-btn-lift inline-flex items-center gap-1.5 rounded-full bg-pc-green text-white px-5 py-3 text-[12.5px] font-extrabold hover:bg-pc-deep shrink-0"
            >
              <span>Quick book a slot</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </FadeUp>
        </div>
      </section>
    </main>
  );
}
