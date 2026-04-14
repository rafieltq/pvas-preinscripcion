"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Loader2 } from "lucide-react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface Settings {
  enrollment_open: boolean
  enrollment_start_date: string
  enrollment_end_date: string
  institution_name: string
  institution_phone: string
  institution_email: string
  institution_address: string
}

const defaultSettings: Settings = {
  enrollment_open: false,
  enrollment_start_date: "",
  enrollment_end_date: "",
  institution_name: "",
  institution_phone: "",
  institution_email: "",
  institution_address: "",
}

function normalizeSettings(data?: Partial<Settings> | null): Settings {
  return {
    enrollment_open: data?.enrollment_open ?? defaultSettings.enrollment_open,
    enrollment_start_date:
      data?.enrollment_start_date ?? defaultSettings.enrollment_start_date,
    enrollment_end_date: data?.enrollment_end_date ?? defaultSettings.enrollment_end_date,
    institution_name: data?.institution_name ?? defaultSettings.institution_name,
    institution_phone: data?.institution_phone ?? defaultSettings.institution_phone,
    institution_email: data?.institution_email ?? defaultSettings.institution_email,
    institution_address: data?.institution_address ?? defaultSettings.institution_address,
  }
}

export default function AdminSettingsPage() {
  const { data: settings, mutate, isLoading } = useSWR<Partial<Settings>>("/api/settings", fetcher)
  const [formData, setFormData] = useState<Settings>(defaultSettings)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!settings) return
    setFormData(normalizeSettings(settings))
  }, [settings])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsSaving(true)
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      mutate()
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading && !settings) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
        <Card>
          <CardContent className="p-6">
            <div className="h-40 bg-muted animate-pulse" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configuración</h1>
        <p className="text-muted-foreground">
          Ajustes generales del sistema de pre-inscripción
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Periodo de Inscripción</CardTitle>
            <CardDescription>
              Configure las fechas y estado del periodo de inscripción
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Switch
                id="enrollment_open"
                checked={formData.enrollment_open}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, enrollment_open: checked })
                }
              />
              <Label htmlFor="enrollment_open">
                Inscripciones {formData.enrollment_open ? "Abiertas" : "Cerradas"}
              </Label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="enrollment_start_date">Fecha de Inicio</Label>
                <Input
                  id="enrollment_start_date"
                  type="date"
                  value={formData.enrollment_start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, enrollment_start_date: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="enrollment_end_date">Fecha de Cierre</Label>
                <Input
                  id="enrollment_end_date"
                  type="date"
                  value={formData.enrollment_end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, enrollment_end_date: e.target.value })
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información de la Institución</CardTitle>
            <CardDescription>
              Datos de contacto que aparecerán en el formulario
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="institution_name">Nombre de la Institución</Label>
              <Input
                id="institution_name"
                value={formData.institution_name}
                onChange={(e) =>
                  setFormData({ ...formData, institution_name: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="institution_phone">Teléfono</Label>
                <Input
                  id="institution_phone"
                  value={formData.institution_phone}
                  onChange={(e) =>
                    setFormData({ ...formData, institution_phone: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="institution_email">Email</Label>
                <Input
                  id="institution_email"
                  type="email"
                  value={formData.institution_email}
                  onChange={(e) =>
                    setFormData({ ...formData, institution_email: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="institution_address">Dirección</Label>
              <Input
                id="institution_address"
                value={formData.institution_address}
                onChange={(e) =>
                  setFormData({ ...formData, institution_address: e.target.value })
                }
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar Configuración"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
