"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  X,
  FileText,
} from "lucide-react";
import { usePlayCourt } from "@/context/PlayCourtContext";
import { FadeUp } from "@/components/ui/MotionPrimitives";

type PolicyType = "cancellation" | "rules" | "privacy" | null;

export function Footer() {
  const pathname = usePathname();
  const { showToast } = usePlayCourt();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [activePolicy, setActivePolicy] = useState<PolicyType>(null);

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) return;
    setSubscribed(true);
    showToast("Thank you for subscribing to PlayCourt weekly match alerts!");
  };

  return (
    <>
      <footer className="bg-[#0b241a] text-white mt-20 pb-8 border-t border-emerald-950/60 relative overflow-hidden">
        {/* Subtle multi-sport accent top stripe */}
        <div className="h-[3px] w-full bg-gradient-to-r from-[#10b981] via-[#dff27a] via-[#38bdf8] to-[#f59e0b]" />

        <div className="w-[min(1200px,calc(100%-32px))] mx-auto pt-14 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
            {/* Col 1: Brand & Regional Coverage (Takes 2 cols on lg) */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <Link
                href="/"
                className="group text-[23px] font-black tracking-[-0.8px] text-white inline-flex items-center gap-2.5 w-fit"
              >
                <span className="bg-pc-lime text-pc-deep w-9 h-9 rounded-xl grid place-items-center text-lg font-black shadow-sm transition-transform duration-300 group-hover:scale-105">
                  P
                </span>
                <span className="transition-colors duration-200 group-hover:text-pc-lime">
                  playcourt
                </span>
              </Link>

              <p className="text-[#c1d9cb] text-[13px] leading-[1.75] max-w-sm">
                The premier multi-sport court booking and community network across
                Chandigarh, Mohali & Zirakpur. Instant reservations, verified
                venues, and open crew matches.
              </p>

              {/* Operating Tricity Coverage */}
              <div className="flex items-center gap-2 text-[12px] text-[#a5c7b3] font-medium mt-1">
                <MapPin className="w-3.5 h-3.5 text-pc-lime shrink-0" />
                <span>Chandigarh · Mohali · Zirakpur</span>
              </div>

              {/* Direct Sport Filters */}
              <div className="pt-2">
                <div className="text-[11px] font-bold text-white/60 uppercase tracking-wider mb-2">
                  Browse by Sport
                </div>
                <div className="flex flex-wrap gap-1.5 text-xs font-bold">
                  {[
                    { name: "Tennis", color: "hover:bg-emerald-500/20 text-emerald-300 border-emerald-600/30" },
                    { name: "Padel", color: "hover:bg-sky-500/20 text-sky-300 border-sky-600/30" },
                    { name: "Badminton", color: "hover:bg-amber-500/20 text-amber-300 border-amber-600/30" },
                    { name: "Squash", color: "hover:bg-purple-500/20 text-purple-300 border-purple-600/30" },
                  ].map((s) => (
                    <Link
                      key={s.name}
                      href={`/venues?sport=${s.name}`}
                      className={`px-3 py-1 rounded-full border bg-white/5 transition-all duration-200 ${s.color}`}
                    >
                      {s.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Col 2: Venues & Courts */}
            <div>
              <h4 className="text-[11.5px] font-black text-pc-lime tracking-[1px] uppercase mb-4">
                Courts & Venues
              </h4>
              <ul className="space-y-2.5 text-[#cadccd] text-[13px]">
                <li>
                  <Link
                    href="/venues"
                    className="hover:text-white hover:translate-x-1 inline-block transition-transform duration-200"
                  >
                    Find Courts
                  </Link>
                </li>
                <li>
                  <Link
                    href="/venues?sport=Tennis"
                    className="hover:text-white hover:translate-x-1 inline-block transition-transform duration-200"
                  >
                    Tennis Courts
                  </Link>
                </li>
                <li>
                  <Link
                    href="/venues?sport=Padel"
                    className="hover:text-white hover:translate-x-1 inline-block transition-transform duration-200"
                  >
                    Padel Courts
                  </Link>
                </li>
                <li>
                  <Link
                    href="/venues?sport=Badminton"
                    className="hover:text-white hover:translate-x-1 inline-block transition-transform duration-200"
                  >
                    Badminton Courts
                  </Link>
                </li>
                <li>
                  <Link
                    href="/venues?sport=Squash"
                    className="hover:text-white hover:translate-x-1 inline-block transition-transform duration-200"
                  >
                    Squash Courts
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 3: Community & Memberships */}
            <div>
              <h4 className="text-[11.5px] font-black text-[#7dd3fc] tracking-[1px] uppercase mb-4">
                Community & Plans
              </h4>
              <ul className="space-y-2.5 text-[#cadccd] text-[13px]">
                <li>
                  <Link
                    href="/community"
                    className="hover:text-white hover:translate-x-1 inline-block transition-transform duration-200"
                  >
                    Open Community Matches
                  </Link>
                </li>
                <li>
                  <Link
                    href="/events"
                    className="hover:text-white hover:translate-x-1 inline-block transition-transform duration-200"
                  >
                    Tournaments & Events
                  </Link>
                </li>
                <li>
                  <Link
                    href="/memberships"
                    className="hover:text-white hover:translate-x-1 inline-block transition-transform duration-200"
                  >
                    Membership Plans
                  </Link>
                </li>
                <li>
                  <Link
                    href="/memberships"
                    className="hover:text-white hover:translate-x-1 inline-block transition-transform duration-200"
                  >
                    Shared Crew Credits
                  </Link>
                </li>
                <li>
                  <Link
                    href="/profile"
                    className="hover:text-white hover:translate-x-1 inline-block transition-transform duration-200"
                  >
                    Player Profile
                  </Link>
                </li>
              </ul>
            </div>

            {/* Col 4: Newsletter & Support */}
            <div>
              <h4 className="text-[11.5px] font-black text-[#fcd34d] tracking-[1px] uppercase mb-4">
                Stay Updated
              </h4>
              <p className="text-[#c1d9cb] text-[12.5px] leading-relaxed mb-3">
                Get notified about newly opened court slots and weekend tournaments.
              </p>

              <form onSubmit={handleSubscribe} className="space-y-2">
                <div className="flex gap-1.5">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="min-w-0 w-full px-3 py-2 rounded-xl border border-white/20 bg-white/10 text-white placeholder:text-white/50 text-[12.5px] focus:outline-none focus:border-pc-lime transition"
                  />
                  <button
                    type="submit"
                    aria-label="Subscribe"
                    className="rounded-xl bg-pc-lime text-pc-deep px-3 font-bold hover:bg-[#ecfaa0] flex items-center justify-center transition shrink-0"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
                {subscribed ? (
                  <p className="text-pc-lime text-[11.5px] font-semibold flex items-center gap-1.5 pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Subscribed to match alerts!
                  </p>
                ) : null}
              </form>

              <div className="pt-4 border-t border-white/10 mt-4 space-y-1.5 text-[12px] text-[#a5c7b3]">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-pc-lime shrink-0" />
                  <span>Support: 06:00 AM – 10:30 PM</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-pc-lime shrink-0" />
                  <a
                    href="mailto:support@playcourt.in"
                    className="hover:text-white underline underline-offset-2 transition"
                  >
                    support@playcourt.in
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar: Policies & Copyright */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[#a5c7b3] text-[12px]">
            <div>
              © 2026 PlayCourt Technologies. All rights reserved.
            </div>

            <div className="flex items-center gap-4 flex-wrap justify-center">
              <button
                type="button"
                onClick={() => setActivePolicy("cancellation")}
                className="hover:text-white transition underline underline-offset-4"
              >
                Cancellation & Refund Policy
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => setActivePolicy("rules")}
                className="hover:text-white transition underline underline-offset-4"
              >
                Court Guidelines
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={() => setActivePolicy("privacy")}
                className="hover:text-white transition underline underline-offset-4"
              >
                Privacy Policy
              </button>
              <span>·</span>
              <Link
                href="/admin"
                className="text-white/40 hover:text-white/80 transition text-[11px]"
                title="Operations Console"
              >
                Staff Portal
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Interactive Policy & Guidelines Modal */}
      {activePolicy && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setActivePolicy(null)}
        >
          <div
            className="bg-[#0f2e21] border border-emerald-600/40 text-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setActivePolicy(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-white/10 text-white/70 hover:text-white hover:bg-white/20 transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {activePolicy === "cancellation" && (
              <div>
                <div className="flex items-center gap-2.5 text-pc-lime mb-3">
                  <ShieldCheck className="w-5 h-5" />
                  <h3 className="text-lg font-black tracking-tight">
                    Cancellation & Refund Policy
                  </h3>
                </div>
                <div className="space-y-3 text-[13px] text-[#d2e7db] leading-relaxed">
                  <p>
                    <strong className="text-white">24-Hour Free Cancellation:</strong> Cancel any confirmed court booking up to 24 hours prior to the slot start time for a 100% full refund or immediate crew credit restoration.
                  </p>
                  <p>
                    <strong className="text-white">Late Cancellations:</strong> Cancellations made within 24 hours of start time are subject to venue review or emergency weather verification.
                  </p>
                  <p>
                    <strong className="text-white">Weather Guarantee:</strong> If outdoor clay or hard court play is disrupted due to rain or extreme weather conditions verified by the venue manager, a full credit voucher is automatically issued.
                  </p>
                </div>
              </div>
            )}

            {activePolicy === "rules" && (
              <div>
                <div className="flex items-center gap-2.5 text-[#7dd3fc] mb-3">
                  <FileText className="w-5 h-5" />
                  <h3 className="text-lg font-black tracking-tight">
                    Court Guidelines & Standards
                  </h3>
                </div>
                <div className="space-y-3 text-[13px] text-[#d2e7db] leading-relaxed">
                  <p>
                    <strong className="text-white">Footwear Requirements:</strong> Non-marking sports shoes are strictly mandatory for all indoor synthetic and wooden courts (Badminton, Squash, and Indoor Padel).
                  </p>
                  <p>
                    <strong className="text-white">Punctuality:</strong> Please arrive 10 minutes prior to your scheduled time slot. Courts must be cleared on the hour to respect subsequent reservations.
                  </p>
                  <p>
                    <strong className="text-white">Equipment Rental:</strong> Racquets, padel bats, and balls are available at all partner pro-shops at nominal rental rates.
                  </p>
                </div>
              </div>
            )}

            {activePolicy === "privacy" && (
              <div>
                <div className="flex items-center gap-2.5 text-pc-lime mb-3">
                  <ShieldCheck className="w-5 h-5" />
                  <h3 className="text-lg font-black tracking-tight">
                    Privacy Policy
                  </h3>
                </div>
                <div className="space-y-3 text-[13px] text-[#d2e7db] leading-relaxed">
                  <p>
                    <strong className="text-white">Data Protection:</strong> PlayCourt only collects your mobile number and name to manage court bookings and open match match-ups.
                  </p>
                  <p>
                    <strong className="text-white">Passwordless Security:</strong> We utilize secure OTP-based mobile authentication without storing sensitive static passwords.
                  </p>
                  <p>
                    <strong className="text-white">Zero Third-Party Sharing:</strong> Your personal contact details are never sold, rented, or shared with commercial marketing agencies.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-white/15 flex justify-end">
              <button
                type="button"
                onClick={() => setActivePolicy(null)}
                className="px-4 py-2 rounded-xl bg-pc-lime text-pc-deep font-bold text-xs hover:bg-[#ecfaa0] transition"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
