"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Users,
  MapPin,
  Clock,
  X,
  HeartHandshake,
  Target,
} from "lucide-react";
import { usePlayCourt } from "@/context/PlayCourtContext";
import { SportType } from "@/types/playcourt";
import { FadeUp, StaggerGrid, StaggerItem } from "@/components/ui/MotionPrimitives";
import { getSportTheme } from "@/lib/sportColors";

const SKILL_PILLS: Record<string, string> = {
  Beginner: "bg-[#dcfce7] text-[#065f46] border border-[#86efac]",
  Intermediate: "bg-[#dbeafe] text-[#1e3a8a] border border-[#93c5fd]",
  Advanced: "bg-[#ffedd5] text-[#7c2d12] border border-[#fdba74]",
};

export default function CommunityPage() {
  const { matches, venues, createOpenMatch, joinOpenMatch } = usePlayCourt();

  const [sportFilter, setSportFilter] = useState<string>("all");
  const [skillFilter, setSkillFilter] = useState<string>("all");
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);

  // Create Match Form State
  const [title, setTitle] = useState("");
  const [sport, setSport] = useState<SportType>("Tennis");
  const [skillLevel, setSkillLevel] = useState<
    "Beginner" | "Intermediate" | "Advanced"
  >("Intermediate");
  const [venueName, setVenueName] = useState(venues[0].name);
  const [dateTime, setDateTime] = useState("Tomorrow · 6:30 PM");
  const [totalSpots, setTotalSpots] = useState(4);
  const [pricePerPlayer, setPricePerPlayer] = useState(250);
  const [description, setDescription] = useState("");

  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      const okSport = sportFilter === "all" || m.sport === sportFilter;
      const okSkill = skillFilter === "all" || m.skillLevel === skillFilter;
      return okSport && okSkill;
    });
  }, [matches, sportFilter, skillFilter]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const chosenVenue = venues.find((v) => v.name === venueName) || venues[0];
    createOpenMatch({
      title: title.trim() || `${sport} ${skillLevel} Session`,
      sport,
      skillLevel,
      venueName: chosenVenue.name,
      area: `${chosenVenue.area}, ${chosenVenue.city}`,
      dateTime: dateTime.trim() || "Tomorrow · 6:00 PM",
      totalSpots: Number(totalSpots) || 4,
      pricePerPlayer: Number(pricePerPlayer) || 200,
      description:
        description.trim() ||
        "Friendly open community match. Bring your racquet and non-marking shoes!",
    });
    setCreateModalOpen(false);
    setTitle("");
    setDescription("");
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
                / <span className="text-pc-lime font-bold">Community</span>
              </div>
              <span className="inline-block bg-pc-lime text-pc-deep px-3 py-1 rounded-full text-[10px] font-black tracking-[1.5px] uppercase">
                YOUR PEOPLE ARE OUT THERE
              </span>
              <h1 className="text-[clamp(32px,4vw,46px)] font-black tracking-[-2px] leading-[1.06] my-3 text-white">
                Find players. Make plans. Play more.
              </h1>
              <p className="text-[#e1f2e9] leading-[1.75] text-[15px] max-w-xl mb-5">
                Join open games hosted by local players, filter by your skill
                bracket, and turn an empty evening slot into a competitive rally.
              </p>
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="group pc-btn-lift inline-flex items-center gap-2 rounded-full bg-pc-lime text-pc-deep px-5 py-3 text-[12.5px] font-black hover:bg-[#e8f88c] shadow-sm"
              >
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                <span>Create an open match</span>
              </button>
            </FadeUp>
            <FadeUp delay={0.08}>
              <div className="group overflow-hidden rounded-[22px] shadow-xl border-2 border-pc-lime/45">
                <img
                  src="https://images.unsplash.com/photo-1592656094267-764a45160876?w=1000&h=650&fit=crop"
                  alt="Community tennis players"
                  className="w-full h-[240px] sm:h-[265px] object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* 2. COMMUNITY MATCH BOARD + FILTERS */}
      <section className="py-8">
        <div className="w-[min(1180px,calc(100%-32px))] mx-auto">
          <FadeUp className="pc-surface-mint border-2 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shadow-sm">
            <div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#d1fae5] text-[#065f46] border border-[#6ee7b7] text-[10px] font-black tracking-[1.4px] uppercase">
                COMMUNITY BOARD
              </span>
              <h2 className="text-[clamp(24px,3vw,34px)] font-black tracking-[-1.4px] mt-1 text-pc-text">
                Open matches near you.
              </h2>
            </div>

            {/* Sport & Skill Filters */}
            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={sportFilter}
                onChange={(e) => setSportFilter(e.target.value)}
                aria-label="Filter matches by sport"
                className="px-3.5 py-2.5 rounded-xl border border-[#8cc5a6] bg-white text-[13px] font-bold text-pc-text focus:outline-none focus:border-pc-green cursor-pointer"
              >
                <option value="all">All sports</option>
                <option value="Tennis">Tennis</option>
                <option value="Padel">Padel</option>
                <option value="Badminton">Badminton</option>
                <option value="Squash">Squash</option>
              </select>

              <select
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                aria-label="Filter matches by skill level"
                className="px-3.5 py-2.5 rounded-xl border border-[#8cc5a6] bg-white text-[13px] font-bold text-pc-text focus:outline-none focus:border-pc-green cursor-pointer"
              >
                <option value="all">All skill levels</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>

              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="pc-pill-lift px-4 py-2.5 rounded-xl bg-pc-green text-pc-lime text-[12.5px] font-extrabold hover:bg-pc-deep"
              >
                ＋ Host Match
              </button>
            </div>
          </FadeUp>

          {/* Match Cards List */}
          {filteredMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredMatches.map((m) => {
                const openSpots = m.totalSpots - m.filledSpots;
                const isFull = openSpots <= 0 && !m.joinedByCurrentUser;
                const st = getSportTheme(m.sport);
                return (
                  <FadeUp key={m.id}>
                    <article
                      className={`group pc-hover-card h-full border-2 rounded-[22px] overflow-hidden flex flex-col justify-between ${st.cardBg}`}
                    >
                      <div>
                        <div className={`h-1.5 w-full ${st.ribbon}`} />
                        <div className="p-5 sm:p-6 pb-0">
                          <div className="flex items-center justify-between gap-2 mb-2.5">
                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${st.pill}`}
                              >
                                {m.sport}
                              </span>
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10.5px] font-extrabold ${
                                  SKILL_PILLS[m.skillLevel] ||
                                  "bg-white/90 text-pc-text border border-pc-line"
                                }`}
                              >
                                {m.skillLevel}
                              </span>
                            </div>
                            <span
                              className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                                m.joinedByCurrentUser
                                  ? "bg-[#dcfce7] text-[#064e3b] border-[#6ee7b7]"
                                  : openSpots === 1
                                  ? "bg-[#fef3c7] text-[#78350f] border-[#fcd34d]"
                                  : "bg-white/90 text-pc-text border-black/10"
                              }`}
                            >
                              {m.joinedByCurrentUser
                                ? "✓ You Joined"
                                : openSpots > 0
                                ? `${openSpots} of ${m.totalSpots} spots open`
                                : "Full"}
                            </span>
                          </div>

                          <h3 className="text-[18.5px] font-black text-pc-text group-hover:text-pc-green transition-colors mb-1">
                            {m.title}
                          </h3>
                          <p className="text-[12.5px] text-pc-muted font-medium leading-relaxed mb-4">
                            {m.description}
                          </p>

                          <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-2xl bg-white/85 group-hover:bg-white transition-colors border border-black/10 text-[12px] mb-4 shadow-sm">
                            <div className="flex items-center gap-1.5 text-pc-text font-bold">
                              <MapPin className="w-3.5 h-3.5 text-pc-green shrink-0" />
                              <span className="truncate">{m.venueName}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-pc-text font-bold">
                              <Clock className="w-3.5 h-3.5 text-[#0369a1] shrink-0" />
                              <span>{m.dateTime}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-pc-muted font-medium">
                              <span>
                                Hosted by{" "}
                                <strong className="text-pc-text font-extrabold">
                                  {m.hostName}
                                </strong>
                              </span>
                              <span className="inline-flex items-center text-[11px] font-black text-[#b45309]">
                                ★ {m.hostRating}
                              </span>
                            </div>
                            <div className="text-right font-black text-pc-text">
                              ₹{m.pricePerPlayer}{" "}
                              <span className="font-semibold text-pc-muted">
                                / player share
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="px-5 sm:px-6 pb-5 pt-3 border-t border-black/10 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {Array.from({ length: m.totalSpots }).map((_, idx) => {
                            const filled = idx < m.filledSpots;
                            return (
                              <span
                                key={idx}
                                className={`w-6 h-6 rounded-full text-[10px] font-black grid place-items-center border hover:scale-110 transition-transform cursor-default ${
                                  filled
                                    ? "bg-pc-green text-pc-lime border-pc-green"
                                    : "bg-white text-pc-text border-dashed border-[#7ba88f]"
                                }`}
                              >
                                {filled ? "✓" : "+"}
                              </span>
                            );
                          })}
                          <span className="text-[11px] font-bold text-pc-muted ml-1">
                            {m.filledSpots}/{m.totalSpots} players
                          </span>
                        </div>

                        <button
                          type="button"
                          disabled={isFull}
                          onClick={() => joinOpenMatch(m.id)}
                          className={`px-4 py-2 rounded-full text-[12px] font-extrabold ${
                            m.joinedByCurrentUser
                              ? "pc-pill-lift border-2 border-pc-green bg-[#dcfce7] text-[#064e3b] hover:bg-[#bbf7d0]"
                              : isFull
                              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                              : "pc-btn-lift bg-pc-green text-white hover:bg-pc-deep"
                          }`}
                        >
                          {m.joinedByCurrentUser
                            ? "Joined (Click to Leave)"
                            : isFull
                            ? "Match Full"
                            : "Request to join ↗"}
                        </button>
                      </div>
                    </article>
                  </FadeUp>
                );
              })}
            </div>
          ) : (
            <FadeUp className="pc-hover-card pc-surface-amber border-2 rounded-[22px] p-10 text-center">
              <p className="text-pc-text font-semibold text-[14px] mb-4">
                No open matches for this filter combination yet.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSportFilter("all");
                  setSkillFilter("all");
                }}
                className="pc-btn-lift px-4 py-2 rounded-full bg-pc-green text-white text-[12px] font-extrabold hover:bg-pc-deep"
              >
                Show all open matches
              </button>
            </FadeUp>
          )}
        </div>
      </section>

      {/* 3. COMMUNITY PILLARS */}
      <section className="py-10 pc-band-vivid">
        <StaggerGrid className="w-[min(1180px,calc(100%-32px))] mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          <StaggerItem>
            <article className="group pc-hover-card pc-surface-mint h-full border-2 rounded-[20px] p-6">
              <div className="bg-[#065f46] text-pc-lime group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 w-11 h-11 rounded-[13px] grid place-items-center shadow-sm">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-[17px] font-extrabold mt-4 mb-1.5 text-pc-text group-hover:text-pc-green transition-colors">
                Skill-aware discovery
              </h3>
              <p className="text-pc-muted font-medium text-[12.5px] leading-[1.75]">
                Filter games by Beginner, Intermediate, or Advanced brackets so
                every rally stays balanced and enjoyable.
              </p>
            </article>
          </StaggerItem>
          <StaggerItem>
            <article className="group pc-hover-card pc-surface-coral h-full border-2 rounded-[20px] p-6">
              <div className="bg-[#c2410c] text-white group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 w-11 h-11 rounded-[13px] grid place-items-center shadow-sm">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-[17px] font-extrabold mt-4 mb-1.5 text-pc-text group-hover:text-[#9a3412] transition-colors">
                Clear open spots
              </h3>
              <p className="text-pc-muted font-medium text-[12.5px] leading-[1.75]">
                See live player counts, court share costs, and host ratings before
                requesting to join a session.
              </p>
            </article>
          </StaggerItem>
          <StaggerItem>
            <article className="group pc-hover-card pc-surface-violet h-full border-2 rounded-[20px] p-6">
              <div className="bg-[#5b21b6] text-white group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 w-11 h-11 rounded-[13px] grid place-items-center shadow-sm">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <h3 className="text-[17px] font-extrabold mt-4 mb-1.5 text-pc-text group-hover:text-[#5b21b6] transition-colors">
                Build your regular crew
              </h3>
              <p className="text-pc-muted font-medium text-[12.5px] leading-[1.75]">
                Meet consistent partners on the court and link up to 4 players in
                a shared Crew Membership.
              </p>
            </article>
          </StaggerItem>
        </StaggerGrid>
      </section>

      {/* CREATE MATCH MODAL */}
      {createModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#0b2118]/75 backdrop-blur-[2px] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCreateModalOpen(false);
          }}
        >
          <div className="pc-modal-pop pc-surface-mint border-2 rounded-[24px] p-6 sm:p-7 w-[min(540px,100%)] max-h-[90vh] overflow-y-auto relative shadow-2xl">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="absolute right-4 top-4 p-2 rounded-full bg-white/80 hover:bg-white hover:rotate-90 transition-all text-pc-text"
            >
              <X className="w-5 h-5" />
            </button>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-pc-green text-pc-lime text-[10px] font-black tracking-[1.4px] uppercase">
              COMMUNITY MATCH HOSTING
            </span>
            <h2 className="text-[24px] font-black text-pc-text mt-2 mb-1">
              Create an open match
            </h2>
            <p className="text-[12.5px] text-pc-muted font-medium mb-5">
              Post a game to the local community board. Players around your
              skill level can join immediately.
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-[11.5px] font-extrabold text-pc-text mb-1">
                  Match Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Evening Doubles Rally · Court 2"
                  className="w-full p-3 rounded-xl border border-[#8cc5a6] bg-white text-[13px] font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11.5px] font-extrabold text-pc-text mb-1">
                    Sport
                  </label>
                  <select
                    value={sport}
                    onChange={(e) => setSport(e.target.value as SportType)}
                    className="w-full p-3 rounded-xl border border-[#8cc5a6] bg-white text-[13px] font-bold cursor-pointer"
                  >
                    <option value="Tennis">Tennis</option>
                    <option value="Padel">Padel</option>
                    <option value="Badminton">Badminton</option>
                    <option value="Squash">Squash</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11.5px] font-extrabold text-pc-text mb-1">
                    Skill Level
                  </label>
                  <select
                    value={skillLevel}
                    onChange={(e) =>
                      setSkillLevel(
                        e.target.value as
                          | "Beginner"
                          | "Intermediate"
                          | "Advanced"
                      )
                    }
                    className="w-full p-3 rounded-xl border border-[#8cc5a6] bg-white text-[13px] font-bold cursor-pointer"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11.5px] font-extrabold text-pc-text mb-1">
                    Venue
                  </label>
                  <select
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#8cc5a6] bg-white text-[13px] font-bold cursor-pointer"
                  >
                    {venues.map((v) => (
                      <option key={v.id} value={v.name}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11.5px] font-extrabold text-pc-text mb-1">
                    Date & Time Label *
                  </label>
                  <input
                    type="text"
                    required
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                    placeholder="e.g., Tomorrow · 6:30 PM"
                    className="w-full p-3 rounded-xl border border-[#8cc5a6] bg-white text-[13px] font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11.5px] font-extrabold text-pc-text mb-1">
                    Total Players
                  </label>
                  <select
                    value={totalSpots}
                    onChange={(e) => setTotalSpots(Number(e.target.value))}
                    className="w-full p-3 rounded-xl border border-[#8cc5a6] bg-white text-[13px] font-bold cursor-pointer"
                  >
                    <option value={2}>2 Players (Singles)</option>
                    <option value={4}>4 Players (Doubles)</option>
                    <option value={6}>6 Players (Rotation)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11.5px] font-extrabold text-pc-text mb-1">
                    Share per player (₹)
                  </label>
                  <input
                    type="number"
                    value={pricePerPlayer}
                    onChange={(e) => setPricePerPlayer(Number(e.target.value))}
                    className="w-full p-3 rounded-xl border border-[#8cc5a6] bg-white text-[13px] font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11.5px] font-extrabold text-pc-text mb-1">
                  Match Notes
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Balls provided, court number, warm-up format..."
                  className="w-full p-3 rounded-xl border border-[#8cc5a6] bg-white text-[13px] font-medium"
                />
              </div>

              <button
                type="submit"
                className="pc-btn-lift w-full rounded-full bg-pc-green text-white py-3.5 text-[13px] font-extrabold hover:bg-pc-deep"
              >
                Publish Match to Community Board →
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
