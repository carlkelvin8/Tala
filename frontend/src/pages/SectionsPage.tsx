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
import { Users, Plus, Edit, Trash2 } from "lucide-react"
import { useState } from "react"

const schema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required")
})

type FormValues = z.infer<typeof schema>

export function SectionsPage() {
  const user = getStoredUser()
  const canManage = user?.role === "ADMIN" || user?.role === "IMPLEMENTOR"
  const form = useForm<FormValues>({ resolver: zodResolver(schema) })
  const [editingSection, setEditingSection] = useState<any | null>(null)
  const [deletingSection, setDeletingSection] = useState<any | null>(null)
  const [editCode, setEditCode] = useState("")
  const [editName, setEditName] = useState("")

  const sectionsQuery = useQuery({
    queryKey: ["sections"],
    queryFn: () => apiRequest<ApiResponse<any[]>>("/api/sections"),
    refetchInterval: 10000,
    retry: false
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      apiRequest<ApiResponse<any>>("/api/sections", {
        method: "POST",
        body: JSON.stringify(values)
      }),
    onSuccess: () => {
      sectionsQuery.refetch()
      toast.success("Section created")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to create section")
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, code, name }: { id: string; code: string; name: string }) =>
      apiRequest<ApiResponse<any>>(`/api/sections/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ code, name })
      }),
    onSuccess: () => {
      sectionsQuery.refetch()
      toast.success("Section updated")
      setEditingSection(null)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Update failed")
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest<ApiResponse<any>>(`/api/sections/${id}`, {
        method: "DELETE"
      }),
    onSuccess: () => {
      sectionsQuery.refetch()
      toast.success("Section deleted")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Delete failed")
    }
  })

  const handleEdit = (section: any) => {
    setEditingSection(section)
    setEditCode(section.code)
    setEditName(section.name)
  }

  const handleSaveEdit = () => {
    if (editingSection) {
      updateMutation.mutate({
        id: editingSection.id,
        code: editCode,
        name: editName
      })
    }
  }

  const handleDelete = (section: any) => {
    setDeletingSection(section)
  }

  const confirmDelete = () => {
    if (deletingSection) {
      deleteMutation.mutate(deletingSection.id)
      setDeletingSection(null)
    }
  }

  const onSubmit = form.handleSubmit(async (values) => {
    await mutation.mutateAsync(values)
    form.reset()
  })

  const sections = sectionsQuery.data?.data ?? []
  const columns = [
    {
      header: "Code",
      cell: (section: any) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary-600" />
          <span className="font-medium text-slate-900">{section.code}</span>
        </div>
      )
    },
    {
      header: "Name",
      cell: (section: any) => section.name
    },
    {
      header: "Created",
      cell: (section: any) =>
        new Date(section.createdAt).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric"
        })
    },
    {
      header: "Actions",
      cell: (section: any) => {
        if (!canManage) return null
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleEdit(section)}
            >
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDelete(section)}
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
        title="Sections"
        description="Manage class sections and student groups"
        actions={
          <Badge variant="outline" className="flex items-center gap-1 text-xs">
            <Users className="h-3 w-3" />
            <span>{sections.length} sections</span>
          </Badge>
        }
      />

      {canManage && (
        <FormSection title="Create Section" description="Add a new class section to the system">
          <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
            <FormField label="Code" required error={form.formState.errors.code?.message}>
              <Input placeholder="e.g. SEC-1A" {...form.register("code")} />
            </FormField>
            <FormField label="Name" required error={form.formState.errors.name?.message}>
              <Input placeholder="e.g. Section 1-A" {...form.register("name")} />
            </FormField>
            {mutation.isError && (
              <Alert variant="danger" className="md:col-span-2">
                {(mutation.error as Error).message}
              </Alert>
            )}
            <div className="md:col-span-2">
              <Button type="submit" disabled={mutation.isPending}>
                <Plus className="h-4 w-4 mr-1" />
                {mutation.isPending ? "Creating..." : "Create Section"}
              </Button>
            </div>
          </form>
        </FormSection>
      )}

      <SectionCard title="All Sections" description="Class sections in the system">
        {sectionsQuery.isError && (
          <Alert variant="danger">
            {(sectionsQuery.error as Error).message === "Unauthorized"
              ? "Please log out and log back in to refresh your session."
              : "Unable to load sections."}
          </Alert>
        )}
        {sectionsQuery.isLoading ? (
          <LoadingSkeleton rows={3} columns={3} />
        ) : sections.length === 0 ? (
          <EmptyState
            title="No sections yet"
            description={
              canManage
                ? "Create your first section to organize students."
                : "No sections have been created yet."
            }
          />
        ) : (
          <ResponsiveTableCards
            data={sections}
            columns={columns}
            rowKey={(section) => section.id}
            renderTitle={(section) => section.code}
          />
        )}
      </SectionCard>

      {/* Edit Section Drawer */}
      <Drawer
        open={!!editingSection}
        onOpenChange={(open) => !open && setEditingSection(null)}
        title="Edit Section"
      >
        <div className="p-4 space-y-4">
          <FormField label="Code" required>
            <Input
              value={editCode}
              onChange={(e) => setEditCode(e.target.value)}
              placeholder="e.g. SEC-1A"
            />
          </FormField>

          <FormField label="Name" required>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="e.g. Section 1-A"
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
            <Button
              variant="outline"
              onClick={() => setEditingSection(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingSection}
        onOpenChange={(open) => !open && setDeletingSection(null)}
        title="Delete Section"
        description={`Are you sure you want to delete "${deletingSection?.code}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={confirmDelete}
      />
    </div>
  )
}
