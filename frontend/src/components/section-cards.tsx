import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "../lib/api"
import { ApiResponse } from "../types"
import { CalendarCheck, GraduationCap, Award, Users } from "lucide-react"
import { cn } from "../lib/utils"

interface DashboardSummary {
  attendanceRate: number | null
  gradeAverage: number | null
  netMerits: number
  enrollmentCount: number
}

const cardConfig = [
  {
    key: "attendance",
    label: "Attendance Rate",
    description: "Present or late · last 30 days",
    icon: CalendarCheck,
    iconBg: "bg-sky-50",
    iconColor: "text-sky-500",
    accent: "before:bg-sky-400",
  },
  {
    key: "grade",
    label: "Average Grade",
    description: "Mean score across all entries",
    icon: GraduationCap,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-500",
    accent: "before:bg-violet-400",
  },
  {
    key: "merits",
    label: "Net Merits",
    description: "Merit points minus demerits",
    icon: Award,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
    accent: "before:bg-amber-400",
  },
  {
    key: "enrollment",
    label: "Enrollments",
    description: "Approved enrollment records",
    icon: Users,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-500",
    accent: "before:bg-emerald-400",
  },
]

export function SectionCards() {
  const { data: summaryData, isLoading } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => apiRequest<ApiResponse<DashboardSummary>>("/api/dashboard"),
    refetchInterval: 5000
  })

  const summary = summaryData?.data

  const values: Record<string, string> = {
    attendance: summary?.attendanceRate != null ? `${Math.round(summary.attendanceRate)}%` : "—",
    grade: summary?.gradeAverage != null ? summary.gradeAverage.toFixed(1) : "—",
    merits: summary != null ? (summary.netMerits > 0 ? `+${summary.netMerits}` : `${summary.netMerits}`) : "—",
    enrollment: summary?.enrollmentCount != null ? String(summary.enrollmentCount) : "—",
  }

  return (
    <div className="grid grid-cols-1 gap-4 px-6 sm:grid-cols-2 xl:grid-cols-4">
      {cardConfig.map(({ key, label, description, icon: Icon, iconBg, iconColor, accent }) => (
        <div
          key={key}
          className={cn(
            "relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-5 shadow-sm",
            "before:absolute before:left-0 before:top-0 before:h-full before:w-[3px] before:rounded-l-2xl",
            accent
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 truncate">
                {label}
              </p>
              {isLoading ? (
                <div className="mt-3 h-8 w-20 animate-pulse rounded-lg bg-slate-100" />
              ) : (
                <p className="mt-2 text-[2rem] font-bold leading-none tracking-tight text-slate-900">
                  {values[key]}
                </p>
              )}
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">{description}</p>
            </div>
            <span className={cn("flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl", iconBg)}>
              <Icon className={cn("h-4.5 w-4.5", iconColor)} strokeWidth={1.75} />
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
