"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export interface FormData {
  // Enrollment Settings
  enrollment_open: boolean
  enrollment_start_date: string
  enrollment_end_date: string
  // Agreement
  hasAcceptedAgreement: boolean
  // Personal Info
  first_name: string
  last_name: string
  cedula: string
  age: number | null
  gender: string
  birth_date: string
  // Representatives
  father_first_name: string
  father_last_name: string
  father_phone: string
  father_email: string
  father_cannot_provide: boolean
  mother_first_name: string
  mother_last_name: string
  mother_phone: string
  mother_email: string
  mother_cannot_provide: boolean
  guardian_first_name: string
  guardian_last_name: string
  guardian_phone: string
  guardian_email: string
  guardian_cannot_provide: boolean
  // Contact Info
  email: string
  phone: string
  // Academic Info
  previous_institution: string
  course_id: number | null
  course_name: string
  // Documents
  hasIdCopy: boolean
  hasBirthCertificate: boolean
  hasGrades: boolean
  hasPhoto: boolean
}

const initialFormData: FormData = {
  enrollment_open: true,
  enrollment_start_date: "",
  enrollment_end_date: "",
  hasAcceptedAgreement: false,
  first_name: "",
  last_name: "",
  cedula: "",
  age: null,
  gender: "",
  birth_date: "",
  father_first_name: "",
  father_last_name: "",
  father_phone: "",
  father_email: "",
  father_cannot_provide: false,
  mother_first_name: "",
  mother_last_name: "",
  mother_phone: "",
  mother_email: "",
  mother_cannot_provide: false,
  guardian_first_name: "",
  guardian_last_name: "",
  guardian_phone: "",
  guardian_email: "",
  guardian_cannot_provide: false,
  email: "",
  phone: "",
  previous_institution: "",
  course_id: null,
  course_name: "",
  hasIdCopy: false,
  hasBirthCertificate: false,
  hasGrades: false,
  hasPhoto: false,
}

interface FormContextType {
  formData: FormData
  updateFormData: (data: Partial<FormData>) => void
  currentStep: number
  setCurrentStep: (step: number) => void
  resetForm: () => void
}

const FormContext = createContext<FormContextType | undefined>(undefined)

export function FormProvider({ children }: { children: ReactNode }) {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [currentStep, setCurrentStep] = useState(0)

  const updateFormData = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const resetForm = () => {
    setFormData(initialFormData)
    setCurrentStep(0)
  }

  return (
    <FormContext.Provider
      value={{ formData, updateFormData, currentStep, setCurrentStep, resetForm }}
    >
      {children}
    </FormContext.Provider>
  )
}

export function useFormContext() {
  const context = useContext(FormContext)
  if (!context) {
    throw new Error("useFormContext must be used within a FormProvider")
  }
  return context
}
