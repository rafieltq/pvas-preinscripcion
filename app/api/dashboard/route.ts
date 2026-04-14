import { NextResponse } from "next/server";
import { getDashboardStats, getCourses } from "@/lib/db/service";
import { requireAdminSession } from "@/lib/auth/api";

export async function GET(request: Request) {
  try {
    const { response } = await requireAdminSession(request);
    if (response) return response;

    const [stats, courses] = await Promise.all([
      getDashboardStats(),
      getCourses(),
    ]);
    
    const activeCourses = courses.filter((c) => c.active === 1);
    const statusCounts = {
      pending: 0,
      in_review: 0,
      accepted: 0,
      rejected: 0,
    };
    
    for (const row of stats.statusStats) {
      if (row.status in statusCounts) {
        statusCounts[row.status as keyof typeof statusCounts] = row.count;
      }
    }

    return NextResponse.json({
      totalStudents: stats.totalStudents,
      totalCourses: activeCourses.length,
      pendingStudents: statusCounts.pending,
      reviewedStudents: statusCounts.in_review,
      acceptedStudents: statusCounts.accepted,
      rejectedStudents: statusCounts.rejected,
      courseStats: stats.courseStats,
      studentsByCourse: stats.courseStats.map((c) => ({
        course_name: c.name,
        count: c.enrolled,
      })),
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}
