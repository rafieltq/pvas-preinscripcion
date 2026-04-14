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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Check, Plus, Pencil, Trash2 } from "lucide-react"
import type { Course } from "@/lib/db/types"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function AdminCoursesPage() {
  const { data: courses, mutate } = useSWR<Course[]>("/api/courses", fetcher)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCourse, setEditingCourse] = useState<Course | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    duration: "",
    schedule: "",
    capacity: 30,
    active: 1,
  })

  const resetForm = () => {
    setFormData({ name: "", description: "", duration: "", schedule: "", capacity: 30, active: 1 })
    setEditingCourse(null)
  }

  const openCreateDialog = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const openEditDialog = (course: Course) => {
    setEditingCourse(course)
    setFormData({
      name: course.name,
      description: course.description || "",
      duration: course.duration,
      schedule: course.schedule || "",
      capacity: course.capacity,
      active: course.active,
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (editingCourse) {
      await fetch(`/api/courses/${editingCourse.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
    } else {
      await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
    }

    mutate()
    setIsDialogOpen(false)
    resetForm()
  }

  const handleDelete = async (courseId: number) => {
    if (!confirm("¿Está seguro de eliminar esta carrera?")) return

    await fetch(`/api/courses/${courseId}`, { method: "DELETE" })
    mutate()
  }

  const isCourseActive = (active: Course["active"]) => Number(active) === 1

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Carreras</h1>
          <p className="text-muted-foreground">Gestión de programas académicos</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Carrera
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCourse ? "Editar Carrera" : "Nueva Carrera"}
              </DialogTitle>
              <DialogDescription>
                {editingCourse
                  ? "Modifique los datos de la carrera"
                  : "Complete los datos para crear una nueva carrera"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Técnico en Informática"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Descripción del programa..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duración *</Label>
                  <Input
                    id="duration"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({ ...formData, duration: e.target.value })
                    }
                    placeholder="2 años"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacidad *</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({ ...formData, capacity: parseInt(e.target.value) || 30 })
                    }
                    placeholder="30"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule">Horario</Label>
                <Input
                  id="schedule"
                  value={formData.schedule}
                  onChange={(e) =>
                    setFormData({ ...formData, schedule: e.target.value })
                  }
                  placeholder="Lunes a Viernes 8:00 AM - 12:00 PM"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="active"
                  checked={formData.active === 1}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, active: checked ? 1 : 0 })
                  }
                />
                <Label htmlFor="active">Carrera activa</Label>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingCourse ? "Guardar Cambios" : "Crear Carrera"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Carreras</CardTitle>
          <CardDescription>{courses?.length || 0} carreras registradas</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Duración</TableHead>
                <TableHead>Capacidad</TableHead>
                <TableHead>Inscritos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses?.map((course) => (
                <TableRow key={course.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{course.name}</p>
                      {course.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {course.description}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{course.duration}</TableCell>
                  <TableCell>{course.capacity}</TableCell>
                  <TableCell>{course.enrolled}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        isCourseActive(course.active)
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }
                    >
                      {isCourseActive(course.active) && <Check className="w-3 h-3 mr-1" />}
                      {isCourseActive(course.active) ? "Activa" : "Inactiva"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(course)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(course.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!courses || courses.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No hay carreras registradas
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
