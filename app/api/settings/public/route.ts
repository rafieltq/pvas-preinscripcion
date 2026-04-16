import { NextResponse } from "next/server";
import { getSettings } from "@/lib/db/service";

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return fallback;
}

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json({
      enrollment_open: toBoolean(settings.inscription_open, false),
      enrollment_start_date: settings.inscription_start_date || "",
      enrollment_end_date: settings.inscription_end_date || "",
    });
  } catch (error) {
    console.error("Error fetching public settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}
