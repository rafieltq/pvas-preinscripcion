"use client"

import { useFormContext } from "@/lib/form-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

const DR_PHONE_REGEX = /^(809|829|849)\d{7}$/

function onlyDigits(value: string) {
  return value.replace(/\D/g, "")
}

function formatDrPhone(value: string) {
  const digits = onlyDigits(value).slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
}

function isValidDrPhone(value: string) {
  return DR_PHONE_REGEX.test(onlyDigits(value))
}

interface PersonalContactStepProps {
  onNext: () => void
  onBack: () => void
}

export function PersonalContactStep({ onNext, onBack }: PersonalContactStepProps) {
  const { formData, updateFormData } = useFormContext()

  const hasBasePersonalInfo =
    formData.first_name.trim() &&
    formData.last_name.trim() &&
    formData.cedula.trim() &&
    formData.age !== null &&
    formData.gender !== "" &&
    formData.birth_date

  const hasFatherInfo =
    !formData.father_cannot_provide &&
    formData.father_first_name.trim() &&
    formData.father_last_name.trim() &&
    isValidDrPhone(formData.father_phone)

  const hasMotherInfo =
    !formData.mother_cannot_provide &&
    formData.mother_first_name.trim() &&
    formData.mother_last_name.trim() &&
    isValidDrPhone(formData.mother_phone)

  const hasGuardianInfo =
    !formData.guardian_cannot_provide &&
    formData.guardian_first_name.trim() &&
    formData.guardian_last_name.trim() &&
    isValidDrPhone(formData.guardian_phone)

  const hasAtLeastOneRepresentative = hasFatherInfo || hasMotherInfo || hasGuardianInfo

  const isValid = hasBasePersonalInfo && hasAtLeastOneRepresentative

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-medium text-foreground">Datos del Estudiante</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">Nombre *</Label>
            <Input
              id="first_name"
              value={formData.first_name}
              onChange={(e) => updateFormData({ first_name: e.target.value })}
              placeholder="Juan"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Apellido *</Label>
            <Input
              id="last_name"
              value={formData.last_name}
              onChange={(e) => updateFormData({ last_name: e.target.value })}
              placeholder="Pérez"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cedula">Cédula *</Label>
            <Input
              id="cedula"
              value={formData.cedula}
              onChange={(e) => updateFormData({ cedula: e.target.value })}
              placeholder="00100000000"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="age">Edad *</Label>
            <Input
              id="age"
              type="number"
              min="1"
              max="100"
              value={formData.age ?? ""}
              onChange={(e) => updateFormData({ age: e.target.value ? Number(e.target.value) : null })}
              placeholder="15"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Género *</Label>
            <select
              id="gender"
              value={formData.gender}
              onChange={(e) => updateFormData({ gender: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Seleccione</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="birth_date">Fecha de Nacimiento *</Label>
            <Input
              id="birth_date"
              type="date"
              value={formData.birth_date}
              onChange={(e) => updateFormData({ birth_date: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => updateFormData({ email: e.target.value })}
              placeholder="juan@ejemplo.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => updateFormData({ phone: formatDrPhone(e.target.value) })}
              placeholder="809-000-0000"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium text-foreground">Representantes</h3>

        <div className="rounded-md border p-4 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h4 className="font-medium text-foreground">Padre</h4>
            <div className="flex items-center gap-2">
              <Checkbox
                id="father_cannot_provide"
                checked={formData.father_cannot_provide}
                onCheckedChange={(checked) => {
                  const cannotProvide = checked === true
                  updateFormData({
                    father_cannot_provide: cannotProvide,
                    father_first_name: cannotProvide ? "" : formData.father_first_name,
                    father_last_name: cannotProvide ? "" : formData.father_last_name,
                    father_phone: cannotProvide ? "" : formData.father_phone,
                    father_email: cannotProvide ? "" : formData.father_email,
                  })
                }}
              />
              <Label htmlFor="father_cannot_provide" className="cursor-pointer text-sm">
                No se puede llenar
              </Label>
            </div>
          </div>

          {!formData.father_cannot_provide && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="father_first_name">Nombre</Label>
                <Input
                  id="father_first_name"
                  value={formData.father_first_name}
                  onChange={(e) => updateFormData({ father_first_name: e.target.value })}
                  placeholder="Ejemplo: Juan"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="father_last_name">Apellido</Label>
                <Input
                  id="father_last_name"
                  value={formData.father_last_name}
                  onChange={(e) => updateFormData({ father_last_name: e.target.value })}
                  placeholder="Ejemplo: Pérez"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="father_phone">Teléfono</Label>
                <Input
                  id="father_phone"
                  type="tel"
                  value={formData.father_phone}
                  onChange={(e) => updateFormData({ father_phone: formatDrPhone(e.target.value) })}
                  placeholder="809-555-0100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="father_email">Correo</Label>
                <Input
                  id="father_email"
                  type="email"
                  value={formData.father_email}
                  onChange={(e) => updateFormData({ father_email: e.target.value })}
                  placeholder="padre@email.com"
                />
              </div>
            </div>
          )}
        </div>

        <div className="rounded-md border p-4 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h4 className="font-medium text-foreground">Madre</h4>
            <div className="flex items-center gap-2">
              <Checkbox
                id="mother_cannot_provide"
                checked={formData.mother_cannot_provide}
                onCheckedChange={(checked) => {
                  const cannotProvide = checked === true
                  updateFormData({
                    mother_cannot_provide: cannotProvide,
                    mother_first_name: cannotProvide ? "" : formData.mother_first_name,
                    mother_last_name: cannotProvide ? "" : formData.mother_last_name,
                    mother_phone: cannotProvide ? "" : formData.mother_phone,
                    mother_email: cannotProvide ? "" : formData.mother_email,
                  })
                }}
              />
              <Label htmlFor="mother_cannot_provide" className="cursor-pointer text-sm">
                No se puede llenar
              </Label>
            </div>
          </div>

          {!formData.mother_cannot_provide && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mother_first_name">Nombre</Label>
                <Input
                  id="mother_first_name"
                  value={formData.mother_first_name}
                  onChange={(e) => updateFormData({ mother_first_name: e.target.value })}
                  placeholder="Ejemplo: Ana"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mother_last_name">Apellido</Label>
                <Input
                  id="mother_last_name"
                  value={formData.mother_last_name}
                  onChange={(e) => updateFormData({ mother_last_name: e.target.value })}
                  placeholder="Ejemplo: Gómez"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mother_phone">Teléfono</Label>
                <Input
                  id="mother_phone"
                  type="tel"
                  value={formData.mother_phone}
                  onChange={(e) => updateFormData({ mother_phone: formatDrPhone(e.target.value) })}
                  placeholder="829-555-0100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mother_email">Correo</Label>
                <Input
                  id="mother_email"
                  type="email"
                  value={formData.mother_email}
                  onChange={(e) => updateFormData({ mother_email: e.target.value })}
                  placeholder="madre@email.com"
                />
              </div>
            </div>
          )}
        </div>

        <div className="rounded-md border p-4 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <h4 className="font-medium text-foreground">Tutor</h4>
            <div className="flex items-center gap-2">
              <Checkbox
                id="guardian_cannot_provide"
                checked={formData.guardian_cannot_provide}
                onCheckedChange={(checked) => {
                  const cannotProvide = checked === true
                  updateFormData({
                    guardian_cannot_provide: cannotProvide,
                    guardian_first_name: cannotProvide ? "" : formData.guardian_first_name,
                    guardian_last_name: cannotProvide ? "" : formData.guardian_last_name,
                    guardian_phone: cannotProvide ? "" : formData.guardian_phone,
                    guardian_email: cannotProvide ? "" : formData.guardian_email,
                  })
                }}
              />
              <Label htmlFor="guardian_cannot_provide" className="cursor-pointer text-sm">
                No se puede llenar
              </Label>
            </div>
          </div>

          {!formData.guardian_cannot_provide && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="guardian_first_name">Nombre</Label>
                <Input
                  id="guardian_first_name"
                  value={formData.guardian_first_name}
                  onChange={(e) => updateFormData({ guardian_first_name: e.target.value })}
                  placeholder="Ejemplo: Carlos"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardian_last_name">Apellido</Label>
                <Input
                  id="guardian_last_name"
                  value={formData.guardian_last_name}
                  onChange={(e) => updateFormData({ guardian_last_name: e.target.value })}
                  placeholder="Ejemplo: Díaz"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardian_phone">Teléfono</Label>
                <Input
                  id="guardian_phone"
                  type="tel"
                  value={formData.guardian_phone}
                  onChange={(e) => updateFormData({ guardian_phone: formatDrPhone(e.target.value) })}
                  placeholder="849-555-0100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardian_email">Correo</Label>
                <Input
                  id="guardian_email"
                  type="email"
                  value={formData.guardian_email}
                  onChange={(e) => updateFormData({ guardian_email: e.target.value })}
                  placeholder="tutor@email.com"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {!hasAtLeastOneRepresentative && (
        <p className="text-sm text-destructive">
          Debe completar la información de al menos un representante (padre, madre o tutor).
        </p>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Atrás
        </Button>
        <Button onClick={onNext} disabled={!isValid}>
          Continuar
        </Button>
      </div>
    </div>
  )
}
