"use client";

import React, { useState, use, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Star,
  Clock,
  CheckCircle2,
  Sparkles,
  Heart,
  Calendar,
  ArrowUpRight,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import { usePlayCourt } from "@/context/PlayCourtContext";
import { FadeUp } from "@/components/ui/MotionPrimitives";
import { getSportTheme } from "@/lib/sportColors";

export default function VenueDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const {
    venues,
    groupMembership,
    profile,
    toggleFavouriteVenue,
    loadAvailabilityForDate,
  } = usePlayCourt();

  const venue =
    venues.find((v) => v.id === id || v.slug === id) || venues[0];

  const [selectedCourtId, setSelectedCourtId] = useState<string>(
    venue.courts[0]?.id || ""
  );
  const [selectedDate, setSelectedDate] = useState<string>("2026-10-29");
  const [selectedSlot, setSelectedSlot] = useState<string>(
    venue.courts[0]?.slots.find((s) => s.available)?.time || "18:00–19:00"
  );
  const [activeImage, setActiveImage] = useState<string>(venue.image);

  useEffect(() => {
    void loadAvailabilityForDate(selectedDate);
  }, [selectedDate, loadAvailabilityForDate]);

  const selectedCourt =
    venue.courts.find((c) => c.id === selectedCourtId) || venue.courts[0];

  const isFav = profile.favouriteVenueIds.includes(venue.id);

  const creditAvailable =
    groupMembership.status === "Active" &&
    groupMembership.dailyCreditUsed < groupMembership.dailyCreditTotal &&
    venue.participatingInCredits;

  const handleProceedToBooking = () => {
    const query = new URLSearchParams({
      venueId: venue.id,
      courtId: selectedCourt.id,
      date: selectedDate,
      slot: selectedSlot,
    });
    router.push(`/booking?${query.toString()}`);
  };

  const upcomingDates = [
    { label: "Today", date: "2026-10-28", day: "Wed, 28 Oct" },
    { label: "Tomorrow", date: "2026-10-29", day: "Thu, 29 Oct" },
    { label: "Friday", date: "2026-10-30", day: "Fri, 30 Oct" },
    { label: "Saturday", date: "2026-10-31", day: "Sat, 31 Oct" },
    { label: "Sunday", date: "2026-11-01", day: "Sun, 01 Nov" },
  ];

  const venueTheme = getSportTheme(venue.primarySport);

  return (
    <main className="py-8 overflow-x-hidden">
      <div className="w-[min(1180px,calc(100%-32px))] mx-auto">
        {/* Breadcrumb */}
        <div className="flex items-center justify-between gap-4 mb-5 text-[12.5px]">
          <div className="flex items-center gap-2 text-pc-muted font-semibold">
            <Link
              href="/venues"
              className="group pc-pill-lift inline-flex items-center gap-1 font-extrabold text-pc-deep px-3 py-1 rounded-full bg-pc-lime border border-[#bcdb65]"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Courts</span>
            </Link>
            <span>/</span>
            <span>{venue.city}</span>
            <span>/</span>
            <span className="text-pc-text font-extrabold">{venue.name}</span>
          </div>

          <button
            type="button"
            onClick={() => toggleFavouriteVenue(venue.id)}
            className="group pc-pill-lift inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#ffe4e6] border border-[#fda4af] text-[12px] font-extrabold text-[#881337] hover:bg-[#fecdd3]"
          >
            <Heart
              className={`w-3.5 h-3.5 group-hover:scale-110 transition-transform ${
                isFav ? "fill-red-600 text-red-600" : "text-[#881337]"
              }`}
            />
            <span>{isFav ? "Saved" : "Save Venue"}</span>
          </button>
        </div>

        {/* 1. GALLERY & HEADER SUMMARY */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.45fr_1fr] gap-5 mb-8">
          <FadeUp className="space-y-3">
            <div className="group relative h-[300px] sm:h-[400px] rounded-[24px] overflow-hidden bg-[#d5e5dc] border-2 border-[#93c9ab] hover:shadow-float transition-shadow duration-300">
              <img
                src={activeImage}
                alt={venue.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <span className="absolute left-4 top-4 bg-[#fef3c7] text-[#78350f] border border-[#fcd34d] px-3 py-1 rounded-full text-[10.5px] font-black tracking-wider shadow-sm group-hover:translate-x-0.5 transition-transform">
                {venue.tag}
              </span>
            </div>
            {venue.gallery.length > 1 && (
              <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                {venue.gallery.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImage(imgUrl)}
                    className={`group pc-pill-lift h-16 w-28 rounded-xl overflow-hidden border-2 shrink-0 ${
                      activeImage === imgUrl
                        ? "border-pc-green scale-[1.02] shadow-md"
                        : "border-white/70 opacity-85 hover:opacity-100 hover:border-pc-green"
                    }`}
                  >
                    <img
                      src={imgUrl}
                      alt={`${venue.name} view ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </button>
                ))}
              </div>
            )}
          </FadeUp>

          {/* Venue Info Box */}
          <FadeUp
            delay={0.07}
            className={`pc-hover-card border-2 rounded-[24px] overflow-hidden flex flex-col justify-between ${venueTheme.cardBg}`}
          >
            <div>
              <div className={`h-2 w-full ${venueTheme.ribbon}`} />
              <div className="p-6 sm:p-7 pb-0">
                <div className="flex flex-wrap items-center gap-2 mb-2.5">
                  {venue.sports.map((sp) => {
                    const st = getSportTheme(sp);
                    return (
                      <span
                        key={sp}
                        className={`pc-pill-lift px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider cursor-default ${st.pill}`}
                      >
                        {sp}
                      </span>
                    );
                  })}
                  <span className="pc-pill-lift inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#fef3c7] border border-[#fcd34d] text-[#78350f] text-[12px] font-black cursor-default">
                    <Star className="w-3.5 h-3.5 fill-[#d97706] text-[#d97706]" />
                    {venue.rating}{" "}
                    <span className="font-semibold">
                      ({venue.reviewCount} reviews)
                    </span>
                  </span>
                </div>

                <h1 className="text-[28px] sm:text-[34px] font-black tracking-[-1.2px] text-pc-text leading-tight">
                  {venue.name}
                </h1>

                <p className="flex items-start gap-2 text-[13px] text-pc-muted font-medium mt-2">
                  <MapPin className="w-4 h-4 text-pc-green shrink-0 mt-0.5" />
                  <span>{venue.address}</span>
                </p>

                <p className="text-[13.5px] text-pc-muted font-medium leading-[1.75] mt-4">
                  {venue.description}
                </p>

                <div className="grid grid-cols-2 gap-3 my-5 pt-4 border-t border-black/10 text-[12.5px]">
                  <div className="pc-hover-subcard pc-surface-sky p-3 rounded-xl border cursor-default">
                    <span className="text-[10.5px] font-extrabold uppercase text-[#075985] block">
                      Opening Hours
                    </span>
                    <strong className="text-pc-text flex items-center gap-1.5 mt-0.5 font-extrabold">
                      <Clock className="w-3.5 h-3.5 text-[#0369a1]" />
                      {venue.openingHours}
                    </strong>
                  </div>
                  <div className="pc-hover-subcard pc-surface-amber p-3 rounded-xl border cursor-default">
                    <span className="text-[10.5px] font-extrabold uppercase text-[#92400e] block">
                      Standard Pricing
                    </span>
                    <strong className="text-pc-text text-[15px] font-black block mt-0.5">
                      ₹{venue.pricePerHour} / hour
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Shared Credit Eligibility Banner */}
            <div className="px-6 sm:px-7 pb-6">
              <div className="pc-hover-subcard pc-surface-lime border-2 rounded-2xl p-4">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="inline-flex items-center gap-1.5 text-[11.5px] font-black text-pc-deep uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-pc-green" />
                    Crew Membership Shared Credit
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-pc-green text-[10.5px] font-extrabold text-pc-lime">
                    {creditAvailable ? "1/1 Eligible Today" : "0/1 Remaining Today"}
                  </span>
                </div>
                <p className="text-[12px] text-pc-text font-medium leading-relaxed">
                  {creditAvailable
                    ? `Your linked group (${groupMembership.groupName}) has 1 free daily court credit ready to redeem at this venue today.`
                    : "Today's shared group credit has already been used. You can still book any slot at the standard hourly rate."}
                </p>
              </div>
            </div>
          </FadeUp>
        </div>

        {/* 2. COURT & TIME SLOT SELECTOR + BOOKING SUMMARY */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.45fr_1fr] gap-6 items-start">
          {/* Left: Courts, Date & Slots */}
          <div className="space-y-6">
            {/* Step 1: Select Date */}
            <FadeUp className="pc-hover-card pc-surface-mint border-2 rounded-[22px] overflow-hidden">
              <div className="h-1.5 w-full bg-gradient-to-r from-[#1e503e] via-[#10b981] to-[#a3e635]" />
              <div className="p-6">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#d1fae5] text-[#065f46] border border-[#6ee7b7] text-[10px] font-black tracking-[1.4px] uppercase">
                  STEP 1 · PICK YOUR PLAY DATE
                </span>
                <h2 className="text-[20px] font-black mt-1.5 mb-4 text-pc-text">
                  Select reservation date
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {upcomingDates.map((d) => {
                    const active = selectedDate === d.date;
                    return (
                      <button
                        key={d.date}
                        type="button"
                        onClick={() => setSelectedDate(d.date)}
                        className={`pc-pill-lift p-3 rounded-xl border text-left ${
                          active
                            ? "bg-pc-green text-white border-pc-green shadow-md"
                            : "bg-white/90 text-pc-text border-[#96ccb0] hover:border-pc-green hover:bg-white"
                        }`}
                      >
                        <span
                          className={`block text-[10.5px] font-extrabold uppercase ${
                            active ? "text-pc-lime" : "text-[#065f46]"
                          }`}
                        >
                          {d.label}
                        </span>
                        <strong className="text-[13px] font-black block mt-0.5">
                          {d.day}
                        </strong>
                      </button>
                    );
                  })}
                </div>
              </div>
            </FadeUp>

            {/* Step 2: Select Court */}
            <FadeUp className="pc-hover-card pc-surface-sky border-2 rounded-[22px] overflow-hidden">
              <div className="h-1.5 w-full bg-gradient-to-r from-[#0369a1] via-[#06b6d4] to-[#2dd4bf]" />
              <div className="p-6">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#dbeafe] text-[#1e3a8a] border border-[#93c5fd] text-[10px] font-black tracking-[1.4px] uppercase">
                  STEP 2 · CHOOSE A COURT
                </span>
                <h2 className="text-[20px] font-black mt-1.5 mb-4 text-pc-text">
                  Available courts at {venue.name}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {venue.courts.map((court) => {
                    const active = court.id === selectedCourt.id;
                    const openCount = court.slots.filter((s) => s.available).length;
                    const ct = getSportTheme(court.sport);
                    return (
                      <button
                        key={court.id}
                        type="button"
                        onClick={() => {
                          setSelectedCourtId(court.id);
                          const firstOpen = court.slots.find((s) => s.available);
                          if (firstOpen) setSelectedSlot(firstOpen.time);
                        }}
                        className={`pc-hover-subcard p-4 rounded-2xl border text-left flex flex-col justify-between ${
                          active
                            ? "border-2 border-pc-green bg-[#dcfce7] shadow-md"
                            : "border-[#96d1ee] bg-white/90 hover:border-pc-green hover:bg-white"
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${ct.pill}`}>
                              {court.sport}
                            </span>
                            <span className="text-[11px] font-extrabold text-[#075985]">
                              {court.indoor ? "Indoor Arena" : "Outdoor Floodlit"}
                            </span>
                          </div>
                          <h3 className="text-[15.5px] font-black text-pc-text mt-2">
                            {court.name}
                          </h3>
                          <p className="text-[12px] text-pc-muted font-medium mt-0.5">
                            Surface: {court.surface}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-4 pt-2.5 border-t border-black/10 text-[12px]">
                          <strong className="text-pc-text font-black">
                            ₹{court.pricePerHour}/hr
                          </strong>
                          <span className="text-pc-green font-extrabold">
                            {openCount} slots open
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </FadeUp>

            {/* Step 3: Select Time Slot */}
            <FadeUp className="pc-hover-card pc-surface-amber border-2 rounded-[22px] overflow-hidden">
              <div className="h-1.5 w-full bg-gradient-to-r from-[#b45309] via-[#f59e0b] to-[#10b981]" />
              <div className="p-6">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#fef3c7] text-[#78350f] border border-[#fcd34d] text-[10px] font-black tracking-[1.4px] uppercase">
                      STEP 3 · SELECT HOURLY TIME SLOT
                    </span>
                    <h2 className="text-[20px] font-black mt-1.5 text-pc-text">
                      {selectedCourt.name} — Time Slots
                    </h2>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-bold text-pc-text">
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-pc-green inline-block" />{" "}
                      Selected
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full border border-[#92400e] bg-white inline-block" />{" "}
                      Available
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-300 inline-block" />{" "}
                      Booked
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {selectedCourt.slots.map((slot) => {
                    const isSelected = selectedSlot === slot.time;
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => setSelectedSlot(slot.time)}
                        className={`p-3 rounded-xl border text-left ${
                          !slot.available
                            ? "bg-[#ffe4e6]/70 border-[#fda4af] text-[#9f1239]/60 cursor-not-allowed line-through"
                            : isSelected
                            ? "pc-pill-lift bg-pc-green text-white border-pc-green shadow-md"
                            : "pc-pill-lift bg-white/95 text-pc-text border-[#e5c46b] hover:border-pc-green hover:bg-[#f0fdf4]"
                        }`}
                      >
                        <div className="font-black text-[13px]">
                          {slot.time}
                        </div>
                        <div
                          className={`text-[11px] mt-0.5 font-semibold ${
                            !slot.available
                              ? "text-[#9f1239]/60"
                              : isSelected
                              ? "text-pc-lime"
                              : "text-[#78350f]"
                          }`}
                        >
                          {!slot.available
                            ? "Reserved"
                            : slot.peak
                            ? `Peak · ₹${selectedCourt.pricePerHour}`
                            : `Standard · ₹${selectedCourt.pricePerHour}`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </FadeUp>

            {/* Step 4: Venue Facilities */}
            <FadeUp className="pc-hover-card pc-surface-violet border-2 rounded-[22px] overflow-hidden">
              <div className="h-1.5 w-full bg-gradient-to-r from-[#5b21b6] via-[#8b5cf6] to-[#ec4899]" />
              <div className="p-6">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#ede9fe] text-[#4c1d95] border border-[#c4b5fd] text-[10px] font-black tracking-[1.4px] uppercase">
                  AMENITIES & FACILITIES
                </span>
                <h2 className="text-[20px] font-black mt-1.5 mb-4 text-pc-text">
                  What this venue offers
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {venue.facilities.map((fac) => (
                    <div
                      key={fac}
                      className="group pc-hover-subcard flex items-center gap-2.5 p-3 rounded-xl bg-white/90 hover:bg-white border border-[#c5b4f3] text-[13px] font-bold text-pc-text cursor-default"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#5b21b6] group-hover:scale-110 transition-transform shrink-0" />
                      <span>{fac}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeUp>
          </div>

          {/* Right Sticky Booking Entry Summary Card */}
          <div className="pc-hover-card pc-surface-mint border-2 rounded-[24px] overflow-hidden shadow-card lg:sticky lg:top-[98px]">
            <div className="pc-hero-banner p-5">
              <span className="inline-block bg-pc-lime text-pc-deep px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-[1.4px] uppercase">
                RESERVATION SUMMARY
              </span>
              <h3 className="text-[22px] font-black text-white mt-1.5">
                Ready to lock in your slot?
              </h3>
            </div>

            <div className="p-6">
              <div className="space-y-3 text-[13px] bg-white/90 p-4 rounded-2xl border border-[#96ccb0] mb-5 shadow-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-pc-muted font-semibold">Venue</span>
                  <strong className="text-pc-text font-extrabold text-right">{venue.name}</strong>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-pc-muted font-semibold">Selected Court</span>
                  <strong className="text-pc-text font-extrabold text-right">
                    {selectedCourt.name}
                  </strong>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-pc-muted font-semibold">Sport & Surface</span>
                  <strong className="text-pc-text font-extrabold">
                    {selectedCourt.sport} · {selectedCourt.surface}
                  </strong>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-pc-muted font-semibold">Date</span>
                  <strong className="text-pc-text font-extrabold inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-pc-green" />
                    {selectedDate}
                  </strong>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-pc-muted font-semibold">Time Slot (60 mins)</span>
                  <strong className="text-pc-green font-black">
                    {selectedSlot}
                  </strong>
                </div>
                <div className="pt-3 border-t border-[#b8dac6] flex justify-between items-baseline">
                  <span className="font-extrabold text-pc-text">Standard Rate</span>
                  <strong className="text-[19px] font-black text-pc-text">
                    ₹{selectedCourt.pricePerHour}
                  </strong>
                </div>
                {creditAvailable && (
                  <div className="pt-2 flex justify-between items-center text-[#064e3b] text-[12px] font-extrabold">
                    <span className="inline-flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> With Group Atlas Credit:
                    </span>
                    <span className="bg-pc-lime text-pc-deep border border-[#b4d652] px-2.5 py-0.5 rounded-md font-black">
                      ₹0 (FREE TODAY)
                    </span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleProceedToBooking}
                className="group pc-btn-lift w-full inline-flex items-center justify-center gap-2 rounded-full bg-pc-green text-white py-3.5 px-6 text-[13px] font-extrabold hover:bg-pc-deep shadow-sm"
              >
                <span>Continue to Booking Checkout</span>
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>

              <p className="text-[11.5px] text-pc-muted font-semibold text-center mt-3.5 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-pc-green shrink-0" />
                <span>
                  Free cancellation up to 24 hours before slot start time.
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
