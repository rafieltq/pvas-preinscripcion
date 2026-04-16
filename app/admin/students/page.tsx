"use client"

import { useState, useEffect, type ChangeEvent } from "react"
import useSWR from "swr"
import Papa from "papaparse"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download, Eye, Upload } from "lucide-react"
import type { Student, Course } from "@/lib/db/types"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  in_review: "bg-blue-100 text-blue-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
}

const statusLabels: Record<string, string> = {
  pending: "Pendiente",
  in_review: "En Revisión",
  accepted: "Aceptado",
  rejected: "Rechazado",
}

const csvSchemaHeaders = [
  "first_name",
  "last_name",
  "cedula",
  "father_first_name",
  "father_last_name",
  "father_phone",
  "mother_first_name",
  "mother_last_name",
  "mother_phone",
  "guardian_first_name",
  "guardian_last_name",
  "guardian_phone",
  "email",
  "phone",
  "birth_date",
  "address",
  "city",
  "province",
  "education_level",
  "previous_institution",
  "course_id",
] as const

type ImportableStudent = {
  [K in (typeof csvSchemaHeaders)[number]]: K extends "course_id" ? number | null : string | null
}

type ImportStatus = "created" | "skipped" | "error"

interface ImportRowResult {
  row: number
  cedula: string
  status: ImportStatus
  reason?: string
}

interface ImportSummary {
  total: number
  created: number
  skipped: number
  errors: number
  results: ImportRowResult[]
  downloadableRows: Array<Record<string, string | number | null>>
}

const requiredFields = ["first_name", "last_name", "email"] as const

const nullableFields = new Set([
  "father_first_name",
  "father_last_name",
  "father_phone",
  "mother_first_name",
  "mother_last_name",
  "mother_phone",
  "guardian_first_name",
  "guardian_last_name",
  "guardian_phone",
])

function getImportStatusStyles(status: ImportStatus) {
  if (status === "created") return "bg-green-100 text-green-800"
  if (status === "skipped") return "bg-yellow-100 text-yellow-800"
  return "bg-red-100 text-red-800"
}

function getImportStatusLabel(status: ImportStatus) {
  if (status === "created") return "Creado"
  if (status === "skipped") return "Omitido"
  return "Error"
}

function csvEscape(value: string | number | null | undefined) {
  if (value === null || value === undefined) return ""

  const stringValue = String(value)
  if (
    stringValue.includes(",") ||
    stringValue.includes("\"") ||
    stringValue.includes("\n") ||
    stringValue.includes("\r")
  ) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }

  return stringValue
}

