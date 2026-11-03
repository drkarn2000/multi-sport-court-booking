"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  Menu,
  X,
  User,
  ArrowUpRight,
  LogIn,
  CalendarCheck,
  Sparkles,
} from "lucide-react";
import { usePlayCourt } from "@/context/PlayCourtContext";

export function Header() {
  const pathname = usePathname();
  const { isAuthenticated, profile } = usePlayCourt();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);

  // Do not render customer header inside /admin
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  // "My Bookings" is ONLY visible when customer panel is open / user is authenticated
  const isCustomerPanel =
    isAuthenticated || pathname === "/bookings" || pathname === "/profile";

  // Base navigation links
  const baseNavLinks = [
    { href: "/", label: "Home" },
    { href: "/venues", label: "Find Courts" },
    { href: "/memberships", label: "Memberships" },
    { href: "/community", label: "Community" },
    { href: "/events", label: "Events" },
  ];

  // Append My Bookings only if customer panel / session is active
  const navLinks = isCustomerPanel
    ? [...baseNavLinks, { href: "/bookings", label: "My Bookings" }]
    : baseNavLinks;

  return (
    <header className="sticky top-0 z-40 bg-[#0d2a1e]/95 backdrop-blur-md text-white border-b border-emerald-900/40 shadow-[0_4px_24px_rgba(10,34,24,0.25)] transition-colors duration-300">
      {/* Animated sports color flow top ribbon */}
      <div className="h-[2.5px] w-full bg-gradient-to-r from-[#10b981] via-[#dff27a] via-[#38bdf8] to-[#f59e0b] animate-gradient-flow" />

      <div className="h-[68px] w-[min(1200px,calc(100%-32px))] mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo with micro-interactions */}
        <Link
          href="/"
          className="group text-[22px] font-black tracking-[-0.8px] text-white flex items-center gap-2.5 shrink-0"
        >
          <motion.span
            whileHover={{ scale: 1.1, rotate: -6 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="bg-pc-lime text-pc-deep w-9 h-9 rounded-xl grid place-items-center text-lg font-black shadow-[0_2px_12px_rgba(223,242,122,0.35)]"
          >
            P
          </motion.span>
          <div className="flex items-center gap-1.5">
            <span className="tracking-tight text-white group-hover:text-pc-lime transition-colors duration-300">
              playcourt
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 group-hover:bg-pc-lime group-hover:scale-125 transition-all duration-300 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
          </div>
        </Link>

        {/* Desktop Nav with Floating Sliding Pill Hover Effect */}
        <nav
          className="hidden lg:flex items-center gap-1 relative p-1 rounded-full bg-white/[0.04] border border-white/[0.08] backdrop-blur-sm shadow-inner"
          onMouseLeave={() => setHoveredHref(null)}
        >
          {navLinks.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname?.startsWith(item.href);
            const isHovered = hoveredHref === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onMouseEnter={() => setHoveredHref(item.href)}
                className={`relative px-4 py-1.5 rounded-full text-[13.5px] font-semibold transition-colors duration-200 z-10 select-none ${
                  isActive
                    ? "text-white font-bold"
                    : "text-[#cbe3d6] hover:text-white"
                }`}
              >
                {/* Smooth sliding hover background */}
                {isHovered && (
                  <motion.span
                    layoutId="nav-hover-pill"
                    className="absolute inset-0 rounded-full bg-white/15 backdrop-blur-md -z-10 shadow-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 450,
                      damping: 32,
                    }}
                  />
                )}

                {/* Persistent active pill */}
                {isActive && !isHovered && (
                  <motion.span
                    layoutId="nav-active-pill"
                    className="absolute inset-0 rounded-full bg-white/12 border border-white/15 -z-10 shadow-sm"
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 30,
                    }}
                  />
                )}

                <span className="flex items-center gap-1.5">
                  {item.label}
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-pc-lime shadow-[0_0_8px_#dff27a] animate-pulse" />
                  )}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-3">
          {isAuthenticated ? (
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Link
                href="/profile"
                className="group relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/50 text-[12.5px] font-bold text-emerald-100 hover:border-emerald-400/80 hover:bg-emerald-900/60 hover:shadow-[0_0_15px_rgba(16,185,129,0.25)] transition-all duration-300"
                title="View Player Profile"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                <span className="w-5 h-5 rounded-full bg-pc-lime text-pc-deep text-[10px] grid place-items-center font-black group-hover:rotate-12 transition-transform duration-300">
                  {profile.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)}
                </span>
                <span className="max-w-[110px] truncate">{profile.name.split(" ")[0]}</span>
              </Link>
            </motion.div>
          ) : (
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Link
                href="/login"
                className="group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-semibold text-[#e1f0e8] hover:text-white border border-transparent hover:border-white/20 hover:bg-white/10 transition-all duration-200"
              >
                <LogIn className="w-4 h-4 text-[#a3c9b7] group-hover:text-pc-lime group-hover:translate-x-0.5 transition-all duration-200" />
                <span>Log in</span>
              </Link>
            </motion.div>
          )}

          {/* Book a court CTA with Shimmer & Glow */}
          <motion.div
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
          >
            <Link
              href="/venues"
              className="relative group overflow-hidden inline-flex items-center gap-1.5 rounded-full bg-pc-lime text-pc-deep px-4 py-2 text-[12.5px] font-black shadow-[0_2px_14px_rgba(223,242,122,0.35)] hover:shadow-[0_4px_22px_rgba(223,242,122,0.55)] transition-all duration-300"
            >
              {/* Shimmer light sweep */}
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
              <span className="relative z-10">Book a court</span>
              <ArrowUpRight className="relative z-10 w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </motion.div>
        </div>

        {/* Mobile menu trigger */}
        <div className="flex items-center gap-2 lg:hidden">
          <Link
            href="/venues"
            className="md:hidden inline-flex items-center gap-1 rounded-full bg-pc-lime text-pc-deep px-3 py-1.5 text-[11.5px] font-black hover:bg-[#ecfaa0]"
          >
            <span>Book</span>
            <ArrowUpRight className="w-3 h-3" />
          </Link>
          <motion.button
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle Menu"
            className="p-2 rounded-xl border border-white/20 text-white bg-white/10 hover:bg-white/20 transition"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </motion.button>
        </div>
      </div>

      {/* Mobile Dropdown Drawer with Staggered Entrance */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-x-0 top-[70.5px] bg-[#0c261c]/98 text-white border-b border-emerald-900/50 shadow-2xl p-5 flex flex-col gap-2 lg:hidden z-50 backdrop-blur-xl"
          >
            {navLinks.map((item, idx) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname?.startsWith(item.href);
              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.04 }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between py-2.5 px-3.5 rounded-xl text-[14px] transition-all duration-200 ${
                      isActive
                        ? "bg-white/15 text-white font-bold"
                        : "text-[#e2f0e8] font-medium hover:bg-white/10"
                    }`}
                  >
                    <span>{item.label}</span>
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-pc-lime shadow-[0_0_8px_#dff27a]" />
                    )}
                  </Link>
                </motion.div>
              );
            })}

            <div className="pt-3 mt-1 border-t border-white/15 flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-emerald-600/40 text-[13px] font-bold text-emerald-100 bg-emerald-950/40 hover:bg-emerald-900/50 transition"
                  >
                    <User className="w-4 h-4 text-pc-lime" />
                    <span>My Profile ({profile.name})</span>
                  </Link>
                  <Link
                    href="/bookings"
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-white/15 text-[13px] font-semibold text-white bg-white/5 hover:bg-white/10 transition"
                  >
                    <CalendarCheck className="w-4 h-4 text-[#7dd3fc]" />
                    <span>My Bookings</span>
                  </Link>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-white/20 text-[13px] font-semibold text-white bg-white/10 hover:bg-white/20 transition"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Log in</span>
                </Link>
              )}

              <Link
                href="/venues"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-pc-lime text-pc-deep text-[13px] font-black hover:bg-[#ecfaa0] shadow-md transition"
              >
                <span>Book a court</span>
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
