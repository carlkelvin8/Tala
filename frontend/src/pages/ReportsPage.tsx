import { useState } from "react"
import {
  FileSpreadsheet,
  Sparkles,
  Calendar,
  Download,
  XCircle,
  RefreshCw,
  BarChart3,
  GraduationCap,
  Award,
  Users,
} from "lucide-react"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { FormField } from "../components/ui/form-field"
import { FormSection } from "../components/ui/form-section"
import { SectionCard } from "../components/ui/section-card"
import { getAccessToken } from "../lib/auth"
import { toast } from "sonner"
import { cn } from "../lib/utils"

const baseUrl = import.meta.env.VITE_API_URL ?? ""

type ReportType = "enrollment" | "attendance" | "grades" | "merits"

const reportTypes: { key: ReportType; label: string; icon: typeof FileSpreadsheet; endpoint: string; description: string }[] = [
  { key: "enrollment", label: "Enrollment Report", icon: Users, endpoint: "/api/reports/enrollments.csv", description: "Student enrollment summaries" },
  { key: "attendance", label: "Attendance Report", icon: BarChart3, endpoint: "/api/reports/attendance.csv", description: "Attendance records by date range" },
  { key: "grades", label: "Grades Report", icon: GraduationCap, endpoint: "/api/reports/grades.csv", description: "Student grade summaries" },
  { key: "merits", label: "Merits Report", icon: Award, endpoint: "/api/reports/merits.csv", description: "Merit and demerit records" },
]

export function ReportsPage() {
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [isDownloading, setIsDownloading] = useState(false)
  const [activeReport, setActiveReport] = useState<ReportType>("enrollment")

  const downloadCsv = async (report: typeof reportTypes[0]) => {
    if (from && to && new Date(to) < new Date(from)) {
      toast.error("End date cannot be before start date")
      return
    }
    setIsDownloading(true)
    try {
      const params = new URLSearchParams()
      if (from) params.set("from", from)
      if (to) params.set("to", to)

      const token = getAccessToken()
      const url = `${baseUrl}${report.endpoint}${params.toString() ? `?${params.toString()}` : ""}`

      const response = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })

      if (!response.ok) {
        if (response.status === 404) {
          toast.warning(`${report.label} endpoint is not yet available`)
          return
        }
        const text = await response.text()
        throw new Error(text || "Failed to generate report")
      }

      const blob = await response.blob()

      if (blob.size < 50) {
        toast.warning(`No data found for the selected date range`)
      }

      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = downloadUrl
      a.download = `${report.key}-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(downloadUrl)
      document.body.removeChild(a)

      if (blob.size >= 50) {
        toast.success(`${report.label} downloaded successfully`)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to download report")
    } finally {
      setIsDownloading(false)
    }
  }

  const activeReportConfig = reportTypes.find(r => r.key === activeReport)!

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-royal to-navy p-8 text-white shadow-card">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-gold/20 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-32 w-32 rounded-full bg-darksilver/10 blur-2xl" />

        <div className="relative z-10 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
            <FileSpreadsheet className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              Reports
              <Sparkles className="h-5 w-5 text-gold" />
            </h1>
            <p className="mt-1 text-sm text-silver">
              Generate and export various reports as CSV files
            </p>
          </div>
        </div>
      </div>

      <SectionCard title="Select Report Type" description="Choose the type of report to generate">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {reportTypes.map((report) => {
            const ReportIcon = report.icon
            return (
              <button
                key={report.key}
                onClick={() => setActiveReport(report.key)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-4 text-left transition-all",
                  activeReport === report.key
                    ? "border-black bg-white shadow-md"
                    : "border-silver/30 hover:border-silver/40 hover:bg-white/50"
                )}
              >
                <div className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-lg shrink-0",
                  activeReport === report.key ? "bg-navy text-white" : "bg-silver/20 text-darksilver"
                )}>
                  <ReportIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-black truncate">{report.label}</p>
                  <p className="text-xs text-darksilver truncate">{report.description}</p>
                </div>
              </button>
            )
          })}
        </div>
      </SectionCard>

      <FormSection
        title={activeReportConfig.label}
        description={`Filter by date range before exporting (leave empty for all records)`}
        className="shadow-card"
      >
        <div className="grid gap-4 md:grid-cols-2">
          <FormField label="From" hint="Optional: Start date">
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                className="pl-10"
              />
            </div>
          </FormField>
          <FormField label="To" hint="Optional: End date">
            <div className="relative">
              <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                className="pl-10"
              />
            </div>
          </FormField>
        </div>

        <div className="flex items-center gap-4 pt-2">
          <Button
            onClick={() => downloadCsv(activeReportConfig)}
            disabled={isDownloading}
            className="bg-gradient-to-r from-navy to-royal hover:from-navy hover:to-black text-white shadow-soft"
          >
            {isDownloading ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            {isDownloading ? "Downloading..." : `Download ${activeReportConfig.label}`}
          </Button>
          {(from || to) && (
            <Button
              variant="outline"
              onClick={() => {
                setFrom("")
                setTo("")
              }}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Clear Filters
            </Button>
          )}
        </div>
      </FormSection>
    </div>
  )
}
