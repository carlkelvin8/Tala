import { useMutation, useQuery } from "@tanstack/react-query"
import { apiRequest } from "../lib/api"
import { ApiResponse } from "../types"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Select } from "../components/ui/select"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { usePermissions } from "../hooks/usePermissions"
import { getStoredUser } from "../lib/auth"
import { PageHeader } from "../components/ui/page-header"
import { FormField } from "../components/ui/form-field"
import { Alert } from "../components/ui/alert"
import { EmptyState } from "../components/ui/empty-state"
import { StatusBadge } from "../components/ui/status-badge"
import { toast } from "sonner"
import { FormSection } from "../components/ui/form-section"
import { SectionCard } from "../components/ui/section-card"
import { ResponsiveTableCards } from "../components/ui/responsive-table-cards"
import { LoadingSkeleton } from "../components/ui/loading-skeleton"
import { ConfirmDialog } from "../components/ui/confirm-dialog"
import { useState } from "react"
import { Search, Medal, Hash, FileText, Clock, Sparkles, Award, ChevronRight, Plus, Minus, Pencil, Trash2 } from "lucide-react"
import { cn } from "../lib/utils"
import { motion } from "framer-motion"
import { cardContainerVariants, cardItemVariants } from "../components/ui/page-transition"

const schema = z.object({
  studentId: z.string().uuid(),
  type: z.enum(["MERIT", "DEMERIT"]),
  points: z.coerce.number().int().positive(),
  reason: z.string().min(1)
})

type FormValues = z.infer<typeof schema>

