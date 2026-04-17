"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface StudentInfo {
  id: number
  first_name: string
  last_name: string
  email: string
  course_name?: string
  is_verified: boolean
  pin_expired: boolean
  pin_locked: boolean
}

interface StudentData {
  id: number
  first_name: string
  last_name: string
  cedula: string
  age: number | null
  gender: string | null
  birth_date: string
  father_first_name: string | null
  father_last_name: string | null
  father_phone: string | null
  father_email: string | null
  mother_first_name: string | null
  mother_last_name: string | null
  mother_phone: string | null
  mother_email: string | null
  guardian_first_name: string | null
  guardian_last_name: string | null
  guardian_phone: string | null
  guardian_email: string | null
  email: string
  phone: string
  education_level: string
  previous_institution: string
  course_id: number | null
  course_name?: string
}

type VerificationState = "loading" | "pin_entry" | "form" | "success" | "error" | "locked"

export default function CorrectionPage() {
  const params = useParams()
  const router = useRouter()
  const studentId = params.student_id as string

  const [state, setState] = useState<VerificationState>("loading")
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null)
  const [studentData, setStudentData] = useState<StudentData | null>(null)
  const [pin, setPin] = useState("")
  const [pinError, setPinError] = useState("")
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<Partial<StudentData>>({})
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const fetchStudentInfo = useCallback(async () => {
    try {
      const res = await fetch(`/api/correction/${studentId}`)
      const data = await res.json()

      if (!res.ok) {
        setState("error")
        setStudentInfo(null)
        return
      }

      setStudentInfo(data)

      if (data.is_verified) {
        setState("form")
        fetchStudentData()
      } else if (data.pin_locked) {
        setState("locked")
      } else {
        setState("pin_entry")
      }
    } catch {
      setState("error")
    }
  }, [studentId])

  useEffect(() => {
    fetchStudentInfo()
  }, [fetchStudentInfo])

  const fetchStudentData = async () => {
    try {
      const res = await fetch(`/api/correction/${studentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check-verification" }),
      })

      if (!res.ok) {
        if (res.status === 401) {
          setState("pin_entry")
          return
        }
        throw new Error("Failed to fetch student data")
      }

      const data = await res.json()
      setStudentData(data.student)
      setFormData(data.student)
    } catch {
      toast.error("Error al cargar los datos del estudiante")
    }
  }

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPinError("")
    setIsSubmitting(true)

    try {
      const res = await fetch(`/api/correction/${studentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify-pin", pin }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        if (data.locked) {
          setState("locked")
        } else {
          setPinError(data.error || "PIN incorrecto")
          setAttemptsRemaining(data.attempts_remaining)
        }
        return
      }

      setState("form")
      await fetchStudentData()
    } catch {
      setPinError("Error al verificar el PIN")
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateFormField = (field: keyof StudentData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.first_name?.trim()) errors.first_name = "El nombre es requerido"
    if (!formData.last_name?.trim()) errors.last_name = "El apellido es requerido"
    if (!formData.cedula?.trim()) errors.cedula = "La cédula es requerida"
    if (!formData.email?.trim()) errors.email = "El correo es requerido"
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Correo electrónico inválido"
    }

    const hasFather = formData.father_first_name?.trim() && formData.father_last_name?.trim() && formData.father_phone?.trim()
    const hasMother = formData.mother_first_name?.trim() && formData.mother_last_name?.trim() && formData.mother_phone?.trim()
    const hasGuardian = formData.guardian_first_name?.trim() && formData.guardian_last_name?.trim() && formData.guardian_phone?.trim()

    if (!hasFather && !hasMother && !hasGuardian) {
      errors.representative = "Debe incluir al menos un representante completo (padre, madre o tutor)"
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      toast.error("Por favor complete todos los campos requeridos")
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch(`/api/correction/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        toast.error(data.error || "Error al guardar los cambios")
        return
      }

      setState("success")
      toast.success("Cambios guardados exitosamente")
    } catch {
      toast.error("Error al guardar los cambios")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (state === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Estudiante no encontrado</CardTitle>
            <CardDescription className="text-center">
              El enlace de corrección no es válido o ha expirado.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (state === "locked") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-600">Cuenta bloqueada</CardTitle>
            <CardDescription>
              Ha superado el número máximo de intentos. Por favor contacte a la institución para obtener un nuevo enlace.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center text-sm text-gray-500">
            <p>Politécnico Vicente Aquilino Santos</p>
            <p>inscripciones@pvas.edu.do</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (state === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-xl text-green-600">Cambios guardados</CardTitle>
            <CardDescription>
              Sus datos han sido actualizados exitosamente.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => router.push("/")} className="w-full">
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <Image src="/logo.webp" alt="Logo" width={80} height={80} className="mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900">Politécnico Vicente Aquilino Santos</h1>
          <p className="text-gray-500">Corrección de datos de pre-inscripción</p>
        </div>

        {state === "pin_entry" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Verificación de identidad</CardTitle>
              <CardDescription className="text-center">
                Ingrese el código PIN que recibió en su correo electrónico
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePinSubmit} className="space-y-4">
                {studentInfo && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>{studentInfo.first_name} {studentInfo.last_name}</strong>
                      <br />
                      <span className="text-sm">{studentInfo.email}</span>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="pin">Código de verificación</Label>
                  <Input
                    id="pin"
                    type="text"
                    value={pin}
                    onChange={(e) => setPin(e.target.value.toUpperCase())}
                    placeholder="______"
                    maxLength={6}
                    className="text-center text-2xl tracking-widest font-mono"
                    disabled={isSubmitting}
                  />
                  {pinError && (
                    <p className="text-sm text-red-600">{pinError}</p>
                  )}
                  {attemptsRemaining !== null && attemptsRemaining > 0 && (
                    <p className="text-sm text-amber-600">
                      Le quedan {attemptsRemaining} intento(s)
                    </p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting || pin.length !== 6}>
                  {isSubmitting ? "Verificando..." : "Verificar"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {state === "form" && studentData && (
          <Card>
            <CardHeader>
              <CardTitle>Editar datos personales</CardTitle>
              <CardDescription>
                Actualice la información que desea corregir
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Datos del estudiante</h3>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">Nombre *</Label>
                      <Input
                        id="first_name"
                        value={formData.first_name || ""}
                        onChange={(e) => updateFormField("first_name", e.target.value)}
                      />
                      {formErrors.first_name && (
                        <p className="text-sm text-red-600">{formErrors.first_name}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="last_name">Apellido *</Label>
                      <Input
                        id="last_name"
                        value={formData.last_name || ""}
                        onChange={(e) => updateFormField("last_name", e.target.value)}
                      />
                      {formErrors.last_name && (
                        <p className="text-sm text-red-600">{formErrors.last_name}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="cedula">Cédula *</Label>
                      <Input
                        id="cedula"
                        value={formData.cedula || ""}
                        onChange={(e) => updateFormField("cedula", e.target.value)}
                      />
                      {formErrors.cedula && (
                        <p className="text-sm text-red-600">{formErrors.cedula}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="birth_date">Fecha de nacimiento</Label>
                      <Input
                        id="birth_date"
                        type="date"
                        value={formData.birth_date || ""}
                        onChange={(e) => updateFormField("birth_date", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="age">Edad</Label>
                      <Input
                        id="age"
                        type="number"
                        value={formData.age || ""}
                        onChange={(e) => updateFormField("age", e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gender">Género</Label>
                      <Select
                        value={formData.gender || ""}
                        onValueChange={(value) => updateFormField("gender", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="M">Masculino</SelectItem>
                          <SelectItem value="F">Femenino</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="email">Correo electrónico *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email || ""}
                        onChange={(e) => updateFormField("email", e.target.value)}
                      />
                      {formErrors.email && (
                        <p className="text-sm text-red-600">{formErrors.email}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        value={formData.phone || ""}
                        onChange={(e) => updateFormField("phone", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Carrera seleccionada</Label>
                    <Input value={studentData.course_name || "N/A"} disabled />
                    <p className="text-sm text-gray-500">La carrera no puede ser modificada</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Datos del padre</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="father_first_name">Nombre</Label>
                      <Input
                        id="father_first_name"
                        value={formData.father_first_name || ""}
                        onChange={(e) => updateFormField("father_first_name", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="father_last_name">Apellido</Label>
                      <Input
                        id="father_last_name"
                        value={formData.father_last_name || ""}
                        onChange={(e) => updateFormField("father_last_name", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="father_phone">Teléfono</Label>
                      <Input
                        id="father_phone"
                        value={formData.father_phone || ""}
                        onChange={(e) => updateFormField("father_phone", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="father_email">Correo electrónico</Label>
                    <Input
                      id="father_email"
                      type="email"
                      value={formData.father_email || ""}
                      onChange={(e) => updateFormField("father_email", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Datos de la madre</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="mother_first_name">Nombre</Label>
                      <Input
                        id="mother_first_name"
                        value={formData.mother_first_name || ""}
                        onChange={(e) => updateFormField("mother_first_name", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mother_last_name">Apellido</Label>
                      <Input
                        id="mother_last_name"
                        value={formData.mother_last_name || ""}
                        onChange={(e) => updateFormField("mother_last_name", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mother_phone">Teléfono</Label>
                      <Input
                        id="mother_phone"
                        value={formData.mother_phone || ""}
                        onChange={(e) => updateFormField("mother_phone", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mother_email">Correo electrónico</Label>
                    <Input
                      id="mother_email"
                      type="email"
                      value={formData.mother_email || ""}
                      onChange={(e) => updateFormField("mother_email", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900">Datos del tutor (si aplica)</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="guardian_first_name">Nombre</Label>
                      <Input
                        id="guardian_first_name"
                        value={formData.guardian_first_name || ""}
                        onChange={(e) => updateFormField("guardian_first_name", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="guardian_last_name">Apellido</Label>
                      <Input
                        id="guardian_last_name"
                        value={formData.guardian_last_name || ""}
                        onChange={(e) => updateFormField("guardian_last_name", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="guardian_phone">Teléfono</Label>
                      <Input
                        id="guardian_phone"
                        value={formData.guardian_phone || ""}
                        onChange={(e) => updateFormField("guardian_phone", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guardian_email">Correo electrónico</Label>
                    <Input
                      id="guardian_email"
                      type="email"
                      value={formData.guardian_email || ""}
                      onChange={(e) => updateFormField("guardian_email", e.target.value)}
                    />
                  </div>
                </div>

                {formErrors.representative && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{formErrors.representative}</AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Guardando..." : "Guardar cambios"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
