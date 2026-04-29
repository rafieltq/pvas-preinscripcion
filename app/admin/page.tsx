"use client"

import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, BookOpen, Clock, CheckCircle, ChartSpline } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface DashboardStats {
  totalStudents: number
  totalCourses: number
  pendingStudents: number
  reviewedStudents: number
  acceptedStudents: number
  rejectedStudents: number
  studentsByCourse: { course_name: string; count: number }[]
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useSWR<DashboardStats>("/api/dashboard", fetcher)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-16 bg-muted animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: "Total Estudiantes",
      value: stats?.totalStudents || 0,
      icon: Users,
      description: "Pre-inscripciones recibidas",
    },
    {
      title: "Carreras Abiertas",
      value: stats?.totalCourses || 0,
      icon: BookOpen,
      description: "Programas disponibles",
    },
    {
      title: "Pendientes",
      value: stats?.pendingStudents || 0,
      icon: Clock,
      description: "Esperando revisión",
    },
    {
      title: "Aceptados",
      value: stats?.acceptedStudents || 0,
      icon: CheckCircle,
      description: "Estudiantes aprobados",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card px-5 py-4 shadow-sm">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Resumen del sistema de pre-inscripción
        </p>
        <div className="mt-3 inline-flex items-center gap-2 rounded-md bg-primary/10 px-3 py-1 text-sm text-primary">
          <ChartSpline className="h-4 w-4" />
          Seguimiento institucional en tiempo real
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
            <Card key={stat.title} className="border-border/80">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="w-4 h-4 text-primary" />
              </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats?.studentsByCourse && stats.studentsByCourse.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Estudiantes por Carrera</CardTitle>
            <CardDescription>Distribución de pre-inscripciones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.studentsByCourse.map((item) => (
                <div key={item.course_name} className="flex items-center justify-between">
                  <span className="text-sm text-foreground">{item.course_name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${Math.min(100, (item.count / (stats?.totalStudents || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-medium text-foreground w-8 text-right">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
