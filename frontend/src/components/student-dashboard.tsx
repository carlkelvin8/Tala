import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "../lib/api"
import { ApiResponse } from "../types"
import { Link } from "react-router-dom"
import { GraduationCap, CalendarCheck, CalendarX, Inbox, CloudUpload, FileText, TicketCheck } from "lucide-react"
import { StatusBadge } from "../components/ui/status-badge"
import { Badge } from "../components/ui/badge"
import { EmptyState } from "../components/ui/empty-state"
import { LoadingSkeleton } from "../components/ui/loading-skeleton"
import { cn } from "../lib/utils"
import { programLabels, programTextColors, programBgColors } from "../lib/programs"
import { type ProgramType } from "../types"

interface StudentSummary {
  program: "CWTS" | "ROTC" | null
  enrollment: {
    id: string
    status: string
    createdAt: string
    section: {
      id: string
      code: string
      name: string
      course: { id: string; code: string; name: string; nstpType: string }
    } | null
  } | null
  totalGrade: {
    totalPercent: number | null
    breakdown: Array<{ name: string; weight: number | null; score: number; max: number }>
  }
  attendance: { recorded: number; attended: number; absent: number; rate: number | null }
  pendingSubmissions: number
}

const statCards = [
  { key: "grade", label: "Total Grade", icon: GraduationCap, iconBg: "bg-violet-50", iconColor: "text-violet-500", accent: "before:bg-violet-400" },
  { key: "attendance", label: "Attendance Rate", icon: CalendarCheck, iconBg: "bg-sky-50", iconColor: "text-sky-500", accent: "before:bg-sky-400" },
  { key: "absent", label: "Absences", icon: CalendarX, iconBg: "bg-rose-50", iconColor: "text-rose-500", accent: "before:bg-rose-400" },
  { key: "pending", label: "Pending Submissions", icon: Inbox, iconBg: "bg-amber-50", iconColor: "text-amber-500", accent: "before:bg-amber-400" },
]

function formatPercent(value: number | null) {
  return value != null ? `${Math.round(value)}%` : "—"
}

