import { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "../lib/api"
import { ApiResponse } from "../types"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { FormField } from "../components/ui/form-field"
import { FormSection } from "../components/ui/form-section"
import { SectionCard } from "../components/ui/section-card"
import { toast } from "sonner"
import { jsPDF } from "jspdf"
import { Award, Search, Download, Medal, CalendarDays, MapPin, PenLine } from "lucide-react"
import { cn } from "../lib/utils"

type EnrollmentRow = {
  id: string
  status: string
  user: {
    id: string
    email: string
    studentProfile?: {
      firstName: string
      lastName: string
      studentNo: string
    } | null
  }
  section?: {
    name: string
    code: string
    course?: {
      name: string
      code: string
      nstpType: "CWTS" | "ROTC"
    } | null
  } | null
}

export function CertificatesPage() {
  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [completionDate, setCompletionDate] = useState(new Date().toISOString().split("T")[0])
  const [place, setPlace] = useState("Manila")
  const [coordinatorName, setCoordinatorName] = useState("")
  const [directorName, setDirectorName] = useState("")

  const { data, isLoading } = useQuery({
    queryKey: ["certificates-enrollments"],
    queryFn: () => apiRequest<ApiResponse<EnrollmentRow[]>>("/api/enrollments?status=APPROVED&pageSize=100"),
  })

  const rows = data?.data ?? []

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) => {
      const profile = row.user.studentProfile
      return (
        row.user.email.toLowerCase().includes(q) ||
        `${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.toLowerCase().includes(q) ||
        (profile?.studentNo ?? "").toLowerCase().includes(q)
      )
    })
  }, [rows, search])

  const selected = filtered.find((row) => row.id === selectedId) ?? rows.find((row) => row.id === selectedId)

  const generateCertificate = () => {
    if (!selected?.user.studentProfile) {
      toast.error("Select a student first")
      return
    }
    const profile = selected.user.studentProfile
    const fullName = `${profile.firstName} ${profile.lastName}`
    const courseName = selected.section?.course?.name ?? "National Service Training Program"
    const nstpType = selected.section?.course?.nstpType ?? ""
    const sectionName = selected.section?.name ?? ""

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })
    const W = doc.internal.pageSize.getWidth()
    const H = doc.internal.pageSize.getHeight()

    doc.setFillColor(254, 253, 250)
    doc.rect(0, 0, W, H, "F")

    doc.setDrawColor(30, 41, 59)
    doc.setLineWidth(2.2)
    doc.rect(8, 8, W - 16, H - 16)
    doc.setDrawColor(202, 138, 4)
    doc.setLineWidth(0.7)
    doc.rect(12, 12, W - 24, H - 24)

    doc.setFillColor(30, 41, 59)
    doc.circle(W / 2, 34, 11, "F")
    doc.setDrawColor(202, 138, 4)
    doc.setLineWidth(1)
    doc.circle(W / 2, 34, 13, "S")
    doc.setTextColor(254, 253, 250)
    doc.setFont("times", "bolditalic")
    doc.setFontSize(14)
    doc.text("N", W / 2, 38, { align: "center" })

    doc.setTextColor(30, 41, 59)
    doc.setFont("times", "normal")
    doc.setFontSize(12)
    doc.text("Republic of the Philippines", W / 2, 56, { align: "center" })
    doc.setFont("times", "bold")
    doc.setFontSize(17)
    doc.text("National Service Training Program", W / 2, 65, { align: "center" })
    doc.setFont("times", "normal")
    doc.setFontSize(10.5)
    doc.setTextColor(100, 100, 100)
    doc.text("Civic Welfare Training Service  •  Reserve Officers' Training Corps", W / 2, 72, { align: "center" })

    doc.setFont("times", "bold")
    doc.setFontSize(30)
    doc.setTextColor(202, 138, 4)
    doc.text("CERTIFICATE OF COMPLETION", W / 2, 90, { align: "center" })

    doc.setDrawColor(202, 138, 4)
    doc.setLineWidth(0.6)
    doc.line(W / 2 - 40, 95, W / 2 + 40, 95)

    doc.setFont("times", "italic")
    doc.setFontSize(12)
    doc.setTextColor(80, 80, 80)
    doc.text("This is to certify that", W / 2, 108, { align: "center" })

    doc.setFont("times", "bolditalic")
    doc.setFontSize(28)
    doc.setTextColor(15, 23, 42)
    doc.text(fullName, W / 2, 121, { align: "center" })

    doc.setDrawColor(150, 150, 150)
    doc.setLineWidth(0.3)
    doc.line(W / 2 - 60, 125, W / 2 + 60, 125)

    doc.setFont("times", "normal")
    doc.setFontSize(11)
    doc.setTextColor(60, 60, 60)
    doc.text(
      `has satisfactorily completed all the requirements of the`,
      W / 2,
      134,
      { align: "center" }
    )
    doc.setFont("times", "bold")
    doc.setFontSize(13)
    doc.setTextColor(30, 41, 59)
    doc.text(`${courseName}${nstpType ? ` (${nstpType})` : ""}`, W / 2, 141, { align: "center" })
    doc.setFont("times", "normal")
    doc.setFontSize(10.5)
    doc.setTextColor(80, 80, 80)
    doc.text(sectionName ? `Section: ${sectionName}   •   Student No.: ${profile.studentNo}` : `Student No.: ${profile.studentNo}`, W / 2, 148, { align: "center" })
    doc.text(
      "with dedication, discipline, and commitment to nation-building,",
      W / 2,
      156,
      { align: "center" }
    )
    doc.text(
      "in accordance with Republic Act No. 9163 or the NSTP Act of 2001.",
      W / 2,
      162,
      { align: "center" }
    )

    doc.setFont("times", "italic")
    doc.setFontSize(10.5)
    doc.setTextColor(80, 80, 80)
    const dateObj = new Date(completionDate)
    const dateText = `Given this ${dateObj.toLocaleDateString("en-PH", { month: "long", day: "numeric", year: "numeric" })}, in ${place}.`
    doc.text(dateText, W / 2, 172, { align: "center" })

    const sigY = H - 32
    doc.setDrawColor(60, 60, 60)
    doc.setLineWidth(0.3)
    doc.line(30, sigY, 85, sigY)
    doc.line(W - 85, sigY, W - 30, sigY)

    doc.setFont("times", "bold")
    doc.setFontSize(10)
    doc.setTextColor(30, 41, 59)
    doc.text(coordinatorName || "NSTP Coordinator", 57.5, sigY + 5.5, { align: "center" })
    doc.text(directorName || "NSTP Director", W - 57.5, sigY + 5.5, { align: "center" })
    doc.setFont("times", "normal")
    doc.setFontSize(9)
    doc.setTextColor(110, 110, 110)
    doc.text("Program Coordinator", 57.5, sigY + 10.5, { align: "center" })
    doc.text("NSTP Director", W - 57.5, sigY + 10.5, { align: "center" })

    doc.setFont("helvetica", "normal")
    doc.setFontSize(7.5)
    doc.setTextColor(160, 160, 160)
    doc.text("Generated by NSTP Management System", W / 2, H - 12, { align: "center" })

    doc.save(`certificate-${profile.studentNo}-${fullName.replace(/\s+/g, "-").toLowerCase()}.pdf`)
    toast.success(`Certificate for ${fullName} downloaded`)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-royal to-navy p-8 text-white shadow-card">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-gold/20 blur-3xl" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
            <Medal className="h-7 w-7 text-gold" />
          </div>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              Certificates of Completion
              <Award className="h-5 w-5 text-gold" />
            </h1>
            <p className="mt-1 text-sm text-silver">
              Generate printable NSTP completion certificates per student
            </p>
          </div>
        </div>
      </div>

      <SectionCard title="Select Student" description="Choose an approved student to generate a certificate">
        <FormField label="Search">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, student number, or email..."
              className="pl-10"
            />
          </div>
        </FormField>

        <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
          {isLoading && <p className="text-sm text-darksilver py-4 text-center">Loading students...</p>}
          {!isLoading && filtered.length === 0 && (
            <p className="text-sm text-darksilver py-4 text-center">No approved enrollments found</p>
          )}
          {filtered.map((row) => {
            const profile = row.user.studentProfile
            return (
              <button
                key={row.id}
                type="button"
                onClick={() => setSelectedId(row.id)}
                className={cn(
                  "flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-all",
                  selectedId === row.id
                    ? "border-navy bg-navy/5 shadow-md"
                    : "border-silver/30 hover:border-silver/40 hover:bg-white/50"
                )}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-black truncate">
                    {profile ? `${profile.lastName}, ${profile.firstName}` : row.user.email}
                  </p>
                  <p className="text-xs text-darksilver truncate">
                    {profile?.studentNo} • {row.section?.course?.name ?? "—"} • {row.section?.name ?? ""}
                  </p>
                </div>
                {selectedId === row.id && (
                  <span className="ml-3 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy">
                    <svg viewBox="0 0 12 10" className="h-3 w-3 fill-none stroke-white stroke-2"><path d="M1 5l3.5 3.5L11 1" /></svg>
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </SectionCard>

      <FormSection title="Certificate Details" description="Customize the details printed on the certificate">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="Completion Date">
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="date" value={completionDate} onChange={(event) => setCompletionDate(event.target.value)} className="pl-10" />
            </div>
          </FormField>
          <FormField label="Issued at (place)">
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="text" value={place} onChange={(event) => setPlace(event.target.value)} placeholder="Manila" className="pl-10" />
            </div>
          </FormField>
          <FormField label="Program Coordinator (signature name)" hint="Optional — defaults to &quot;NSTP Coordinator&quot;">
            <div className="relative">
              <PenLine className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="text" value={coordinatorName} onChange={(event) => setCoordinatorName(event.target.value)} placeholder="NSTP Coordinator" className="pl-10" />
            </div>
          </FormField>
          <FormField label="NSTP Director (signature name)" hint="Optional — defaults to &quot;NSTP Director&quot;">
            <div className="relative">
              <PenLine className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input type="text" value={directorName} onChange={(event) => setDirectorName(event.target.value)} placeholder="NSTP Director" className="pl-10" />
            </div>
          </FormField>
        </div>

        <div className="pt-2">
          <Button
            onClick={generateCertificate}
            disabled={!selected}
            className="bg-gradient-to-r from-navy to-royal hover:from-navy hover:to-black text-white shadow-soft"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Certificate PDF{selected?.user.studentProfile ? ` — ${selected.user.studentProfile.firstName}` : ""}
          </Button>
        </div>
      </FormSection>
    </div>
  )
}