function downloadCsv(rows: Array<Record<string, string | number | null>>, filename: string) {
  if (rows.length === 0) return

  const headers = [...csvSchemaHeaders, "row", "reason"]
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

function hasStrictSchema(headers: string[]) {
  const cleaned = headers.map((header) => header.trim()).sort()
  const expected = [...csvSchemaHeaders].sort()

  if (cleaned.length !== expected.length) return false

  for (let index = 0; index < expected.length; index += 1) {
    if (cleaned[index] !== expected[index]) return false
  }

  return true
}

function normalizeCsvRow(
  row: Record<string, unknown>,
  rowNumber: number
): { data?: ImportableStudent; reason?: string } {
  const normalized: Partial<ImportableStudent> = {}

  for (const key of csvSchemaHeaders) {
    const raw = row[key]

    if (key === "course_id") {
      if (raw === "" || raw === null || raw === undefined) {
        normalized.course_id = null
        continue
      }

      const parsed = typeof raw === "number" ? raw : Number(String(raw).trim())
      if (!Number.isInteger(parsed) || parsed <= 0) {
        return { reason: `Fila ${rowNumber}: course_id debe ser entero positivo o vacío.` }
      }

      normalized.course_id = parsed
      continue
    }

    const value = raw === null || raw === undefined ? "" : String(raw).trim()

    if (nullableFields.has(key)) {
      normalized[key] = value === "" ? null : value
      continue
    }

    normalized[key] = value
  }

  for (const field of requiredFields) {
    if (!normalized[field]) {
      return { reason: `Fila ${rowNumber}: el campo ${field} es obligatorio.` }
    }
  }

  return { data: normalized as ImportableStudent }
}

export default function AdminStudentsPage() {
  const { data: students, mutate } = useSWR<Student[]>("/api/students", fetcher)
  const { data: courses } = useSWR<Course[]>("/api/courses", fetcher)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isImporting, setIsImporting] = useState(false)
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)

  const filteredStudents = students?.filter((s) =>
    filterStatus === "all" ? true : s.status === filterStatus
  )

  const totalItems = filteredStudents?.length || 0
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems)
  const paginatedStudents = filteredStudents?.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [filterStatus])

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [totalPages, currentPage])

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const getPageNumbers = () => {
    const pages: (number | "...")[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      pages.push(1)

      if (currentPage > 3) {
        pages.push("...")
      }

      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      if (currentPage < totalPages - 2) {
        pages.push("...")
      }

      pages.push(totalPages)
    }

    return pages
  }

  const getCourseName = (courseId: number | null) => {
    if (courseId === null) return "No especificada"
    return courses?.find((c) => c.id === courseId)?.name || "N/A"
  }

  const updateStudentStatus = async (studentId: number, status: string) => {
    await fetch(`/api/students/${studentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    mutate()
    setSelectedStudent(null)
  }

  const downloadTemplate = () => {
    const sampleRow: Record<string, string | number | null> = {
      first_name: "Juan",
      last_name: "Perez",
      cedula: "00112345678",
      father_first_name: "Pedro",
      father_last_name: "Perez",
      father_phone: "8090000001",
      mother_first_name: "Maria",
      mother_last_name: "Lopez",
      mother_phone: "8090000002",
      guardian_first_name: "",
      guardian_last_name: "",
      guardian_phone: "",
      email: "juan@example.com",
      phone: "8090000003",
      birth_date: "2008-01-31",
      address: "Calle Principal #12",
      city: "Santo Domingo",
      province: "Distrito Nacional",
      education_level: "bachiller_tecnico",
      previous_institution: "Liceo Central",
      course_id: 1,
    }

    downloadCsv([sampleRow], "plantilla-importar-estudiantes.csv")
  }

  const handleFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    event.target.value = ""

    if (!selectedFile) return

    setIsImporting(true)
    setImportSummary(null)

    Papa.parse<Record<string, unknown>>(selectedFile, {
      header: true,
      skipEmptyLines: "greedy",
      complete: async (result: Papa.ParseResult<Record<string, unknown>>) => {
        try {
          const headers = result.meta.fields || []
          if (!hasStrictSchema(headers)) {
            setImportSummary({
              total: result.data.length,
              created: 0,
              skipped: 0,
              errors: 1,
              results: [
                {
                  row: 0,
                  cedula: "N/A",
                  status: "error",
                  reason: "Schema inválido: use la plantilla oficial sin columnas extra o faltantes.",
                },
              ],
              downloadableRows: [
                {
                  row: 0,
                  reason: "Schema inválido: use la plantilla oficial sin columnas extra o faltantes.",
                },
              ],
            })
            return
          }

          const normalizedRows: ImportableStudent[] = []
          const parseErrors: Array<Record<string, string | number | null>> = []

          for (let index = 0; index < result.data.length; index += 1) {
            const rowNumber = index + 2
            const parsedRow = result.data[index]
            const { data, reason } = normalizeCsvRow(parsedRow, rowNumber)

            if (!data) {
              parseErrors.push({
                ...parsedRow,
                row: rowNumber,
                reason: reason || "Fila inválida.",
              })
              continue
            }

            normalizedRows.push(data)
          }

          if (parseErrors.length > 0) {
            setImportSummary({
              total: result.data.length,
              created: 0,
              skipped: 0,
              errors: parseErrors.length,
              results: parseErrors.map((row) => ({
                row: Number(row.row || 0),
                cedula: String(row.cedula || "N/A"),
                status: "error",
                reason: String(row.reason || "Fila inválida."),
              })),
              downloadableRows: parseErrors,
            })
            return
          }

          const response = await fetch("/api/students/importar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ students: normalizedRows }),
          })

          const data = (await response.json()) as ImportSummary | { error: string }

          if (!response.ok || "error" in data) {
            setImportSummary({
              total: normalizedRows.length,
              created: 0,
              skipped: 0,
              errors: normalizedRows.length,
              results: [
                {
                  row: 0,
                  cedula: "N/A",
                  status: "error",
                  reason: "error" in data ? data.error : "No se pudo importar el archivo.",
                },
              ],
              downloadableRows: [],
            })
            return
          }

          setImportSummary(data)
          await mutate()
        } finally {
          setIsImporting(false)
        }
      },
      error: (error: Error) => {
        setImportSummary({
          total: 0,
          created: 0,
          skipped: 0,
          errors: 1,
          results: [
            {
              row: 0,
              cedula: "N/A",
              status: "error",
              reason: `No se pudo procesar el CSV: ${error.message}`,
            },
          ],
          downloadableRows: [],
        })
        setIsImporting(false)
      },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Estudiantes</h1>
          <p className="text-muted-foreground">Gestión de pre-inscripciones</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4" />
            Descargar plantilla
          </Button>
          <Button asChild disabled={isImporting}>
            <label>
              <Upload className="h-4 w-4" />
              {isImporting ? "Importando..." : "Importar CSV"}
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleFileSelected}
              />
            </label>
          </Button>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendiente</SelectItem>
              <SelectItem value="in_review">En Revisión</SelectItem>
              <SelectItem value="accepted">Aceptado</SelectItem>
              <SelectItem value="rejected">Rechazado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {importSummary && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado de la importación</CardTitle>
            <CardDescription>
              Total: {importSummary.total} | Creados: {importSummary.created} | Omitidos: {importSummary.skipped} | Errores: {importSummary.errors}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {importSummary.downloadableRows.length > 0 && (
              <Button
                variant="outline"
                onClick={() =>
                  downloadCsv(
                    importSummary.downloadableRows,
                    "importar-estudiantes-omitidos-o-errores.csv"
                  )
                }
              >
                <Download className="h-4 w-4" />
                Descargar omitidos/errores
              </Button>
            )}
            <div className="max-h-48 overflow-y-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fila</TableHead>
                    <TableHead>Cédula</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Detalle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importSummary.results.slice(0, 20).map((result) => (
                    <TableRow key={`${result.row}-${result.cedula}-${result.status}`}>
                      <TableCell>{result.row}</TableCell>
                      <TableCell>{result.cedula}</TableCell>
                      <TableCell>
                        <Badge className={getImportStatusStyles(result.status)}>
                          {getImportStatusLabel(result.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{result.reason || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Lista de Pre-Inscripciones</CardTitle>
          <CardDescription>
            {totalItems > 0
              ? `Mostrando ${startIndex + 1}-${endIndex} de ${totalItems} estudiantes`
              : "No hay estudiantes registrados"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Cédula</TableHead>
                <TableHead>Carrera</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStudents?.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">
                    {student.first_name} {student.last_name}
                  </TableCell>
                  <TableCell>{student.cedula || "-"}</TableCell>
                  <TableCell>{getCourseName(student.course_id)}</TableCell>
                  <TableCell>
                    <Badge className={statusColors[student.status] || statusColors.pending}>
                      {statusLabels[student.status] || "Pendiente"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(student.created_at).toLocaleDateString("es-DO")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedStudent(student)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!paginatedStudents || paginatedStudents.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No hay estudiantes registrados
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {totalItems > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Ver</span>
                <Select
                  value={String(itemsPerPage)}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value))
                    setCurrentPage(1)
                  }}
                >
                  <SelectTrigger className="w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <span>por página</span>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-1">
                  {getPageNumbers().map((page, index) =>
                    page === "..." ? (
                      <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">
                        ...
                      </span>
                    ) : (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        className="h-8 w-8"
                        onClick={() => goToPage(page)}
                      >
                        {page}
                      </Button>
                    )
                  )}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent style={{ minWidth: "50vw" }}>
          <DialogHeader>
            <DialogTitle>
              {selectedStudent?.first_name} {selectedStudent?.last_name}
            </DialogTitle>
            <DialogDescription>Detalles de la pre-inscripción</DialogDescription>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Cédula</p>
                  <p className="font-medium">{selectedStudent.cedula}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Fecha de Nacimiento</p>
                  <p className="font-medium">{selectedStudent.birth_date}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Padre</p>
                  <p className="font-medium">
                    {selectedStudent.father_first_name && selectedStudent.father_last_name
                      ? `${selectedStudent.father_first_name} ${selectedStudent.father_last_name} (${selectedStudent.father_phone || "Sin teléfono"})`
                      : "No proporcionado"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Madre</p>
                  <p className="font-medium">
                    {selectedStudent.mother_first_name && selectedStudent.mother_last_name
                      ? `${selectedStudent.mother_first_name} ${selectedStudent.mother_last_name} (${selectedStudent.mother_phone || "Sin teléfono"})`
                      : "No proporcionado"}
                  </p>
                </div>
                <div className="space-y-1 col-span-2">
                  <p className="text-sm text-muted-foreground">Tutor</p>
                  <p className="font-medium">
                    {selectedStudent.guardian_first_name && selectedStudent.guardian_last_name
                      ? `${selectedStudent.guardian_first_name} ${selectedStudent.guardian_last_name} (${selectedStudent.guardian_phone || "Sin teléfono"})`
                      : "No proporcionado"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedStudent.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Teléfono</p>
                  <p className="font-medium">{selectedStudent.phone || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Edad</p>
                  <p className="font-medium">{selectedStudent.age ?? "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Género</p>
                  <p className="font-medium">
                    {selectedStudent.gender === "M"
                      ? "Masculino"
                      : selectedStudent.gender === "F"
                        ? "Femenino"
                        : "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Nivel de Educación</p>
                  <p className="font-medium capitalize">{selectedStudent.education_level || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Institución Anterior</p>
                  <p className="font-medium">{selectedStudent.previous_institution}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Carrera</p>
                  <p className="font-medium">{getCourseName(selectedStudent.course_id)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <Badge className={statusColors[selectedStudent.status] || statusColors.pending}>
                    {statusLabels[selectedStudent.status] || "Pendiente"}
                  </Badge>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => updateStudentStatus(selectedStudent.id, "in_review")}
                  disabled={selectedStudent.status === "in_review"}
                >
                  Marcar En Revisión
                </Button>
                <Button
                  onClick={() => updateStudentStatus(selectedStudent.id, "accepted")}
                  disabled={selectedStudent.status === "accepted"}
                >
                  Aceptar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => updateStudentStatus(selectedStudent.id, "rejected")}
                  disabled={selectedStudent.status === "rejected"}
                >
                  Rechazar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
