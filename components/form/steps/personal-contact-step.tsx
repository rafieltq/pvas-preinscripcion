"use client"

import { useFormContext } from "@/lib/form-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertCircle, AlertTriangle } from "lucide-react"

const DR_PHONE_REGEX = /^(809|829|849)\d{7}$/

function onlyDigits(value: string) {
  return value.replace(/\D/g, "")
}

function getPhoneDigitCount(value: string): number {
  return onlyDigits(value).length
}

function isValidDrPhone(value: string) {
  return DR_PHONE_REGEX.test(onlyDigits(value))
}

function getPhoneError(phone: string): string | null {
  if (!phone.trim()) return null
  
  const digits = getPhoneDigitCount(phone)
  if (digits === 0) return null
  
  if (digits < 10) {
    return `El teléfono debe tener 10 dígitos. Actualmente tiene ${digits} dígito(s). Formato esperado: 809-000-0000`
  }
  if (digits > 10) {
    return `El teléfono tiene ${digits} dígitos. Máximo permitido: 10 dígitos.`
  }
  if (!isValidDrPhone(phone)) {
    return `Teléfono inválido. Debe comenzar con 809, 829 o 849. Ejemplo: 809-555-0100`
  }
  
  return null
}

function getNameError(name: string, label: string): string | null {
  if (name.trim()) return null
  
  return `El ${label} es requerido`
}

interface PersonalContactStepProps {
  onNext: () => void
  onBack: () => void
}

