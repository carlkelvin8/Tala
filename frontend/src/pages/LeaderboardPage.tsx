import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "../lib/api"
import { ApiResponse } from "../types"
import { SectionCard } from "../components/ui/section-card"
import { toast } from "sonner"
import { cn } from "../lib/utils"
import { Trophy, Flame, Star, Medal, Crown, RefreshCw } from "lucide-react"

type Badge = { key: string; label: string; icon: string }

type LeaderboardEntry = {
  userId: string
  name: string
  studentNo: string
  sectionName: string | null
  present: number
  late: number
  absent: number
  totalSessions: number
  attendanceRate: number
  currentStreak: number
  points: number
  badges: Badge[]
  rank: number
}

const rankStyles: Record<number, string> = {
  1: "from-yellow-400 to-amber-500 text-white shadow-lg shadow-amber-200",
  2: "from-slate-300 to-slate-400 text-white shadow-md",
  3: "from-amber-600 to-orange-400 text-white shadow-md",
}

export function LeaderboardPage() {
  const [tick] = useState(0)

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["leaderboard", tick],
    queryFn: () => apiRequest<ApiResponse<LeaderboardEntry[]>>("/api/leaderboard"),
  })

  useEffect(() => {
    if (error) toast.error(error instanceof Error ? error.message : "Failed to fetch leaderboard")
  }, [error])

  const entries = data?.data ?? []
  const topThree = entries.slice(0, 3)
  const rest = entries.slice(3)
  const maxPoints = entries[0]?.points ?? 1

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-royal to-navy p-8 text-white shadow-card">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-gold/20 blur-3xl" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
            <Trophy className="h-7 w-7 text-gold" />
          </div>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
              Leaderboard
              <Crown className="h-5 w-5 text-gold" />
            </h1>
            <p className="mt-1 text-sm text-silver">Attendance streaks, badges, and rankings</p>
          </div>
        </div>
      </div>

      {isLoading && (
        <SectionCard title="Loading" description="">
          <div className="flex justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-navy" />
          </div>
        </SectionCard>
      )}

      {!isLoading && entries.length === 0 && (
        <SectionCard title="No Rankings Yet" description="">
          <p className="py-6 text-center text-sm text-darksilver">
            No attendance records yet — rankings appear once sessions are held.
          </p>
        </SectionCard>
      )}

      {entries.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {topThree.map((entry, index) => (
              <div
                key={entry.userId}
                className={cn(
                  "relative overflow-hidden rounded-2xl border-2 p-5 text-center shadow-card transition-transform hover:-translate-y-1",
                  index === 0 ? "border-yellow-400/60 sm:-mt-3 sm:mb-3" : index === 1 ? "border-slate-300/60" : "border-orange-300/60"
                )}
              >
                <div className={cn("mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br font-bold text-lg", rankStyles[entry.rank])}>
                  #{entry.rank}
                </div>
                <p className="mt-3 truncate text-base font-bold text-black">{entry.name}</p>
                <p className="text-xs text-darksilver">{entry.studentNo}</p>
                <p className="mt-2 text-3xl font-extrabold tabular-nums bg-gradient-to-r from-navy to-royal bg-clip-text text-transparent">
                  {entry.points}
                </p>
                <p className="text-[11px] uppercase tracking-wider text-darksilver font-medium">points</p>
                <div className="mt-3 flex items-center justify-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1 font-semibold text-green-600">
                    <Flame className="h-3.5 w-3.5" />
                    {entry.currentStreak} streak
                  </span>
                  <span className="font-semibold text-navy">{entry.attendanceRate}%</span>
                </div>
              </div>
            ))}
          </div>

          <SectionCard title="Full Rankings" description={`${entries.length} ranked students`}>
            <div className="space-y-2">
              {rest.map((entry) => (
                <div key={entry.userId} className="rounded-xl border border-silver/30 bg-white/50 px-4 py-3 transition-colors hover:bg-white">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-silver/20 text-sm font-bold text-darksilver tabular-nums">
                      {entry.rank}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-black">{entry.name}</p>
                        <span className="shrink-0 text-sm font-bold tabular-nums text-navy">{entry.points} pts</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-silver/25">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-navy to-royal transition-all duration-700"
                          style={{ width: `${Math.round((entry.points / maxPoints) * 100)}%` }}
                        />
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-darksilver">
                        <span>{entry.studentNo}</span>
                        <span>{entry.sectionName ?? "—"}</span>
                        <span className="text-green-600 font-medium">{entry.present}P</span>
                        <span className="text-amber-600 font-medium">{entry.late}L</span>
                        <span className="text-red-500 font-medium">{entry.absent}A</span>
                        <span className="inline-flex items-center gap-0.5 text-orange-500 font-medium">
                          <Flame className="h-3 w-3" />
                          {entry.currentStreak}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          {entry.badges.map((badge) => (
                            <span
                              key={badge.key}
                              title={badge.label}
                              className="inline-flex items-center gap-0.5 rounded-full bg-gold/15 px-1.5 py-0.5 font-semibold text-yellow-700"
                            >
                              <Star className="h-3 w-3" />
                              {badge.icon}
                            </span>
                          ))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {isFetching && <p className="pt-2 text-center text-xs text-darksilver"><RefreshCw className="inline h-3 w-3 animate-spin" /> refreshing…</p>}
          </SectionCard>

          <SectionCard title="Badge Collection" description="How to earn badges">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
              {[
                { icon: "🏆", label: "Perfect Attendance", desc: "Zero absences across 3+ sessions" },
                { icon: "🔥", label: "Streak Master", desc: "4+ consecutive sessions attended" },
                { icon: "🌅", label: "Early Bird", desc: "Checked in before 7 AM three times" },
                { icon: "🎖️", label: "Reliable Cadet", desc: "90%+ attendance rate" },
                { icon: "⭐", label: "Veteran", desc: "6+ sessions attended" },
              ].map((badge) => (
                <div key={badge.label} className="flex items-start gap-3 rounded-xl border border-silver/30 bg-white/50 p-3">
                  <span className="text-2xl">{badge.icon}</span>
                  <div>
                    <p className="font-semibold text-black text-xs uppercase tracking-wide inline-flex items-center gap-1">
                      <Medal className="h-3 w-3 text-gold" />
                      {badge.label}
                    </p>
                    <p className="text-xs text-darksilver mt-0.5">{badge.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </>
      )}
    </div>
  )
}
