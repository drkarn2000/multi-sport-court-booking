import { NextRequest } from "next/server";
import { getVenuesWithLiveAvailability } from "@/server/services/playcourtService";
import { apiError, apiSuccess } from "@/server/utils/http";
import { SportType } from "@/types/playcourt";

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;
    const sport = sp.get("sport") as SportType | "All" | null;
    const area = sp.get("area");
    const search = sp.get("search")?.toLowerCase().trim();
    const sortBy = sp.get("sortBy");
    const date = sp.get("date") || undefined;

    let venues = getVenuesWithLiveAvailability(date);

    if (sport && sport !== "All") {
      venues = venues.filter((v) => v.sports.includes(sport));
    }

    if (area && area !== "All") {
      venues = venues.filter(
        (v) =>
          v.area.toLowerCase().includes(area.toLowerCase()) ||
          v.city.toLowerCase().includes(area.toLowerCase())
      );
    }

    if (search) {
      venues = venues.filter(
        (v) =>
          v.name.toLowerCase().includes(search) ||
          v.area.toLowerCase().includes(search) ||
          v.city.toLowerCase().includes(search) ||
          v.sports.some((s) => s.toLowerCase().includes(search))
      );
    }

    if (sortBy === "price-asc") {
      venues = [...venues].sort((a, b) => a.pricePerHour - b.pricePerHour);
    } else if (sortBy === "price-desc") {
      venues = [...venues].sort((a, b) => b.pricePerHour - a.pricePerHour);
    } else if (sortBy === "rating") {
      venues = [...venues].sort((a, b) => b.rating - a.rating);
    }

    return apiSuccess({ venues, total: venues.length });
  } catch (err) {
    return apiError(err);
  }
}