function relativeTime(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

function getInitials(email: string): string {
  return email.charAt(0).toUpperCase()
}

export function MeritsPage() {
  const perms = usePermissions()
  const currentUser = getStoredUser()
  const isStudent = currentUser?.role === "STUDENT"
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { type: "MERIT" } })
  const [studentSearch, setStudentSearch] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<{ type: string; points: number; reason: string }>({ type: "MERIT", points: 0, reason: "" })
  const [deletingMerit, setDeletingMerit] = useState<any | null>(null)

  const meritsQuery = useQuery({
    queryKey: ["merits", currentUser?.id],
    queryFn: () => apiRequest<ApiResponse<any[]>>(isStudent ? `/api/merits?userId=${currentUser?.id}` : "/api/merits"),
    refetchInterval: 30000
  })

  const studentsQuery = useQuery({
    queryKey: ["merit-students", studentSearch],
    queryFn: () =>
      apiRequest<ApiResponse<any[]>>(
        `/api/enrollments?search=${encodeURIComponent(studentSearch.trim())}`
      ),
    enabled: studentSearch.trim().length >= 2
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      apiRequest<ApiResponse<any>>("/api/merits", { method: "POST", body: JSON.stringify(values) }),
    onSuccess: () => {
      meritsQuery.refetch()
      toast.success("Merit entry saved")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to save merit entry")
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: typeof editForm }) =>
      apiRequest<ApiResponse<any>>(`/api/merits/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => {
      meritsQuery.refetch()
      setEditingId(null)
      toast.success("Merit entry updated")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to update")
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest<ApiResponse<any>>(`/api/merits/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      meritsQuery.refetch()
      toast.success("Merit entry deleted")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to delete")
    }
  })

  const onSubmit = form.handleSubmit(async (values) => {
    await mutation.mutateAsync(values)
    form.reset({ studentId: "", reason: "", points: 0, type: "MERIT" })
  })

  const rows = meritsQuery.data?.data ?? []

  const summary = {
    merits: rows.filter((r: any) => r.type === "MERIT").reduce((s: number, r: any) => s + r.points, 0),
    demerits: rows.filter((r: any) => r.type === "DEMERIT").reduce((s: number, r: any) => s + r.points, 0),
    count: rows.length,
  }

  const columns = [
    {
      header: "Student",
      cell: (item: any) => (
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-navy to-royal text-xs font-bold text-white shadow-soft shrink-0">
            {item.student?.email ? getInitials(item.student.email) : "?"}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-black truncate">{item.student?.email ?? item.studentId}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Type",
      cell: (item: any) => (
        <div className="flex items-center gap-2">
          {item.type === "MERIT" ? (
            <Award className="h-4 w-4 text-emerald-500" strokeWidth={2.5} />
          ) : (
            <Minus className="h-4 w-4 text-red-500" strokeWidth={3} />
          )}
          <StatusBadge status={item.type} />
        </div>
      ),
    },
    {
      header: "Points",
      cell: (item: any) => {
        const isMerit = item.type === "MERIT"
        return (
          <span className={cn(
            "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-sm font-bold",
            isMerit ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50"
          )}>
            {isMerit ? "+" : "-"}{item.points}
          </span>
        )
      },
    },
    {
      header: "Reason",
      cell: (item: any) => (
        <span className="text-sm text-darksilver truncate max-w-[200px] block">{item.reason}</span>
      ),
    },
    {
      header: "Date",
      cell: (item: any) => (
        <div className="flex items-center gap-1.5 text-sm text-darksilver whitespace-nowrap">
          <Clock className="h-3.5 w-3.5 text-darksilver shrink-0" />
          <span title={new Date(item.createdAt).toLocaleString()}>
            {item.createdAt ? relativeTime(item.createdAt) : "—"}
          </span>
        </div>
      ),
    },
  ]

  const actionsColumn = perms.canCreate ? {
    header: "Actions",
    cell: (item: any) => (
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setEditingId(item.id)
            setEditForm({ type: item.type, points: item.points, reason: item.reason })
          }}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setDeletingMerit(item)}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    ),
  } : null

  const allColumns = actionsColumn ? [...columns, actionsColumn] : columns

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
            <Medal className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
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
              <span>Performance & Discipline Tracking</span>
            </motion.div>
            <motion.h1
              className="text-xl sm:text-2xl font-bold text-white tracking-tight"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.28, ease: [0.16, 1, 0.3, 1] as const }}
            >
              Merits & Demerits
            </motion.h1>
            <motion.p
              className="mt-1 text-sm text-silver max-w-2xl"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.36, ease: [0.16, 1, 0.3, 1] as const }}
            >
              Record performance points and discipline notes for students.
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
          {[
            { label: "Total Merits", value: summary.merits, icon: Plus, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Total Demerits", value: summary.demerits, icon: Minus, color: "text-red-600", bg: "bg-red-50" },
            { label: "Net Score", value: summary.merits - summary.demerits, icon: Award, color: (summary.merits - summary.demerits) >= 0 ? "text-emerald-600" : "text-red-600", bg: (summary.merits - summary.demerits) >= 0 ? "bg-emerald-50" : "bg-red-50" },
          ].map(({ label, value, icon: SummaryIcon, color, bg }) => (
            <motion.div
              key={label}
              variants={cardItemVariants}
              whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.2, ease: "easeOut" } }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-4 rounded-xl border border-silver/20 bg-white p-5 shadow-card cursor-default"
            >
              <span className={cn("flex h-12 w-12 items-center justify-center rounded-xl shrink-0", bg)}>
                <SummaryIcon className={cn("h-6 w-6", color)} strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-darksilver">{label}</p>
                <motion.p
                  className={cn("text-2xl font-bold mt-0.5", color)}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as const }}
                >
                  {value}
                </motion.p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {editingId && (
        <FormSection title="Edit Merit/Demerit" description="Update the record details">
          <div className="grid gap-4 md:grid-cols-3">
            <FormField label="Type">
              <Select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}>
                <option value="MERIT">Merit</option>
                <option value="DEMERIT">Demerit</option>
              </Select>
            </FormField>
            <FormField label="Points">
              <Input type="number" value={editForm.points} onChange={(e) => setEditForm({ ...editForm, points: Number(e.target.value) })} />
            </FormField>
            <FormField label="Reason">
              <Input value={editForm.reason} onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })} />
            </FormField>
          </div>
          <div className="flex gap-2 pt-2">
            <Button onClick={() => updateMutation.mutate({ id: editingId, data: editForm })} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
            <Button variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
          </div>
        </FormSection>
      )}

      {perms.canCreate && (
        <FormSection title="Assign Merit/Demerit" description="Track point-based performance changes" className="shadow-card">
          <form className="grid gap-4 md:grid-cols-4" onSubmit={onSubmit}>
            <FormField label="Student" required error={form.formState.errors.studentId?.message}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darksilver" />
                <Input
                  placeholder="Search by email or ID"
                  value={studentSearch}
                  onChange={(event) => setStudentSearch(event.target.value)}
                  autoComplete="off"
                  className="h-11 pl-10"
                />
                <input type="hidden" {...form.register("studentId")} />
                {studentSearch.trim().length >= 2 && (
                  <div className="absolute z-20 mt-1 w-full rounded-xl border border-silver/30 bg-white shadow-elevated overflow-hidden">
                    {studentsQuery.isLoading ? (
                      <div className="px-4 py-3 text-xs text-darksilver">Searching students...</div>
                    ) : studentsQuery.isError ? (
                      <div className="px-4 py-3 text-xs text-red-500">Unable to search students.</div>
                    ) : (studentsQuery.data?.data ?? []).length === 0 ? (
                      <div className="px-4 py-3 text-xs text-darksilver">No matching students found.</div>
                    ) : (
                      <ul className="max-h-64 overflow-y-auto py-1 text-sm">
                        {(studentsQuery.data?.data ?? []).map((enrollment: any) => (
                          <li
                            key={enrollment.id}
                            className="flex items-center gap-3 cursor-pointer px-4 py-2.5 hover:bg-silver/10 transition-colors"
                            onMouseDown={(event) => {
                              event.preventDefault()
                              form.setValue("studentId", enrollment.userId)
                              setStudentSearch(enrollment.user?.email ?? enrollment.userId)
                            }}
                          >
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-navy to-royal text-[10px] font-bold text-white shrink-0">
                              {enrollment.user?.email ? getInitials(enrollment.user.email) : "?"}
                            </span>
                            <div>
                              <div className="font-medium text-black">
                                {enrollment.user?.email ?? enrollment.userId}
                              </div>
                              <div className="text-xs text-darksilver">
                                {enrollment.section?.code ?? "-"} · {enrollment.flight?.code ?? "-"}
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 ml-auto text-silver" />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </FormField>
            <FormField label="Type" required>
              <div className="relative">
                <Medal className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darksilver" />
                <Select {...form.register("type")} className="h-11 pl-10">
                  <option value="MERIT">Merit</option>
                  <option value="DEMERIT">Demerit</option>
                </Select>
              </div>
            </FormField>
            <FormField label="Points" required error={form.formState.errors.points?.message}>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darksilver" />
                <Input type="number" placeholder="0" {...form.register("points")} className="h-11 pl-10" min="1" />
              </div>
            </FormField>
            <FormField label="Reason" required error={form.formState.errors.reason?.message}>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darksilver" />
                <Input placeholder="Add reason" {...form.register("reason")} className="h-11 pl-10" />
              </div>
            </FormField>
            {mutation.isError && <Alert variant="danger" className="md:col-span-4">{(mutation.error as Error).message}</Alert>}
            <div className="md:col-span-4">
              <Button type="submit" disabled={mutation.isPending} className="bg-gradient-to-r from-navy to-royal hover:from-navy hover:to-black text-white shadow-soft">
                {mutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    Save
                  </span>
                )}
              </Button>
            </div>
          </form>
        </FormSection>
      )}

      <SectionCard title="Merits/Demerits" description="Recent merit and demerit records" className="shadow-card">
        {meritsQuery.isError && <Alert variant="danger">Unable to load merit records.</Alert>}
        {meritsQuery.isLoading ? (
          <LoadingSkeleton rows={3} columns={4} />
        ) : rows.length === 0 ? (
          <EmptyState title="No merits logged" description="Assign a merit or demerit to see it here." />
        ) : (
          <ResponsiveTableCards
            data={rows}
            columns={allColumns}
            rowKey={(item) => item.id}
            renderTitle={(item) => item.student?.email ?? item.studentId}
          />
        )}
      </SectionCard>

      <ConfirmDialog
        open={Boolean(deletingMerit)}
        onOpenChange={(open) => { if (!open) setDeletingMerit(null) }}
        title="Delete merit record?"
        description="This action cannot be undone. The merit or demerit record will be permanently removed."
        onConfirm={() => {
          if (deletingMerit) {
            deleteMutation.mutate(deletingMerit.id)
            setDeletingMerit(null)
          }
        }}
      />
    </div>
  )
}
