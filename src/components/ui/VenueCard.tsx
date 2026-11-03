"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Heart, MapPin, Star, ArrowUpRight, Sparkles } from "lucide-react";
import { Venue } from "@/types/playcourt";
import { usePlayCourt } from "@/context/PlayCourtContext";
import { getSportTheme } from "@/lib/sportColors";

export function VenueCard({
  venue,
  showAvailabilityPreview = false,
}: {
  venue: Venue;
  showAvailabilityPreview?: boolean;
}) {
  const { profile, toggleFavouriteVenue } = usePlayCourt();
  const isFav = profile.favouriteVenueIds.includes(venue.id);

  // Pick up to 3 available slots from the primary court for quick preview
  const primaryCourt = venue.courts[0];
  const previewSlots = primaryCourt
    ? primaryCourt.slots.filter((s) => s.available).slice(0, 3)
    : [];

  const sportTheme = getSportTheme(venue.primarySport);

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
      className={`group pc-hover-card border rounded-[22px] overflow-hidden flex flex-col ${sportTheme.cardBg}`}
    >
      {/* Sport Spectrum Accent Bar */}
      <div className={`h-1.5 w-full ${sportTheme.ribbon}`} />

      {/* Image Container */}
      <div className="h-[205px] relative overflow-hidden bg-[#d5e5dc]">
        <Link href={`/venues/${venue.id}`}>
          <img
            src={venue.image}
            alt={`${venue.primarySport} court at ${venue.name}`}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </Link>
        <span className="absolute left-3 top-3 bg-[#fef3c7] text-[#78350f] border border-[#fcd34d] px-2.5 py-1 rounded-full text-[10px] font-black tracking-[0.6px] shadow-sm transition-transform duration-300 group-hover:scale-105">
          {venue.tag}
        </span>
        <button
          type="button"
          onClick={() => toggleFavouriteVenue(venue.id)}
          aria-label="Save to favourites"
          className="absolute right-3 top-3 w-8 h-8 rounded-full bg-white/95 hover:bg-white hover:scale-110 active:scale-90 grid place-items-center shadow-md transition-all duration-200"
        >
          <Heart
            className={`w-4 h-4 transition-transform duration-200 ${
              isFav
                ? "fill-red-500 text-red-500 scale-110"
                : "text-pc-text hover:text-red-500"
            }`}
          />
        </button>
        {venue.participatingInCredits && (
          <span className="absolute left-3 bottom-3 bg-pc-deep/95 backdrop-blur-sm text-pc-lime border border-pc-lime/30 px-2.5 py-1 rounded-lg text-[10px] font-extrabold inline-flex items-center gap-1 shadow-sm transition-transform duration-300 group-hover:translate-x-0.5">
            <Sparkles className="w-3 h-3" />
            Crew Credit Eligible
          </span>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-2">
            <Link
              href={`/venues/${venue.id}`}
              className="text-[16.5px] font-extrabold text-pc-text hover:text-pc-green transition-colors leading-snug"
            >
              {venue.name}
            </Link>
            <span className="inline-flex items-center gap-1 text-[12px] font-black text-[#78350f] shrink-0 bg-[#fef3c7] border border-[#fcd34d] px-2.5 py-0.5 rounded-full transition-transform duration-200 group-hover:scale-105">
              <Star className="w-3.5 h-3.5 fill-[#d97706] text-[#d97706]" />
              {venue.rating}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[12px] text-pc-muted mt-1.5 mb-2.5 font-medium">
            <MapPin className="w-3.5 h-3.5 shrink-0 text-pc-green transition-transform duration-200 group-hover:scale-110" />
            <span>
              {venue.area} · {venue.city}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            {venue.sports.map((sp) => {
              const st = getSportTheme(sp);
              return (
                <span
                  key={sp}
                  className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold ${st.pill}`}
                >
                  {sp}
                </span>
              );
            })}
          </div>

          {showAvailabilityPreview && previewSlots.length > 0 && (
            <div className={`mb-3.5 p-2.5 rounded-xl border ${sportTheme.subcardBg}`}>
              <span className="block text-[10px] font-black uppercase tracking-wider text-pc-text mb-1.5">
                Today&apos;s Quick Slots ({primaryCourt.name.split(" (")[0]})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {previewSlots.map((slot) => (
                  <Link
                    key={slot.time}
                    href={`/booking?venueId=${venue.id}&courtId=${primaryCourt.id}&slot=${encodeURIComponent(
                      slot.time
                    )}`}
                    className="pc-pill-lift text-[11px] font-extrabold px-2.5 py-1 rounded-lg border border-[#8cc5a6] bg-white/90 text-pc-deep hover:bg-pc-green hover:text-white hover:border-pc-green shadow-sm"
                  >
                    {slot.time.split("–")[0]}
                  </Link>
                ))}
                <Link
                  href={`/venues/${venue.id}`}
                  className="text-[11px] font-extrabold px-2 py-1 text-pc-green hover:underline hover:translate-x-0.5 transition-all"
                >
                  +{venue.courts.length} courts
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-black/10 pt-3 flex items-center justify-between text-[12px]">
          <span className="transition-transform duration-200 group-hover:translate-x-0.5">
            <strong className="text-[17px] font-black text-pc-text">
              ₹{venue.pricePerHour}
            </strong>{" "}
            <span className="text-pc-muted font-semibold">/ hour</span>
          </span>
          <div className="flex items-center gap-1.5">
            <Link
              href={`/venues/${venue.id}`}
              className="pc-pill-lift px-3 py-2 rounded-full border border-[#8ab89f] bg-white/85 text-[11.5px] font-extrabold text-pc-text hover:border-pc-green hover:bg-pc-lime hover:text-pc-deep"
            >
              Details
            </Link>
            <Link
              href={`/booking?venueId=${venue.id}`}
              className="group/btn pc-btn-lift inline-flex items-center gap-1 rounded-full bg-pc-green text-white px-3.5 py-2 text-[11.5px] font-extrabold hover:bg-pc-deep"
            >
              <span>Book now</span>
              <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