export function PersonalContactStep({ onNext, onBack }: PersonalContactStepProps) {
  const { formData, updateFormData, formErrors, clearFieldError } = useFormContext()

  const handleFieldChange = (field: string, value: string | number | null) => {
    updateFormData({ [field]: value })
    clearFieldError(field)
  }

  const hasAtLeastOneRepresentative = 
    (!formData.father_cannot_provide && 
      formData.father_first_name.trim() && 
      formData.father_last_name.trim() && 
      isValidDrPhone(formData.father_phone)) ||
    (!formData.mother_cannot_provide && 
      formData.mother_first_name.trim() && 
      formData.mother_last_name.trim() && 
      isValidDrPhone(formData.mother_phone)) ||
    (!formData.guardian_cannot_provide && 
      formData.guardian_first_name.trim() && 
      formData.guardian_last_name.trim() && 
      isValidDrPhone(formData.guardian_phone))

  const isValid = hasAtLeastOneRepresentative &&
    formData.first_name.trim() &&
    formData.last_name.trim() &&
    formData.cedula.trim() &&
    formData.age !== null &&
    formData.gender !== "" &&
    formData.birth_date

  const fatherPhoneError = getPhoneError(formData.father_phone)
  const motherPhoneError = getPhoneError(formData.mother_phone)
  const guardianPhoneError = getPhoneError(formData.guardian_phone)

  const fatherNameError = getNameError(formData.father_first_name, "nombre del padre") || 
    (formData.father_first_name.trim() && getNameError(formData.father_last_name, "apellido del padre"))
  const motherNameError = getNameError(formData.mother_first_name, "nombre de la madre") ||
    (formData.mother_first_name.trim() && getNameError(formData.mother_last_name, "apellido de la madre"))
  const guardianNameError = getNameError(formData.guardian_first_name, "nombre del tutor") ||
    (formData.guardian_first_name.trim() && getNameError(formData.guardian_last_name, "apellido del tutor"))

  const hasFatherPartial = formData.father_first_name.trim() || formData.father_last_name.trim() || formData.father_phone.trim()
  const hasMotherPartial = formData.mother_first_name.trim() || formData.mother_last_name.trim() || formData.mother_phone.trim()
  const hasGuardianPartial = formData.guardian_first_name.trim() || formData.guardian_last_name.trim() || formData.guardian_phone.trim()

  const fatherIncomplete = !formData.father_cannot_provide && hasFatherPartial && !(
    formData.father_first_name.trim() && 
    formData.father_last_name.trim() && 
    isValidDrPhone(formData.father_phone)
  )
  const motherIncomplete = !formData.mother_cannot_provide && hasMotherPartial && !(
    formData.mother_first_name.trim() && 
    formData.mother_last_name.trim() && 
    isValidDrPhone(formData.mother_phone)
  )
  const guardianIncomplete = !formData.guardian_cannot_provide && hasGuardianPartial && !(
    formData.guardian_first_name.trim() && 
    formData.guardian_last_name.trim() && 
    isValidDrPhone(formData.guardian_phone)
  )

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
              onChange={(e) => handleFieldChange("first_name", e.target.value)}
              placeholder="Juan"
              className={formErrors.first_name ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {formErrors.first_name && (
              <div className="flex items-center gap-1.5 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{formErrors.first_name}</span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="last_name">Apellido *</Label>
            <Input
              id="last_name"
              value={formData.last_name}
              onChange={(e) => handleFieldChange("last_name", e.target.value)}
              placeholder="Pérez"
              className={formErrors.last_name ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {formErrors.last_name && (
              <div className="flex items-center gap-1.5 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{formErrors.last_name}</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cedula">Cédula *</Label>
            <Input
              id="cedula"
              value={formData.cedula}
              onChange={(e) => handleFieldChange("cedula", e.target.value)}
              placeholder="00100000000"
              className={formErrors.cedula ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {formErrors.cedula && (
              <div className="flex items-center gap-1.5 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{formErrors.cedula}</span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="age">Edad *</Label>
            <Input
              id="age"
              type="number"
              min="1"
              max="100"
              value={formData.age ?? ""}
              onChange={(e) => handleFieldChange("age", e.target.value ? Number(e.target.value) : null)}
              placeholder="15"
              className={formErrors.age ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {formErrors.age && (
              <div className="flex items-center gap-1.5 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{formErrors.age}</span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Género *</Label>
            <select
              id="gender"
              value={formData.gender}
              onChange={(e) => handleFieldChange("gender", e.target.value)}
              className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${formErrors.gender ? "border-destructive focus-visible:ring-destructive" : ""}`}
            >
              <option value="">Seleccione</option>
              <option value="M">Masculino</option>
              <option value="F">Femenino</option>
            </select>
            {formErrors.gender && (
              <div className="flex items-center gap-1.5 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{formErrors.gender}</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="birth_date">Fecha de Nacimiento *</Label>
            <Input
              id="birth_date"
              type="date"
              value={formData.birth_date}
              onChange={(e) => handleFieldChange("birth_date", e.target.value)}
              className={formErrors.birth_date ? "border-destructive focus-visible:ring-destructive" : ""}
            />
            {formErrors.birth_date && (
              <div className="flex items-center gap-1.5 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{formErrors.birth_date}</span>
              </div>
            )}
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
              onChange={(e) => updateFormData({ phone: e.target.value })}
              placeholder="8090000000"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium text-foreground">Representantes</h3>

        {(!formData.father_cannot_provide && fatherIncomplete) && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Información incompleta del padre</p>
                <p className="text-destructive/80 mt-1">
                  Complete todos los campos requeridos: nombre, apellido y teléfono válido (10 dígitos).
                </p>
              </div>
            </div>
          </div>
        )}

        {(!formData.mother_cannot_provide && motherIncomplete) && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Información incompleta de la madre</p>
                <p className="text-destructive/80 mt-1">
                  Complete todos los campos requeridos: nombre, apellido y teléfono válido (10 dígitos).
                </p>
              </div>
            </div>
          </div>
        )}

        {(!formData.guardian_cannot_provide && guardianIncomplete) && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Información incompleta del tutor</p>
                <p className="text-destructive/80 mt-1">
                  Complete todos los campos requeridos: nombre, apellido y teléfono válido (10 dígitos).
                </p>
              </div>
            </div>
          </div>
        )}

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
                  onChange={(e) => handleFieldChange("father_first_name", e.target.value)}
                  placeholder="Ejemplo: Juan"
                />
                {fatherNameError && hasFatherPartial && (
                  <div className="flex items-center gap-1.5 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{fatherNameError}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="father_last_name">Apellido</Label>
                <Input
                  id="father_last_name"
                  value={formData.father_last_name}
                  onChange={(e) => handleFieldChange("father_last_name", e.target.value)}
                  placeholder="Ejemplo: Pérez"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="father_phone">Teléfono *</Label>
                <Input
                  id="father_phone"
                  type="tel"
                  value={formData.father_phone}
                  onChange={(e) => handleFieldChange("father_phone", e.target.value)}
                  placeholder="8095550100"
                />
                {fatherPhoneError && hasFatherPartial && (
                  <div className="flex items-start gap-1.5 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>{fatherPhoneError}</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">10 dígitos: 809, 829 o 849</p>
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
                  onChange={(e) => handleFieldChange("mother_first_name", e.target.value)}
                  placeholder="Ejemplo: Ana"
                />
                {motherNameError && hasMotherPartial && (
                  <div className="flex items-center gap-1.5 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{motherNameError}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="mother_last_name">Apellido</Label>
                <Input
                  id="mother_last_name"
                  value={formData.mother_last_name}
                  onChange={(e) => handleFieldChange("mother_last_name", e.target.value)}
                  placeholder="Ejemplo: Gómez"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mother_phone">Teléfono *</Label>
                <Input
                  id="mother_phone"
                  type="tel"
                  value={formData.mother_phone}
                  onChange={(e) => handleFieldChange("mother_phone", e.target.value)}
                  placeholder="8295550100"
                />
                {motherPhoneError && hasMotherPartial && (
                  <div className="flex items-start gap-1.5 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>{motherPhoneError}</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">10 dígitos: 809, 829 o 849</p>
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
                  onChange={(e) => handleFieldChange("guardian_first_name", e.target.value)}
                  placeholder="Ejemplo: Carlos"
                />
                {guardianNameError && hasGuardianPartial && (
                  <div className="flex items-center gap-1.5 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{guardianNameError}</span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardian_last_name">Apellido</Label>
                <Input
                  id="guardian_last_name"
                  value={formData.guardian_last_name}
                  onChange={(e) => handleFieldChange("guardian_last_name", e.target.value)}
                  placeholder="Ejemplo: Díaz"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="guardian_phone">Teléfono *</Label>
                <Input
                  id="guardian_phone"
                  type="tel"
                  value={formData.guardian_phone}
                  onChange={(e) => handleFieldChange("guardian_phone", e.target.value)}
                  placeholder="8495550100"
                />
                {guardianPhoneError && hasGuardianPartial && (
                  <div className="flex items-start gap-1.5 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>{guardianPhoneError}</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">10 dígitos: 809, 829 o 849</p>
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
        <div className="rounded-md bg-destructive/10 border border-destructive/30 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 flex-shrink-0 text-destructive mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Representante requerido</p>
              <p className="text-sm text-destructive/80 mt-1">
                Debe completar la información de al menos un representante (padre, madre o tutor) con todos sus datos: nombre, apellido y un teléfono válido de 10 dígitos.
              </p>
            </div>
          </div>
        </div>
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