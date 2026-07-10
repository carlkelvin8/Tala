import { useMutation, useQuery } from "@tanstack/react-query"
import { apiRequest } from "../lib/api"
import { ApiResponse } from "../types"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { PageHeader } from "../components/ui/page-header"
import { FormField } from "../components/ui/form-field"
import { EmptyState } from "../components/ui/empty-state"
import { toast } from "sonner"
import { SectionCard } from "../components/ui/section-card"
import { ResponsiveTableCards } from "../components/ui/responsive-table-cards"
import { LoadingSkeleton } from "../components/ui/loading-skeleton"
import { Badge } from "../components/ui/badge"
import { Drawer } from "../components/ui/drawer"
import { ConfirmDialog } from "../components/ui/confirm-dialog"
import { Plus, Edit, Trash2 } from "lucide-react"
import { useState } from "react"

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
      apiRequest<ApiResponse<any>>(`/api/terms/${id}/activate`, { method: "POST" }),
    onSuccess: () => {
      toast.success("Term activated")
      termsQuery.refetch()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Failed to activate term")
  })

  const terms = termsQuery.data?.data ?? []

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Academic Terms"
        description="Manage academic terms and training periods"
        actions={
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Term
          </Button>
        }
      />

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
            { header: "Name", cell: (r: any) => <span className="font-semibold">{r.name}</span> },
            { header: "Start", cell: (r: any) => formatDate(r.startDate) },
            { header: "End", cell: (r: any) => formatDate(r.endDate) },
            {
              header: "Status",
              cell: (r: any) => (
                <Badge variant={r.isActive ? "success" : "default"}>
                  {r.isActive ? "Active" : "Inactive"}
                </Badge>
              )
            }
          ]}
          data={terms}
          rowKey={(r: any) => r.id}
          renderTitle={(term: any) => term.name}
          renderActions={(term: any) => (
            <div className="flex items-center gap-2">
              {!term.isActive && (
                <Button size="sm" variant="outline" onClick={() => activateMutation.mutate(term.id)}>
                  Activate
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => { setEditingTerm(term); form.reset({ name: term.name, startDate: term.startDate?.split("T")[0] || "", endDate: term.endDate?.split("T")[0] || "" }) }}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setDeletingTerm(term)}>
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          )}
        />
      )}

      {/* Create Drawer */}
      <Drawer open={showCreate} onOpenChange={setShowCreate} title="New Academic Term">
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
          <Button type="submit" disabled={createMutation.isPending} className="w-full">
            {createMutation.isPending ? "Creating..." : "Create Term"}
          </Button>
        </form>
      </Drawer>

      {/* Edit Drawer */}
      <Drawer open={!!editingTerm} onOpenChange={(open) => { if (!open) setEditingTerm(null) }} title="Edit Academic Term">
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
          <Button type="submit" disabled={updateMutation.isPending} className="w-full">
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </form>
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
