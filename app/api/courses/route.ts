import { NextResponse } from "next/server";
import {
  getCourses,
  getAvailableCourses,
  getActiveCourses,
  createCourse,
} from "@/lib/db/service";
import { getOptionalAdminSession, requireAdminSession } from "@/lib/auth/api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const availableOnly = searchParams.get("active") === "true";
    const session = await getOptionalAdminSession(request);

    const courses = session
      ? await getCourses()
      : availableOnly
        ? await getAvailableCourses()
        : await getActiveCourses();

    return NextResponse.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { response } = await requireAdminSession(request);
    if (response) return response;

    const body = await request.json();
    const course = await createCourse(body);
    return NextResponse.json(course, { status: 201 });
  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
  }
}
