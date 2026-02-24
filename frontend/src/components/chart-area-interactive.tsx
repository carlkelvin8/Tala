import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts"
import { apiRequest } from "../lib/api"
import { ApiResponse } from "../types"
import { cn } from "../lib/utils"

const ranges = [
  { value: "7d", label: "7d" },
  { value: "30d", label: "30d" },
  { value: "3m", label: "3mo" },
] as const

type Range = typeof ranges[number]["value"]

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-100 bg-white px-3.5 py-2.5 shadow-lg">
        <p className="text-[11px] font-medium text-slate-400">{label}</p>
        <p className="mt-0.5 text-sm font-bold text-slate-900">
          {payload[0].value}{" "}
          <span className="text-xs font-normal text-slate-400">present</span>
        </p>
      </div>
    )
  }
  return null
}

export function ChartAreaInteractive() {
  const [range, setRange] = useState<Range>("30d")

  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ["dashboard-attendance"],
    queryFn: () => apiRequest<ApiResponse<any[]>>("/api/attendance?pageSize=100"),
  })

  const attendanceRecords = attendanceData?.data ?? []

  const chartData = (() => {
    if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) return []

    const now = new Date()
    const cutoff = new Date(now)
    if (range === "7d") cutoff.setDate(now.getDate() - 7)
    else if (range === "30d") cutoff.setDate(now.getDate() - 30)
    else cutoff.setDate(now.getDate() - 90)
    cutoff.setHours(0, 0, 0, 0)

    const buckets = new Map<string, { name: string; present: number }>()

    for (const record of attendanceRecords as any[]) {
      if (!record.date) continue
      const date = new Date(record.date)
      if (Number.isNaN(date.getTime()) || date < cutoff) continue
      const day = new Date(date)
      day.setHours(0, 0, 0, 0)
      const key = day.toISOString().slice(0, 10)
      const label = day.toLocaleDateString(undefined, { month: "short", day: "numeric" })
      const isPresent = record.status === "PRESENT" || record.status === "LATE"
      const existing = buckets.get(key)
      if (!existing) {
        buckets.set(key, { name: label, present: isPresent ? 1 : 0 })
      } else if (isPresent) {
        existing.present += 1
      }
    }

    return Array.from(buckets.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([, v]) => v)
  })()

  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Attendance Over Time</h3>
          <p className="mt-0.5 text-xs text-slate-400">Daily present &amp; late count for the selected period</p>
        </div>
        <div className="flex items-center gap-1 self-start rounded-xl border border-slate-100 bg-slate-50 p-1 sm:self-auto">
          {ranges.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setRange(value)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150",
                range === value
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart body */}
      <div className="px-6 py-5">
        {isLoading ? (
          <div className="flex h-56 items-center justify-center">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-slate-500" />
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex h-56 flex-col items-center justify-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50">
              <svg className="h-5 w-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <p className="text-xs text-slate-400">No attendance data for this period</p>
          </div>
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0f172a" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="#0f172a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  tickMargin={10}
                  interval="preserveStartEnd"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#e2e8f0", strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="present"
                  stroke="#0f172a"
                  strokeWidth={2}
                  fill="url(#attendanceGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#0f172a", stroke: "#fff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}
