import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "../lib/api"
import { ApiResponse } from "../types"
import { Input } from "../components/ui/input"
import { useState, useMemo } from "react"
import { Alert } from "../components/ui/alert"
import { EmptyState } from "../components/ui/empty-state"
import { StatusBadge } from "../components/ui/status-badge"
import { SectionCard } from "../components/ui/section-card"
import { ResponsiveTableCards } from "../components/ui/responsive-table-cards"
import { LoadingSkeleton } from "../components/ui/loading-skeleton"
import { Search, Sparkles, Users, UserCheck, UserPlus, Eye, BookOpen, Plane, GraduationCap } from "lucide-react"
import { StudentProfileDrawer } from "../components/StudentProfileDrawer"
import { cn } from "../lib/utils"
import { motion } from "framer-motion"
import { cardContainerVariants, cardItemVariants } from "../components/ui/page-transition"

const STATUSES = ["ALL", "APPROVED", "PENDING", "REJECTED"] as const

const statusMeta: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  APPROVED: { label: "Approved", color: "text-emerald-600", bg: "bg-emerald-50", dot: "bg-emerald-500" },
  PENDING:  { label: "Pending",  color: "text-amber-600",  bg: "bg-amber-50",   dot: "bg-amber-500" },
  REJECTED: { label: "Rejected", color: "text-red-600",    bg: "bg-red-50",     dot: "bg-red-500" },
}

