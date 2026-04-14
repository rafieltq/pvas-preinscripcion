import { NextResponse } from "next/server";
import { getCourseById, updateCourse, deleteCourse } from "@/lib/db/service";
import { requireAdminSession } from "@/lib/auth/api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { response } = await requireAdminSession(request);
    if (response) return response;

    const { id } = await params;
    const course = await getCourseById(parseInt(id));
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    return NextResponse.json(course);
  } catch (error) {
    console.error("Error fetching course:", error);
    return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { response } = await requireAdminSession(request);
    if (response) return response;

    const { id } = await params;
    const body = await request.json();
    const course = await updateCourse(parseInt(id), body);
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    return NextResponse.json(course);
  } catch (error) {
    console.error("Error updating course:", error);
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { response } = await requireAdminSession(request);
    if (response) return response;

    const { id } = await params;
    const body = await request.json();
    const course = await updateCourse(parseInt(id), body);
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    return NextResponse.json(course);
  } catch (error) {
    console.error("Error updating course:", error);
    return NextResponse.json({ error: "Failed to update course" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { response } = await requireAdminSession(request);
    if (response) return response;

    const { id } = await params;
    const deleted = await deleteCourse(parseInt(id));
    if (!deleted) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting course:", error);
    return NextResponse.json({ error: "Failed to delete course" }, { status: 500 });
  }
}
