import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <main className="py-20 overflow-x-hidden">
      <div className="pc-hover-card pc-modal-pop pc-surface-amber w-[min(640px,calc(100%-32px))] mx-auto border-2 rounded-[26px] overflow-hidden text-center shadow-card">
        <div className="h-2 w-full bg-gradient-to-r from-[#1e503e] via-[#dff27a] via-[#38bdf8] to-[#f97316]" />
        <div className="p-10">
          <span className="pc-pill-lift inline-block bg-pc-green text-pc-lime px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider cursor-default">
            OUT OF BOUNDS · 404
          </span>
          <h1 className="text-[34px] font-black tracking-[-1.4px] text-pc-text mt-3 mb-2">
            That shot landed outside the baseline.
          </h1>
          <p className="text-pc-muted font-medium text-[14px] leading-relaxed mb-6">
            The page or court route you requested could not be found. Explore our
            active venues or return to the PlayCourt home screen.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="group pc-btn-lift inline-flex items-center gap-1.5 rounded-full bg-pc-green hover:bg-pc-deep text-white px-5 py-3 text-[12.5px] font-extrabold"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Home</span>
            </Link>
            <Link
              href="/venues"
              className="group pc-pill-lift inline-flex items-center gap-1.5 rounded-full border-2 border-[#0369a1]/40 bg-[#e0f2fe] hover:bg-[#bae6fd] text-[#0c4a6e] px-5 py-3 text-[12.5px] font-extrabold"
            >
              <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Find Courts</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
