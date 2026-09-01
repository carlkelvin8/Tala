import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "../lib/api"
import { ApiResponse, ProgramType } from "../types"
import { getStoredUser } from "../lib/auth"
import { CalendarCheck, GraduationCap, Award, Users } from "lucide-react"
import { cn } from "../lib/utils"

interface DashboardSummary {
  attendanceRate: number | null
  attendanceByProgram: { CWTS: number | null; ROTC: number | null } | null
  gradeAverage: number | null
  netMerits: number
  enrollmentCount: number
}

interface StatCard {
  key: string
  label: string
  description: string
  icon: typeof CalendarCheck
  iconBg: string
  iconColor: string
  accent: string
}

export function SectionCards({ program }: { program?: ProgramType }) {
  const { data: summaryData, isLoading } = useQuery({
    queryKey: ["dashboard-summary", program ?? "all"],
    queryFn: () => apiRequest<ApiResponse<DashboardSummary>>(`/api/dashboard${program ? `?program=${program}` : ""}`),
    refetchInterval: 30000
  })

  const summary = summaryData?.data
  const user = getStoredUser()

  const cardConfig: StatCard[] = [
    {
      key: "attendance",
      label: program ? `${program} Attendance Rate` : "Attendance Rate",
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

  // Net Merits is not shown on implementor dashboards. Students see their
  // specific enrollment status in the student dashboard, so the aggregate
  // "Enrollments" count card is hidden for them.
  const visibleCards =
    user?.role === "IMPLEMENTOR"
      ? cardConfig.filter((c) => c.key !== "merits")
      : user?.role === "STUDENT"
      ? cardConfig.filter((c) => c.key !== "enrollment")
      : cardConfig

  const values: Record<string, string> = {
    attendance: summary?.attendanceRate != null ? `${Math.round(summary.attendanceRate)}%` : "—",
    grade: summary?.gradeAverage != null ? summary.gradeAverage.toFixed(1) : "—",
    merits: summary != null ? (summary.netMerits > 0 ? `+${summary.netMerits}` : `${summary.netMerits}`) : "—",
    enrollment: summary?.enrollmentCount != null ? String(summary.enrollmentCount) : "—",
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2",
        user?.role === "IMPLEMENTOR" ? "lg:grid-cols-3 xl:grid-cols-3" : "xl:grid-cols-4"
      )}
    >
      {visibleCards.map(({ key, label, description, icon: Icon, iconBg, iconColor, accent }, idx) => (
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
              <p className="text-[11px] font-semibold uppercase tracking-widest text-darksilver truncate">
                {label}
              </p>
              {isLoading ? (
                <div className="mt-3 h-8 w-20 animate-pulse rounded-lg bg-silver/20" />
              ) : (
                <p className="mt-2 text-[2rem] font-bold leading-none tracking-tight text-black">
                  {values[key]}
                </p>
              )}
              <p className="mt-2 text-xs text-darksilver leading-relaxed">{description}</p>
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