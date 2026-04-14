"use client"

import { useState } from "react"
import useSWR from "swr"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Eye } from "lucide-react"
import type { Student, Course } from "@/lib/db/types"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  in_review: "bg-blue-100 text-blue-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
}

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  in_review: "En Revisión",
  accepted: "Aceptado",
  rejected: "Rechazado",
}

export default function AdminStudentsPage() {
  const { data: students, mutate } = useSWR<Student[]>("/api/students", fetcher)
  const { data: courses } = useSWR<Course[]>("/api/courses", fetcher)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")

  const filteredStudents = students?.filter((s) =>
    filterStatus === "all" ? true : s.status === filterStatus
  )

  const getCourseName = (courseId: number | null) => {
    if (courseId === null) return "No especificada"
    return courses?.find((c) => c.id === courseId)?.name || "N/A"
  }

  const updateStudentStatus = async (studentId: number, status: string) => {
    await fetch(`/api/students/${studentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    mutate()
    setSelectedStudent(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Estudiantes</h1>
          <p className="text-muted-foreground">Gestión de pre-inscripciones</p>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="in_review">En Revisión</SelectItem>
            <SelectItem value="accepted">Aceptado</SelectItem>
            <SelectItem value="rejected">Rechazado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Pre-Inscripciones</CardTitle>
          <CardDescription>
            {filteredStudents?.length || 0} estudiantes encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Cédula</TableHead>
                <TableHead>Carrera</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents?.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">
                    {student.first_name} {student.last_name}
                  </TableCell>
                  <TableCell>{student.cedula}</TableCell>
                  <TableCell>{getCourseName(student.course_id)}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[student.status] || statusColors.pending}>
                      {statusLabels[student.status] || "Pendiente"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(student.created_at).toLocaleDateString("es-DO")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedStudent(student)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!filteredStudents || filteredStudents.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No hay estudiantes registrados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedStudent?.first_name} {selectedStudent?.last_name}
            </DialogTitle>
            <DialogDescription>Detalles de la pre-inscripción</DialogDescription>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Cédula</p>
                  <p className="font-medium">{selectedStudent.cedula}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Fecha de Nacimiento</p>
                  <p className="font-medium">{selectedStudent.birth_date}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Padre</p>
                  <p className="font-medium">
                    {selectedStudent.father_first_name && selectedStudent.father_last_name
                      ? `${selectedStudent.father_first_name} ${selectedStudent.father_last_name} (${selectedStudent.father_phone || "Sin teléfono"})`
                      : "No proporcionado"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Madre</p>
                  <p className="font-medium">
                    {selectedStudent.mother_first_name && selectedStudent.mother_last_name
                      ? `${selectedStudent.mother_first_name} ${selectedStudent.mother_last_name} (${selectedStudent.mother_phone || "Sin teléfono"})`
                      : "No proporcionado"}
                  </p>
                </div>
                <div className="space-y-1 col-span-2">
                  <p className="text-sm text-muted-foreground">Tutor</p>
                  <p className="font-medium">
                    {selectedStudent.guardian_first_name && selectedStudent.guardian_last_name
                      ? `${selectedStudent.guardian_first_name} ${selectedStudent.guardian_last_name} (${selectedStudent.guardian_phone || "Sin teléfono"})`
                      : "No proporcionado"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedStudent.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Teléfono</p>
                  <p className="font-medium">{selectedStudent.phone}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Ciudad</p>
                  <p className="font-medium">{selectedStudent.city}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Provincia</p>
                  <p className="font-medium">{selectedStudent.province}</p>
                </div>
                <div className="space-y-1 col-span-2">
                  <p className="text-sm text-muted-foreground">Dirección</p>
                  <p className="font-medium">{selectedStudent.address}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Nivel de Educación</p>
                  <p className="font-medium capitalize">{selectedStudent.education_level}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Institución Anterior</p>
                  <p className="font-medium">{selectedStudent.previous_institution}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Carrera</p>
                  <p className="font-medium">{getCourseName(selectedStudent.course_id)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <Badge className={statusColors[selectedStudent.status] || statusColors.pending}>
                    {statusLabels[selectedStudent.status] || "Pendiente"}
                  </Badge>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => updateStudentStatus(selectedStudent.id, "in_review")}
                  disabled={selectedStudent.status === "in_review"}
                >
                  Marcar En Revisión
                </Button>
                <Button
                  onClick={() => updateStudentStatus(selectedStudent.id, "accepted")}
                  disabled={selectedStudent.status === "accepted"}
                >
                  Aceptar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => updateStudentStatus(selectedStudent.id, "rejected")}
                  disabled={selectedStudent.status === "rejected"}
                >
                  Rechazar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
