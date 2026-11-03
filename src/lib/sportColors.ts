export interface SportVisualTheme {
  ribbon: string;
  cardBg: string;
  subcardBg: string;
  pill: string;
  pillSolid: string;
  iconBox: string;
  accentText: string;
}

const SPORT_THEMES: Record<string, SportVisualTheme> = {
  tennis: {
    ribbon: "bg-gradient-to-r from-[#1e503e] via-[#10b981] to-[#a3e635]",
    cardBg:
      "bg-gradient-to-br from-[#eaf9f0] via-[#f2fbf2] to-[#e9f5dd] border-[#9fd4b2]",
    subcardBg: "bg-[#e1f5e9]/85 border-[#a8d8b9]",
    pill: "bg-[#d1fae5] text-[#064e3b] border border-[#6ee7b7]",
    pillSolid: "bg-[#1e503e] text-[#dff27a]",
    iconBox: "bg-[#d1fae5] text-[#065f46]",
    accentText: "text-[#065f46]",
  },
  padel: {
    ribbon: "bg-gradient-to-r from-[#0369a1] via-[#06b6d4] to-[#2dd4bf]",
    cardBg:
      "bg-gradient-to-br from-[#e6f6fe] via-[#eef9ff] to-[#e3f6f4] border-[#96d1ee]",
    subcardBg: "bg-[#ddf0fc]/85 border-[#9fd2ef]",
    pill: "bg-[#dbeafe] text-[#1e3a8a] border border-[#93c5fd]",
    pillSolid: "bg-[#0369a1] text-white",
    iconBox: "bg-[#dbeafe] text-[#075985]",
    accentText: "text-[#075985]",
  },
  badminton: {
    ribbon: "bg-gradient-to-r from-[#c2410c] via-[#f97316] to-[#facc15]",
    cardBg:
      "bg-gradient-to-br from-[#fff2e6] via-[#fff7ed] to-[#fef2d6] border-[#f4bf92]",
    subcardBg: "bg-[#ffead6]/85 border-[#f5c093]",
    pill: "bg-[#ffedd5] text-[#7c2d12] border border-[#fdba74]",
    pillSolid: "bg-[#c2410c] text-white",
    iconBox: "bg-[#ffedd5] text-[#9a3412]",
    accentText: "text-[#9a3412]",
  },
  squash: {
    ribbon: "bg-gradient-to-r from-[#5b21b6] via-[#8b5cf6] to-[#ec4899]",
    cardBg:
      "bg-gradient-to-br from-[#f1ecff] via-[#f6f2ff] to-[#fbeaf4] border-[#c4b2f3]",
    subcardBg: "bg-[#e9e1ff]/85 border-[#c6b5f5]",
    pill: "bg-[#ede9fe] text-[#4c1d95] border border-[#c4b5fd]",
    pillSolid: "bg-[#5b21b6] text-white",
    iconBox: "bg-[#ede9fe] text-[#5b21b6]",
    accentText: "text-[#5b21b6]",
  },
  default: {
    ribbon: "bg-gradient-to-r from-[#1e503e] via-[#14b8a6] to-[#dff27a]",
    cardBg:
      "bg-gradient-to-br from-[#ecf8f1] via-[#f4faea] to-[#e7f4f2] border-[#a8d5bc]",
    subcardBg: "bg-[#e3f3ea]/85 border-[#aed8c0]",
    pill: "bg-[#dcfce7] text-[#14532d] border border-[#86efac]",
    pillSolid: "bg-[#1e503e] text-white",
    iconBox: "bg-[#dcfce7] text-[#166534]",
    accentText: "text-[#1e503e]",
  },
};

export function getSportTheme(sport?: string): SportVisualTheme {
  if (!sport) return SPORT_THEMES.default;
  const key = sport.trim().toLowerCase();
  if (key.includes("padel")) return SPORT_THEMES.padel;
  if (key.includes("badminton")) return SPORT_THEMES.badminton;
  if (key.includes("squash")) return SPORT_THEMES.squash;
  if (key.includes("tennis")) return SPORT_THEMES.tennis;
  return SPORT_THEMES.default;
}

export function getEventCategoryTheme(category?: string): SportVisualTheme {
  const key = (category || "").trim().toLowerCase();
  if (key.includes("tournament")) {
    return {
      ribbon: "bg-gradient-to-r from-[#b45309] via-[#f59e0b] to-[#dff27a]",
      cardBg:
        "bg-gradient-to-br from-[#fef7df] via-[#fffbeb] to-[#eef8dc] border-[#ecc978]",
      subcardBg: "bg-[#fef0c7]/80 border-[#ecc978]",
      pill: "bg-[#fef3c7] text-[#78350f] border border-[#fcd34d]",
      pillSolid: "bg-[#b45309] text-white",
      iconBox: "bg-[#fef3c7] text-[#92400e]",
      accentText: "text-[#92400e]",
    };
  }
  if (key.includes("coaching")) {
    return SPORT_THEMES.squash;
  }
  if (key.includes("social")) {
    return {
      ribbon: "bg-gradient-to-r from-[#be123c] via-[#f43f5e] to-[#fb923c]",
      cardBg:
        "bg-gradient-to-br from-[#fff0f3] via-[#fff5f6] to-[#fff1e6] border-[#f5b2c0]",
      subcardBg: "bg-[#ffe4ea]/80 border-[#f5b2c0]",
      pill: "bg-[#ffe4e6] text-[#881337] border border-[#fda4af]",
      pillSolid: "bg-[#be123c] text-white",
      iconBox: "bg-[#ffe4e6] text-[#9f1239]",
      accentText: "text-[#9f1239]",
    };
  }
  return SPORT_THEMES.tennis;
}

