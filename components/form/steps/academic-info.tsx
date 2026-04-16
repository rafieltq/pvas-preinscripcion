"use client"

import { useEffect, useState } from "react"
import { useFormContext } from "@/lib/form-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface CourseOption {
  id: number
  name: string
}

interface AcademicInfoStepProps {
  onNext: () => void
  onBack: () => void
}

export function AcademicInfoStep({ onNext, onBack }: AcademicInfoStepProps) {
  const { formData, updateFormData } = useFormContext()
  const [courses, setCourses] = useState<CourseOption[]>([])
  const [isLoadingCourses, setIsLoadingCourses] = useState(true)
  const [coursesError, setCoursesError] = useState("")

  useEffect(() => {
    const controller = new AbortController()

    const loadCourses = async () => {
      try {
        setIsLoadingCourses(true)
        setCoursesError("")

        const response = await fetch("/api/courses", { signal: controller.signal })
        if (!response.ok) {
          throw new Error("No se pudieron cargar las carreras")
        }

        const data = (await response.json()) as CourseOption[]
        setCourses(data)

      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return
        setCourses([])
        setCoursesError("No se pudieron cargar las carreras. Intente de nuevo.")
      } finally {
        setIsLoadingCourses(false)
      }
    }

    loadCourses()

    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (formData.course_id === null) return
    if (courses.some((course) => course.id === formData.course_id)) return

    updateFormData({ course_id: null, course_name: "" })
  }, [courses, formData.course_id, updateFormData])

  const selectedCourseExists =
    formData.course_id !== null && courses.some((course) => course.id === formData.course_id)
  const isValid = formData.previous_institution.trim().length > 0 && selectedCourseExists

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="previous_institution">Escuela / Colegio Anterior *</Label>
        <Input
          id="previous_institution"
          value={formData.previous_institution}
          onChange={(e) => updateFormData({ previous_institution: e.target.value })}
          placeholder="Nombre de la institución"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="course_id">Carrera a cursar *</Label>
        <Select
          value={formData.course_id !== null ? String(formData.course_id) : undefined}
          onValueChange={(value) => {
            const selectedCourse = courses.find((course) => String(course.id) === value)
            updateFormData({
              course_id: Number(value),
              course_name: selectedCourse?.name || "",
            })
          }}
          disabled={isLoadingCourses || courses.length === 0}
        >
          <SelectTrigger id="course_id" className="w-full">
            <SelectValue
              placeholder={isLoadingCourses ? "Cargando carreras..." : "Seleccione una carrera"}
            />
          </SelectTrigger>
          <SelectContent>
            {courses.map((course) => (
              <SelectItem key={course.id} value={String(course.id)}>
                {course.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {coursesError && <p className="text-sm text-destructive">{coursesError}</p>}
        {!isLoadingCourses && !coursesError && courses.length === 0 && (
          <p className="text-sm text-muted-foreground">No hay carreras disponibles en este momento.</p>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Atrás
        </Button>
        <Button onClick={onNext} disabled={!isValid || isLoadingCourses || courses.length === 0}>
          Continuar
        </Button>
      </div>
    </div>
  )
}
