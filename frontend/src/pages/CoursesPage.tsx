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
import { BookOpen, Plus, Edit, Trash2 } from "lucide-react"
import { useState } from "react"

const schema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required")
})

type FormValues = z.infer<typeof schema>

const MAX_SECTIONS_PER_COURSE = 50

export function CoursesPage() {
  const user = getStoredUser()
  const canManage = user?.role === "ADMIN" || user?.role === "IMPLEMENTOR"
  const form = useForm<FormValues>({ resolver: zodResolver(schema) })
  const [editingCourse, setEditingCourse] = useState<any | null>(null)
  const [deletingCourse, setDeletingCourse] = useState<any | null>(null)
  const [editCode, setEditCode] = useState("")
  const [editName, setEditName] = useState("")

  const coursesQuery = useQuery({
    queryKey: ["courses"],
    queryFn: () => apiRequest<ApiResponse<any[]>>("/api/courses"),
    refetchInterval: 10000,
    retry: false
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      apiRequest<ApiResponse<any>>("/api/courses", {
        method: "POST",
        body: JSON.stringify(values)
      }),
    onSuccess: () => {
      coursesQuery.refetch()
      toast.success("Course created")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to create course")
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, code, name }: { id: string; code: string; name: string }) =>
      apiRequest<ApiResponse<any>>(`/api/courses/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ code, name })
      }),
    onSuccess: () => {
      coursesQuery.refetch()
      toast.success("Course updated")
      setEditingCourse(null)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Update failed")
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest<ApiResponse<any>>(`/api/courses/${id}`, {
        method: "DELETE"
      }),
    onSuccess: () => {
      coursesQuery.refetch()
      toast.success("Course deleted")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Delete failed")
    }
  })

  const handleEdit = (course: any) => {
    setEditingCourse(course)
    setEditCode(course.code)
    setEditName(course.name)
  }

  const handleSaveEdit = () => {
    if (editingCourse) {
      updateMutation.mutate({
        id: editingCourse.id,
        code: editCode,
        name: editName
      })
    }
  }

  const handleDelete = (course: any) => {
    setDeletingCourse(course)
  }

  const confirmDelete = () => {
    if (deletingCourse) {
      deleteMutation.mutate(deletingCourse.id)
      setDeletingCourse(null)
    }
  }

  const onSubmit = form.handleSubmit(async (values) => {
    await mutation.mutateAsync(values)
    form.reset()
  })

  const courses = coursesQuery.data?.data ?? []
  const columns = [
    {
      header: "Code",
      cell: (course: any) => (
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary-600" />
          <span className="font-medium text-slate-900">{course.code}</span>
        </div>
      )
    },
    {
      header: "Name",
      cell: (course: any) => course.name
    },
    {
      header: "Sections",
      cell: (course: any) => {
        const count = course._count?.sections ?? 0
        return (
          <Badge variant={count >= MAX_SECTIONS_PER_COURSE ? "danger" : "outline"} className="text-xs">
            {count} / {MAX_SECTIONS_PER_COURSE}
          </Badge>
        )
      }
    },
    {
      header: "Created",
      cell: (course: any) =>
        new Date(course.createdAt).toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric"
        })
    },
    {
      header: "Actions",
      cell: (course: any) => {
        if (!canManage) return null
        return (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => handleEdit(course)}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDelete(course)}
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
        title="Courses"
        description="Manage courses and their sections (max 50 sections per course)"
        actions={
          <Badge variant="outline" className="flex items-center gap-1 text-xs">
            <BookOpen className="h-3 w-3" />
            <span>{courses.length} courses</span>
          </Badge>
        }
      />

      {canManage && (
        <FormSection title="Create Course" description="Add a new course to the system">
          <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
            <FormField label="Code" required error={form.formState.errors.code?.message}>
              <Input placeholder="e.g. NSTP-101" {...form.register("code")} />
            </FormField>
            <FormField label="Name" required error={form.formState.errors.name?.message}>
              <Input placeholder="e.g. National Service Training Program" {...form.register("name")} />
            </FormField>
            {mutation.isError && (
              <Alert variant="danger" className="md:col-span-2">
                {(mutation.error as Error).message}
              </Alert>
            )}
            <div className="md:col-span-2">
              <Button type="submit" disabled={mutation.isPending}>
                <Plus className="h-4 w-4 mr-1" />
                {mutation.isPending ? "Creating..." : "Create Course"}
              </Button>
            </div>
          </form>
        </FormSection>
      )}

      <SectionCard title="All Courses" description="Courses in the system">
        {coursesQuery.isError && (
          <Alert variant="danger">
            {(coursesQuery.error as Error).message === "Unauthorized"
              ? "Please log out and log back in to refresh your session."
              : "Unable to load courses."}
          </Alert>
        )}
        {coursesQuery.isLoading ? (
          <LoadingSkeleton rows={3} columns={3} />
        ) : courses.length === 0 ? (
          <EmptyState
            title="No courses yet"
            description={
              canManage
                ? "Create your first course to organize sections."
                : "No courses have been created yet."
            }
          />
        ) : (
          <ResponsiveTableCards
            data={courses}
            columns={columns}
            rowKey={(course) => course.id}
            renderTitle={(course) => course.code}
          />
        )}
      </SectionCard>

      <Drawer
        open={!!editingCourse}
        onOpenChange={(open) => !open && setEditingCourse(null)}
        title="Edit Course"
      >
        <div className="p-4 space-y-4">
          <FormField label="Code" required>
            <Input
              value={editCode}
              onChange={(e) => setEditCode(e.target.value)}
              placeholder="e.g. NSTP-101"
            />
          </FormField>
          <FormField label="Name" required>
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="e.g. National Service Training Program"
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
            <Button variant="outline" onClick={() => setEditingCourse(null)}>
              Cancel
            </Button>
          </div>
        </div>
      </Drawer>

      <ConfirmDialog
        open={!!deletingCourse}
        onOpenChange={(open) => !open && setDeletingCourse(null)}
        title="Delete Course"
        description={`Are you sure you want to delete "${deletingCourse?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={confirmDelete}
      />
    </div>
  )
}