export function StudentsPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const query = useQuery({
    queryKey: ["enrollments", search],
    queryFn: () => apiRequest<ApiResponse<any[]>>(`/api/enrollments?search=${encodeURIComponent(search)}`)
  })
  const rows = query.data?.data ?? []

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: rows.length, APPROVED: 0, PENDING: 0, REJECTED: 0 }
    for (const e of rows) {
      if (counts[e.status] !== undefined) counts[e.status]++
    }
    return counts
  }, [rows])

  const filteredRows = useMemo(() => {
    return statusFilter === "ALL" ? rows : rows.filter((e: any) => e.status === statusFilter)
  }, [rows, statusFilter])

  const columns = [
    {
      header: "Student",
      cell: (enrollment: any) => {
        const profile = enrollment.user?.studentProfile
        const name = profile?.firstName && profile?.lastName
          ? `${profile.firstName} ${profile.lastName}`
          : null
        const initial = name
          ? (profile.firstName?.[0] ?? enrollment.user?.email?.[0] ?? "?").toUpperCase()
          : (enrollment.user?.email?.[0] ?? "?").toUpperCase()
        return (
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-navy to-royal text-xs font-bold text-white shadow-soft shrink-0">
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-black truncate">{name || enrollment.user?.email || "-"}</p>
                {profile?.studentNo && (
                  <span className="text-[10px] font-medium text-darksilver shrink-0">#{profile.studentNo}</span>
                )}
              </div>
              {name && enrollment.user?.email && (
                <p className="text-xs text-darksilver truncate">{enrollment.user.email}</p>
              )}
            </div>
            <button
              onClick={() => setSelectedUserId(enrollment.userId)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-darksilver hover:text-darksilver hover:bg-silver/10 transition-all shrink-0"
              title="View Profile"
            >
              <Eye className="h-4 w-4" />
            </button>
          </div>
        )
      }
    },
    {
      header: "Status",
      cell: (enrollment: any) => <StatusBadge status={enrollment.status} />
    },
    {
      header: "Section",
      cell: (enrollment: any) => enrollment.section?.code
        ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-darksilver">
            <BookOpen className="h-3 w-3" />
            {enrollment.section.code}
          </span>
        )
        : <span className="text-xs text-darksilver">—</span>
    },
    {
      header: "Flight",
      cell: (enrollment: any) => enrollment.flight?.code
        ? (
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-semibold text-royal">
            <Plane className="h-3 w-3" />
            {enrollment.flight.code}
          </span>
        )
        : <span className="text-xs text-darksilver">—</span>
    },
  ]

  return (
    <div className="space-y-6">
      <motion.div
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-royal to-navy px-6 sm:px-10 py-8 shadow-elevated"
        initial={{ opacity: 0, y: 32, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
      >
        <div className="absolute inset-0 bg-grid opacity-[0.06]" />
        <motion.div
          className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-gold/10 blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.18, 0.1] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-royal/10 blur-3xl"
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <motion.div
            className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20"
            initial={{ opacity: 0, scale: 0.7, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] as const }}
          >
            <GraduationCap className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
          </motion.div>
          <div className="flex-1 min-w-0">
            <motion.div
              className="flex items-center gap-2 text-gold text-xs font-medium uppercase tracking-wider mb-1.5"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
            >
              <motion.span animate={{ rotate: [0, 20, -10, 0] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 5 }}>
                <Sparkles className="h-3.5 w-3.5" />
              </motion.span>
              <span>Student Directory</span>
            </motion.div>
            <motion.h1
              className="text-xl sm:text-2xl font-bold text-white tracking-tight"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.28, ease: [0.16, 1, 0.3, 1] as const }}
            >
              Students
            </motion.h1>
            <motion.p
              className="mt-1 text-sm text-silver max-w-2xl"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.36, ease: [0.16, 1, 0.3, 1] as const }}
            >
              Browse, search, and filter enrolled learners across sections and flights.
            </motion.p>
          </div>
        </div>
      </motion.div>

      {rows.length > 0 && (
        <motion.div
          className="grid gap-4 sm:grid-cols-3"
          variants={cardContainerVariants}
          initial="initial"
          animate="animate"
        >
          {([
            { status: "APPROVED", icon: UserCheck },
            { status: "PENDING", icon: UserPlus },
            { status: "REJECTED", icon: Users },
          ] as const).map(({ status, icon: StatIcon }) => {
            const meta = statusMeta[status]
            const count = statusCounts[status]
            return (
              <motion.div
                key={status}
                variants={cardItemVariants}
                whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.2, ease: "easeOut" } }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-4 rounded-xl border border-silver/20 bg-white p-5 shadow-card cursor-default"
              >
                <span className={cn("flex h-12 w-12 items-center justify-center rounded-xl shrink-0", meta.bg)}>
                  <StatIcon className={cn("h-6 w-6", meta.color)} strokeWidth={1.75} />
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-darksilver">{meta.label}</p>
                  <motion.p
                    className={cn("text-2xl font-bold mt-0.5", meta.color)}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
                  >
                    {count}
                  </motion.p>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.22, ease: [0.16, 1, 0.3, 1] as const }}
      >
      <SectionCard title="Enrollment Directory" description="Search and filter enrolled students" className="shadow-card">
        {rows.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 px-6 pt-2">
              {STATUSES.map((s) => {
                const meta = statusMeta[s]
                const count = statusCounts[s] || 0
                const isActive = statusFilter === s
                return (
                  <button
                    key={s}
                    onClick={() => setStatusFilter(isActive ? "ALL" : s)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                      isActive
                        ? s === "ALL"
                          ? "bg-navy text-white ring-1 ring-inset ring-navy"
                          : `${meta.bg} ${meta.color} ring-1 ring-inset ring-silver/30`
                        : "bg-white text-darksilver hover:bg-silver/20 hover:text-black/80"
                    )}
                  >
                    {s !== "ALL" && <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />}
                    {s === "ALL" ? "All" : meta?.label ?? s}
                    <span className={cn(
                      "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                      isActive ? (s === "ALL" ? "bg-white/20" : "bg-white/60") : "bg-white"
                    )}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="px-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darksilver" />
                <Input
                  placeholder="Search by name, email, or student ID..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="h-10 pl-10"
                />
              </div>
            </div>
          </div>
        )}

        {query.isError && (
          <div className="px-6 pt-4">
            <Alert variant="danger">Unable to load students.</Alert>
          </div>
        )}

        <div className="px-6 pt-3 pb-2">
          {query.isLoading ? (
            <LoadingSkeleton rows={3} columns={4} />
          ) : rows.length === 0 ? (
            <div className="py-4">
              <EmptyState title="No students found" description={search ? "Try adjusting your search query." : "No enrollment records yet."} />
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="py-4">
              <EmptyState
                title="No results found"
                description="No students with this enrollment status."
              />
            </div>
          ) : (
            <ResponsiveTableCards
              data={filteredRows}
              columns={columns}
              rowKey={(enrollment) => enrollment.id}
              renderTitle={(enrollment) => {
                const p = enrollment.user?.studentProfile
                return p?.firstName && p?.lastName ? `${p.firstName} ${p.lastName}` : (enrollment.user?.email ?? "Student")
              }}
            />
          )}
        </div>
      </SectionCard>
      </motion.div>

      <StudentProfileDrawer userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
    </div>
  )
}
