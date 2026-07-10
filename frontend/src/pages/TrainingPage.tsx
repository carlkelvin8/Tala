import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "../lib/api"
import { ApiResponse } from "../types"
import { PageHeader } from "../components/ui/page-header"
import { EmptyState } from "../components/ui/empty-state"
import { LoadingSkeleton } from "../components/ui/loading-skeleton"
import { Badge } from "../components/ui/badge"
import { SectionCard } from "../components/ui/section-card"
import { ResponsiveTableCards } from "../components/ui/responsive-table-cards"
import { Target, CheckCircle2, AlertTriangle, Clock } from "lucide-react"
import { useState, useEffect } from "react"

export function TrainingPage() {
  const [selectedTermId, setSelectedTermId] = useState<string>("")

  const termsQuery = useQuery({
    queryKey: ["terms"],
    queryFn: () => apiRequest<ApiResponse<any[]>>("/api/terms"),
    retry: false
  })

  const summaryQuery = useQuery({
    queryKey: ["training-summary", selectedTermId],
    queryFn: () => apiRequest<ApiResponse<any>>(`/api/training/summary?termId=${selectedTermId}`),
    enabled: !!selectedTermId
  })

  const overviewQuery = useQuery({
    queryKey: ["training-overview", selectedTermId],
    queryFn: () => apiRequest<ApiResponse<any[]>>(`/api/training/overview?termId=${selectedTermId}`),
    enabled: !!selectedTermId
  })

  const terms = termsQuery.data?.data ?? []
  const summary = summaryQuery.data?.data
  const overview = overviewQuery.data?.data ?? []

  useEffect(() => {
    if (!selectedTermId && terms.length > 0) {
      const active = terms.find((t: any) => t.isActive)
      setSelectedTermId(active?.id || terms[0]?.id || "")
    }
  }, [terms, selectedTermId])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Training Monitoring"
        description="Track CWTS/ROTC training day attendance and compliance"
      />

      {/* Term Selector */}
      <div className="max-w-sm">
        <label className="text-sm font-medium text-slate-700 mb-1 block">Select Term</label>
        <select
          value={selectedTermId}
          onChange={(e) => setSelectedTermId(e.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950/10"
        >
          <option value="">Choose a term</option>
          {terms.map((t: any) => (
            <option key={t.id} value={t.id}>{t.name}{t.isActive ? " (Active)" : ""}</option>
          ))}
        </select>
      </div>

      {termsQuery.isLoading || !selectedTermId ? (
        <LoadingSkeleton rows={3} />
      ) : !summary ? (
        <EmptyState
          title="No term selected"
          description="Select an academic term to view training day data."
        />
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SectionCard title="Total Sessions">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Clock className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{summary.totalSessions}</p>
              </div>
            </SectionCard>
            <SectionCard title="Required Days">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100">
                  <Target className="h-5 w-5 text-violet-600" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{summary.requiredDays}</p>
              </div>
            </SectionCard>
            <SectionCard title="Compliance">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${summary.isCompliant ? "bg-emerald-100" : "bg-red-100"}`}>
                  {summary.isCompliant ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <Badge variant={summary.isCompliant ? "success" : "danger"}>
                  {summary.isCompliant ? "Compliant" : "Non-Compliant"}
                </Badge>
              </div>
            </SectionCard>
          </div>

          {/* Session Overview */}
          {overview.length > 0 ? (
            <SectionCard title="Session Attendance Overview">
              <ResponsiveTableCards
                columns={[
                  { header: "Session", cell: (r: any) => <span className="font-semibold">{r.title}</span> },
                  { header: "Date", cell: (r: any) => new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
                  { header: "Section", cell: (r: any) => r.section?.code || "—" },
                  {
                    header: "Present",
                    cell: (r: any) => (
                      <span className="text-emerald-600 font-semibold">{r.totalPresent}</span>
                    )
                  },
                  {
                    header: "Late",
                    cell: (r: any) => (
                      <span className="text-amber-600 font-semibold">{r.totalLate}</span>
                    )
                  },
                  {
                    header: "Absent",
                    cell: (r: any) => (
                      <span className="text-red-600 font-semibold">{r.totalAbsent}</span>
                    )
                  },
                  {
                    header: "Remarks",
                    cell: (r: any) => (
                      <span className="text-slate-500 text-sm truncate max-w-[200px] block">
                        {r.remarks || "—"}
                      </span>
                    )
                  }
                ]}
                data={overview}
                rowKey={(r: any) => r.id}
                renderTitle={(session: any) => session.title}
                renderActions={(session: any) => (
                  <Badge variant="default">{session.section?.code || "All"}</Badge>
                )}
              />
            </SectionCard>
          ) : (
            <EmptyState
              title="No sessions this term"
              description="Sessions will appear here once attendance sessions are created for this term."
            />
          )}
        </>
      )}
    </div>
  )
}
