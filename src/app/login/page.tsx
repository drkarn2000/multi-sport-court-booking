"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Phone,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  KeyRound,
  AlertCircle,
  Clock,
  RefreshCw,
} from "lucide-react";
import { usePlayCourt } from "@/context/PlayCourtContext";
import { FadeUp } from "@/components/ui/MotionPrimitives";

const LOCAL_DEMO_ACCOUNTS = [
  {
    label: "Player (Aarav)",
    phone: "+91 98765 43210",
    role: "PLAYER",
    tint: "bg-[#dcfce7]/15 border-[#6ee7b7]/35 hover:bg-[#dcfce7]/25",
    badge: "text-pc-lime",
  },
  {
    label: "Platform Admin (Priya)",
    phone: "+91 99999 00001",
    role: "PLATFORM_ADMIN",
    tint: "bg-[#ede9fe]/15 border-[#c4b5fd]/35 hover:bg-[#ede9fe]/25",
    badge: "text-[#ddd6fe]",
  },
  {
    label: "Venue Manager (Rohan)",
    phone: "+91 99999 00002",
    role: "VENUE_MANAGER",
    tint: "bg-[#dbeafe]/15 border-[#93c5fd]/35 hover:bg-[#dbeafe]/25",
    badge: "text-[#bae6fd]",
  },
  {
    label: "Finance Ops (Meera)",
    phone: "+91 99999 00003",
    role: "FINANCE_OPERATOR",
    tint: "bg-[#fef3c7]/15 border-[#fcd34d]/35 hover:bg-[#fef3c7]/25",
    badge: "text-[#fde68a]",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const {
    requestOtpAsync,
    verifyOtpAsync,
    logoutDemo,
    isAuthenticated,
    currentUser,
    localDevMode,
    showToast,
  } = usePlayCourt();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [fullName, setFullName] = useState("Aarav Mehta");
  const [email, setEmail] = useState("aarav.m@example.com");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [devGeneratedOtp, setDevGeneratedOtp] = useState<string | null>(null);
  const [rateInfo, setRateInfo] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authInfo, setAuthInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phone.trim()) return;
    setBusy(true);
    setAuthError(null);
    setAuthInfo(null);

    const res = await requestOtpAsync(phone);
    setBusy(false);

    if (!res.ok) {
      setAuthError(res.error || "Could not generate OTP.");
      return;
    }

    setStep("otp");
    if (res.devOtpHint) {
      setDevGeneratedOtp(res.devOtpHint);
      setOtp(res.devOtpHint.split(""));
      setRateInfo(
        `Window usage: ${res.requestsUsedInWindow || 1}/${res.maxRequestsPerWindow || 5} requests (15m limit)`
      );
      showToast(`Local Dev OTP generated: ${res.devOtpHint}`);
    } else {
      setDevGeneratedOtp(null);
      setOtp(["", "", "", "", "", ""]);
      showToast(`Verification code requested for ${phone}`);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthInfo(null);
    const code = otp.join("").trim();
    if (code.length !== 6) {
      setAuthError("Please enter all 6 digits of your verification code.");
      return;
    }

    setBusy(true);
    const res = await verifyOtpAsync({
      phone,
      otp: code,
      fullName: mode === "signup" ? fullName : undefined,
      email: mode === "signup" ? email : undefined,
    });
    setBusy(false);

    if (!res.ok) {
      setAuthError(res.error || "Invalid or expired OTP code.");
      return;
    }

    if (res.user && res.user.role !== "PLAYER") {
      router.push("/admin");
    } else {
      router.push("/profile");
    }
  };

  const handleExpireOtpForTest = async () => {
    setAuthError(null);
    const r = await fetch("/api/v1/dev/testing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "expire_latest_otp", phone }),
    });
    const j = await r.json();
    if (r.ok) {
      setAuthInfo(
        "Local Dev: Latest OTP has been marked EXPIRED in SQLite. Click Verify below to test expired OTP rejection."
      );
    } else {
      setAuthError(j?.error?.message || "Could not expire OTP");
    }
  };

  const handleResetRateLimit = async () => {
    setAuthError(null);
    const r = await fetch("/api/v1/dev/testing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reset_otp_rate_limit", phone }),
    });
    if (r.ok) {
      setRateInfo("Window usage reset to 0/5");
      setAuthInfo("Local Dev: OTP rate-limit counter cleared for this phone.");
    }
  };

  const handleOtpDigitChange = (idx: number, val: string) => {
    const clean = val.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[idx] = clean;
    setOtp(next);
  };

  return (
    <main className="py-12 overflow-x-hidden">
      <div className="w-[min(1080px,calc(100%-32px))] mx-auto grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-8 items-start">
        {/* Left Brand & Local Test Accounts Panel */}
        <FadeUp className="pc-hero-banner rounded-[28px] p-7 sm:p-10 flex flex-col justify-between min-h-[480px] hover:-translate-y-1 hover:shadow-float transition-all duration-300">
          <div>
            <span className="pc-pill-lift inline-flex items-center gap-1.5 bg-pc-lime text-pc-deep px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider cursor-default">
              <Sparkles className="w-3.5 h-3.5" />
              PLAYCOURT PLAYER & STAFF ACCESS
            </span>
            <h1 className="text-[30px] sm:text-[38px] font-black tracking-[-1.6px] leading-[1.08] mt-4 mb-3 text-white">
              One account for every court, match, and crew credit.
            </h1>
            <p className="text-[#e1f2e9] text-[13.5px] leading-[1.8]">
              Sign in with your mobile number to book championship courts, check
              your Group Atlas daily shared credit, and join open community
              matches.
            </p>
          </div>

          <div className="space-y-3 my-6 pt-5 border-t border-white/15 text-[12.5px] text-white font-medium">
            <div className="flex items-center gap-2.5 hover:translate-x-1 transition-transform duration-200 cursor-default">
              <CheckCircle2 className="w-4 h-4 text-pc-lime shrink-0" />
              <span>
                Real SHA-256 hashed 6-digit OTP verification & JWT session cookies
              </span>
            </div>
            <div className="flex items-center gap-2.5 hover:translate-x-1 transition-transform duration-200 cursor-default">
              <CheckCircle2 className="w-4 h-4 text-[#7dd3fc] shrink-0" />
              <span>
                Link up to 4 player accounts under one Crew Membership
              </span>
            </div>
            <div className="flex items-center gap-2.5 hover:translate-x-1 transition-transform duration-200 cursor-default">
              <CheckCircle2 className="w-4 h-4 text-[#fcd34d] shrink-0" />
              <span>
                Rate-limited OTP challenges (5 per 15m) & 5-attempt lockout
              </span>
            </div>
          </div>

          {localDevMode && (
            <div className="bg-[#0b271d]/65 border border-pc-lime/30 rounded-2xl p-4 space-y-2.5">
              <div className="text-[10.5px] font-black uppercase tracking-wider text-pc-lime">
                Local Development Test Accounts (Click to Fill)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {LOCAL_DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.phone}
                    type="button"
                    onClick={() => {
                      setMode("login");
                      setStep("phone");
                      setPhone(acc.phone);
                      setAuthError(null);
                      setAuthInfo(`Selected ${acc.label} (${acc.phone})`);
                    }}
                    className={`text-left p-2.5 rounded-xl border hover:-translate-y-0.5 transition-all duration-200 text-[11.5px] ${acc.tint}`}
                  >
                    <strong className={`block font-extrabold ${acc.badge}`}>
                      {acc.label}
                    </strong>
                    <span className="text-white/90 font-medium">{acc.phone}</span>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-[#cfe4d8] pt-1">
                Local Dev Mode only: Generated OTPs are logged to the terminal
                and shown in the Step 2 inspector—never exposed in production.
              </p>
            </div>
          )}
        </FadeUp>

        {/* Right Auth Card */}
        <FadeUp
          delay={0.07}
          className="pc-hover-card pc-surface-mint border-2 rounded-[28px] overflow-hidden shadow-card"
        >
          <div className="h-2 w-full bg-gradient-to-r from-[#1e503e] via-[#dff27a] via-[#38bdf8] to-[#f59e0b]" />
          <div className="p-7 sm:p-9">
            {/* Active Session Indicator */}
            {isAuthenticated && currentUser && (
              <div className="pc-hover-subcard mb-5 p-3.5 rounded-2xl bg-[#dcfce7] border border-[#6ee7b7] flex flex-wrap items-center justify-between gap-2 text-[12px]">
                <div>
                  <strong className="text-[#064e3b] font-extrabold">
                    Active session: {currentUser.fullName}
                  </strong>{" "}
                  <span className="text-[#065f46] font-semibold">
                    ({currentUser.role})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={logoutDemo}
                  className="pc-pill-lift px-3 py-1 rounded-full bg-white border border-rose-300 font-extrabold text-rose-700 hover:bg-rose-50"
                >
                  Sign Out Now
                </button>
              </div>
            )}

            {/* Mode Tabs */}
            <div className="grid grid-cols-2 p-1 rounded-full bg-white/90 border border-[#96ccb0] mb-6 shadow-sm">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setStep("phone");
                  setAuthError(null);
                }}
                className={`py-2.5 rounded-full text-[12.5px] font-extrabold ${
                  mode === "login"
                    ? "bg-pc-green text-pc-lime shadow-sm"
                    : "text-pc-text hover:bg-[#e5f5ec]"
                }`}
              >
                Log In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setStep("phone");
                  setAuthError(null);
                }}
                className={`py-2.5 rounded-full text-[12.5px] font-extrabold ${
                  mode === "signup"
                    ? "bg-pc-green text-pc-lime shadow-sm"
                    : "text-pc-text hover:bg-[#e5f5ec]"
                }`}
              >
                Create Account
              </button>
            </div>

            {authError && (
              <div className="mb-4 bg-[#ffe4e6] border border-[#fda4af] text-[#881337] px-3.5 py-2.5 rounded-xl flex items-start gap-2 text-[12px] font-bold">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span>{authError}</span>
                  {localDevMode && authError.toLowerCase().includes("rate limit") && (
                    <button
                      type="button"
                      onClick={handleResetRateLimit}
                      className="block mt-1 underline font-black text-[#881337]"
                    >
                      [Local Dev] Reset rate-limit counter for {phone}
                    </button>
                  )}
                </div>
              </div>
            )}

            {authInfo && (
              <div className="mb-4 bg-[#fef3c7] border border-[#fcd34d] text-[#78350f] px-3.5 py-2.5 rounded-xl text-[12px] font-bold">
                {authInfo}
              </div>
            )}

            {step === "phone" ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#d1fae5] text-[#065f46] border border-[#6ee7b7] text-[10px] font-black tracking-[1.4px] uppercase">
                    {mode === "login" ? "WELCOME BACK" : "NEW PLAYER REGISTRATION"}
                  </span>
                  <h2 className="text-[24px] font-black text-pc-text mt-1.5">
                    {mode === "login"
                      ? "Sign in with your phone"
                      : "Create your PlayCourt profile"}
                  </h2>
                  <p className="text-[12.5px] text-pc-muted font-medium mt-1">
                    Request a 6-digit OTP verification code stored securely in the
                    local SQLite database.
                  </p>
                </div>

                {mode === "signup" && (
                  <>
                    <div>
                      <label className="block text-[11.5px] font-extrabold text-pc-text mb-1.5">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full p-3 rounded-xl border border-[#8cc5a6] bg-white text-[13px] font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-extrabold text-pc-text mb-1.5">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full p-3 rounded-xl border border-[#8cc5a6] bg-white text-[13px] font-medium"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-[11.5px] font-extrabold text-pc-text mb-1.5">
                    Mobile Number *
                  </label>
                  <div className="relative group">
                    <Phone className="w-4 h-4 text-pc-green transition-colors absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full pl-10 pr-3 py-3 rounded-xl border border-[#8cc5a6] bg-white text-[13.5px] font-bold text-pc-text focus:outline-none focus:border-pc-green"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="group pc-btn-lift w-full inline-flex items-center justify-center gap-2 rounded-full bg-pc-green text-white py-3.5 px-6 text-[13px] font-extrabold hover:bg-pc-deep disabled:opacity-60"
                >
                  <span>
                    {busy ? "Generating OTP..." : "Send Demo OTP Code"}
                  </span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#dbeafe] text-[#1e3a8a] border border-[#93c5fd] text-[10px] font-black tracking-[1.4px] uppercase">
                    STEP 2 · VERIFY 6-DIGIT OTP
                  </span>
                  <h2 className="text-[24px] font-black text-pc-text mt-1.5">
                    Enter 6-digit verification code
                  </h2>
                  <p className="text-[12.5px] text-pc-muted font-medium mt-1">
                    Verification challenge issued for{" "}
                    <strong className="text-pc-text font-extrabold">{phone}</strong>:
                  </p>
                </div>

                {localDevMode && devGeneratedOtp && (
                  <div className="pc-hover-subcard pc-surface-amber border-2 rounded-2xl p-3.5 space-y-2 text-[12px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 font-extrabold text-[#78350f]">
                        <KeyRound className="w-3.5 h-3.5 text-pc-green" />
                        Local Dev OTP:{" "}
                        <code className="text-[14px] bg-white px-2 py-0.5 rounded border border-[#e5c46b] text-pc-text font-black">
                          {devGeneratedOtp}
                        </code>
                      </span>
                      {rateInfo && (
                        <span className="text-[11px] font-semibold text-[#78350f]">
                          {rateInfo}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setOtp(devGeneratedOtp.split(""));
                          setAuthError(null);
                        }}
                        className="pc-pill-lift px-2.5 py-1 rounded-lg bg-white border border-[#8cc5a6] text-[11px] font-bold text-pc-text hover:border-pc-green"
                      >
                        Fill Valid OTP
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setOtp(["0", "0", "0", "0", "0", "0"]);
                          setAuthInfo(
                            "Filled wrong code 000000 — click Verify below to test incorrect OTP rejection."
                          );
                        }}
                        className="pc-pill-lift px-2.5 py-1 rounded-lg bg-white border border-[#f59e0b] text-[11px] font-bold text-[#78350f]"
                      >
                        Fill Wrong OTP (000000)
                      </button>
                      <button
                        type="button"
                        onClick={handleExpireOtpForTest}
                        className="pc-pill-lift inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-rose-300 text-[11px] font-bold text-rose-700"
                      >
                        <Clock className="w-3 h-3" />
                        Expire OTP Now
                      </button>
                      <button
                        type="button"
                        onClick={handleResetRateLimit}
                        className="group pc-pill-lift inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-[#8dc7e8] text-[11px] font-bold text-[#075985]"
                      >
                        <RefreshCw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
                        Reset Rate Limit
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-6 gap-2">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                      aria-label={`OTP digit ${idx + 1}`}
                      className="w-full h-12 text-center text-[18px] font-black rounded-xl border-2 border-pc-green bg-white hover:border-pc-deep hover:-translate-y-0.5 focus:scale-105 transition-all duration-200 text-pc-text focus:outline-none shadow-sm"
                    />
                  ))}
                </div>

                <div className="pc-hover-subcard bg-white/90 border border-[#96ccb0] rounded-xl p-3 text-[11.5px] text-pc-muted font-semibold flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-pc-green" />
                    Valid for 5 minutes · Max 5 attempts
                  </span>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleRequestOtp()}
                    className="font-extrabold text-pc-green hover:underline"
                  >
                    Resend code
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("phone");
                      setAuthError(null);
                    }}
                    className="pc-pill-lift px-4 py-3 rounded-full border border-[#8cc5a6] bg-white hover:border-pc-green text-[12px] font-extrabold text-pc-text"
                  >
                    ← Change Number
                  </button>
                  <button
                    type="submit"
                    disabled={busy}
                    className="group pc-btn-lift flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-pc-green text-white py-3.5 px-6 text-[13px] font-extrabold hover:bg-pc-deep disabled:opacity-60"
                  >
                    <span>
                      {busy ? "Verifying..." : "Verify & Continue"}
                    </span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 pt-5 border-t border-[#9fd4b3] flex items-center justify-between text-[11.5px] text-pc-muted font-semibold">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-pc-green" />
                HttpOnly JWT session cookie
              </span>
              <Link
                href="/profile"
                className="font-extrabold text-pc-green hover:translate-x-0.5 hover:underline inline-block transition-transform"
              >
                Go to Player Profile →
              </Link>
            </div>
          </div>
        </FadeUp>
      </div>
    </main>
  );
}
