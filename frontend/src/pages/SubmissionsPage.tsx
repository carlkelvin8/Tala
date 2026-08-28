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
import { Drawer } from "../components/ui/drawer"
import { FormField } from "../components/ui/form-field"
import { RefreshIndicator } from "../components/ui/refresh-indicator"
import { useState, useMemo, useRef } from "react"
import { Inbox, Sparkles, Check, X, Upload, CalendarDays, FileText } from "lucide-react"
import { cn } from "../lib/utils"
import { motion } from "framer-motion"
import { cardContainerVariants, cardItemVariants } from "../components/ui/page-transition"
import { Link } from "react-router-dom"

const STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const

const DOC_TYPES = [
  { value: "EXCUSE_LETTER", label: "Excuse Letter" },
  { value: "MEDICAL_CERTIFICATE", label: "Medical Certificate" },
  { value: "OTHER_OFFICIAL_DOCUMENT", label: "Other Official Document" },
] as const

const statusMeta: Record<string, { label: string; color: string; bg: string; dot: string; icon: typeof Check }> = {
  PENDING:  { label: "Pending",  color: "text-amber-600",  bg: "bg-amber-50",   dot: "bg-amber-500",  icon: FileText },
  APPROVED: { label: "Approved", color: "text-emerald-600", bg: "bg-emerald-50",  dot: "bg-emerald-500", icon: Check },
  REJECTED: { label: "Rejected", color: "text-red-600",    bg: "bg-red-50",     dot: "bg-red-500",    icon: X },
}

function docTypeLabel(value: string) {
  return DOC_TYPES.find((d) => d.value === value)?.label ?? value
}

function DocTypeTag({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center rounded-md bg-navy/5 px-2 py-0.5 text-[11px] font-semibold text-navy ring-1 ring-inset ring-navy/10">
      {docTypeLabel(value)}
    </span>
  )
}

export function SubmissionsPage() {
  const currentUser = getStoredUser()
  const isStudent = currentUser?.role === "STUDENT"
  const isStaff = currentUser?.role === "ADMIN" || currentUser?.role === "IMPLEMENTOR"

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
            <Inbox className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
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
              <span>{isStudent ? "Student Portal" : "Admin Panel"}</span>
            </motion.div>
            <motion.h1
              className="text-xl sm:text-2xl font-bold text-white tracking-tight"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.28, ease: [0.16, 1, 0.3, 1] as const }}
            >
              Submission Box
            </motion.h1>
            <motion.p
              className="mt-1 text-sm text-silver max-w-2xl"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.36, ease: [0.16, 1, 0.3, 1] as const }}
            >
              {isStudent
                ? "Submit and track excuse letters, medical certificates, and other official documents."
                : "Review and manage student document submissions."}
            </motion.p>
          </div>
          {isStaff && (
            <motion.div
              className="shrink-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <RefreshIndicator isRefetching={false} />
            </motion.div>
          )}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.22, ease: [0.16, 1, 0.3, 1] as const }}
      >
        {isStudent ? <StudentView /> : <StaffView />}
      </motion.div>
    </div>
  )
}

