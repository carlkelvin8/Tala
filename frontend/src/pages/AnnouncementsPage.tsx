import { useMutation, useQuery } from "@tanstack/react-query"
import { apiRequest } from "../lib/api"
import { ApiResponse } from "../types"
import { Input } from "../components/ui/input"
import { Textarea } from "../components/ui/textarea"
import { Button } from "../components/ui/button"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { FormField } from "../components/ui/form-field"
import { Alert } from "../components/ui/alert"
import { EmptyState } from "../components/ui/empty-state"
import { toast } from "sonner"
import { FormSection } from "../components/ui/form-section"
import { SectionCard } from "../components/ui/section-card"
import { ResponsiveTableCards } from "../components/ui/responsive-table-cards"
import { LoadingSkeleton } from "../components/ui/loading-skeleton"
import { Drawer } from "../components/ui/drawer"
import { ConfirmDialog } from "../components/ui/confirm-dialog"
import { Megaphone, Sparkles, Plus, Edit, Trash2, Save, X, RefreshCw, Clock, CalendarCheck, Filter } from "lucide-react"
import { useState, useMemo } from "react"
import { cn } from "../lib/utils"
import { motion } from "framer-motion"
import { usePermissions } from "../hooks/usePermissions"
import { getFullName, relativeTime } from "../lib/display"
import { ProgramScopePicker } from "../components/program-scope-picker"

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
  program: z.enum(["CWTS", "ROTC"]).optional(),
  eventDate: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

/* "2026-10-05" for <input type="date"> from a stored ISO datetime.
   Uses local date parts so the day never shifts across timezones. */
