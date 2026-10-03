import { useDeferredValue, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Search, ShieldCheck, Plus, Pencil, Trash2, LogIn, KeyRound, Activity, ChevronDown } from "lucide-react"
import { apiRequest } from "../lib/api"
import type { ApiResponse, RoleType } from "../types"
import { Input } from "../components/ui/input"
import { Button } from "../components/ui/button"
import { EmptyState } from "../components/ui/empty-state"
import { cn } from "../lib/utils"

type AuditLog = {
  id: string
  action: string
  entity: string
  entityId?: string | null
  meta?: unknown
  createdAt: string
  actor?: { id: string; email: string; role: RoleType } | null
}

/* Plain-language names for audited record types. */
const ENTITY_LABELS: Record<string, string> = {
  Announcement: "announcement",
  LearningMaterial: "learning material",
  StudentGrade: "student grade",
  GradeItem: "grade item",
  GradeCategory: "grade category",
  MeritDemerit: "merit/demerit record",
  AttendanceRecord: "attendance record",
  AttendanceSession: "attendance session",
  Enrollment: "enrollment",
  Section: "section",
  Course: "course",
  Flight: "flight",
  ExamSession: "exam",
  ExamQuestion: "exam question",
  ExamAttempt: "exam attempt",
  DocumentSubmission: "document submission",
  InstructorRemark: "instructor remark",
  MonitoringLog: "monitoring entry",
  StudentProfile: "student profile",
  UserProfile: "user profile",
  UserPassword: "user password",
  User: "user account",
  AcademicTerm: "academic term",
  SystemSetting: "system setting",
}

function indefiniteArticle(word: string): string {
  return /^[aeiou]/i.test(word) ? "an" : "a"
}

/* Safely read a string/number field from the log's meta JSON.
   Returns undefined for missing or wrongly-typed values so malformed
   metadata can never crash rendering. */
function metaField(log: AuditLog, key: string): string | number | undefined {
  if (typeof log.meta !== "object" || log.meta === null) return undefined
  const value = (log.meta as Record<string, unknown>)[key]
  return typeof value === "string" || typeof value === "number" ? value : undefined
}

const DOC_TYPE_LABELS: Record<string, string> = {
  EXCUSE_LETTER: "excuse letter",
  MEDICAL_CERTIFICATE: "medical certificate",
  OTHER_OFFICIAL_DOCUMENT: "official document",
}

/* Convert a raw audit record into a human-readable statement.
   Driven entirely by actual log data — nothing is hardcoded per record.
   Where the backend stored specifics in `meta` (document titles, review
   decisions, section assignments, counts), those are woven into the
   sentence so the statement says what was actually done. */
export function auditStatement(log: AuditLog): string {
  const actor = log.actor?.email ?? "System"
  const target = ENTITY_LABELS[log.entity] ?? log.entity.toLowerCase().replace(/_/g, " ")

  // Document submissions carry what/why details in meta.
  if (log.entity === "DocumentSubmission") {
    const docTypeRaw = metaField(log, "docType")
    const docKind =
      (typeof docTypeRaw === "string" && DOC_TYPE_LABELS[docTypeRaw]) || "document"
    const title = metaField(log, "title")
    const titled = typeof title === "string" && title ? ` titled "${title}"` : ""
    if (log.action === "CREATE") {
      return `${actor} submitted ${indefiniteArticle(docKind)} ${docKind}${titled} for review.`
    }
    if (log.action === "UPDATE") {
      const status = metaField(log, "status")
      if (status === "APPROVED") return `${actor} approved the ${docKind}${titled}.`
      if (status === "REJECTED") return `${actor} rejected the ${docKind}${titled}.`
      return `${actor} reviewed the ${docKind}${titled}.`
    }
  }

  // Approving a document clears absences — meta records how many.
  if (log.entity === "AttendanceRecord" && log.action === "UPDATE") {
    const removed = metaField(log, "removedAbsences")
    if (typeof removed === "number") {
      return removed === 1
        ? `${actor} cleared 1 absence after approving a document.`
        : `${actor} cleared ${removed} absences after approving a document.`
    }
  }

  // Auto-sectioning records the destination section in meta.
  if (log.entity === "Enrollment" && log.action === "UPDATE") {
    const sectionCode = metaField(log, "sectionCode")
    if (typeof sectionCode === "string" && sectionCode) {
      return `${actor === "System" ? "The system" : actor} assigned an enrollment to section ${sectionCode}.`
    }
  }

  switch (log.action) {
    case "CREATE":
      return `${actor} added a new ${target}.`
    case "BULK_CREATE": {
      const count = metaField(log, "count") ?? metaField(log, "imported")
      const source = metaField(log, "source")
      if (typeof count === "number") {
        const via = source === "csv" ? " via CSV import" : " in bulk"
        return `${actor} added ${count} ${target}${count === 1 ? "" : "s"}${via}.`
      }
      return `${actor} added multiple ${target}s in bulk.`
    }
    case "UPDATE":
      return `${actor} updated ${indefiniteArticle(target)} ${target}.`
    case "DELETE":
      return `${actor} deleted ${indefiniteArticle(target)} ${target}.`
    case "LOGIN":
      return `${actor} logged in.`
    case "FORGOT_PASSWORD":
      return `${actor} requested a password reset.`
    case "RESET_PASSWORD":
      return `${actor} reset a user password.`
    default:
      return `${actor} performed ${log.action.toLowerCase().replace(/_/g, " ")} on ${indefiniteArticle(target)} ${target}.`
  }
}