function StudentView() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [docType, setDocType] = useState<string>("EXCUSE_LETTER")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [fileName, setFileName] = useState("")
  const [fileUrl, setFileUrl] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const submissionsQuery = useQuery({
    queryKey: ["my-submissions"],
    queryFn: () => apiRequest<ApiResponse<any[]>>("/api/submissions/my"),
    refetchInterval: 10_000,
  })

  const submitMutation = useMutation({
    mutationFn: (body: {
      docType: string
      title: string
      description: string
      fileName: string
      fileUrl: string
      dateFrom: string
      dateTo: string
    }) =>
      apiRequest<ApiResponse<any>>("/api/submissions", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      submissionsQuery.refetch()
      toast.success("Document submitted")
      setDrawerOpen(false)
      resetForm()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Submission failed")
    },
  })

  const resetForm = () => {
    setDocType("EXCUSE_LETTER")
    setTitle("")
    setDescription("")
    setFileName("")
    setFileUrl("")
    setDateFrom("")
    setDateTo("")
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setFileName(file.name)
    }
  }

  const handleSubmit = () => {
    if (!title.trim() || !fileName.trim()) {
      toast.error("Please provide a title and attach a file")
      return
    }
    if (dateFrom && dateTo && new Date(dateTo) < new Date(dateFrom)) {
      toast.error("End date cannot be before start date")
      return
    }
    const cdDateFrom = dateFrom || ""
    const cdDateTo = dateTo || ""
    if (selectedFile) {
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        submitMutation.mutate({
          docType,
          title: title.trim(),
          description: description.trim(),
          fileName: fileName.trim(),
          fileUrl: dataUrl,
          dateFrom: cdDateFrom,
          dateTo: cdDateTo,
        })
      }
      reader.readAsDataURL(selectedFile)
    } else {
      submitMutation.mutate({
        docType,
        title: title.trim(),
        description: description.trim(),
        fileName: fileName.trim(),
        fileUrl: fileUrl.trim(),
        dateFrom: cdDateFrom,
        dateTo: cdDateTo,
      })
    }
  }

  const rows = submissionsQuery.data?.data ?? []

  const columns = [
    {
      header: "Type",
      cell: (s: any) => <DocTypeTag value={s.docType} />,
    },
    {
      header: "Document",
      cell: (s: any) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-darksilver shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-black truncate">{s.title}</p>
            <p className="text-xs text-darksilver truncate">{s.fileName}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Date Range",
      cell: (s: any) => (
        <div className="flex items-center gap-1.5 text-sm text-darksilver whitespace-nowrap">
          {s.dateFrom && s.dateTo ? (
            <>
              <CalendarDays className="h-3.5 w-3.5 shrink-0" />
              <span>{new Date(s.dateFrom).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
              <span className="text-silver">—</span>
              <span>{new Date(s.dateTo).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
            </>
          ) : (
            <span className="text-xs text-silver">—</span>
          )}
        </div>
      ),
    },
    {
      header: "Status",
      cell: (s: any) => <StatusBadge status={s.status} />,
    },
  ]

  return (
    <>
      <SectionCard
        title="My Submissions"
        description="Documents you have submitted for review"
        className="shadow-card"
        actions={
          <button
            onClick={() => setDrawerOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-navy to-royal px-4 py-2 text-sm font-semibold text-white shadow-soft hover:from-navy hover:to-black transition-all"
          >
            <Upload className="h-4 w-4" />
            Submit Document
          </button>
        }
      >
        {submissionsQuery.isError && (
          <div className="px-6 pt-4">
            <Alert variant="danger">
              {(submissionsQuery.error as Error).message === "Unauthorized"
                ? "Please log in to view submissions."
                : "Unable to load submissions."}
            </Alert>
          </div>
        )}

        <div className="px-6 pt-3 pb-2">
          {submissionsQuery.isLoading ? (
            <LoadingSkeleton rows={3} columns={4} />
          ) : rows.length === 0 ? (
            <div className="py-4">
              <EmptyState title="No submissions yet" description="Submit a document to see it here." />
            </div>
          ) : (
            <ResponsiveTableCards
              data={rows}
              columns={columns}
              rowKey={(s) => s.id}
              renderTitle={(s) => s.title}
            />
          )}
        </div>
      </SectionCard>

      <Drawer
        open={drawerOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDrawerOpen(false)
            resetForm()
          }
        }}
        title="Submit a Document"
      >
        <div className="h-1 w-full bg-sky-500" />
        <div className="p-4 space-y-5">
          <FormField label="Document Type" required>
            <Select value={docType} onChange={(e) => setDocType(e.target.value)} className="h-11">
              {DOC_TYPES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Title" required>
            <Input
              placeholder="e.g. Excuse letter for family emergency"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11"
            />
          </FormField>

          <FormField label="File" required>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex h-11 cursor-pointer items-center gap-3 rounded-lg border border-dashed border-silver/50 bg-white px-4 hover:border-navy/40 hover:bg-slate-50 transition-colors"
            >
              <Upload className="h-4 w-4 text-darksilver" />
              <span className="text-sm text-darksilver truncate">
                {selectedFile ? selectedFile.name : "Click to upload (PDF, DOCX, JPG)"}
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
          </FormField>

          <FormField label="Or paste file URL (optional)">
            <Input
              placeholder="https://..."
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              className="h-11"
              disabled={Boolean(selectedFile)}
            />
          </FormField>

          <FormField label="Description (optional)">
            <Input
              placeholder="Additional details for the reviewer"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-11"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="From (optional)">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-11"
              />
            </FormField>
            <FormField label="To (optional)">
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-11"
              />
            </FormField>
          </div>
          <p className="text-xs text-darksilver -mt-2">
            Use the date range to link this document to specific days of absence.
          </p>

          {submitMutation.isError && (
            <Alert variant="danger">{(submitMutation.error as Error).message}</Alert>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              className="bg-gradient-to-r from-navy to-royal hover:from-navy hover:to-black text-white shadow-soft"
            >
              {submitMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Submit
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setDrawerOpen(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Drawer>
    </>
  )
}

function StaffView() {
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [docTypeFilter, setDocTypeFilter] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState("")

  const submissionsQuery = useQuery({
    queryKey: ["submissions"],
    queryFn: () => apiRequest<ApiResponse<any[]>>("/api/submissions"),
    refetchInterval: 10_000,
  })

  const reviewMutation = useMutation({
    mutationFn: ({ id, status, remarks }: { id: string; status: string; remarks?: string }) =>
      apiRequest<ApiResponse<any>>(`/api/submissions/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status, remarks }),
      }),
    onSuccess: () => {
      submissionsQuery.refetch()
      toast.success("Submission reviewed")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Review failed")
    },
  })

  const handleApprove = (id: string) => {
    reviewMutation.mutate({ id, status: "APPROVED" })
  }

  const handleReject = (id: string) => {
    reviewMutation.mutate({ id, status: "REJECTED" })
  }

  const rows = submissionsQuery.data?.data ?? []

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: rows.length, PENDING: 0, APPROVED: 0, REJECTED: 0 }
    for (const s of rows) {
      if (counts[s.status] !== undefined) counts[s.status]++
    }
    return counts
  }, [rows])

  const filteredRows = useMemo(() => {
    let result = statusFilter === "ALL" ? rows : rows.filter((s: any) => s.status === statusFilter)
    if (docTypeFilter !== "ALL") result = result.filter((s: any) => s.docType === docTypeFilter)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((s: any) =>
        (s.user?.studentProfile?.firstName?.toLowerCase() || "").includes(q) ||
        (s.user?.studentProfile?.lastName?.toLowerCase() || "").includes(q) ||
        (s.user?.email?.toLowerCase() || "").includes(q) ||
        (s.title?.toLowerCase() || "").includes(q) ||
        (s.fileName?.toLowerCase() || "").includes(q)
      )
    }
    return result
  }, [rows, statusFilter, docTypeFilter, searchQuery])

  const columns = [
    {
      header: "Student",
      cell: (s: any) => {
        const profile = s.user?.studentProfile
        const name = profile?.firstName && profile?.lastName
          ? `${profile.firstName} ${profile.lastName}`
          : null
        const initial = name
          ? (profile.firstName?.[0] ?? s.user?.email?.[0] ?? "?").toUpperCase()
          : (s.user?.email?.[0] ?? "?").toUpperCase()
        return (
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-navy to-royal text-xs font-bold text-white shadow-soft shrink-0">
              {initial}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-black truncate">{name || s.user?.email || "-"}</p>
                {profile?.studentNo && (
                  <span className="text-[10px] font-medium text-darksilver shrink-0">#{profile.studentNo}</span>
                )}
              </div>
              {name && s.user?.email && (
                <p className="text-xs text-darksilver truncate">{s.user.email}</p>
              )}
            </div>
          </div>
        )
      },
    },
    {
      header: "Type",
      cell: (s: any) => <DocTypeTag value={s.docType} />,
    },
    {
      header: "Document",
      cell: (s: any) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-darksilver shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-black truncate">{s.title}</p>
            <p className="text-xs text-darksilver truncate">{s.fileName}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Date Range",
      cell: (s: any) => (
        <div className="flex items-center gap-1.5 text-sm text-darksilver whitespace-nowrap">
          {s.dateFrom && s.dateTo ? (
            <>
              <CalendarDays className="h-3.5 w-3.5 shrink-0" />
              <span>{new Date(s.dateFrom).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
              <span className="text-silver">—</span>
              <span>{new Date(s.dateTo).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
            </>
          ) : (
            <span className="text-xs text-silver">—</span>
          )}
        </div>
      ),
    },
    {
      header: "Status",
      cell: (s: any) => <StatusBadge status={s.status} />,
    },
    {
      header: "",
      cell: (s: any) => {
        if (s.status !== "PENDING") return null
        return (
          <div className="flex gap-1">
            <button
              onClick={() => handleApprove(s.id)}
              disabled={reviewMutation.isPending}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 transition-all disabled:opacity-50"
              title="Approve"
            >
              <Check className="h-4 w-4" strokeWidth={2.5} />
            </button>
            <button
              onClick={() => handleReject(s.id)}
              disabled={reviewMutation.isPending}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 transition-all disabled:opacity-50"
              title="Reject"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>
          </div>
        )
      },
    },
  ]

  return (
    <SectionCard title="All Submissions" description="Review student document submissions" className="shadow-card">
      {rows.length > 0 && (
        <div className="space-y-4">
          <motion.div
            className="grid gap-4 sm:grid-cols-3"
            variants={cardContainerVariants}
            initial="initial"
            animate="animate"
          >
            {([...STATUSES] as const).map((status) => {
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

          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 px-6 pt-2">
              <button
                key="ALL"
                onClick={() => setStatusFilter((prev) => (prev === "ALL" ? "ALL" : "ALL"))}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                  statusFilter === "ALL"
                    ? "bg-navy text-white ring-1 ring-inset ring-navy"
                    : "bg-white text-darksilver hover:bg-silver/20 hover:text-black/80"
                )}
              >
                All
                <span className={cn(
                  "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  statusFilter === "ALL" ? "bg-white/20" : "bg-white"
                )}>
                  {statusCounts.ALL}
                </span>
              </button>
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
                        ? `${meta.bg} ${meta.color} ring-1 ring-inset ring-silver/30`
                        : "bg-white text-darksilver hover:bg-silver/20 hover:text-black/80"
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} />
                    {meta.label}
                    <span className={cn(
                      "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                      isActive ? "bg-white/60" : "bg-white"
                    )}>
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>

            <div className="flex flex-wrap items-center gap-2 px-6">
              <Select
                value={docTypeFilter}
                onChange={(e) => setDocTypeFilter(e.target.value)}
                className="h-10 w-48"
              >
                <option value="ALL">All document types</option>
                {DOC_TYPES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </Select>
              <div className="relative flex-1 min-w-[220px]">
                <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darksilver" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                <Input
                  placeholder="Search by name, email, title, or file name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 pl-10"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {submissionsQuery.isError && (
        <div className="px-6 pt-4">
          <Alert variant="danger">
            {(submissionsQuery.error as Error).message === "Unauthorized"
              ? "Please log in to view submissions."
              : "Unable to load submissions."}
          </Alert>
        </div>
      )}

      <div className="px-6 pt-3 pb-2">
        {submissionsQuery.isLoading ? (
          <LoadingSkeleton rows={3} columns={5} />
        ) : rows.length === 0 ? (
          <div className="py-4">
            <EmptyState
              title="No submissions yet"
              description="Submitted documents will appear here."
              action={
                <Link
                  to="/students"
                  className="text-sm font-semibold text-navy hover:underline"
                >
                  Go to Students
                </Link>
              }
            />
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="py-4">
            <EmptyState
              title="No results found"
              description={searchQuery ? "Try a different search term." : "No submissions with this filter."}
            />
          </div>
        ) : (
          <ResponsiveTableCards
            data={filteredRows}
            columns={columns}
            rowKey={(s) => s.id}
            renderTitle={(s) => {
              const p = s.user?.studentProfile
              return p?.firstName && p?.lastName ? `${p.firstName} ${p.lastName}` : (s.user?.email ?? "Student")
            }}
          />
        )}
      </div>
    </SectionCard>
  )
}