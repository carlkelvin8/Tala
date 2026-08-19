import { useMutation, useQuery } from "@tanstack/react-query"
import { apiRequest } from "../lib/api"
import { ApiResponse } from "../types"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Select } from "../components/ui/select"
import { Alert } from "../components/ui/alert"
import { EmptyState } from "../components/ui/empty-state"
import { StatusBadge } from "../components/ui/status-badge"
import { toast } from "sonner"
import { SectionCard } from "../components/ui/section-card"
import { ResponsiveTableCards } from "../components/ui/responsive-table-cards"
import { LoadingSkeleton } from "../components/ui/loading-skeleton"
import { getStoredUser } from "../lib/auth"
import { StudentProfileDrawer } from "../components/StudentProfileDrawer"
import { RefreshIndicator } from "../components/ui/refresh-indicator"
import { Drawer } from "../components/ui/drawer"
import { FormField } from "../components/ui/form-field"
import { usePermissions } from "../hooks/usePermissions"
import { useState, useMemo } from "react"
import { Check, X, Eye, Edit, Search, Sparkles, Users, UserPlus, Ban, Save, BookOpen, Plane, Upload, Wand2 } from "lucide-react"
import { cn } from "../lib/utils"
import { motion } from "framer-motion"
import { cardContainerVariants, cardItemVariants } from "../components/ui/page-transition"

const STATUSES = ["ALL", "PENDING", "APPROVED", "REJECTED"] as const

const statusMeta: Record<string, { label: string; color: string; bg: string; dot: string; icon: typeof Check }> = {
  PENDING:   { label: "Pending",   color: "text-amber-600",  bg: "bg-amber-50",   dot: "bg-amber-500",  icon: UserPlus },
  APPROVED:  { label: "Approved",  color: "text-emerald-600", bg: "bg-emerald-50",  dot: "bg-emerald-500", icon: Check },
  REJECTED:  { label: "Rejected",  color: "text-red-600",    bg: "bg-red-50",     dot: "bg-red-500",    icon: Ban },
}

