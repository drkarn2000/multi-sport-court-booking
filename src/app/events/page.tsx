"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  X,
  ArrowUpRight,
  Users,
  Trophy,
} from "lucide-react";
import { usePlayCourt } from "@/context/PlayCourtContext";
import { PlayEvent } from "@/types/playcourt";
import { FadeUp } from "@/components/ui/MotionPrimitives";
import { getEventCategoryTheme } from "@/lib/sportColors";

const CATEGORY_FILTER_STYLES: Record<string, { idle: string; active: string }> = {
  all: {
    idle: "bg-white/95 border border-[#8cc5a6] text-pc-text hover:bg-[#dcfce7]",
    active: "bg-pc-green text-pc-lime shadow-sm border border-pc-green",
  },
  Tournament: {
    idle: "bg-[#fef3c7] border border-[#fcd34d] text-[#78350f] hover:bg-[#fde68a]",
    active: "bg-[#b45309] text-white shadow-sm border border-[#b45309]",
  },
  Coaching: {
    idle: "bg-[#ede9fe] border border-[#c4b5fd] text-[#4c1d95] hover:bg-[#ddd6fe]",
    active: "bg-[#5b21b6] text-white shadow-sm border border-[#5b21b6]",
  },
  Social: {
    idle: "bg-[#ffe4e6] border border-[#fda4af] text-[#881337] hover:bg-[#fecdd3]",
    active: "bg-[#be123c] text-white shadow-sm border border-[#be123c]",
  },
};

