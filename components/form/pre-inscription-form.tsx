"use client"

import { useFormContext } from "@/lib/form-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StepIndicator } from "./step-indicator"
import { AgreementStep } from "./steps/agreement-step"
import { PersonalInfoStep } from "./steps/personal-info"
import { ContactInfoStep } from "./steps/contact-info"
import { AcademicInfoStep } from "./steps/academic-info"
import { DocumentsStep } from "./steps/documents-step"
import { ReviewStep } from "./steps/review-step"
import { SuccessStep } from "./steps/success-step"
import { useState } from "react"
import { NotebookPen } from "lucide-react"

const steps = ["Acuerdo", "Personal", "Contacto", "Académico", "Documentos", "Revisión"]

export function PreInscriptionForm() {
  const { formData, currentStep, setCurrentStep, resetForm } = useFormContext()
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
      alert("Error al enviar la solicitud. Por favor intente de nuevo.")
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
        {currentStep === 1 && <PersonalInfoStep onNext={handleNext} />}
        {currentStep === 2 && <ContactInfoStep onNext={handleNext} onBack={handleBack} />}
        {currentStep === 3 && <AcademicInfoStep onNext={handleNext} onBack={handleBack} />}
        {currentStep === 4 && <DocumentsStep onNext={handleNext} onBack={handleBack} />}
        {currentStep === 5 && <ReviewStep onBack={handleBack} onSubmit={handleSubmit} />}
      </CardContent>
    </Card>
  )
}