function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const dd = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${mm}-${dd}`
}

/* Human-readable date, e.g. "Oct 3, 2026". Central here so list, drawer
   and tooltips stay consistent. */
export function formatAnnouncementDate(iso: string | null | undefined): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
}

export function AnnouncementsPage() {
  const perms = usePermissions()
  const [editingAnnouncement, setEditingAnnouncement] = useState<any | null>(null)
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<any | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editBody, setEditBody] = useState("")
  const [editProgram, setEditProgram] = useState<string>("")
  const [editEventDate, setEditEventDate] = useState<string>("")
  const [programFilter, setProgramFilter] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState("")

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const announcementsQuery = useQuery({
    queryKey: ["announcements"],
    queryFn: () => apiRequest<ApiResponse<any[]>>("/api/announcements"),
    refetchInterval: 30000,
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      apiRequest<ApiResponse<any>>("/api/announcements", {
        method: "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      announcementsQuery.refetch()
      toast.success("Announcement published")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to publish announcement")
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest<ApiResponse<any>>(`/api/announcements/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      announcementsQuery.refetch()
      toast.success("Announcement updated")
      setEditingAnnouncement(null)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Update failed")
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest<ApiResponse<any>>(`/api/announcements/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      announcementsQuery.refetch()
      toast.success("Announcement deleted")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Delete failed")
    },
  })

  const onSubmit = form.handleSubmit(async (values) => {
    await mutation.mutateAsync({
      ...values,
      eventDate: values.eventDate ? new Date(`${values.eventDate}T00:00:00`).toISOString() : undefined,
    })
    form.reset({ title: "", body: "", program: undefined, eventDate: undefined })
  })

  const handleEdit = (a: any) => {
    setEditingAnnouncement(a)
    setEditTitle(a.title)
    setEditBody(a.body)
    setEditProgram(a.program ?? "")
    setEditEventDate(toDateInputValue(a.eventDate))
  }

  const handleSaveEdit = () => {
    if (!editingAnnouncement) return
    updateMutation.mutate({
      id: editingAnnouncement.id,
      data: {
        title: editTitle,
        body: editBody,
        program: editProgram || null,
        eventDate: editEventDate ? new Date(`${editEventDate}T00:00:00`).toISOString() : null,
      },
    })
  }

  const handleDelete = (a: any) => setDeletingAnnouncement(a)
  const confirmDelete = () => {
    if (deletingAnnouncement) {
      deleteMutation.mutate(deletingAnnouncement.id)
      setDeletingAnnouncement(null)
    }
  }

  const rows = announcementsQuery.data?.data ?? []

  const counted = useMemo(() => {
    const counts: Record<string, number> = { ALL: rows.length, CWTS: 0, ROTC: 0 }
    for (const a of rows) {
      const key = a.program ?? "GENERAL"
      counts[key] = (counts[key] || 0) + 1
    }
    return counts
  }, [rows])

  const filteredRows = useMemo(() => {
    let result = programFilter === "ALL" ? rows : rows.filter((a: any) => a.program === programFilter)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((a: any) =>
        a.title.toLowerCase().includes(q) ||
        (a.body?.toLowerCase() || "").includes(q)
      )
    }
    return result
  }, [rows, programFilter, searchQuery])

  const columns = [
    {
      header: "Announcement",
      cell: (a: any) => {
        const program = a.program
        return (
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50">
              <Megaphone className="h-4.5 w-4.5 text-amber-600" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-black truncate">{a.title}</p>
              <p className="text-xs text-darksilver mt-0.5 line-clamp-2 max-w-[380px]">{a.body}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {a.eventDate && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-royal/10 px-2 py-0.5 text-[10px] font-bold text-royal dark:text-sky-200">
                    <CalendarCheck className="h-3 w-3" />
                    {formatAnnouncementDate(a.eventDate)}
                  </span>
                )}
                {program && (
                  <span className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                    program === "CWTS" ? "bg-teal-50 text-teal-600" : "bg-amber-50 text-amber-600"
                  )}>
                    {program}
                  </span>
                )}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      header: "Posted By",
      cell: (a: any) => (
        <div className="leading-tight">
          <p className="text-sm font-medium text-black">{getFullName(a.createdBy)}</p>
          {a.createdBy?.email && <p className="text-xs text-darksilver">{a.createdBy.email}</p>}
        </div>
      ),
    },
    {
      header: "Date",
      cell: (a: any) => (
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <Clock className="h-3.5 w-3.5 shrink-0 text-darksilver" />
          <div className="leading-tight">
            <p className="text-sm font-medium text-black" title={a.createdAt ? new Date(a.createdAt).toLocaleString() : undefined}>
              {formatAnnouncementDate(a.createdAt)}
            </p>
            {a.createdAt && <p className="text-[11px] text-darksilver">{relativeTime(a.createdAt)}</p>}
          </div>
        </div>
      ),
    },
    ...(perms.canEdit || perms.canDelete ? [{
      header: "",
      cell: (a: any) => (
        <div className="flex gap-1">
          {perms.canEdit && (
            <Button size="sm" variant="outline" onClick={() => handleEdit(a)} className="h-8 w-8 p-0" title="Edit">
              <Edit className="h-3.5 w-3.5" />
            </Button>
          )}
          {perms.canDelete && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDelete(a)}
              disabled={deleteMutation.isPending}
              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    }] : []),
  ]

  const isFormVisible = perms.canCreate

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
            <Megaphone className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
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
              <span>NSTP Bulletin Board</span>
            </motion.div>
            <motion.h1
              className="text-xl sm:text-2xl font-bold text-white tracking-tight"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.28, ease: [0.16, 1, 0.3, 1] as const }}
            >
              Announcements
            </motion.h1>
            <motion.p
              className="mt-1 text-sm text-silver max-w-2xl"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.36, ease: [0.16, 1, 0.3, 1] as const }}
            >
              Stay up to date with official NSTP notices, schedules, and reminders.
            </motion.p>
          </div>
        </div>
      </motion.div>

      {isFormVisible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <FormSection
            title="Post Announcement"
            description="Publish a notice for students and staff"
            className="shadow-card"
          >
            <form className="space-y-5" onSubmit={onSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Title" required error={form.formState.errors.title?.message}>
                  <div className="relative">
                    <Megaphone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darksilver" />
                    <Input placeholder="e.g. Schedule change for this week" {...form.register("title")} className="h-11 pl-10" />
                  </div>
                </FormField>
                <FormField label="Program Scope">
                  <ProgramScopePicker value={form.watch("program") ?? ""} onChange={(v) => form.setValue("program", (v || undefined) as "CWTS" | "ROTC" | undefined, { shouldDirty: true })} />
                </FormField>
                <FormField label="Event Date" hint="Optional — shows on the calendar">
                  <Input type="date" {...form.register("eventDate")} className="h-11" />
                </FormField>
              </div>
              <FormField label="Message" required error={form.formState.errors.body?.message}>
                <Textarea placeholder="Write the announcement details here..." {...form.register("body")} className="min-h-[120px]" />
              </FormField>
              {mutation.isError && (
                <Alert variant="danger">{(mutation.error as Error).message}</Alert>
              )}
              <Button type="submit" disabled={mutation.isPending} className="h-11 bg-gradient-to-r from-navy to-royal hover:from-navy hover:to-black text-white shadow-soft">
                {mutation.isPending ? (
                  <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" />Publishing…</span>
                ) : (
                  <span className="flex items-center gap-2"><Plus className="h-4 w-4" />Post Announcement</span>
                )}
              </Button>
            </form>
          </FormSection>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.22, ease: [0.16, 1, 0.3, 1] as const }}
      >
        <SectionCard
          title="All Announcements"
          description="Latest notices and updates"
          className="shadow-card"
        >
          {rows.length > 0 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 px-6 pt-2">
                {["ALL", "CWTS", "ROTC"].map((prog) => {
                  const isActive = programFilter === prog
                  return (
                    <button
                      key={prog}
                      onClick={() => setProgramFilter(isActive ? "ALL" : prog)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                        isActive
                          ? prog === "CWTS" ? "bg-teal-50 text-teal-600 ring-1 ring-inset ring-teal-200"
                          : prog === "ROTC" ? "bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-200"
                          : "bg-navy text-white ring-1 ring-inset ring-navy"
                          : "bg-white text-darksilver hover:bg-silver/20 hover:text-black/80"
                      )}
                    >
                      {prog === "ALL" ? <CalendarCheck className="h-3 w-3" /> : null}
                      {prog === "ALL" ? "All" : prog}
                      <span className="ml-0.5 rounded-full bg-white/70 px-1.5 py-0.5 text-[10px] font-bold">
                        {counted[prog] || 0}
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="px-6">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darksilver" />
                  <Input
                    placeholder="Search announcements..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 pl-10"
                  />
                </div>
              </div>
            </div>
          )}

          {announcementsQuery.isError && (
            <div className="px-6 pt-4">
              <Alert variant="danger">Unable to load announcements.</Alert>
            </div>
          )}

          <div className="px-6 pt-3 pb-2">
            {announcementsQuery.isLoading ? (
              <LoadingSkeleton rows={3} columns={3} />
            ) : rows.length === 0 ? (
              <div className="py-4">
                <EmptyState title="No announcements yet" description="Post the first announcement to get started." />
              </div>
            ) : filteredRows.length === 0 ? (
              <div className="py-4">
                <EmptyState title="No results found" description={searchQuery ? "Try a different search term." : "No announcements in this program."} />
              </div>
            ) : (
              <ResponsiveTableCards
                data={filteredRows}
                columns={columns}
                rowKey={(a) => a.id}
                renderTitle={(a) => a.title}
              />
            )}
          </div>
        </SectionCard>
      </motion.div>

      <Drawer
        open={!!editingAnnouncement}
        onOpenChange={(open) => !open && setEditingAnnouncement(null)}
        title="Edit Announcement"
      >
        <div className="h-1 w-full bg-amber-500" />
        <div className="p-4 space-y-5">
          {editingAnnouncement && (
            <div className="flex items-center gap-3 pb-2 border-b border-silver/20">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                <Megaphone className="h-5 w-5 text-amber-600" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-black truncate">{editingAnnouncement.title}</p>
                <p className="text-xs text-darksilver">Posted {formatAnnouncementDate(editingAnnouncement.createdAt)}{editingAnnouncement.createdAt ? ` · ${relativeTime(editingAnnouncement.createdAt)}` : ""}</p>
              </div>
            </div>
          )}

          <FormField label="Title" required>
            <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="e.g. Schedule change" className="h-11" />
          </FormField>

          <FormField label="Program Scope">
            <ProgramScopePicker value={editProgram} onChange={setEditProgram} />
          </FormField>

          <FormField label="Event Date" hint="Optional — shows on the calendar">
            <Input type="date" value={editEventDate} onChange={(e) => setEditEventDate(e.target.value)} className="h-11" />
          </FormField>

          <FormField label="Message" required>
            <Textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} placeholder="Write the announcement details..." className="min-h-[120px]" />
          </FormField>

          {updateMutation.isError && (
            <Alert variant="danger">{(updateMutation.error as Error).message}</Alert>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSaveEdit}
              disabled={updateMutation.isPending || !editTitle || !editBody}
              className="bg-gradient-to-r from-navy to-royal hover:from-navy hover:to-black"
            >
              {updateMutation.isPending ? (
                <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" />Saving…</span>
              ) : (
                <span className="flex items-center gap-2"><Save className="h-4 w-4" />Save Changes</span>
              )}
            </Button>
            <Button variant="outline" onClick={() => setEditingAnnouncement(null)}><X className="h-4 w-4 mr-1" />Cancel</Button>
          </div>
        </div>
      </Drawer>

      <ConfirmDialog
        open={!!deletingAnnouncement}
        onOpenChange={(open) => !open && setDeletingAnnouncement(null)}
        title="Delete Announcement"
        description={`Are you sure you want to delete "${deletingAnnouncement?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={confirmDelete}
      />
    </div>
  )
}