const ACTION_STYLE: Record<string, { icon: typeof Activity; chip: string }> = {
  CREATE: { icon: Plus, chip: "bg-emerald-50 text-emerald-600" },
  BULK_CREATE: { icon: Plus, chip: "bg-emerald-50 text-emerald-600" },
  UPDATE: { icon: Pencil, chip: "bg-amber-50 text-amber-600" },
  DELETE: { icon: Trash2, chip: "bg-red-50 text-red-500" },
  LOGIN: { icon: LogIn, chip: "bg-sky-50 text-royal" },
  FORGOT_PASSWORD: { icon: KeyRound, chip: "bg-violet-50 text-violet-600" },
  RESET_PASSWORD: { icon: KeyRound, chip: "bg-violet-50 text-violet-600" },
}

function AuditLogRow({ log }: { log: AuditLog }) {
  const [expanded, setExpanded] = useState(false)
  const style = ACTION_STYLE[log.action] ?? { icon: Activity, chip: "bg-silver/20 text-darksilver" }
  const Icon = style.icon
  const metaText =
    log.meta !== undefined && log.meta !== null ? JSON.stringify(log.meta, null, 2) : null

  return (
    <div className="rounded-xl border border-silver/20 bg-white/50 px-4 py-3 transition-colors hover:bg-white">
      <div className="flex items-start gap-3">
        <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", style.chip)}>
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-black">{auditStatement(log)}</p>
          <p className="mt-1 text-[11px] text-darksilver">
            {log.actor?.role ?? "SYSTEM"}
            {" · "}
            {new Date(log.createdAt).toLocaleString("en-PH", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
          </p>
          {expanded && (
            <div className="mt-2 space-y-1 rounded-lg bg-silver/10 p-3 text-[11px] text-darksilver">
              <p><span className="font-semibold">Record:</span> <span className="font-mono">{log.entityId ?? "—"}</span></p>
              <p><span className="font-semibold">Type:</span> {log.entity} · {log.action}</p>
              {metaText && (
                <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[10px]">{metaText}</pre>
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-label={expanded ? "Hide details" : "Show details"}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-darksilver hover:bg-silver/20 hover:text-black"
        >
          <ChevronDown className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")} />
        </button>
      </div>
    </div>
  )
}

export function AuditLogsPage() {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const deferredSearch = useDeferredValue(search)
  const pageSize = 25

  const query = useQuery({
    queryKey: ["audit-logs", deferredSearch, page],
    queryFn: () => apiRequest<ApiResponse<AuditLog[]>>(
      `/api/audit-logs?page=${page}&pageSize=${pageSize}&search=${encodeURIComponent(deferredSearch)}`
    ),
  })

  const logs = query.data?.data ?? []
  const total = query.data?.meta?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="space-y-6">
      <header className="rounded-2xl bg-gradient-to-br from-navy via-royal to-navy p-6 text-white shadow-card">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/10 ring-1 ring-white/20"><ShieldCheck className="h-5 w-5" /></span>
          <div><h1 className="text-2xl font-bold">Audit Logs</h1><p className="text-sm text-silver">Review security and data-change activity across the system.</p></div>
        </div>
      </header>

      <section className="rounded-2xl border border-silver/30 bg-white p-4 shadow-card sm:p-6">
        <label htmlFor="audit-search" className="sr-only">Search audit logs</label>
        <div className="relative mb-5 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darksilver" />
          <Input id="audit-search" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Search action, entity, or actor…" className="pl-9" />
        </div>

        {query.isLoading ? <div className="h-64 animate-pulse rounded-xl bg-slate-100" aria-label="Loading audit logs" /> :
        query.isError ? <EmptyState title="Could not load audit logs" description={query.error instanceof Error ? query.error.message : "Try again."} action={<Button onClick={() => query.refetch()}>Retry</Button>} /> :
        logs.length === 0 ? <EmptyState title="No audit events found" description="Try a different search term." /> : (
          <div className="space-y-2">
            {logs.map((log) => (
              <AuditLogRow key={log.id} log={log} />
            ))}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between text-sm"><span className="text-darksilver">{total} events</span><div className="flex items-center gap-2"><Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</Button><span>Page {page} of {totalPages}</span><Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((value) => value + 1)}>Next</Button></div></div>
      </section>
    </div>
  )
}
