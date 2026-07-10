import { useMutation, useQuery } from "@tanstack/react-query"
import { apiRequest } from "../lib/api"
import { ApiResponse } from "../types"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Select } from "../components/ui/select"
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
import { Users, Plus, Edit, Trash2, Zap } from "lucide-react"
import { useState } from "react"

const MAX_SECTIONS_PER_COURSE = 50

const createSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  courseId: z.string().nullable().optional()
})

const generateSchema = z.object({
  prefix: z.string().min(1, "Prefix is required"),
  start: z.coerce.number().int().min(1, "Start must be at least 1"),
  end: z.coerce.number().int().min(1, "End must be at least 1"),
  courseId: z.string().min(1, "Course is required"),
  separator: z.string().default("-")
}).refine((data) => data.end >= data.start, {
  message: "End must be greater than or equal to start",
  path: ["end"]
}).refine((data) => (data.end - data.start + 1) <= 50, {
  message: "Cannot generate more than 50 sections at once",
  path: ["end"]
})

type CreateFormValues = z.infer<typeof createSchema>
type GenerateFormValues = z.infer<typeof generateSchema>

export function SectionsPage() {
  const user = getStoredUser()
  const canManage = user?.role === "ADMIN" || user?.role === "IMPLEMENTOR"
  const createForm = useForm<CreateFormValues>({ resolver: zodResolver(createSchema) })
  const generateForm = useForm<GenerateFormValues>({
    resolver: zodResolver(generateSchema),
    defaultValues: { prefix: "SEC", start: 1, end: 10, courseId: "", separator: "-" }
  })
  const [editingSection, setEditingSection] = useState<any | null>(null)
  const [deletingSection, setDeletingSection] = useState<any | null>(null)
  const [editCode, setEditCode] = useState("")
  const [editName, setEditName] = useState("")
  const [editCourseId, setEditCourseId] = useState<string | null>(null)

  const sectionsQuery = useQuery({
    queryKey: ["sections"],
    queryFn: () => apiRequest<ApiResponse<any[]>>("/api/sections"),
    refetchInterval: 10000,
    retry: false
  })

  const coursesQuery = useQuery({
    queryKey: ["courses"],
    queryFn: () => apiRequest<ApiResponse<any[]>>("/api/courses"),
    retry: false
  })

  const createMutation = useMutation({
    mutationFn: (values: CreateFormValues) =>
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

  const generateMutation = useMutation({
    mutationFn: (values: GenerateFormValues) =>
      apiRequest<ApiResponse<any>>("/api/sections/generate", {
        method: "POST",
        body: JSON.stringify(values)
      }),
    onSuccess: (res) => {
      sectionsQuery.refetch()
      toast.success(res.message || "Sections generated")
      generateForm.reset({ prefix: "SEC", start: 1, end: 10, courseId: "", separator: "-" })
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to generate sections")
    }
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, code, name, courseId }: { id: string; code: string; name: string; courseId: string | null }) =>
      apiRequest<ApiResponse<any>>(`/api/sections/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ code, name, courseId })
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
    setEditCourseId(section.courseId ?? null)
  }

  const handleSaveEdit = () => {
    if (editingSection) {
      updateMutation.mutate({
        id: editingSection.id,
        code: editCode,
        name: editName,
        courseId: editCourseId
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

  const onCreateSubmit = createForm.handleSubmit(async (values) => {
    await createMutation.mutateAsync(values)
    createForm.reset()
  })

  const onGenerateSubmit = generateForm.handleSubmit(async (values) => {
    await generateMutation.mutateAsync(values)
  })

  const sections = sectionsQuery.data?.data ?? []
  const courses = coursesQuery.data?.data ?? []

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
      header: "Course",
      cell: (section: any) => section.course?.name ?? (
        <span className="text-slate-400 italic">Unassigned</span>
      )
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
            <Button size="sm" variant="outline" onClick={() => handleEdit(section)}>
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

  const previewPrefix = generateForm.watch("prefix") || "SEC"
  const previewStart = generateForm.watch("start") || 1
  const previewEnd = generateForm.watch("end") || 1
  const previewSep = generateForm.watch("separator") || "-"
  const previewCount = Math.max(0, (previewEnd || 0) - (previewStart || 0) + 1)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sections"
        description="Manage and generate class sections"
        actions={
          <Badge variant="outline" className="flex items-center gap-1 text-xs">
            <Users className="h-3 w-3" />
            <span>{sections.length} sections</span>
          </Badge>
        }
      />

      {canManage && (
        <FormSection title="Generate Sections" description="Automatically create multiple sections for a course">
          <form className="grid gap-4 md:grid-cols-3" onSubmit={onGenerateSubmit}>
            <FormField label="Course" required error={generateForm.formState.errors.courseId?.message}>
              <Select {...generateForm.register("courseId")}>
                <option value="">Select a course</option>
                {courses.map((course: any) => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Prefix" required error={generateForm.formState.errors.prefix?.message}>
              <Input placeholder="e.g. SEC" {...generateForm.register("prefix")} />
            </FormField>
            <FormField label="Separator" error={generateForm.formState.errors.separator?.message}>
              <Input placeholder="-" {...generateForm.register("separator")} />
            </FormField>
            <FormField label="Start Number" required error={generateForm.formState.errors.start?.message}>
              <Input type="number" min={1} placeholder="1" {...generateForm.register("start")} />
            </FormField>
            <FormField label="End Number" required error={generateForm.formState.errors.end?.message}>
              <Input type="number" min={1} placeholder="10" {...generateForm.register("end")} />
            </FormField>
            <div className="flex items-end">
              <div className="text-sm text-slate-500 pb-2">
                Preview: <span className="font-medium text-slate-700">{previewPrefix}{previewSep}{String(previewStart).padStart(2, "0")}</span>
                {previewCount > 1 && (
                  <> to <span className="font-medium text-slate-700">{previewPrefix}{previewSep}{String(previewEnd).padStart(2, "0")}</span></>
                )}
                <span className="ml-1 text-slate-400">({previewCount} sections)</span>
              </div>
            </div>
            {generateMutation.isError && (
              <Alert variant="danger" className="md:col-span-3">
                {(generateMutation.error as Error).message}
              </Alert>
            )}
            <div className="md:col-span-3">
              <Button type="submit" disabled={generateMutation.isPending}>
                <Zap className="h-4 w-4 mr-1" />
                {generateMutation.isPending ? "Generating..." : "Generate Sections"}
              </Button>
            </div>
          </form>
        </FormSection>
      )}

      {canManage && (
        <FormSection title="Create Single Section" description="Add one section manually">
          <form className="grid gap-4 md:grid-cols-3" onSubmit={onCreateSubmit}>
            <FormField label="Code" required error={createForm.formState.errors.code?.message}>
              <Input placeholder="e.g. SEC-1A" {...createForm.register("code")} />
            </FormField>
            <FormField label="Name" required error={createForm.formState.errors.name?.message}>
              <Input placeholder="e.g. Section 1-A" {...createForm.register("name")} />
            </FormField>
            <FormField label="Course" error={createForm.formState.errors.courseId?.message}>
              <Select {...createForm.register("courseId")}>
                <option value="">No course (optional)</option>
                {courses.map((course: any) => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </Select>
            </FormField>
            {createMutation.isError && (
              <Alert variant="danger" className="md:col-span-3">
                {(createMutation.error as Error).message}
              </Alert>
            )}
            <div className="md:col-span-3">
              <Button type="submit" disabled={createMutation.isPending}>
                <Plus className="h-4 w-4 mr-1" />
                {createMutation.isPending ? "Creating..." : "Create Section"}
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
                ? "Use the generator above to create sections automatically."
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

          <FormField label="Course">
            <Select
              value={editCourseId ?? ""}
              onChange={(e) => setEditCourseId(e.target.value || null)}
            >
              <option value="">No course (optional)</option>
              {courses.map((course: any) => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.name}
                </option>
              ))}
            </Select>
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
            <Button variant="outline" onClick={() => setEditingSection(null)}>
              Cancel
            </Button>
          </div>
        </div>
      </Drawer>

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
