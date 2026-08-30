import { NextResponse } from "next/server";
import { resolveOwnerCityLabel } from "@/lib/formatOwnerCity";
import { client } from "@/sanity/client";
import { OWNER_LOCATION_QUERY } from "@/sanity/queries";
import type { OwnerLocation } from "@/sanity/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_CITY = "Los Angeles, CA";
const DEFAULT_TIMEZONE = "America/Los_Angeles";

export async function GET() {
  try {
    const data = await client
      .withConfig({ useCdn: false })
      .fetch<OwnerLocation | null>(OWNER_LOCATION_QUERY);
    const timezone = data?.timezone?.trim() || DEFAULT_TIMEZONE;
    const city = await resolveOwnerCityLabel(
      data?.city?.trim() || DEFAULT_CITY,
      timezone,
      fetch,
      undefined,
      data?.state,
    );
    return NextResponse.json(
      { city, timezone },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { city: DEFAULT_CITY, timezone: DEFAULT_TIMEZONE },
      { headers: { "Cache-Control": "no-store" } },
    );
  }
}
