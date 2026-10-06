import { useMutation, useQuery } from "@tanstack/react-query"
import { apiRequest } from "../lib/api"
import { ApiResponse } from "../types"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Select } from "../components/ui/select"
import { Alert } from "../components/ui/alert"
import { EmptyState } from "../components/ui/empty-state"
import { SearchInput } from "../components/ui/search-input"
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
import { useState, useMemo, useRef } from "react"
import { Check, X, Eye, Edit, Search, Sparkles, Users, UserPlus, Ban, Save, BookOpen, Plane, Upload } from "lucide-react"
import { cn } from "../lib/utils"
import { parseCsv } from "../lib/export"
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
  // Enrollment is view-only for implementors — only admins may approve/reject/edit
  const canApprove = currentUser?.role === "ADMIN"
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [editingEnrollment, setEditingEnrollment] = useState<any | null>(null)
  const [selectedFlight, setSelectedFlight] = useState<string>("")
  const [selectedSection, setSelectedSection] = useState<string>("")
  // Bulk section assignment: checked enrollment ids and the chosen target section
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set())
  const [bulkSection, setBulkSection] = useState<string>("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 8
  const [searchQuery, setSearchQuery] = useState("")

  const enrollmentsQuery = useQuery({
    queryKey: ["enrollments"],
    queryFn: () => apiRequest<ApiResponse<any[]>>("/api/enrollments?pageSize=100"),
    retry: false,
    refetchInterval: 30000
  })

  const sectionsQuery = useQuery({
    queryKey: ["sections"],
    queryFn: () => apiRequest<ApiResponse<any[]>>("/api/sections"),
    retry: false
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
    mutationFn: ({ id, sectionId, flightId }: { id: string; sectionId: string | null; flightId: string | null }) =>
      apiRequest<ApiResponse<any>>(`/api/enrollments/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ sectionId, flightId })
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

  const importFileRef = useRef<HTMLInputElement>(null)
  const [importPreview, setImportPreview] = useState<Record<string, string>[] | null>(null)
  const [importStatus, setImportStatus] = useState<"APPROVED" | "PENDING">("APPROVED")
  const [importResult, setImportResult] = useState<{ created: number; skipped: number; failed: number; errors?: string[] } | null>(null)

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      const text = await file.text()
      const parsed = parseCsv(text)
      if (parsed.length < 2) throw new Error("CSV is empty")
      // Header names are matched loosely: case, spaces, "_" and "-" are ignored, and common aliases work
      const headers = parsed[0].map((h) => h.trim().toLowerCase().replace(/[\s_-]+/g, ""))
      const aliases: Record<string, string> = {
        email: "email", emailaddress: "email",
        firstname: "firstName", first: "firstName",
        lastname: "lastName", last: "lastName", surname: "lastName",
        studentno: "studentNo", studentnumber: "studentNo", studentid: "studentNo", idnumber: "studentNo",
        gender: "gender", sex: "gender",
        birthdate: "birthDate", birthday: "birthDate", dateofbirth: "birthDate",
        contactno: "contactNo", contactnumber: "contactNo", contact: "contactNo", phone: "contactNo", mobile: "contactNo",
        address: "address", fulladdress: "address",
        sectioncode: "sectionCode", section: "sectionCode",
      }
      const rows = parsed.slice(1).map((cells) => {
        const row: Record<string, string> = {}
        headers.forEach((header, i) => {
          row[aliases[header] ?? header] = (cells[i] ?? "").trim()
        })
        return row
      })
      const valid = rows.filter((row) => row.email && row.firstName && row.lastName && row.studentNo)
      if (valid.length === 0) throw new Error("No valid rows — required columns: email, firstName, lastName, studentNo")
      if (valid.length < rows.length) toast.warning(`${rows.length - valid.length} rows skipped due to missing required fields`)
      setImportPreview(valid)
      setImportResult(null)
      toast.success(`${valid.length} rows parsed and ready to import`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to parse CSV")
    } finally {
      event.target.value = ""
    }
  }

  const importMutation = useMutation({
    mutationFn: () =>
      apiRequest<ApiResponse<{ created: number; skipped: number; failed: number; errors: string[] }>>("/api/enrollments/import", {
        method: "POST",
        body: JSON.stringify({ rows: importPreview, enrollmentStatus: importStatus }),
      }),
    onSuccess: (data) => {
      setImportResult(data.data ?? null)
      setImportPreview(null)
      enrollmentsQuery.refetch()
      toast.success(`Import complete: ${data.data?.created ?? 0} students created`)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Import failed")
    }
  })

  const bulkAssignMutation = useMutation({
    mutationFn: async ({ ids, sectionId }: { ids: string[]; sectionId: string }) => {
      const failures: string[] = []
      let assigned = 0
      // Small batches keep the server load reasonable while still being fast
      for (let i = 0; i < ids.length; i += 5) {
        const results = await Promise.allSettled(
          ids.slice(i, i + 5).map((id) =>
            apiRequest<ApiResponse<any>>(`/api/enrollments/${id}`, { method: "PATCH", body: JSON.stringify({ sectionId }) })
          )
        )
        for (const result of results) {
          if (result.status === "fulfilled") assigned++
          else failures.push(result.reason instanceof Error ? result.reason.message : "Update failed")
        }
      }
      return { assigned, failures }
    },
    onSuccess: ({ assigned, failures }) => {
      enrollmentsQuery.refetch()
      if (assigned > 0) toast.success(`${assigned} student${assigned === 1 ? "" : "s"} assigned to the section`)
      if (failures.length > 0) toast.error(`${failures.length} could not be assigned: ${failures[0]}`)
      // Clear the selection; any failed students can simply be re-selected and retried
      setCheckedIds(new Set())
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Bulk assignment failed")
    }
  })

  const handleEdit = (enrollment: any) => {
    setEditingEnrollment(enrollment)
    setSelectedFlight(enrollment.flightId || "")
    setSelectedSection(enrollment.sectionId || "")
  }

  const handleSaveEdit = () => {
    if (editingEnrollment) {
      updateEnrollmentMutation.mutate({
        id: editingEnrollment.id,
        sectionId: selectedSection || null,
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
  // A student may only join sections of their own NSTP program (the server enforces this too)
  const editingProgram = editingEnrollment?.user?.program ?? editingEnrollment?.section?.course?.nstpType ?? null
  const sectionOptions = (sectionsQuery.data?.data ?? []).filter(
    (section: any) => !editingProgram || !section.course?.nstpType || section.course.nstpType === editingProgram
  )

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

  // Client-side pagination over the filtered rows
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pagedRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const checkedRows = filteredRows.filter((row: any) => checkedIds.has(row.id))
  const allFilteredChecked = filteredRows.length > 0 && filteredRows.every((row: any) => checkedIds.has(row.id))
  const toggleChecked = (id: string) =>
    setCheckedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  // When every selected student shares a program, only offer that program's sections
  const checkedPrograms = new Set(checkedRows.map((row: any) => row.user?.program ?? row.section?.course?.nstpType).filter(Boolean))
  const bulkSectionOptions = (sectionsQuery.data?.data ?? []).filter(
    (section: any) => checkedPrograms.size !== 1 || !section.course?.nstpType || checkedPrograms.has(section.course.nstpType)
  )

  const columns = [
    ...(canApprove ? [{
      header: "",
      cell: (enrollment: any) => (
        <input
          type="checkbox"
          checked={checkedIds.has(enrollment.id)}
          onChange={() => toggleChecked(enrollment.id)}
          aria-label="Select student"
          className="h-4 w-4 rounded border-silver/50 accent-navy"
        />
      ),
    }] : []),
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
            {enrollment.status === "APPROVED" && canApprove && (
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
              Manage student enrollment records and approve requests.
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

      {canApprove && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <SectionCard title="CSV Bulk Import" description="Import a whole block of students from a CSV file (columns: email, firstName, lastName, studentNo, gender, birthDate, contactNo, address, sectionCode)" className="shadow-card">
            <div className="flex flex-wrap items-center gap-3 px-6 pb-4">
              <input
                ref={importFileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleImportFile}
              />
              <Button
                variant="outline"
                onClick={() => importFileRef.current?.click()}
                disabled={importMutation.isPending}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                {importPreview ? `${importPreview.length} rows ready` : "Choose CSV file"}
              </Button>
              <Select
                value={importStatus}
                onChange={(e) => setImportStatus(e.target.value as "APPROVED" | "PENDING")}
                className="h-10 w-40"
              >
                <option value="APPROVED">Enroll as Approved</option>
                <option value="PENDING">Enroll as Pending</option>
              </Select>
              <Button
                onClick={() => importMutation.mutate()}
                disabled={!importPreview || importMutation.isPending}
                className="flex items-center gap-2 bg-gradient-to-r from-navy to-royal hover:from-navy hover:to-black text-white"
              >
                {importMutation.isPending ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Import Students
                  </>
                )}
              </Button>
              <a
                href="data:text/csv;charset=utf-8,email,firstName,lastName,studentNo,gender,birthDate,contactNo,address,sectionCode%0Ajuandelacruz%40example.com,Juan,Dela+Cruz,2025-00001,Male,2005-01-15,09171234567,Pasay+City,CWTS-SEC-A"
                download="import-template.csv"
                className="text-xs text-royal hover:text-navy underline"
              >
                Download template
              </a>
            </div>
            {importResult && (
              <div className="px-6 pb-4">
                <Alert variant={importResult.failed > 0 ? "warning" : "success"} className="text-sm">
                  Imported: {importResult.created} created, {importResult.skipped} skipped (already exist), {importResult.failed} failed.
                  {importResult.errors && importResult.errors.length > 0 && ` First error: ${importResult.errors[0]}`}
                </Alert>
              </div>
            )}
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
                    onClick={() => { setStatusFilter(isActive ? "ALL" : s); setPage(1) }}
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
              <SearchInput
                placeholder="Search by name, email, or student ID... (Enter to search)"
                onSearch={(term) => { setSearchQuery(term); setPage(1) }}
              />
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
            <>
            {canApprove && (
              <div className="mb-3 flex flex-wrap items-center gap-3 rounded-xl border border-silver/20 bg-white/60 px-4 py-3">
                <label className="flex items-center gap-2 text-xs font-semibold text-darksilver">
                  <input
                    type="checkbox"
                    checked={allFilteredChecked}
                    onChange={() =>
                      setCheckedIds(allFilteredChecked ? new Set() : new Set(filteredRows.map((row: any) => row.id)))
                    }
                    className="h-4 w-4 rounded border-silver/50 accent-navy"
                  />
                  Select all ({filteredRows.length})
                </label>
                {checkedRows.length > 0 && (
                  <>
                    <span className="text-xs font-semibold text-black">{checkedRows.length} selected</span>
                    <Select value={bulkSection} onChange={(e) => setBulkSection(e.target.value)} className="h-9 w-56">
                      <option value="">Select a section</option>
                      {bulkSectionOptions.map((section: any) => (
                        <option key={section.id} value={section.id}>{section.code} — {section.name}</option>
                      ))}
                    </Select>
                    <Button
                      onClick={() => bulkAssignMutation.mutate({ ids: checkedRows.map((row: any) => row.id), sectionId: bulkSection })}
                      disabled={!bulkSection || bulkAssignMutation.isPending}
                      className="h-9 bg-gradient-to-r from-navy to-royal hover:from-navy hover:to-black text-white shadow-soft"
                    >
                      {bulkAssignMutation.isPending ? "Assigning…" : "Assign to section"}
                    </Button>
                    <button
                      type="button"
                      onClick={() => setCheckedIds(new Set())}
                      className="text-xs text-darksilver hover:text-black transition-colors"
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>
            )}
            <ResponsiveTableCards
              data={pagedRows}
              columns={columns}
              rowKey={(enrollment) => enrollment.id}
              renderTitle={(enrollment) => {
                const p = enrollment.user?.studentProfile
                return p?.firstName && p?.lastName ? `${p.firstName} ${p.lastName}` : (enrollment.user?.email ?? "Student")
              }}
            />
            </>
          )}
          {filteredRows.length > 0 && (
            <div className="flex items-center justify-between px-6 pt-4 text-sm">
              <span className="text-xs text-darksilver">
                Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filteredRows.length)} of {filteredRows.length}
              </span>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={safePage === 1} onClick={() => setPage((v) => v - 1)}>Previous</Button>
                <span className="text-xs text-darksilver">Page {safePage} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => setPage((v) => v + 1)}>Next</Button>
              </div>
            </div>
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

          <FormField label={editingProgram ? `Section (${editingProgram})` : "Section"}>
            <Select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="h-11"
            >
              <option value="">No section</option>
              {sectionOptions.map((section: any) => (
                <option key={section.id} value={section.id}>
                  {section.code} — {section.name}
                </option>
              ))}
            </Select>
          </FormField>

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