function StudentStats({ summary, isLoading }: { summary?: StudentSummary; isLoading: boolean }) {
  const values: Record<string, string> = {
    grade: formatPercent(summary?.totalGrade?.totalPercent ?? null),
    attendance: formatPercent(summary?.attendance?.rate ?? null),
    absent: summary?.attendance?.absent != null ? String(summary.attendance.absent) : "—",
    pending: summary?.pendingSubmissions != null ? String(summary.pendingSubmissions) : "—",
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {statCards.map(({ key, label, icon: Icon, iconBg, iconColor, accent }, idx) => (
        <div
          key={key}
          className={cn(
            "relative overflow-hidden rounded-2xl border border-silver/20 bg-white p-5 shadow-card transition-all duration-200",
            "hover:shadow-card-hover hover:-translate-y-0.5",
            "before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:rounded-l-2xl before:transition-all before:duration-200",
            "hover:before:w-[4px]",
            accent
          )}
          style={{ animationDelay: `${idx * 80}ms` }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-darksilver truncate">{label}</p>
              {isLoading ? (
                <div className="mt-3 h-8 w-20 animate-pulse rounded-lg bg-silver/20" />
              ) : (
                <p className="mt-2 text-[2rem] font-bold leading-none tracking-tight text-black">{values[key]}</p>
              )}
              <p className="mt-2 text-xs text-darksilver leading-relaxed">
                {key === "grade" ? "Weighted across grade categories" : key === "attendance" ? "Present or late · all sessions" : key === "absent" ? "Recorded as absent" : "Awaiting review"}
              </p>
            </div>
            <span className={cn("flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl transition-colors", iconBg)}>
              <Icon className={cn("h-5 w-5", iconColor)} strokeWidth={1.75} />
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

function EnrollmentPanel({ summary, isLoading }: { summary?: StudentSummary; isLoading: boolean }) {
  const enrollment = summary?.enrollment
  const program = summary?.program

  return (
    <div className="flex flex-col rounded-2xl border border-silver/20 bg-white p-5 sm:p-6 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-darksilver">Enrollment Status</p>
          {isLoading && <div className="mt-3 h-8 w-24 animate-pulse rounded-lg bg-silver/20" />}
          {!isLoading && !enrollment && <p className="mt-2 text-lg font-bold text-black">No enrollment yet</p>}
        </div>
        {!isLoading && enrollment && <StatusBadge status={enrollment.status} />}
      </div>

      {!isLoading && enrollment && (
        <div className="mt-4 flex flex-col gap-3 text-sm">
          {program && (
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn("px-2.5 py-0.5 text-[11px] font-semibold", programTextColors[program as ProgramType], programBgColors[program as ProgramType])}
              >
                {programLabels[program as ProgramType] ?? program}
              </Badge>
              <span className="text-xs text-darksilver">Program</span>
            </div>
          )}
          {enrollment.section?.course && (
            <div className="flex items-center gap-2">
              <span className="font-semibold text-black">{enrollment.section.course.code}</span>
              <span className="text-darksilver">{enrollment.section.course.name}</span>
            </div>
          )}
          {enrollment.section && (
            <p className="text-darksilver">
              Section <span className="font-semibold text-black">{enrollment.section.code}</span>
              {enrollment.section.name ? ` — ${enrollment.section.name}` : ""}
            </p>
          )}
          <p className="text-xs text-darksilver">
            Requested {new Date(enrollment.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
      )}

      {!isLoading && !enrollment && (
        <p className="mt-2 text-xs text-darksilver">
          Submit a program enrollment request to get started.
        </p>
      )}
    </div>
  )
}

function SubmissionBoxPanel({ summary, isLoading }: { summary?: StudentSummary; isLoading: boolean }) {
  const { data: submissionsData, isLoading: submissionsLoading } = useQuery({
    queryKey: ["my-submissions"],
    queryFn: () => apiRequest<ApiResponse<any[]>>("/api/submissions/my"),
  })

  const recent = (submissionsData?.data ?? []).slice(0, 3)

  return (
    <div className="flex flex-col rounded-2xl border border-silver/20 bg-white p-5 sm:p-6 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50">
            <CloudUpload className="h-5 w-5 text-sky-500" strokeWidth={1.75} />
          </span>
          <div>
            <p className="text-sm font-semibold text-black">Submission Box</p>
            <p className="text-xs text-darksilver">Excuse letters, medical certs, official documents</p>
          </div>
        </div>
        <Link
          to="/submissions"
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-navy to-royal px-3.5 py-2 text-xs font-semibold text-white shadow-soft hover:from-navy hover:to-black transition-all"
        >
          <CloudUpload className="h-3.5 w-3.5" />
          Submit
        </Link>
      </div>

      <div className="mt-4 space-y-2">
        {isLoading || submissionsLoading ? (
          <LoadingSkeleton rows={3} columns={3} />
        ) : recent.length === 0 ? (
          <EmptyState title="No submissions yet" description="Documents you submit will appear here." />
        ) : (
          recent.map((s: any) => (
            <Link
              key={s.id}
              to="/submissions"
              className="flex items-center gap-3 rounded-xl border border-silver/20 bg-white px-3 py-2.5 transition-colors hover:bg-slate-50"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy/5">
                <FileText className="h-4 w-4 text-navy" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-black">{s.title}</p>
                <p className="text-[11px] text-darksilver">
                  {s.docType === "EXCUSE_LETTER" ? "Excuse Letter" : s.docType === "MEDICAL_CERTIFICATE" ? "Medical Certificate" : "Official Document"}
                  {" · "}{new Date(s.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </p>
              </div>
              <StatusBadge status={s.status} />
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

export function StudentDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-dashboard"],
    queryFn: () => apiRequest<ApiResponse<StudentSummary>>("/api/dashboard/my"),
    refetchInterval: 30_000,
  })

  const summary = data?.data

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-2xl border border-silver/20 bg-white p-5 shadow-card">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
          <TicketCheck className="h-5 w-5 text-emerald-500" strokeWidth={1.75} />
        </span>
        <div>
          <p className="text-sm font-semibold text-black">Your personal NSTP summary</p>
          <p className="mt-0.5 text-xs text-darksilver">
            Enrollment status, total grade, attendance, and tracked submissions — personalized just for you.
          </p>
        </div>
      </div>

      <StudentStats summary={summary} isLoading={isLoading} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <EnrollmentPanel summary={summary} isLoading={isLoading} />
        <SubmissionBoxPanel summary={summary} isLoading={isLoading} />
      </div>
    </div>
  )
}