export function EnrollmentPage() {
  const currentUser = getStoredUser()
  const perms = usePermissions()
  const canApprove = perms.canEdit
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [editingEnrollment, setEditingEnrollment] = useState<any | null>(null)
  const [selectedFlight, setSelectedFlight] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCourseForSectioning, setSelectedCourseForSectioning] = useState<string>("")

  const enrollmentsQuery = useQuery({
    queryKey: ["enrollments"],
    queryFn: () => apiRequest<ApiResponse<any[]>>("/api/enrollments"),
    retry: false,
    refetchInterval: 30000
  })

  const flightsQuery = useQuery({
    queryKey: ["flights"],
    queryFn: () => apiRequest<ApiResponse<any[]>>("/api/flights"),
    retry: false
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest<ApiResponse<any>>(`/api/enrollments/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      }),
    onSuccess: () => {
      enrollmentsQuery.refetch()
      toast.success("Enrollment status updated")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Update failed")
    }
  })

  const updateEnrollmentMutation = useMutation({
    mutationFn: ({ id, flightId }: { id: string; flightId: string | null }) =>
      apiRequest<ApiResponse<any>>(`/api/enrollments/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ flightId })
      }),
    onSuccess: () => {
      enrollmentsQuery.refetch()
      toast.success("Enrollment updated")
      setEditingEnrollment(null)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Update failed")
    }
  })

  const autoSectionMutation = useMutation({
    mutationFn: (courseId: string) =>
      apiRequest<ApiResponse<any>>("/api/auto-sectioning", {
        method: "POST",
        body: JSON.stringify({ courseId })
      }),
    onSuccess: (data) => {
      enrollmentsQuery.refetch()
      toast.success(`Auto-sectioning complete: ${data.data?.assigned ?? 0} students assigned`)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Auto-sectioning failed")
    }
  })

  const coursesQuery = useQuery({
    queryKey: ["courses"],
    queryFn: () => apiRequest<ApiResponse<any[]>>("/api/courses"),
    retry: false
  })

  const handleEdit = (enrollment: any) => {
    setEditingEnrollment(enrollment)
    setSelectedFlight(enrollment.flightId || "")
  }

  const handleSaveEdit = () => {
    if (editingEnrollment) {
      updateEnrollmentMutation.mutate({
        id: editingEnrollment.id,
        flightId: selectedFlight || null
      })
    }
  }

  const handleApprove = (id: string) => {
    updateStatusMutation.mutate({ id, status: "APPROVED" })
  }

  const handleReject = (id: string) => {
    updateStatusMutation.mutate({ id, status: "REJECTED" })
  }

  const rows = enrollmentsQuery.data?.data ?? []
  const flights = flightsQuery.data?.data ?? []

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: rows.length, PENDING: 0, APPROVED: 0, REJECTED: 0 }
    for (const e of rows) {
      if (counts[e.status] !== undefined) counts[e.status]++
    }
    return counts
  }, [rows])

  const filteredRows = useMemo(() => {
    let result = statusFilter === "ALL" ? rows : rows.filter((e: any) => e.status === statusFilter)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((e: any) =>
        (e.user?.email?.toLowerCase() || "").includes(q) ||
        (e.user?.studentProfile?.firstName?.toLowerCase() || "").includes(q) ||
        (e.user?.studentProfile?.lastName?.toLowerCase() || "").includes(q) ||
        (e.user?.studentProfile?.studentNo?.toLowerCase() || "").includes(q)
      )
    }
    return result
  }, [rows, statusFilter, searchQuery])

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
    {
      header: "",
      cell: (enrollment: any) => {
        if (!canApprove) return null
        return (
          <div className="flex gap-1">
            {enrollment.status === "PENDING" && (
              <>
                <button
                  onClick={() => handleApprove(enrollment.id)}
                  disabled={updateStatusMutation.isPending}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 transition-all disabled:opacity-50"
                  title="Approve"
                >
                  <Check className="h-4 w-4" strokeWidth={2.5} />
                </button>
                <button
                  onClick={() => handleReject(enrollment.id)}
                  disabled={updateStatusMutation.isPending}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-all disabled:opacity-50"
                  title="Reject"
                >
                  <X className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </>
            )}
            {enrollment.status === "APPROVED" && perms.canEdit && (
              <button
                onClick={() => handleEdit(enrollment)}
                className="flex h-8 items-center gap-1.5 rounded-lg border border-silver/30 bg-white px-2.5 text-xs font-medium text-darksilver hover:bg-silver/10 hover:border-silver/40 transition-all"
              >
                <Edit className="h-3.5 w-3.5" />
                Edit
              </button>
            )}
          </div>
        )
      }
    }
  ]

  const editingProfile = editingEnrollment?.user?.studentProfile
  const editingName = editingProfile?.firstName && editingProfile?.lastName
    ? `${editingProfile.firstName} ${editingProfile.lastName}`
    : editingEnrollment?.user?.email

  return (
    <div className="space-y-6">
      {/* Hero */}
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
          animate={{ scale: [1, 1.15, 1], opacity: [0.05, 0.12, 0.05] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <motion.div
            className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20"
            initial={{ opacity: 0, scale: 0.7, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] as const }}
          >
            <Users className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
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
              <span>Student Management</span>
            </motion.div>
            <motion.h1
              className="text-xl sm:text-2xl font-bold text-white tracking-tight"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.28, ease: [0.16, 1, 0.3, 1] as const }}
            >
              Enrollment
            </motion.h1>
            <motion.p
              className="mt-1 text-sm text-silver max-w-2xl"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.36, ease: [0.16, 1, 0.3, 1] as const }}
            >
              Manage student enrollment records, approve requests, and auto-section students.
            </motion.p>
          </div>
          <motion.div
            className="shrink-0 flex items-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <RefreshIndicator isRefetching={enrollmentsQuery.isRefetching} />
          </motion.div>
        </div>
      </motion.div>

      {rows.length > 0 && (
        <motion.div
          className="grid gap-4 sm:grid-cols-3"
          variants={cardContainerVariants}
          initial="initial"
          animate="animate"
        >
          {(["PENDING", "APPROVED", "REJECTED"] as const).map((status) => {
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
                  <meta.icon className={cn("h-6 w-6", meta.color)} strokeWidth={1.75} />
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

      {perms.canEdit && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <SectionCard title="Auto-Sectioning" description="Automatically assign approved students to sections (28 per section, alphabetical)" className="shadow-card">
            <div className="flex flex-wrap items-center gap-3 px-6 pb-4">
              <Select
                value={selectedCourseForSectioning}
                onChange={(e) => setSelectedCourseForSectioning(e.target.value)}
                className="h-10 w-64"
              >
                <option value="">Select a course</option>
                {(coursesQuery.data?.data ?? []).map((course: any) => (
                  <option key={course.id} value={course.id}>
                    {course.code} — {course.name}
                  </option>
                ))}
              </Select>
              <Button
                onClick={() => {
                  if (selectedCourseForSectioning) {
                    autoSectionMutation.mutate(selectedCourseForSectioning)
                  } else {
                    toast.error("Please select a course first")
                  }
                }}
                disabled={autoSectionMutation.isPending || !selectedCourseForSectioning}
                className="flex items-center gap-2 bg-gradient-to-r from-navy to-royal hover:from-navy hover:to-black text-white"
              >
                {autoSectionMutation.isPending ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sectioning...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    Auto-Section Students
                  </>
                )}
              </Button>
              <p className="text-xs text-darksilver">
                Sorts students alphabetically and assigns them to sections of 28.
              </p>
            </div>
          </SectionCard>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.22, ease: [0.16, 1, 0.3, 1] as const }}
      >
        <SectionCard title="Enrollments" description="Student enrollment requests and assignments" className="shadow-card">
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
                    {meta?.label ?? s}
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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 pl-10"
                />
              </div>
            </div>
          </div>
        )}

        {enrollmentsQuery.isError && (
          <div className="px-6 pt-4">
            <Alert variant="danger">
              {(enrollmentsQuery.error as Error).message === "Unauthorized"
                ? "Please log in to view enrollments."
                : "Unable to load enrollments."}
            </Alert>
          </div>
        )}

        <div className="px-6 pt-3 pb-2">
          {enrollmentsQuery.isLoading ? (
            <LoadingSkeleton rows={3} columns={4} />
          ) : rows.length === 0 ? (
            <div className="py-4">
              <EmptyState title="No enrollments yet" description="Create a new enrollment to see results here." />
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="py-4">
              <EmptyState
                title="No results found"
                description={searchQuery ? "Try a different search term." : "No enrollments with this status."}
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

      <Drawer
        open={!!editingEnrollment}
        onOpenChange={(open) => !open && setEditingEnrollment(null)}
        title="Edit Enrollment"
      >
        <div className="h-1 w-full bg-sky-500" />
        <div className="p-4 space-y-5">
          {editingEnrollment && (
            <div className="flex items-center gap-3 pb-3 border-b border-silver/20">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-navy to-royal text-sm font-bold text-white shrink-0">
                {editingName?.[0]?.toUpperCase() || "?"}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-black truncate">{editingName}</p>
                <p className="text-xs text-darksilver">{editingEnrollment.user?.email}</p>
              </div>
            </div>
          )}

          <FormField label="Flight">
            <Select
              value={selectedFlight}
              onChange={(e) => setSelectedFlight(e.target.value)}
              className="h-11"
            >
              <option value="">No flight</option>
              {flights.map((flight: any) => (
                <option key={flight.id} value={flight.id}>
                  {flight.code} — {flight.name}
                </option>
              ))}
            </Select>
          </FormField>

          {updateEnrollmentMutation.isError && (
            <Alert variant="danger">
              {(updateEnrollmentMutation.error as Error).message}
            </Alert>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSaveEdit}
              disabled={updateEnrollmentMutation.isPending}
              className="bg-gradient-to-r from-navy to-royal hover:from-navy hover:to-black text-white shadow-soft"
            >
              {updateEnrollmentMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Save Changes
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setEditingEnrollment(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  )
}
