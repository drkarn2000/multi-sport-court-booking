"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Sparkles,
  Calendar,
  Clock,
  MapPin,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Users,
} from "lucide-react";
import { usePlayCourt } from "@/context/PlayCourtContext";
import { BookingRecord } from "@/types/playcourt";
import { FadeUp } from "@/components/ui/MotionPrimitives";

function BookingFlowContent() {
  const searchParams = useSearchParams();
  const {
    venues,
    groupMembership,
    profile,
    localDevMode,
    createBookingAsync,
    loadAvailabilityForDate,
  } = usePlayCourt();

  const initialVenueId = searchParams.get("venueId") || venues[0].id;
  const [selectedVenueId, setSelectedVenueId] = useState<string>(initialVenueId);

  const selectedVenue =
    venues.find((v) => v.id === selectedVenueId) || venues[0];

  const initialCourtId =
    searchParams.get("courtId") || selectedVenue.courts[0].id;
  const [selectedCourtId, setSelectedCourtId] = useState<string>(initialCourtId);

  const selectedCourt =
    selectedVenue.courts.find((c) => c.id === selectedCourtId) ||
    selectedVenue.courts[0];

  const [selectedDate, setSelectedDate] = useState<string>(
    searchParams.get("date") || "2026-10-29"
  );
  const [selectedSlot, setSelectedSlot] = useState<string>(
    searchParams.get("slot") ||
      selectedCourt.slots.find((s) => s.available)?.time ||
      "18:00–19:00"
  );

  // Player details form
  const [playerName, setPlayerName] = useState<string>(profile.name);
  const [playerEmail, setPlayerEmail] = useState<string>(profile.email);
  const [playerPhone, setPlayerPhone] = useState<string>(profile.phone);
  const [notes, setNotes] = useState<string>("");

  // Shared group credit eligibility
  const creditEligible =
    groupMembership.status === "Active" &&
    groupMembership.dailyCreditTotal > 0 &&
    groupMembership.dailyCreditUsed < groupMembership.dailyCreditTotal &&
    selectedVenue.participatingInCredits;

  const [useGroupCredit, setUseGroupCredit] = useState<boolean>(creditEligible);
  const [paymentOutcome, setPaymentOutcome] = useState<
    "SUCCESS" | "FAILED" | "CANCELLED"
  >("SUCCESS");
  const [paymentTxCode, setPaymentTxCode] = useState<string | undefined>(
    undefined
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmedBooking, setConfirmedBooking] =
    useState<BookingRecord | null>(null);

  // Load live court availability from SQLite whenever reservation date changes
  useEffect(() => {
    void loadAvailabilityForDate(selectedDate);
  }, [selectedDate, loadAvailabilityForDate]);

  // Sync player contact fields if profile loads from server
  useEffect(() => {
    setPlayerName(profile.name);
    setPlayerEmail(profile.email);
    setPlayerPhone(profile.phone);
  }, [profile.name, profile.email, profile.phone]);

  // Keep useGroupCredit synced whenever credit eligibility changes
  useEffect(() => {
    setUseGroupCredit(creditEligible);
  }, [creditEligible]);

  // Ensure selectedSlot stays on an available slot if current slot was just booked
  useEffect(() => {
    const currentSlotObj = selectedCourt.slots.find(
      (s) => s.time === selectedSlot
    );
    if (!currentSlotObj || !currentSlotObj.available) {
      const nextOpen = selectedCourt.slots.find((s) => s.available);
      if (nextOpen) {
        setSelectedSlot(nextOpen.time);
      }
    }
  }, [selectedCourt, selectedSlot]);

  const handleVenueChange = (newVenueId: string) => {
    setSelectedVenueId(newVenueId);
    const v = venues.find((x) => x.id === newVenueId) || venues[0];
    const firstCourt = v.courts[0];
    setSelectedCourtId(firstCourt.id);
    const openSlot = firstCourt.slots.find((s) => s.available);
    if (openSlot) setSelectedSlot(openSlot.time);
  };

  const handleCourtChange = (newCourtId: string) => {
    setSelectedCourtId(newCourtId);
    const c =
      selectedVenue.courts.find((x) => x.id === newCourtId) ||
      selectedVenue.courts[0];
    const openSlot = c.slots.find((s) => s.available);
    if (openSlot) setSelectedSlot(openSlot.time);
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!playerName.trim() || !playerEmail.trim() || !playerPhone.trim()) {
      setErrorMessage("Please enter your full name, email, and phone number.");
      return;
    }

    if (!selectedSlot) {
      setErrorMessage("Please select an available time slot.");
      return;
    }

    setIsSubmitting(true);
    const result = await createBookingAsync({
      venueId: selectedVenue.id,
      courtId: selectedCourt.id,
      date: selectedDate,
      timeSlot: selectedSlot,
      playerName: playerName.trim(),
      playerEmail: playerEmail.trim(),
      playerPhone: playerPhone.trim(),
      useGroupCredit: useGroupCredit && creditEligible,
      notes: notes.trim() || undefined,
      paymentOutcome:
        useGroupCredit && creditEligible ? "SUCCESS" : paymentOutcome,
    });
    setIsSubmitting(false);

    if (!result.ok || !result.booking) {
      setErrorMessage(
        result.error ||
          "Reservation was rejected by the server. Please choose another slot or retry."
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setPaymentTxCode(result.paymentTxCode);
    setConfirmedBooking(result.booking);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // CONFIRMATION SCREEN
  if (confirmedBooking) {
    return (
      <main className="py-12 overflow-x-hidden">
        <FadeUp className="pc-hover-card pc-surface-mint w-[min(760px,calc(100%-32px))] mx-auto border-2 rounded-[28px] overflow-hidden shadow-card">
          <div className="h-2.5 w-full bg-gradient-to-r from-[#1e503e] via-[#10b981] via-[#dff27a] to-[#f59e0b]" />
          <div className="p-7 sm:p-10">
            <div className="w-14 h-14 rounded-2xl bg-pc-green text-pc-lime grid place-items-center mb-5 hover:scale-110 hover:-rotate-3 transition-transform duration-300 shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <span className="inline-block bg-pc-green text-pc-lime px-3 py-1 rounded-full text-[10px] font-black tracking-[1.4px] uppercase">
              FRONTEND DEMO CONFIRMATION
            </span>
            <h1 className="text-[28px] sm:text-[36px] font-black tracking-[-1.4px] text-pc-text mt-2 mb-2">
              Court reservation confirmed!
            </h1>
            <p className="text-pc-muted font-medium text-[14px] leading-relaxed mb-6">
              Booking reference{" "}
              <strong className="text-pc-text font-black">{confirmedBooking.id}</strong> has
              been added to your session.{" "}
              {confirmedBooking.paidWithCredit
                ? `Your ${groupMembership.groupName} shared daily free booking credit was redeemed for today.`
                : "This is a frontend demonstration—no real payment gateway was charged."}
            </p>

            {/* Summary Grid */}
            <div className="pc-hover-subcard bg-white/95 border border-[#8cc5a6] rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px] mb-6 shadow-sm">
              <div>
                <span className="text-[11px] font-extrabold uppercase text-[#065f46] block">
                  Booking ID & Status
                </span>
                <strong className="text-pc-text text-[15px] font-black">
                  {confirmedBooking.id} · {confirmedBooking.status}
                </strong>
              </div>
              <div>
                <span className="text-[11px] font-extrabold uppercase text-[#065f46] block">
                  Venue & Location
                </span>
                <strong className="text-pc-text text-[15px] font-black">
                  {confirmedBooking.venueName}
                </strong>
                <span className="block text-pc-muted font-medium text-[11.5px]">
                  {confirmedBooking.venueArea}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-extrabold uppercase text-[#0369a1] block">
                  Court & Sport
                </span>
                <strong className="text-pc-text font-extrabold">
                  {confirmedBooking.courtName} ({confirmedBooking.sport})
                </strong>
              </div>
              <div>
                <span className="text-[11px] font-extrabold uppercase text-[#0369a1] block">
                  Date & Time Slot
                </span>
                <strong className="text-pc-green font-black">
                  {confirmedBooking.date} · {confirmedBooking.timeSlot}
                </strong>
              </div>
              <div>
                <span className="text-[11px] font-extrabold uppercase text-[#5b21b6] block">
                  Player Details
                </span>
                <strong className="text-pc-text font-extrabold">
                  {confirmedBooking.playerName}
                </strong>
                <span className="block text-pc-muted font-medium text-[11.5px]">
                  {confirmedBooking.playerEmail} · {confirmedBooking.playerPhone}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-extrabold uppercase text-[#92400e] block">
                  Amount & Payment Method
                </span>
                <strong className="text-[17px] font-black text-pc-text">
                  ₹{confirmedBooking.totalPrice}
                </strong>
                <span className="block text-[11.5px] font-extrabold text-[#065f46]">
                  {confirmedBooking.paidWithCredit
                    ? "1/1 Shared Crew Daily Credit Applied"
                    : `Simulated Local Payment (${paymentTxCode || "Paid"})`}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/bookings"
                className="group pc-btn-lift inline-flex items-center gap-1.5 rounded-full bg-pc-green text-white px-6 py-3 text-[12.5px] font-extrabold hover:bg-pc-deep"
              >
                <span>View in My Bookings</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <button
                type="button"
                onClick={() => setConfirmedBooking(null)}
                className="pc-pill-lift inline-flex items-center gap-1.5 rounded-full border-2 border-[#0369a1]/40 bg-[#e0f2fe] hover:bg-[#bae6fd] text-[#0c4a6e] px-5 py-3 text-[12.5px] font-extrabold"
              >
                <span>Book Another Court</span>
              </button>
              <Link
                href="/community"
                className="pc-pill-lift inline-flex items-center gap-1.5 rounded-full border-2 border-[#f59e0b]/50 bg-[#fef3c7] hover:bg-[#fde68a] text-[#78350f] px-5 py-3 text-[12.5px] font-extrabold"
              >
                <span>Find Players for this Slot</span>
              </Link>
            </div>
          </div>
        </FadeUp>
      </main>
    );
  }

  const effectivePrice =
    useGroupCredit && creditEligible ? 0 : selectedCourt.pricePerHour;

  return (
    <main className="py-8 overflow-x-hidden">
      <div className="w-[min(1180px,calc(100%-32px))] mx-auto">
        {/* Header Banner */}
        <FadeUp className="pc-hero-banner rounded-[26px] p-6 sm:p-8 mb-7">
          <Link
            href={`/venues/${selectedVenue.id}`}
            className="group inline-flex items-center gap-1 text-[12.5px] font-extrabold text-pc-lime hover:underline mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to {selectedVenue.name}</span>
          </Link>
          <span className="block text-[10px] font-black tracking-[1.7px] text-[#bae6fd] uppercase">
            COURT RESERVATION CHECKOUT
          </span>
          <h1 className="text-[clamp(28px,3.6vw,42px)] font-black tracking-[-1.6px] text-white mt-1">
            Complete your court booking
          </h1>
          <p className="text-[#e1f2e9] text-[14px]">
            Confirm your venue, court, time slot, and shared group membership
            credit option below.
          </p>
        </FadeUp>

        {errorMessage && (
          <div className="mb-6 bg-[#ffe4e6] border-2 border-[#f43f5e] text-[#881337] px-4 py-3.5 rounded-2xl flex items-center gap-2.5 text-[13px] font-bold shadow-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form
          onSubmit={handleConfirmBooking}
          className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-7 items-start"
        >
          {/* Left Column: Booking Configuration */}
          <div className="space-y-6">
            {/* 1. Venue & Court Selection */}
            <FadeUp className="pc-hover-card pc-surface-mint border-2 rounded-[22px] overflow-hidden">
              <div className="h-1.5 w-full bg-gradient-to-r from-[#1e503e] via-[#10b981] to-[#a3e635]" />
              <div className="p-6">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#d1fae5] text-[#065f46] border border-[#6ee7b7] text-[10px] font-black tracking-[1.4px] uppercase">
                  1 · VENUE & COURT
                </span>
                <h2 className="text-[19px] font-black mt-1.5 mb-4 text-pc-text">
                  Selected Playing Space
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11.5px] font-extrabold text-pc-text mb-1.5">
                      Select Venue
                    </label>
                    <select
                      value={selectedVenue.id}
                      onChange={(e) => handleVenueChange(e.target.value)}
                      className="w-full p-3 rounded-xl border border-[#8cc5a6] bg-white text-[13px] font-bold text-pc-text focus:outline-none focus:border-pc-green cursor-pointer"
                    >
                      {venues.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name} ({v.area}, {v.city})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11.5px] font-extrabold text-pc-text mb-1.5">
                      Select Court
                    </label>
                    <select
                      value={selectedCourt.id}
                      onChange={(e) => handleCourtChange(e.target.value)}
                      className="w-full p-3 rounded-xl border border-[#8cc5a6] bg-white text-[13px] font-bold text-pc-text focus:outline-none focus:border-pc-green cursor-pointer"
                    >
                      {selectedVenue.courts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} — ₹{c.pricePerHour}/hr
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </FadeUp>

            {/* 2. Date & Available Time Slots */}
            <FadeUp className="pc-hover-card pc-surface-sky border-2 rounded-[22px] overflow-hidden">
              <div className="h-1.5 w-full bg-gradient-to-r from-[#0369a1] via-[#06b6d4] to-[#2dd4bf]" />
              <div className="p-6">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#dbeafe] text-[#1e3a8a] border border-[#93c5fd] text-[10px] font-black tracking-[1.4px] uppercase">
                  2 · DATE & TIME SLOT
                </span>
                <h2 className="text-[19px] font-black mt-1.5 mb-4 text-pc-text">
                  Choose Date & Available Slot
                </h2>

                <div className="mb-4 max-w-xs">
                  <label className="block text-[11.5px] font-extrabold text-pc-text mb-1.5">
                    Reservation Date
                  </label>
                  <input
                    type="date"
                    required
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#8dc7e8] bg-white text-[13px] font-bold text-pc-text focus:outline-none focus:border-pc-green cursor-pointer"
                  />
                </div>

                <label className="block text-[11.5px] font-extrabold text-pc-text mb-2">
                  Available 60-Minute Time Slots ({selectedCourt.name})
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {selectedCourt.slots.map((slot) => {
                    const active = selectedSlot === slot.time;
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => setSelectedSlot(slot.time)}
                        className={`p-3 rounded-xl border text-left ${
                          !slot.available
                            ? "bg-[#ffe4e6]/70 border-[#fda4af] text-[#9f1239]/60 cursor-not-allowed line-through"
                            : active
                            ? "pc-pill-lift bg-pc-green text-white border-pc-green shadow-md"
                            : "pc-pill-lift bg-white/95 text-pc-text border-[#8dc7e8] hover:border-pc-green hover:bg-white"
                        }`}
                      >
                        <div className="text-[13px] font-black">
                          {slot.time}
                        </div>
                        <div
                          className={`text-[11px] font-semibold ${
                            !slot.available
                              ? "text-[#9f1239]/60"
                              : active
                              ? "text-pc-lime"
                              : "text-[#075985]"
                          }`}
                        >
                          {!slot.available
                            ? "Booked"
                            : `₹${selectedCourt.pricePerHour}`}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </FadeUp>

            {/* 3. Group Membership Shared Credit Option */}
            <FadeUp className="pc-hover-card pc-surface-amber border-2 rounded-[22px] overflow-hidden">
              <div className="h-1.5 w-full bg-gradient-to-r from-[#b45309] via-[#f59e0b] to-[#dff27a]" />
              <div className="p-6">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#fef3c7] text-[#78350f] border border-[#fcd34d] text-[10px] font-black tracking-[1.4px] uppercase">
                    3 · SHARED CREW CREDIT ELIGIBILITY
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-pc-green text-pc-lime text-[11px] font-extrabold">
                    <Users className="w-3.5 h-3.5" />
                    {groupMembership.groupName} ({groupMembership.members.length}/4
                    Linked)
                  </span>
                </div>
                <h2 className="text-[19px] font-black mb-3 text-pc-text">
                  Daily Group Booking Credit
                </h2>

                {creditEligible ? (
                  <div className="pc-hover-subcard pc-surface-lime border-2 rounded-2xl p-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useGroupCredit}
                        onChange={(e) => setUseGroupCredit(e.target.checked)}
                        className="mt-1 w-4 h-4 accent-pc-green rounded"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <strong className="text-[14px] font-extrabold text-pc-text flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-pc-green" />
                            Redeem 1/1 Shared Daily Credit (Save ₹
                            {selectedCourt.pricePerHour})
                          </strong>
                          <span className="bg-pc-green text-pc-lime px-2.5 py-0.5 rounded-full text-[10.5px] font-black">
                            ELIGIBLE
                          </span>
                        </div>
                        <p className="text-[12px] text-pc-muted font-medium mt-1 leading-relaxed">
                          Your group ({groupMembership.groupName}) shares 1 free
                          court booking credit per day across up to 4 linked
                          player accounts. Once redeemed today, additional
                          bookings by any member revert to standard paid rates.
                        </p>
                      </div>
                    </label>
                  </div>
                ) : (
                  <div className="pc-hover-subcard bg-white/95 border border-[#e5c46b] rounded-2xl p-4">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <strong className="text-[13.5px] font-extrabold text-pc-text">
                        0 of 1 Shared Daily Credit Remaining Today
                      </strong>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#ffedd5] text-[#7c2d12] border border-[#fdba74] text-[10.5px] font-extrabold">
                        CREDIT USED TODAY
                      </span>
                    </div>
                    <p className="text-[12px] text-pc-muted font-medium leading-relaxed">
                      {groupMembership.creditUsedBy
                        ? `Today's shared group credit was already redeemed by ${groupMembership.creditUsedBy} at ${groupMembership.creditUsedVenue} (${groupMembership.creditUsedTime}). `
                        : "Today's shared credit is unavailable. "}
                      You can proceed with a standard paid reservation below (₹
                      {selectedCourt.pricePerHour}).
                    </p>
                  </div>
                )}
              </div>
            </FadeUp>

            {/* 4. Player Details */}
            <FadeUp className="pc-hover-card pc-surface-violet border-2 rounded-[22px] overflow-hidden">
              <div className="h-1.5 w-full bg-gradient-to-r from-[#5b21b6] via-[#8b5cf6] to-[#ec4899]" />
              <div className="p-6">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#ede9fe] text-[#4c1d95] border border-[#c4b5fd] text-[10px] font-black tracking-[1.4px] uppercase">
                  4 · PLAYER DETAILS
                </span>
                <h2 className="text-[19px] font-black mt-1.5 mb-4 text-pc-text">
                  Primary Player Contact
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11.5px] font-extrabold text-pc-text mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Enter player name"
                      className="w-full p-3 rounded-xl border border-[#c5b4f3] bg-white text-[13px] font-medium focus:outline-none focus:border-pc-green"
                    />
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-extrabold text-pc-text mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={playerEmail}
                      onChange={(e) => setPlayerEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full p-3 rounded-xl border border-[#c5b4f3] bg-white text-[13px] font-medium focus:outline-none focus:border-pc-green"
                    />
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-extrabold text-pc-text mb-1.5">
                      Phone Number (SMS updates) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={playerPhone}
                      onChange={(e) => setPlayerPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full p-3 rounded-xl border border-[#c5b4f3] bg-white text-[13px] font-medium focus:outline-none focus:border-pc-green"
                    />
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-extrabold text-pc-text mb-1.5">
                      Notes / Equipment Rental (Optional)
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g., Need 2 rental racquets"
                      className="w-full p-3 rounded-xl border border-[#c5b4f3] bg-white text-[13px] font-medium focus:outline-none focus:border-pc-green"
                    />
                  </div>
                </div>
              </div>
            </FadeUp>
          </div>

          {/* Right Column: Sticky Booking Summary */}
          <div className="pc-hover-card pc-surface-mint border-2 rounded-[24px] overflow-hidden shadow-card lg:sticky lg:top-[98px]">
            <div className="pc-hero-banner p-5">
              <span className="inline-block bg-pc-lime text-pc-deep px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-[1.4px] uppercase">
                BOOKING SUMMARY
              </span>
              <h3 className="text-[22px] font-black text-white mt-1.5">
                Review your reservation
              </h3>
            </div>

            <div className="p-6">
              <div className="group flex items-center gap-3.5 pb-4 mb-4 border-b border-[#9ed4b3]">
                <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border-2 border-pc-green/40">
                  <img
                    src={selectedVenue.image}
                    alt={selectedVenue.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div>
                  <h4 className="font-extrabold text-[15px] text-pc-text group-hover:text-pc-green transition-colors">
                    {selectedVenue.name}
                  </h4>
                  <p className="text-[12px] text-pc-muted font-medium flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-pc-green" />
                    {selectedVenue.area} · {selectedVenue.city}
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-[13px] bg-white/90 p-4 rounded-2xl border border-[#96ccb0] mb-5 shadow-sm">
                <div className="flex justify-between">
                  <span className="text-pc-muted font-semibold">Court</span>
                  <strong className="text-pc-text font-extrabold text-right">
                    {selectedCourt.name}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-pc-muted font-semibold">Sport & Surface</span>
                  <strong className="text-pc-text font-extrabold">
                    {selectedCourt.sport} · {selectedCourt.surface}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-pc-muted font-semibold">Date</span>
                  <strong className="text-pc-text font-extrabold inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-pc-green" />
                    {selectedDate}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-pc-muted font-semibold">Time Slot</span>
                  <strong className="text-pc-green font-black inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {selectedSlot} (60 mins)
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-pc-muted font-semibold">Player</span>
                  <strong className="text-pc-text font-extrabold">
                    {playerName || "Not entered"}
                  </strong>
                </div>

                <div className="border-t border-[#b8dac6] pt-3 space-y-2">
                  <div className="flex justify-between text-pc-muted font-semibold">
                    <span>Court Hourly Fee</span>
                    <span>₹{selectedCourt.pricePerHour}</span>
                  </div>
                  {useGroupCredit && creditEligible && (
                    <div className="flex justify-between text-[#065f46] font-extrabold">
                      <span>Shared Crew Daily Credit (1/1)</span>
                      <span>- ₹{selectedCourt.pricePerHour}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline pt-2 border-t border-[#b8dac6]">
                    <span className="font-extrabold text-[14px] text-pc-text">
                      Total Payable (Demo)
                    </span>
                    <strong className="text-[24px] font-black text-pc-text">
                      ₹{effectivePrice}
                    </strong>
                  </div>
                </div>
              </div>

              {effectivePrice > 0 && localDevMode && (
                <div className="pc-hover-subcard mb-4 p-3.5 rounded-2xl bg-[#fef3c7] border border-[#f59e0b]/60 space-y-2 text-[12px]">
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-[#78350f] text-[11px] uppercase tracking-wider font-black">
                      Simulated Payment Sandbox (Local Only)
                    </strong>
                    <span className="px-2 py-0.5 rounded-full bg-white text-[#92400e] text-[10px] font-extrabold">
                      NO REAL CHARGE
                    </span>
                  </div>
                  <select
                    value={paymentOutcome}
                    onChange={(e) =>
                      setPaymentOutcome(
                        e.target.value as "SUCCESS" | "FAILED" | "CANCELLED"
                      )
                    }
                    aria-label="Simulated Payment Outcome"
                    className="w-full p-2.5 rounded-xl border border-[#d9b45b] bg-white text-[12px] font-bold text-pc-text cursor-pointer"
                  >
                    <option value="SUCCESS">
                      Simulate Success (Paid receipt + Confirm slot)
                    </option>
                    <option value="FAILED">
                      Simulate Bank Failure (402 Decline + Log Failed TX)
                    </option>
                    <option value="CANCELLED">
                      Simulate Checkout Cancelled (Abort without booking)
                    </option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="pc-btn-lift w-full rounded-full bg-pc-green text-white py-3.5 px-6 text-[13px] font-extrabold hover:bg-pc-deep disabled:opacity-60 shadow-sm"
              >
                {isSubmitting
                  ? "Confirming reservation..."
                  : useGroupCredit && creditEligible
                  ? "Confirm with Free Group Credit →"
                  : `Confirm Demo Booking (₹${effectivePrice}) →`}
              </button>

              <div className="pc-hover-subcard mt-4 bg-white/85 border border-[#96ccb0] rounded-xl p-3 text-[11px] text-pc-muted font-medium flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-pc-green shrink-0 mt-0.5" />
                <span>
                  <strong className="text-pc-text">Frontend Demo Mode:</strong> Clicking confirm creates an
                  interactive booking in your session and updates your group
                  credit state. No live payment is processed.
                </span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}

export default function BookingPage() {
  return (
    <Suspense
      fallback={
        <div className="w-[min(1180px,calc(100%-32px))] mx-auto py-16 text-center text-pc-text font-bold">
          Complete your court booking...
        </div>
      }
    >
      <BookingFlowContent />
    </Suspense>
  );
}