export default function EventsPage() {
  const { events, profile, registerForEvent } = usePlayCourt();

  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [sportFilter, setSportFilter] = useState<string>("all");
  const [selectedEvent, setSelectedEvent] = useState<PlayEvent | null>(null);
  const [partnerName, setPartnerName] = useState<string>("");

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const okCat =
        categoryFilter === "all" || ev.category === categoryFilter;
      const okSport = sportFilter === "all" || ev.sport === sportFilter;
      return okCat && okSport;
    });
  }, [events, categoryFilter, sportFilter]);

  const handleConfirmRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    registerForEvent(selectedEvent.id, partnerName.trim() || undefined);
    setSelectedEvent((prev) =>
      prev
        ? {
            ...prev,
            registered: true,
            spotsLeft: Math.max(0, prev.spotsLeft - 1),
          }
        : null
    );
  };

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
                / <span className="text-pc-lime font-bold">Events & Tournaments</span>
              </div>
              <span className="inline-block bg-[#fef3c7] text-[#78350f] px-3 py-1 rounded-full text-[10px] font-black tracking-[1.5px] uppercase">
                MORE REASONS TO PLAY
              </span>
              <h1 className="text-[clamp(32px,4vw,46px)] font-black tracking-[-2px] leading-[1.06] my-3 text-white">
                Make a day of the game.
              </h1>
              <p className="text-[#e1f2e9] leading-[1.75] text-[15px] max-w-xl">
                Discover city-wide doubles tournaments, small-group coaching
                clinics, and sunset club mixers. Find your next challenge on the
                calendar.
              </p>
            </FadeUp>
            <FadeUp delay={0.08}>
              <div className="group overflow-hidden rounded-[22px] shadow-xl border-2 border-pc-lime/45">
                <img
                  src="https://images.unsplash.com/photo-1519861531473-9200262188bf?w=1000&h=650&fit=crop"
                  alt="Sports event in progress"
                  className="w-full h-[235px] sm:h-[260px] object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* 2. FILTER BAR & EVENT CARDS */}
      <section className="py-8">
        <div className="w-[min(1180px,calc(100%-32px))] mx-auto">
          <FadeUp className="pc-surface-amber border-2 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shadow-sm">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#fef3c7] text-[#78350f] border border-[#fcd34d] text-[10px] font-black tracking-[1.4px] uppercase">
                UPCOMING EXPERIENCES
              </span>
              <h2 className="text-[clamp(24px,3vw,34px)] font-black tracking-[-1.4px] mt-1 text-pc-text">
                On the PlayCourt calendar.
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {["all", "Tournament", "Coaching", "Social"].map((cat) => {
                const st = CATEGORY_FILTER_STYLES[cat] || CATEGORY_FILTER_STYLES.all;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`pc-pill-lift px-4 py-2 rounded-full text-[12px] font-extrabold ${
                      categoryFilter === cat ? st.active : st.idle
                    }`}
                  >
                    {cat === "all" ? "All Experiences" : `${cat}s`}
                  </button>
                );
              })}

              <select
                value={sportFilter}
                onChange={(e) => setSportFilter(e.target.value)}
                aria-label="Filter events by sport"
                className="px-3.5 py-2 rounded-full border border-[#d9b45b] bg-white text-[12px] font-extrabold text-pc-text focus:outline-none focus:border-pc-green cursor-pointer"
              >
                <option value="all">All Sports</option>
                <option value="Tennis">Tennis</option>
                <option value="Padel">Padel</option>
                <option value="Badminton">Badminton</option>
                <option value="Squash">Squash</option>
              </select>
            </div>
          </FadeUp>

          {/* Event Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredEvents.map((ev) => {
              const ct = getEventCategoryTheme(ev.category);
              return (
                <FadeUp key={ev.id}>
                  <article
                    className={`group pc-hover-card h-full border-2 rounded-[22px] overflow-hidden flex flex-col justify-between ${ct.cardBg}`}
                  >
                    <div>
                      <div className={`h-1.5 w-full ${ct.ribbon}`} />
                      <div className="h-[200px] relative bg-[#d5e5dc] overflow-hidden">
                        <img
                          src={ev.image}
                          alt={ev.title}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                        <span
                          className={`absolute left-3 top-3 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm group-hover:translate-x-0.5 transition-transform ${ct.pill}`}
                        >
                          {ev.category} · {ev.sport}
                        </span>
                        <span className="absolute left-3 bottom-3 bg-pc-lime text-pc-deep border border-[#bddb65] px-3 py-1.5 rounded-lg text-[11px] font-black shadow-sm group-hover:-translate-y-0.5 transition-transform">
                          {ev.dateLabel}
                        </span>
                        {ev.registered && (
                          <span className="absolute right-3 top-3 bg-pc-green text-pc-lime px-2.5 py-1 rounded-full text-[10px] font-extrabold shadow-sm">
                            ✓ Registered
                          </span>
                        )}
                      </div>

                      <div className="p-4">
                        <h3 className="text-[17.5px] font-black text-pc-text group-hover:text-pc-green transition-colors mb-1">
                          {ev.title}
                        </h3>
                        <div className="text-[12px] text-pc-muted font-medium mb-2.5 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-pc-green shrink-0" />
                          <span>{ev.venueName}</span>
                          <span>·</span>
                          <strong className={`font-extrabold ${ct.accentText}`}>
                            {ev.spotsLeft} spots left
                          </strong>
                        </div>
                        <p className="text-[12.5px] text-pc-muted font-medium leading-relaxed">
                          {ev.description}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 pt-3 border-t border-black/10 flex items-center justify-between text-[12px]">
                      <span>
                        <strong className="text-[17px] font-black text-pc-text">
                          ₹{ev.price}
                        </strong>{" "}
                        <span className="text-pc-muted font-semibold">/ person</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedEvent(ev)}
                        className="group/btn pc-btn-lift inline-flex items-center gap-1 rounded-full bg-pc-green text-white px-4 py-2 text-[11.5px] font-extrabold hover:bg-pc-deep"
                      >
                        <span>
                          {ev.registered ? "View Registration" : "Details & Register"}
                        </span>
                        <ArrowUpRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                      </button>
                    </div>
                  </article>
                </FadeUp>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. COACHING CTA */}
      <section className="py-10">
        <div className="w-[min(1180px,calc(100%-32px))] mx-auto">
          <FadeUp className="pc-hover-card bg-gradient-to-r from-[#3b1578] via-[#1e503e] to-[#114e4a] text-white border border-pc-lime/30 rounded-[26px] p-7 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-card">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-pc-lime text-pc-deep text-[10px] font-black uppercase tracking-wider mb-2">
                PRO COACHING SQUADS
              </span>
              <h2 className="text-[24px] sm:text-[28px] font-black tracking-[-1px] text-white mb-1">
                Ready to level up your stroke play?
              </h2>
              <p className="text-[#e1f2e9] text-[13.5px]">
                Filter by Coaching Clinics to work with ITF & BWF certified
                coaches in small 1:4 ratio squads.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setCategoryFilter("Coaching");
                window.scrollTo({ top: 280, behavior: "smooth" });
              }}
              className="group pc-btn-lift inline-flex items-center gap-1.5 rounded-full bg-pc-lime text-pc-deep px-5 py-3 text-[12.5px] font-black hover:bg-[#e8f88c] shrink-0"
            >
              <span>Filter Coaching Clinics</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </FadeUp>
        </div>
      </section>

      {/* EVENT DETAILS & DEMO REGISTRATION MODAL */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 bg-[#0b2118]/75 backdrop-blur-[2px] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedEvent(null);
          }}
        >
          <div className="pc-modal-pop pc-surface-violet border-2 rounded-[24px] p-6 sm:p-7 w-[min(560px,100%)] max-h-[90vh] overflow-y-auto relative shadow-2xl">
            <button
              type="button"
              onClick={() => setSelectedEvent(null)}
              className="absolute right-4 top-4 p-2 rounded-full bg-white/80 hover:bg-white hover:rotate-90 transition-all text-pc-text"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="inline-block bg-pc-green text-pc-lime px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
              {selectedEvent.category} · {selectedEvent.sport}
            </span>
            <h2 className="text-[24px] font-black text-pc-text mt-2 mb-1">
              {selectedEvent.title}
            </h2>
            <p className="text-[12.5px] text-pc-muted font-medium mb-4">
              Organized by <strong className="text-pc-text">{selectedEvent.coachOrOrganizer}</strong>
            </p>

            <div className="pc-hover-subcard grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-2xl bg-white/95 border border-[#c5b4f3] text-[12.5px] font-semibold mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-pc-green shrink-0" />
                <span>{selectedEvent.fullDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#0369a1] shrink-0" />
                <span>{selectedEvent.time}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#b45309] shrink-0" />
                <span>{selectedEvent.venueName}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#5b21b6] shrink-0" />
                <span>
                  {selectedEvent.spotsLeft} of {selectedEvent.totalSpots} places
                  remaining
                </span>
              </div>
            </div>

            <div className="mb-5">
              <h4 className="text-[12px] font-extrabold uppercase tracking-wider text-[#4c1d95] mb-2">
                What&apos;s Included
              </h4>
              <ul className="space-y-1.5 text-[12.5px] font-semibold">
                {selectedEvent.highlights.map((h) => (
                  <li
                    key={h}
                    className="flex items-center gap-2 text-pc-text hover:translate-x-1 transition-transform duration-200"
                  >
                    <CheckCircle2 className="w-4 h-4 text-pc-green shrink-0" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            {selectedEvent.registered ? (
              <div className="bg-[#dcfce7] border border-[#6ee7b7] rounded-2xl p-4 text-[13px] text-[#064e3b] font-bold flex items-center gap-2.5">
                <Trophy className="w-5 h-5 shrink-0" />
                <span>
                  You are registered for {selectedEvent.title}! Confirmation
                  sent to {profile.email} (Demo).
                </span>
              </div>
            ) : (
              <form
                onSubmit={handleConfirmRegistration}
                className="bg-white/95 border border-[#c5b4f3] rounded-2xl p-4 space-y-3"
              >
                <div className="text-[12px] font-extrabold text-pc-text">
                  Player Registration (Frontend Demo)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-extrabold text-pc-muted mb-1">
                      Player Name
                    </label>
                    <input
                      type="text"
                      defaultValue={profile.name}
                      required
                      className="w-full p-2.5 rounded-xl border border-[#c5b4f3] bg-white text-[12.5px] font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-extrabold text-pc-muted mb-1">
                      Doubles Partner (Optional)
                    </label>
                    <input
                      type="text"
                      value={partnerName}
                      onChange={(e) => setPartnerName(e.target.value)}
                      placeholder="Partner name or 'Need partner'"
                      className="w-full p-2.5 rounded-xl border border-[#c5b4f3] bg-white text-[12.5px] font-medium"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="pc-btn-lift w-full rounded-full bg-pc-green text-white py-3 text-[12.5px] font-extrabold hover:bg-pc-deep"
                >
                  Confirm Demo Registration · ₹{selectedEvent.price} →
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
