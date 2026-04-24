"use client"

import { useFormContext } from "@/lib/form-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StepIndicator } from "./step-indicator"
import { AgreementStep } from "./steps/agreement-step"
import { PersonalContactStep } from "./steps/personal-contact-step"
import { AcademicInfoStep } from "./steps/academic-info"
import { DocumentsStep } from "./steps/documents-step"
import { ReviewStep } from "./steps/review-step"
import { SuccessStep } from "./steps/success-step"
import { useState } from "react"
import { toast } from "sonner"

const steps = ["Acuerdo", "Personal y Contacto", "Académico", "Documentos", "Revisión"]

interface ApiErrorResponse {
  error: string
  details?: Record<string, string>
}

export function PreInscriptionForm() {
  const { formData, setCurrentStep, resetForm, setFormErrors, currentStep } = useFormContext()
  const [isSuccess, setIsSuccess] = useState(false)

  const handleNext = () => setCurrentStep(currentStep + 1)
  const handleBack = () => setCurrentStep(currentStep - 1)

  const handleSubmit = async () => {
    const response = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: formData.first_name,
        last_name: formData.last_name,
        cedula: formData.cedula,
        age: formData.age,
        gender: formData.gender,
        birth_date: formData.birth_date,
        father_first_name: formData.father_cannot_provide ? null : formData.father_first_name,
        father_last_name: formData.father_cannot_provide ? null : formData.father_last_name,
        father_phone: formData.father_cannot_provide ? null : formData.father_phone,
        father_email: formData.father_cannot_provide ? null : formData.father_email,
        mother_first_name: formData.mother_cannot_provide ? null : formData.mother_first_name,
        mother_last_name: formData.mother_cannot_provide ? null : formData.mother_last_name,
        mother_phone: formData.mother_cannot_provide ? null : formData.mother_phone,
        mother_email: formData.mother_cannot_provide ? null : formData.mother_email,
        guardian_first_name: formData.guardian_cannot_provide ? null : formData.guardian_first_name,
        guardian_last_name: formData.guardian_cannot_provide ? null : formData.guardian_last_name,
        guardian_phone: formData.guardian_cannot_provide ? null : formData.guardian_phone,
        guardian_email: formData.guardian_cannot_provide ? null : formData.guardian_email,
        email: formData.email,
        phone: formData.phone,
        previous_institution: formData.previous_institution,
        education_level: "bachiller_tecnico",
        course_id: formData.course_id,
      }),
    })

    if (response.ok) {
      setIsSuccess(true)
    } else {
      try {
        const data = (await response.json()) as ApiErrorResponse
        
        if (data.details && Object.keys(data.details).length > 0) {
          setFormErrors(data.details)
          
          Object.entries(data.details).forEach(([, message]) => {
            toast.error(message, {
              duration: 5000,
            })
          })
          
          const stepMap: Record<number, number> = {
            1: 1,
            first_name: 1, last_name: 1, cedula: 1, age: 1, gender: 1, birth_date: 1,
            father_first_name: 1, father_last_name: 1, father_phone: 1,
            mother_first_name: 1, mother_last_name: 1, mother_phone: 1,
            guardian_first_name: 1, guardian_last_name: 1, guardian_phone: 1,
            2: 2,
            previous_institution: 2, course_id: 2,
            3: 3,
            hasIdCopy: 3, hasBirthCertificate: 3, hasGrades: 3, hasPhoto: 3,
          }
          
          const targetStep = stepMap[Object.keys(data.details)[0] as keyof typeof stepMap]
          if (targetStep !== undefined && targetStep !== currentStep) {
            setCurrentStep(targetStep)
          }
        } else {
          toast.error(data.error || "Error al enviar la solicitud. Por favor intente de nuevo.", {
            duration: 5000,
          })
        }
      } catch {
        toast.error("Error al procesar la respuesta del servidor. Por favor intente de nuevo.", {
          duration: 5000,
        })
      }
    }
  }

  const handleReset = () => {
    resetForm()
    setIsSuccess(false)
  }

  if (isSuccess) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <SuccessStep onReset={handleReset} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto border-border/80 shadow-md">
      <CardHeader className="text-center border-b border-border/70">
        <CardTitle className="text-2xl">Pre-Inscripcion</CardTitle>
        <CardDescription>
          Complete el formulario para iniciar su proceso de admisión
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <p className="mb-4 text-center text-sm text-muted-foreground">
          Paso {currentStep + 1} de {steps.length}
        </p>
        <StepIndicator steps={steps} currentStep={currentStep} />

        {currentStep === 0 && <AgreementStep onNext={handleNext} />}
        {currentStep === 1 && <PersonalContactStep onNext={handleNext} onBack={handleBack} />}
        {currentStep === 2 && <AcademicInfoStep onNext={handleNext} onBack={handleBack} />}
        {currentStep === 3 && <DocumentsStep onNext={handleNext} onBack={handleBack} />}
        {currentStep === 4 && <ReviewStep onBack={handleBack} onSubmit={handleSubmit} />}
      </CardContent>
    </Card>
  )
}
