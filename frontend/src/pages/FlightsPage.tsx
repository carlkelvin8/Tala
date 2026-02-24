import { useMutation, useQuery } from "@tanstack/react-query"
import { apiRequest } from "../lib/api"
import { ApiResponse } from "../types"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { getStoredUser } from "../lib/auth"
import { PageHeader } from "../components/ui/page-header"
import { FormField } from "../components/ui/form-field"
import { Alert } from "../components/ui/alert"
import { EmptyState } from "../components/ui/empty-state"
import { toast } from "sonner"
import { FormSection } from "../components/ui/form-section"
import { SectionCard } from "../components/ui/section-card"
import { ResponsiveTableCards } from "../components/ui/responsive-table-cards"
import { LoadingSkeleton } from "../components/ui/loading-skeleton"
import { Badge } from "../components/ui/badge"
import { Drawer } from "../components/ui/drawer"
import { ConfirmDialog } from "../components/ui/confirm-dialog"
import { Plane, Plus, Edit, Trash2 } from "lucide-react"
import { useState } from "react"

const schema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required")
})

type FormValues = z.infer<typeof schema>

export function FlightsPage() {
  const user = getStoredUser()
  const canManage = user?.role === "ADMIN" || user?.role === "CADET_OFFICER"
  const form = useForm<FormValues>({ resolver: zodResolver(schema) })
  const [editingFlight, setEditingFlight] = useState<any | null>(null)
  const [deletingFlight, setDeletingFlight] = useState<any | null>(null)
  const [editCode, setEditCode] = useState("")
  const [editName, setEditName] = useState("")

  const flightsQuery = useQuery({
    queryKey: ["flights"],
    queryFn: () => apiRequest<ApiResponse<any[]>>("/api/flights"),
    refetchInterval: 10000,
    retry: false
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      apiRequest<ApiResponse<any>>("/api/flights", {
        method: "POST",
        body: JSON.stringify(values)
      }),
    onSuccess: () => {
      flightsQuery.refetch()
      toast.success("Flight created")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to create flight")
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, code, name }: { id: string; code: string; name: string }) =>
      apiRequest<ApiResponse<any>>(`/api/flights/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ code, name })
      }),
    onSuccess: () => {
      flightsQuery.refetch()
      toast.success("Flight updated")
      setEditingFlight(null)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Update failed")
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest<ApiResponse<any>>(`/api/flights/${id}`, {
        method: "DELETE"
      }),
    onSuccess: () => {
      flightsQuery.refetch()
      toast.success("Flight deleted")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Delete failed")
    }
  })

  const handleEdit = (flight: any) => {
    setEditingFlight(flight)
    setEditCode(flight.code)
    setEditName(flight.name)
  }

  const handleSaveEdit = () => {
    if (editingFlight) {
      updateMutation.mutate({
        id: editingFlight.id,
        code: editCode,
        name: editName
      })
    }
  }

  const handleDelete = (flight: any) => {
    setDeletingFlight(flight)
  }

  const confirmDelete = () => {
    if (deletingFlight) {
      deleteMutation.mutate(deletingFlight.id)
      setDeletingFlight(null)
    }
  }

  const onSubmit = form.handleSubmit(async (values) => {
    await mutation.mutateAsync(values)
    form.reset()
  })

  const flights = flightsQuery.data?.data ?? []
  const columns = [
    {
      header: "Code",
      cell: (flight: any) => (
        <div className="flex items-center gap-2">
          <Plane className="h-4 w-4 text-primary-600" />
          <span className="font-medium text-slate-900">{flight.code}</span>
        </div>
      )
    },
    {
      header: "Name",
      cell: (flight: any) => flight.name
    },
    {
      header: "Created",
      cell: (flight: any) =>
        new Date(flight.createdAt).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric"
        })
    },
    {
      header: "Actions",
      cell: (flight: any) => {
        if (!canManage) return null
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleEdit(flight)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDelete(flight)}
              disabled={deleteMutation.isPending}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        )
      }
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Flights"
        description="Manage flight groups and assignments"
        actions={
          <Badge variant="outline" className="flex items-center gap-1 text-xs">
            <Plane className="h-3 w-3" />
            <span>{flights.length} flights</span>
          </Badge>
        }
      />

      {canManage && (
        <FormSection title="Create Flight" description="Add a new flight group to the system">
          <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
            <FormField label="Code" required error={form.formState.errors.code?.message}>
              <Input placeholder="e.g. FLT-A" {...form.register("code")} />
            </FormField>
            <FormField label="Name" required error={form.formState.errors.name?.message}>
              <Input placeholder="e.g. Alpha Flight" {...form.register("name")} />
            </FormField>
            {mutation.isError && (
              <Alert variant="danger" className="md:col-span-2">
                {(mutation.error as Error).message}
              </Alert>
            )}
            <div className="md:col-span-2">
              <Button type="submit" disabled={mutation.isPending}>
                <Plus className="h-4 w-4 mr-1" />
                {mutation.isPending ? "Creating..." : "Create Flight"}
              </Button>
            </div>
          </form>
        </FormSection>
      )}

      <SectionCard title="All Flights" description="Flight groups in the system">
        {flightsQuery.isError && (
          <Alert variant="danger">
            {(flightsQuery.error as Error).message === "Unauthorized"
              ? "Please log out and log back in to refresh your session."
              : "Unable to load flights."}
          </Alert>
        )}
        {flightsQuery.isLoading ? (
          <LoadingSkeleton rows={3} columns={3} />
        ) : flights.length === 0 ? (
          <EmptyState
            title="No flights yet"
            description={
              canManage
                ? "Create your first flight group to organize students."
                : "No flight groups have been created yet."
            }
          />
        ) : (
          <ResponsiveTableCards
            data={flights}
            columns={columns}
            rowKey={(flight) => flight.id}
            renderTitle={(flight) => flight.code}
          />
        )}
      </SectionCard>

      <Drawer
        open={!!editingFlight}
        onOpenChange={(open) => !open && setEditingFlight(null)}
        title="Edit Flight"
      >
        <div className="p-4 space-y-4">
          <FormField label="Code" required>
            <Input
              value={editCode}
              onChange={(e) => setEditCode(e.target.value)}
              placeholder="e.g. FLT-A"
            />
          </FormField>
          <FormField label="Name" required>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="e.g. Alpha Flight"
            />
          </FormField>

          {updateMutation.isError && (
            <Alert variant="danger">
              {(updateMutation.error as Error).message}
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleSaveEdit}
              disabled={updateMutation.isPending || !editCode || !editName}
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
            <Button variant="outline" onClick={() => setEditingFlight(null)}>
              Cancel
            </Button>
          </div>
        </div>
      </Drawer>

      <ConfirmDialog
        open={!!deletingFlight}
        onOpenChange={(open) => !open && setDeletingFlight(null)}
        title="Delete Flight"
        description={`Are you sure you want to delete "${deletingFlight?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={confirmDelete}
      />
    </div>
  )
}
