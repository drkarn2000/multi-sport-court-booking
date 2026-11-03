"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  X,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";
import { usePlayCourt } from "@/context/PlayCourtContext";
import { BookingRecord } from "@/types/playcourt";
import { FadeUp } from "@/components/ui/MotionPrimitives";
import { getSportTheme } from "@/lib/sportColors";

export default function MyBookingsPage() {
  const { bookings, requestCancelBooking } = usePlayCourt();

  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [detailBooking, setDetailBooking] = useState<BookingRecord | null>(null);
  const [cancelBookingTarget, setCancelBookingTarget] =
    useState<BookingRecord | null>(null);
  const [cancelReason, setCancelReason] = useState<string>(
    "Schedule change / rain forecast"
  );

  const upcomingList = bookings.filter(
    (b) =>
      b.status === "Upcoming" ||
      b.status === "Confirmed" ||
      b.status === "Cancellation Requested"
  );
  const pastList = bookings.filter(
    (b) => b.status === "Completed" || b.status === "Cancelled"
  );

  const displayedList = tab === "upcoming" ? upcomingList : pastList;

  const handleConfirmCancellation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelBookingTarget) return;
    requestCancelBooking(cancelBookingTarget.id, cancelReason);
    setCancelBookingTarget(null);
  };

  return (
    <main className="py-9 overflow-x-hidden">
      <div className="w-[min(1180px,calc(100%-32px))] mx-auto">
        {/* Header Banner */}
        <FadeUp className="pc-hero-banner rounded-[26px] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
          <div>
            <div className="text-[#cfe5d9] text-[12px] mb-1.5 font-medium">
              <Link href="/" className="hover:text-pc-lime hover:underline">
                Home
              </Link>{" "}
              /{" "}
              <Link href="/profile" className="hover:text-pc-lime hover:underline">
                Profile
              </Link>{" "}
              / <span className="text-pc-lime font-bold">My Bookings</span>
            </div>
            <span className="inline-block bg-pc-lime text-pc-deep px-3 py-0.5 rounded-full text-[10px] font-black tracking-[1.5px] uppercase">
              RESERVATION LEDGER
            </span>
            <h1 className="text-[clamp(28px,3.6vw,42px)] font-black tracking-[-1.6px] text-white mt-2">
              My court bookings
            </h1>
            <p className="text-[#e1f2e9] text-[14px]">
              Review upcoming sessions, inspect shared credit usage, or submit a
              cancellation request.
            </p>
          </div>

          <Link
            href="/booking"
            className="group pc-btn-lift inline-flex items-center gap-1.5 rounded-full bg-pc-lime text-pc-deep px-5 py-3 text-[12.5px] font-black hover:bg-[#e8f88c] shrink-0"
          >
            <span>Book a new court</span>
            <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </FadeUp>

        {/* Tabs */}
        <FadeUp className="flex items-center gap-2.5 mb-6 border-b border-[#9fd4b3] pb-3.5">
          <button
            type="button"
            onClick={() => setTab("upcoming")}
            className={`pc-pill-lift px-5 py-2.5 rounded-full text-[12.5px] font-extrabold ${
              tab === "upcoming"
                ? "bg-pc-green text-pc-lime shadow-sm"
                : "bg-white/95 border border-[#8cc5a6] text-pc-text hover:bg-[#dcfce7]"
            }`}
          >
            Upcoming & Active ({upcomingList.length})
          </button>
          <button
            type="button"
            onClick={() => setTab("past")}
            className={`pc-pill-lift px-5 py-2.5 rounded-full text-[12.5px] font-extrabold ${
              tab === "past"
                ? "bg-[#92400e] text-white shadow-sm"
                : "bg-[#fef3c7] border border-[#fcd34d] text-[#78350f] hover:bg-[#fde68a]"
            }`}
          >
            Past & Completed ({pastList.length})
          </button>
        </FadeUp>

        {/* Bookings List */}
        {displayedList.length > 0 ? (
          <div className="space-y-4">
            {displayedList.map((b) => {
              const isCancelRequested = b.status === "Cancellation Requested";
              const st = getSportTheme(b.sport);
              return (
                <FadeUp key={b.id}>
                  <article
                    className={`group pc-hover-card border-2 rounded-[22px] overflow-hidden ${st.cardBg}`}
                  >
                    <div className={`h-1.5 w-full ${st.ribbon}`} />
                    <div className="p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-pc-green text-pc-lime text-[11.5px] font-black">
                            {b.id}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold border ${
                              isCancelRequested
                                ? "bg-[#fef3c7] text-[#78350f] border-[#fcd34d]"
                                : b.status === "Completed"
                                ? "bg-[#ede9fe] text-[#4c1d95] border-[#c4b5fd]"
                                : "bg-[#dcfce7] text-[#064e3b] border-[#6ee7b7]"
                            }`}
                          >
                            {b.status}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${st.pill}`}
                          >
                            {b.sport}
                          </span>
                          {b.paidWithCredit && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-pc-lime text-pc-deep border border-[#b5d656] text-[10.5px] font-black">
                              <Sparkles className="w-3 h-3" />
                              1/1 Shared Crew Credit
                            </span>
                          )}
                        </div>

                        <h2 className="text-[19px] font-black text-pc-text group-hover:text-pc-green transition-colors">
                          {b.venueName} — {b.courtName}
                        </h2>

                        <div className="flex flex-wrap items-center gap-4 text-[12.5px] text-pc-muted font-medium">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-pc-green" />
                            {b.venueArea}
                          </span>
                          <span className="inline-flex items-center gap-1 font-extrabold text-pc-text">
                            <Calendar className="w-3.5 h-3.5 text-[#0369a1]" />
                            {b.date}
                          </span>
                          <span className="inline-flex items-center gap-1 font-extrabold text-pc-text">
                            <Clock className="w-3.5 h-3.5 text-pc-green" />
                            {b.timeSlot} ({b.durationMinutes} mins)
                          </span>
                        </div>

                        {b.notes && (
                          <p className="text-[12px] text-pc-muted font-medium italic">
                            Note: {b.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap sm:flex-nowrap items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-black/10 shrink-0">
                        <div className="mr-3">
                          <span className="text-[10.5px] font-extrabold uppercase text-pc-muted block">
                            Amount Paid
                          </span>
                          <strong className="text-[19px] font-black text-pc-text">
                            ₹{b.totalPrice}
                          </strong>
                        </div>

                        <button
                          type="button"
                          onClick={() => setDetailBooking(b)}
                          className="pc-pill-lift px-4 py-2.5 rounded-full border border-[#8cc5a6] text-[12px] font-extrabold text-pc-text hover:border-pc-green bg-white/95"
                        >
                          View Details
                        </button>

                        {tab === "upcoming" && !isCancelRequested && (
                          <button
                            type="button"
                            onClick={() => setCancelBookingTarget(b)}
                            className="pc-pill-lift px-4 py-2.5 rounded-full border border-[#fda4af] bg-[#ffe4e6] text-[#881337] text-[12px] font-extrabold hover:bg-[#fecdd3]"
                          >
                            Request Cancellation
                          </button>
                        )}

                        {tab === "past" && (
                          <Link
                            href={`/booking?venueId=${b.venueId}&courtId=${b.courtId}`}
                            className="pc-btn-lift px-4 py-2.5 rounded-full bg-pc-green text-white text-[12px] font-extrabold hover:bg-pc-deep"
                          >
                            Book Again ↗
                          </Link>
                        )}
                      </div>
                    </div>
                  </article>
                </FadeUp>
              );
            })}
          </div>
        ) : (
          <FadeUp className="pc-hover-card pc-surface-amber border-2 rounded-[24px] p-12 text-center">
            <p className="text-pc-text font-semibold text-[14px] mb-4">
              No {tab} bookings found in your demo session.
            </p>
            <Link
              href="/venues"
              className="group pc-btn-lift inline-flex items-center gap-1.5 rounded-full bg-pc-green text-white px-5 py-2.5 text-[12.5px] font-extrabold hover:bg-pc-deep"
            >
              <span>Explore Courts</span>
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </FadeUp>
        )}
      </div>

      {/* BOOKING DETAIL MODAL */}
      {detailBooking && (
        <div
          className="fixed inset-0 z-50 bg-[#0b2118]/75 backdrop-blur-[2px] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDetailBooking(null);
          }}
        >
          <div className="pc-modal-pop pc-surface-mint border-2 rounded-[24px] p-6 sm:p-7 w-[min(520px,100%)] relative shadow-2xl">
            <button
              type="button"
              onClick={() => setDetailBooking(null)}
              className="absolute right-4 top-4 p-2 rounded-full bg-white/80 hover:bg-white hover:rotate-90 transition-all text-pc-text"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="inline-block px-2.5 py-0.5 rounded-full bg-pc-green text-pc-lime text-[10px] font-black tracking-[1.4px] uppercase">
              BOOKING RECEIPT · {detailBooking.id}
            </span>
            <h2 className="text-[22px] font-black text-pc-text mt-2 mb-4">
              {detailBooking.venueName}
            </h2>

            <div className="pc-hover-subcard bg-white/95 border border-[#8cc5a6] rounded-2xl p-4 space-y-2.5 text-[13px] mb-5">
              <div className="flex justify-between">
                <span className="text-pc-muted font-semibold">Status</span>
                <strong className="text-pc-green font-black">{detailBooking.status}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-pc-muted font-semibold">Court</span>
                <strong className="text-pc-text">{detailBooking.courtName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-pc-muted font-semibold">Sport</span>
                <strong className="text-pc-text">{detailBooking.sport}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-pc-muted font-semibold">Date & Time</span>
                <strong className="text-pc-text">
                  {detailBooking.date} · {detailBooking.timeSlot}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-pc-muted font-semibold">Player</span>
                <strong className="text-pc-text">
                  {detailBooking.playerName} ({detailBooking.playerPhone})
                </strong>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#b8dac6]">
                <span className="font-extrabold text-pc-text">Total Paid</span>
                <strong className="text-[16px] font-black text-pc-text">
                  ₹{detailBooking.totalPrice}{" "}
                  {detailBooking.paidWithCredit ? "(Crew Credit)" : ""}
                </strong>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDetailBooking(null)}
                className="pc-btn-lift px-5 py-2.5 rounded-full bg-pc-green hover:bg-pc-deep text-white text-[12px] font-extrabold"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCELLATION REQUEST MODAL */}
      {cancelBookingTarget && (
        <div
          className="fixed inset-0 z-50 bg-[#0b2118]/75 backdrop-blur-[2px] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setCancelBookingTarget(null);
          }}
        >
          <div className="pc-modal-pop pc-surface-amber border-2 rounded-[24px] p-6 sm:p-7 w-[min(500px,100%)] relative shadow-2xl">
            <button
              type="button"
              onClick={() => setCancelBookingTarget(null)}
              className="absolute right-4 top-4 p-2 rounded-full bg-white/80 hover:bg-white hover:rotate-90 transition-all text-pc-text"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-11 h-11 rounded-2xl bg-[#92400e] text-[#fef3c7] grid place-items-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h2 className="text-[22px] font-black text-pc-text mb-1">
              Request booking cancellation?
            </h2>
            <p className="text-[12.5px] text-pc-muted font-medium mb-4">
              You are requesting to cancel{" "}
              <strong className="text-pc-text font-extrabold">
                {cancelBookingTarget.id}
              </strong>{" "}
              at {cancelBookingTarget.venueName} ({cancelBookingTarget.date} ·{" "}
              {cancelBookingTarget.timeSlot}).
              {cancelBookingTarget.paidWithCredit &&
                " Once approved, your Group Atlas daily credit will be restored."}
            </p>

            <form onSubmit={handleConfirmCancellation} className="space-y-4">
              <div>
                <label className="block text-[11.5px] font-extrabold text-pc-text mb-1.5">
                  Reason for cancellation
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#d9b45b] bg-white text-[13px] font-bold text-pc-text cursor-pointer"
                >
                  <option>Schedule change / rain forecast</option>
                  <option>Partner unavailable for doubles</option>
                  <option>Booked wrong time slot or venue</option>
                  <option>Minor injury / recovery</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setCancelBookingTarget(null)}
                  className="pc-pill-lift px-4 py-2.5 rounded-full border border-[#d9b45b] bg-white text-[12px] font-extrabold text-pc-text"
                >
                  Keep Booking
                </button>
                <button
                  type="submit"
                  className="pc-btn-lift px-5 py-2.5 rounded-full bg-red-600 text-white text-[12px] font-extrabold hover:bg-red-700"
                >
                  Submit Cancellation Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
