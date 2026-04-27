"use client"

import { FormProvider } from "@/lib/form-context"
import { PreInscriptionForm } from "@/components/form/pre-inscription-form"
import Image from "next/image"
import Link from "next/link"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

interface PublicSettings {
  enrollment_open: boolean
  enrollment_start_date: string
  enrollment_end_date: string
}

export default function HomePage() {
  const { data: publicSettings } = useSWR<PublicSettings>("/api/settings/public", fetcher)
  const isEnrollmentOpen = publicSettings?.enrollment_open ?? true

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-primary text-primary-foreground py-6 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image src="/logo.webp" alt="Logo Politécnico Vicente Aquilino Santos" width={40} height={40} className="w-10 h-10 rounded-full bg-white" priority />
              <div>
                <h1 className="text-xl font-bold">Politécnico Vicente Aquilino Santos</h1>
                <p className="text-sm text-primary-foreground/80">Sistema de Pre-Inscripción</p>
              </div>
            </div>
            <Link
              href="/admin"
              className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
            >
              Administración
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 flex-1">
        {!isEnrollmentOpen ? (
          <div className="bg-muted text-muted-foreground px-4 py-8 rounded-md text-center max-w-2xl mx-auto">
            <h2 className="text-xl font-semibold mb-2">Inscripciones Cerradas</h2>
            <p className="text-sm">
              Las inscripciones no están disponibles en este momento. Por favor, comuníquese con la
              institución para más información.
            </p>
          </div>
        ) : (
          <FormProvider>
            <PreInscriptionForm />
          </FormProvider>
        )}
      </main>

      <footer className="border-t border-border py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} Politécnico Vicente Aquilino Santos. Todos los derechos
            reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
