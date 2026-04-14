import { NextResponse } from "next/server";
import { getSettings, updateSetting } from "@/lib/db/service";
import { requireAdminSession } from "@/lib/auth/api";

type SettingsPayload = Record<string, unknown>;

function toStringValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

function toBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return fallback;
}

function normalizeSettingsResponse(settings: Record<string, string>) {
  return {
    enrollment_open: toBoolean(
      settings.enrollment_open ?? settings.inscription_open,
      false
    ),
    enrollment_start_date:
      settings.enrollment_start_date ?? settings.inscription_start_date ?? "",
    enrollment_end_date:
      settings.enrollment_end_date ?? settings.inscription_end_date ?? "",
    institution_name: settings.institution_name ?? "",
    institution_phone: settings.institution_phone ?? settings.contact_phone ?? "",
    institution_email: settings.institution_email ?? settings.contact_email ?? "",
    institution_address:
      settings.institution_address ?? settings.contact_address ?? "",
  };
}

function normalizeSettingsUpdate(body: SettingsPayload): Record<string, string> {
  const updates: Record<string, string> = {};

  if ("enrollment_open" in body || "inscription_open" in body) {
    updates.inscription_open = toStringValue(
      body.enrollment_open ?? body.inscription_open
    );
  }

  if ("enrollment_start_date" in body || "inscription_start_date" in body) {
    updates.inscription_start_date = toStringValue(
      body.enrollment_start_date ?? body.inscription_start_date
    );
  }

  if ("enrollment_end_date" in body || "inscription_end_date" in body) {
    updates.inscription_end_date = toStringValue(
      body.enrollment_end_date ?? body.inscription_end_date
    );
  }

  if ("institution_name" in body) {
    updates.institution_name = toStringValue(body.institution_name);
  }

  if ("institution_phone" in body || "contact_phone" in body) {
    updates.contact_phone = toStringValue(
      body.institution_phone ?? body.contact_phone
    );
  }

  if ("institution_email" in body || "contact_email" in body) {
    updates.contact_email = toStringValue(
      body.institution_email ?? body.contact_email
    );
  }

  if ("institution_address" in body || "contact_address" in body) {
    updates.contact_address = toStringValue(
      body.institution_address ?? body.contact_address
    );
  }

  return updates;
}

export async function GET(request: Request) {
  try {
    const { response } = await requireAdminSession(request);
    if (response) return response;

    const settings = await getSettings();
    return NextResponse.json(normalizeSettingsResponse(settings));
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const auth = await requireAdminSession(request);
    if (auth.response) return auth.response;

    const body = await request.json();
    const updates = normalizeSettingsUpdate(body as SettingsPayload);

    for (const [key, value] of Object.entries(updates)) {
      await updateSetting(key, value);
    }

    const settings = await getSettings();
    return NextResponse.json(normalizeSettingsResponse(settings));
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  return PATCH(request);
}
