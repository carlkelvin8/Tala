import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "../lib/api"
import { ApiResponse } from "../types"
import { EmptyState } from "../components/ui/empty-state"
import { LoadingSkeleton } from "../components/ui/loading-skeleton"
import { Badge } from "../components/ui/badge"
import { SectionCard } from "../components/ui/section-card"
import { ResponsiveTableCards } from "../components/ui/responsive-table-cards"
import { Select } from "../components/ui/select"
import { Sparkles, Target, Clock, CheckCircle2, AlertTriangle, Calendar } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "../lib/utils"

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
    enabled: !!selectedTermId,
    retry: false
  })

  const overviewQuery = useQuery({
    queryKey: ["training-overview", selectedTermId],
    queryFn: () => apiRequest<ApiResponse<any[]>>(`/api/training/overview?termId=${selectedTermId}`),
    enabled: !!selectedTermId,
    retry: false
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
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-royal to-navy px-6 sm:px-10 py-8 shadow-elevated">
        <div className="absolute inset-0 bg-grid opacity-[0.06]" />
        <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-royal/10 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
            <Target className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-gold text-xs font-medium uppercase tracking-wider mb-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Training Attendance</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Training Monitoring</h1>
            <p className="mt-1 text-sm text-silver max-w-2xl">Track CWTS/ROTC training day attendance and compliance.</p>
          </div>
        </div>
      </div>

      <div className="max-w-sm relative shadow-card rounded-xl border border-silver/20 bg-white p-4 transition-all duration-200 hover:shadow-card-hover">
        <label className="text-sm font-medium text-black/80 mb-1.5 block">Select Term</label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darksilver pointer-events-none z-10" />
          <Select
            value={selectedTermId}
            onChange={(e) => setSelectedTermId(e.target.value)}
            className="h-11 pl-10"
          >
            <option value="">Choose a term</option>
            {terms.map((t: any) => (
              <option key={t.id} value={t.id}>{t.name}{t.isActive ? " (Active)" : ""}</option>
            ))}
          </Select>
        </div>
      </div>

      {termsQuery.isLoading || !selectedTermId ? (
        <LoadingSkeleton rows={3} />
      ) : termsQuery.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-red-800">Failed to load terms</p>
          <p className="text-xs text-red-500 mt-1">Please try refreshing the page.</p>
        </div>
      ) : summaryQuery.isError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-red-800">Failed to load training summary</p>
          <p className="text-xs text-red-500 mt-1">{(summaryQuery.error as Error).message === "Unauthorized" ? "Session expired. Please log in again." : "Please try refreshing the page."}</p>
        </div>
      ) : !summary ? (
        <EmptyState
          title="No term selected"
          description="Select an academic term to view training day data."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                title: "Total Sessions",
                value: summary.totalSessions,
                icon: Clock,
                iconBg: "bg-blue-100",
                iconColor: "text-blue-600"
              },
              {
                title: "Required Days",
                value: summary.requiredDays,
                icon: Target,
                iconBg: "bg-violet-100",
                iconColor: "text-violet-600"
              },
              {
                title: "Compliance",
                value: null,
                icon: summary.isCompliant ? CheckCircle2 : AlertTriangle,
                iconBg: summary.isCompliant ? "bg-emerald-100" : "bg-red-100",
                iconColor: summary.isCompliant ? "text-emerald-600" : "text-red-600"
              }
            ].map((card, idx) => (
              <SectionCard key={card.title} title={card.title} className="shadow-card">
                <div className="flex items-center gap-4">
                  <span className={cn("flex h-12 w-12 items-center justify-center rounded-xl shrink-0", card.iconBg)}>
                    <card.icon className={cn("h-6 w-6", card.iconColor)} strokeWidth={1.75} />
                  </span>
                  {card.value !== null ? (
                    <p className="text-2xl font-bold text-black">{card.value}</p>
                  ) : (
                    <Badge variant={summary.isCompliant ? "success" : "danger"}>
                      {summary.isCompliant ? "Compliant" : "Non-Compliant"}
                    </Badge>
                  )}
                </div>
              </SectionCard>
            ))}
          </div>

          {overview.length > 0 ? (
            <SectionCard title="Session Attendance Overview" className="shadow-card">
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
                      <span className="text-darksilver text-sm truncate max-w-[200px] block">
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
