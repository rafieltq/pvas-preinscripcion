"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export interface FormData {
  // Agreement
  hasAcceptedAgreement: boolean
  // Personal Info
  first_name: string
  last_name: string
  cedula: string
  birth_date: string
  // Representatives
  father_first_name: string
  father_last_name: string
  father_phone: string
  father_cannot_provide: boolean
  mother_first_name: string
  mother_last_name: string
  mother_phone: string
  mother_cannot_provide: boolean
  guardian_first_name: string
  guardian_last_name: string
  guardian_phone: string
  guardian_cannot_provide: boolean
  // Contact Info
  email: string
  phone: string
  address: string
  city: string
  province: string
  // Academic Info
  previous_institution: string
  // Documents
  hasIdCopy: boolean
  hasBirthCertificate: boolean
  hasGrades: boolean
  hasPhoto: boolean
}

const initialFormData: FormData = {
  hasAcceptedAgreement: false,
  first_name: "",
  last_name: "",
  cedula: "",
  birth_date: "",
  father_first_name: "",
  father_last_name: "",
  father_phone: "",
  father_cannot_provide: false,
  mother_first_name: "",
  mother_last_name: "",
  mother_phone: "",
  mother_cannot_provide: false,
  guardian_first_name: "",
  guardian_last_name: "",
  guardian_phone: "",
  guardian_cannot_provide: false,
  email: "",
  phone: "",
  address: "",
  city: "",
  province: "",
  previous_institution: "",
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
