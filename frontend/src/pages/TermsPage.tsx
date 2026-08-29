import { useMutation, useQuery } from "@tanstack/react-query"
import { apiRequest } from "../lib/api"
import { ApiResponse } from "../types"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { FormField } from "../components/ui/form-field"
import { EmptyState } from "../components/ui/empty-state"
import { toast } from "sonner"
import { SectionCard } from "../components/ui/section-card"
import { ResponsiveTableCards } from "../components/ui/responsive-table-cards"
import { LoadingSkeleton } from "../components/ui/loading-skeleton"
import { Badge } from "../components/ui/badge"
import { Drawer } from "../components/ui/drawer"
import { ConfirmDialog } from "../components/ui/confirm-dialog"
import { Calendar, Sparkles, Plus, Edit, Trash2, CheckCircle2, XCircle, Save, X, RefreshCw, ChevronRight } from "lucide-react"
import { useState, useMemo } from "react"
import { cn } from "../lib/utils"

const termSchema = z.object({
  name: z.string().min(1, "Name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
}).refine((data) => new Date(data.endDate) >= new Date(data.startDate), {
  message: "End date must be on or after start date",
  path: ["endDate"]
})

type TermFormValues = z.infer<typeof termSchema>

export function TermsPage() {
  const [editingTerm, setEditingTerm] = useState<any | null>(null)
  const [deletingTerm, setDeletingTerm] = useState<any | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const form = useForm<TermFormValues>({
    resolver: zodResolver(termSchema),
    defaultValues: { name: "", startDate: "", endDate: "" }
  })

  const termsQuery = useQuery({
    queryKey: ["terms"],
    queryFn: () => apiRequest<ApiResponse<any[]>>("/api/terms"),
    refetchInterval: 10000,
    retry: false
  })

  const createMutation = useMutation({
    mutationFn: (values: TermFormValues) =>
      apiRequest<ApiResponse<any>>("/api/terms", {
        method: "POST",
        body: JSON.stringify({
          ...values,
          startDate: new Date(values.startDate).toISOString(),
          endDate: new Date(values.endDate).toISOString()
        })
      }),
    onSuccess: () => {
      toast.success("Term created")
      termsQuery.refetch()
      setShowCreate(false)
      form.reset()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to create term")
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: TermFormValues }) =>
      apiRequest<ApiResponse<any>>(`/api/terms/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...values,
          startDate: new Date(values.startDate).toISOString(),
          endDate: new Date(values.endDate).toISOString()
        })
      }),
    onSuccess: () => {
      toast.success("Term updated")
      termsQuery.refetch()
      setEditingTerm(null)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to update term")
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest<ApiResponse<any>>(`/api/terms/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Term deleted")
      termsQuery.refetch()
      setDeletingTerm(null)
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to delete term")
  })

  const activateMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest<ApiResponse<any>>(`/api/terms/${id}`, { method: "PATCH", body: JSON.stringify({ isActive: true }) }),
    onSuccess: () => {
      toast.success("Term activated")
      termsQuery.refetch()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to activate term")
  })

  const terms = termsQuery.data?.data ?? []

  const termStats = useMemo(() => {
    const total = terms.length
    const activeCount = terms.filter((t: any) => t.isActive).length
    return { total, activeCount }
  }, [terms])

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-royal to-navy px-6 sm:px-10 py-8 shadow-elevated">
        <div className="absolute inset-0 bg-grid opacity-[0.06]" />
        <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-royal/10 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
            <Calendar className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-gold text-xs font-medium uppercase tracking-wider mb-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Academic Terms</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Terms</h1>
            <p className="mt-1 text-sm text-silver max-w-2xl">Manage academic terms and training periods for your NSTP program.</p>
          </div>
          <Button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-sm px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/20 hover:bg-white/20 hover:ring-white/30 transition-all shrink-0"
          >
            <Plus className="h-4 w-4" />
            New Term
          </Button>
        </div>
      </div>

      {terms.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-4 rounded-xl border border-silver/20 bg-white p-5 shadow-card transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-royal/10 shrink-0">
              <Calendar className="h-6 w-6 text-royal" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-darksilver">Total Terms</p>
              <p className="text-2xl font-bold text-royal mt-0.5">{termStats.total}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-silver/20 bg-white p-5 shadow-card transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 shrink-0">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-darksilver">Active Term</p>
              <p className="text-2xl font-bold text-emerald-600 mt-0.5">{termStats.activeCount}</p>
            </div>
          </div>
        </div>
      )}

      <SectionCard title="Terms Directory" description="View and manage all academic terms" className="shadow-card">
        {termsQuery.isLoading ? (
          <LoadingSkeleton rows={3} />
        ) : terms.length === 0 ? (
          <EmptyState
            title="No terms yet"
            description="Create an academic term to start tracking training days."
          />
        ) : (
          <ResponsiveTableCards
            columns={[
              {
                header: "Name",
                cell: (r: any) => (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{r.name}</span>
                  </div>
                )
              },
              {
                header: "Start",
                cell: (r: any) => (
                  <span className="text-sm text-darksilver">{formatDate(r.startDate)}</span>
                )
              },
              {
                header: "End",
                cell: (r: any) => (
                  <span className="text-sm text-darksilver">{formatDate(r.endDate)}</span>
                )
              },
              {
                header: "Status",
                cell: (r: any) => (
                  <span className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold",
                    r.isActive
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200"
                      : "bg-white text-darksilver ring-1 ring-inset ring-silver/30"
                  )}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", r.isActive ? "bg-emerald-500" : "bg-darksilver")} />
                    {r.isActive ? "Active" : "Inactive"}
                  </span>
                )
              }
            ]}
            data={terms}
            rowKey={(r: any) => r.id}
            renderTitle={(term: any) => term.name}
            renderActions={(term: any) => (
              <div className="flex items-center gap-2">
                {!term.isActive && (
                  <Button
                    size="sm"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200 hover:bg-emerald-100 transition-all"
                    onClick={() => activateMutation.mutate(term.id)}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Activate
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-darksilver hover:text-royal hover:bg-royal/10"
                  onClick={() => { setEditingTerm(term); form.reset({ name: term.name, startDate: term.startDate?.split("T")[0] || "", endDate: term.endDate?.split("T")[0] || "" }) }}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={term.isActive}
                  title={term.isActive ? "The active term cannot be deleted" : "Delete term"}
                  className="h-8 w-8 p-0 text-darksilver hover:text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                  onClick={() => setDeletingTerm(term)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          />
        )}
      </SectionCard>

      {/* Create Drawer */}
      <Drawer open={showCreate} onOpenChange={setShowCreate} title="New Academic Term" className="shadow-elevated">
        <div className="h-1 w-full bg-royal/100" />
        <div className="p-6 space-y-4">
          <form onSubmit={form.handleSubmit((v) => createMutation.mutate(v))} className="space-y-4">
            <FormField label="Term Name" error={form.formState.errors.name?.message}>
              <Input {...form.register("name")} placeholder="e.g. 1st Semester 2025-2026" />
            </FormField>
            <FormField label="Start Date" error={form.formState.errors.startDate?.message}>
              <Input {...form.register("startDate")} type="date" />
            </FormField>
            <FormField label="End Date" error={form.formState.errors.endDate?.message}>
              <Input {...form.register("endDate")} type="date" />
            </FormField>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="w-full rounded-xl bg-gradient-to-r from-royal to-navy text-white font-semibold shadow-md hover:from-navy hover:to-navy transition-all"
            >
              {createMutation.isPending ? (
                <span className="inline-flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" /> Creating...</span>
              ) : (
                <span className="inline-flex items-center gap-2"><Plus className="h-4 w-4" /> Create Term</span>
              )}
            </Button>
          </form>
        </div>
      </Drawer>

      {/* Edit Drawer */}
      <Drawer open={!!editingTerm} onOpenChange={(open) => { if (!open) setEditingTerm(null) }} title="Edit Academic Term" className="shadow-elevated">
        <div className="h-1 w-full bg-royal/100" />
        <div className="p-6 space-y-4">
          <form onSubmit={form.handleSubmit((v) => { if (editingTerm) updateMutation.mutate({ id: editingTerm.id, values: v }) })} className="space-y-4">
            <FormField label="Term Name" error={form.formState.errors.name?.message}>
              <Input {...form.register("name")} placeholder="e.g. 1st Semester 2025-2026" />
            </FormField>
            <FormField label="Start Date" error={form.formState.errors.startDate?.message}>
              <Input {...form.register("startDate")} type="date" />
            </FormField>
            <FormField label="End Date" error={form.formState.errors.endDate?.message}>
              <Input {...form.register("endDate")} type="date" />
            </FormField>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="w-full rounded-xl bg-gradient-to-r from-royal to-navy text-white font-semibold shadow-md hover:from-navy hover:to-navy transition-all"
            >
              {updateMutation.isPending ? (
                <span className="inline-flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" /> Saving...</span>
              ) : (
                <span className="inline-flex items-center gap-2"><Save className="h-4 w-4" /> Save Changes</span>
              )}
            </Button>
          </form>
        </div>
      </Drawer>

      <ConfirmDialog
        open={!!deletingTerm}
        onOpenChange={() => setDeletingTerm(null)}
        title="Delete Term"
        description={`Are you sure you want to delete "${deletingTerm?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => { if (deletingTerm) deleteMutation.mutate(deletingTerm.id) }}
      />
    </div>
  )
}
