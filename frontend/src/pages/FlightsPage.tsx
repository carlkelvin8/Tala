import { useMutation, useQuery } from "@tanstack/react-query"
import { apiRequest } from "../lib/api"
import { ApiResponse } from "../types"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { getStoredUser } from "../lib/auth"
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
import { Plane, Sparkles, Plus, Edit, Trash2, Save, X, RefreshCw, Hash, Tag } from "lucide-react"
import { cn } from "../lib/utils"
import { useState, useMemo } from "react"

const schema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required")
})

type FormValues = z.infer<typeof schema>

type Flight = {
  id: string
  code: string
  name: string
  createdAt: string
  _count?: { enrollments?: number }
}

export function FlightsPage() {
  const user = getStoredUser()
  const canManage = user?.role === "ADMIN"
  const form = useForm<FormValues>({ resolver: zodResolver(schema) })
  const [editingFlight, setEditingFlight] = useState<Flight | null>(null)
  const [deletingFlight, setDeletingFlight] = useState<Flight | null>(null)
  const [editCode, setEditCode] = useState("")
  const [editName, setEditName] = useState("")

  const flightsQuery = useQuery({
    queryKey: ["flights"],
    queryFn: () => apiRequest<ApiResponse<Flight[]>>("/api/flights"),
    refetchInterval: 10000,
    retry: false
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      apiRequest<ApiResponse<Flight>>("/api/flights", {
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
      apiRequest<ApiResponse<Flight>>(`/api/flights/${id}`, {
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
      apiRequest<ApiResponse<Flight>>(`/api/flights/${id}`, {
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

  const handleEdit = (flight: Flight) => {
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

  const handleDelete = (flight: Flight) => {
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

  const totalFlights = useMemo(() => flights.length, [flights])
  const totalStudents = useMemo(() => flights.reduce((sum, flight) => sum + (flight._count?.enrollments ?? 0), 0), [flights])

  const columns = [
    {
      header: "Code",
      cell: (flight: Flight) => (
        <div className="flex items-center gap-2">
          <Plane className="h-4 w-4 text-primary-600" />
          <span className="font-medium text-black">{flight.code}</span>
        </div>
      )
    },
    {
      header: "Name",
      cell: (flight: Flight) => flight.name
    },
    {
      header: "Created",
      cell: (flight: Flight) =>
        new Date(flight.createdAt).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric"
        })
    },
    {
      header: "Actions",
      cell: (flight: Flight) => {
        if (!canManage) return null
        return (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => handleEdit(flight)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDelete(flight)}
              disabled={deleteMutation.isPending}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )
      }
    }
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Gradient Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-royal to-navy p-8 text-white shadow-xl">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:2rem_2rem]" />
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-gold/20 blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-royal/10 blur-3xl" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
                <Plane className="h-6 w-6 text-royal/70" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Welcome to Flights
                </h1>
                <p className="text-silver text-sm">
                  Manage flight groups and assignments
                </p>
              </div>
            </div>
          </div>
          <Badge variant="outline" className="flex items-center gap-1.5 border-white/20 bg-white/10 px-3 py-1.5 text-sm font-medium backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>{totalFlights} flights</span>
          </Badge>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-silver/30 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-royal/10">
              <Plane className="h-5 w-5 text-royal" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-darksilver">Total Flights</p>
              <p className="text-2xl font-bold text-black">{totalFlights}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-silver/30 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
              <Hash className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-darksilver">Enrolled Students</p>
              <p className="text-2xl font-bold text-black">{flightsQuery.isLoading ? "..." : totalStudents}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-silver/30 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50">
              <Tag className="h-5 w-5 text-royal" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-darksilver">Avg. per Flight</p>
              <p className="text-2xl font-bold text-black">{flightsQuery.isLoading ? "..." : totalFlights > 0 ? Math.round(totalStudents / totalFlights) : 0}</p>
            </div>
          </div>
        </div>
      </div>

      {canManage && (
        <FormSection title="Create Flight" description="Add a new flight group to the system" className="shadow-card">
          <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
            <FormField label="Code" required error={form.formState.errors.code?.message}>
              <div className="relative">
                <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darksilver" />
                <Input placeholder="e.g. FLT-A" className="pl-10" {...form.register("code")} />
              </div>
            </FormField>
            <FormField label="Name" required error={form.formState.errors.name?.message}>
              <div className="relative">
                <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darksilver" />
                <Input placeholder="e.g. Alpha Flight" className="pl-10" {...form.register("name")} />
              </div>
            </FormField>
            {mutation.isError && (
              <Alert variant="danger" className="md:col-span-2">
                {(mutation.error as Error).message}
              </Alert>
            )}
            <div className="md:col-span-2">
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="bg-gradient-to-r from-royal to-navy text-white shadow-md hover:from-navy hover:to-navy hover:shadow-lg transition-all"
              >
                {mutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                {mutation.isPending ? "Creating..." : "Create Flight"}
              </Button>
            </div>
          </form>
        </FormSection>
      )}

      <SectionCard title="All Flights" description="Flight groups in the system" className="shadow-card">
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
        {/* Accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-royal to-navy" />

        {/* Preview header */}
        {editingFlight && (
          <div className="flex items-center gap-3 border-b border-silver/30 bg-white px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-royal/10">
              <Plane className="h-4.5 w-4.5 text-royal" />
            </div>
            <div>
              <p className="text-sm font-semibold text-black">{editingFlight.code}</p>
              <p className="text-xs text-darksilver">{editingFlight.name}</p>
            </div>
          </div>
        )}

        <div className="p-4 space-y-4">
          <FormField label="Code" required>
            <div className="relative">
              <Hash className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darksilver" />
              <Input
                value={editCode}
                onChange={(e) => setEditCode(e.target.value)}
                placeholder="e.g. FLT-A"
                className="pl-10"
              />
            </div>
          </FormField>
          <FormField label="Name" required>
            <div className="relative">
              <Tag className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darksilver" />
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g. Alpha Flight"
                className="pl-10"
              />
            </div>
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
              className="bg-gradient-to-r from-royal to-navy text-white hover:from-navy hover:to-navy"
            >
              {updateMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
            <Button variant="outline" onClick={() => setEditingFlight(null)}>
              <X className="h-4 w-4 mr-1" />
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
