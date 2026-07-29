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
import { LayoutGrid, Sparkles, Users, Plus, Edit, Trash2, Zap, Save, X, Hash, BookOpen, ChevronRight } from "lucide-react"
import { useState, useMemo } from "react"
import { cn } from "../lib/utils"

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

  const totalSections = useMemo(() => sections.length, [sections])

  const columns = [
    {
      header: "Code",
      cell: (section: any) => (
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-royal/10">
            <Hash className="h-3.5 w-3.5 text-royal" />
          </span>
          <span className="font-semibold text-black">{section.code}</span>
        </div>
      )
    },
    {
      header: "Name",
      cell: (section: any) => (
        <span className="text-darksilver">{section.name}</span>
      )
    },
    {
      header: "Course",
      cell: (section: any) => section.course?.name ?? (
        <span className="text-darksilver italic">Unassigned</span>
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
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleEdit(section)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-darksilver hover:text-royal hover:bg-sky-50 transition-colors"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(section)}
              disabled={deleteMutation.isPending}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-darksilver hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
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
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-royal to-navy px-6 sm:px-10 py-8 shadow-elevated">
        <div className="absolute inset-0 bg-grid opacity-[0.06]" />
        <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-royal/10 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
            <LayoutGrid className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-gold text-xs font-medium uppercase tracking-wider mb-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Section Management</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Sections</h1>
            <p className="mt-1 text-sm text-silver max-w-2xl">Manage and generate class sections for your courses.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/10 text-white border-white/20">
              <Users className="h-3.5 w-3.5 text-emerald-400" />
              <span>{totalSections} sections</span>
            </Badge>
          </div>
        </div>
      </div>

      {canManage && (
        <FormSection title="Generate Sections" description="Automatically create multiple sections for a course" className="shadow-card">
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
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darksilver" />
                <Input placeholder="e.g. SEC" {...generateForm.register("prefix")} className="h-11 pl-10" />
              </div>
            </FormField>
            <FormField label="Separator" error={generateForm.formState.errors.separator?.message}>
              <div className="relative">
                <ChevronRight className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darksilver" />
                <Input placeholder="-" {...generateForm.register("separator")} className="h-11 pl-10" />
              </div>
            </FormField>
            <FormField label="Start Number" required error={generateForm.formState.errors.start?.message}>
              <Input type="number" min={1} placeholder="1" {...generateForm.register("start")} className="h-11" />
            </FormField>
            <FormField label="End Number" required error={generateForm.formState.errors.end?.message}>
              <Input type="number" min={1} placeholder="10" {...generateForm.register("end")} className="h-11" />
            </FormField>
            <div className="flex items-end">
              <div className="text-sm text-darksilver pb-2">
                Preview: <span className="font-medium text-black/80">{previewPrefix}{previewSep}{String(previewStart).padStart(2, "0")}</span>
                {previewCount > 1 && (
                  <> to <span className="font-medium text-black/80">{previewPrefix}{previewSep}{String(previewEnd).padStart(2, "0")}</span></>
                )}
                <span className="ml-1 text-darksilver">({previewCount} sections)</span>
              </div>
            </div>
            {generateMutation.isError && (
              <Alert variant="danger" className="md:col-span-3">
                {(generateMutation.error as Error).message}
              </Alert>
            )}
            <div className="md:col-span-3">
              <Button type="submit" disabled={generateMutation.isPending} className="bg-gradient-to-r from-navy to-royal hover:from-navy hover:to-black text-white shadow-soft">
                <Zap className="h-4 w-4 mr-1" />
                {generateMutation.isPending ? "Generating..." : "Generate Sections"}
              </Button>
            </div>
          </form>
        </FormSection>
      )}

      {canManage && (
        <FormSection title="Create Single Section" description="Add one section manually" className="shadow-card">
          <form className="grid gap-4 md:grid-cols-3" onSubmit={onCreateSubmit}>
            <FormField label="Code" required error={createForm.formState.errors.code?.message}>
              <div className="relative">
                <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darksilver" />
                <Input placeholder="e.g. SEC-1A" {...createForm.register("code")} className="h-11 pl-10" />
              </div>
            </FormField>
            <FormField label="Name" required error={createForm.formState.errors.name?.message}>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darksilver" />
                <Input placeholder="e.g. Section 1-A" {...createForm.register("name")} className="h-11 pl-10" />
              </div>
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
              <Button type="submit" disabled={createMutation.isPending} className="bg-gradient-to-r from-navy to-royal hover:from-navy hover:to-black text-white shadow-soft">
                <Plus className="h-4 w-4 mr-1" />
                {createMutation.isPending ? "Creating..." : "Create Section"}
              </Button>
            </div>
          </form>
        </FormSection>
      )}

      <SectionCard title="All Sections" description="Class sections in the system" className="shadow-card">
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
        <div className="h-1 w-full bg-royal/100" />
        <div className="p-4 space-y-5">
          {editingSection && (
            <div className="flex items-center gap-3 pb-3 border-b border-silver/20">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-royal/10">
                <LayoutGrid className="h-5 w-5 text-royal" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-black truncate">{editingSection.code}</p>
                <p className="text-xs text-darksilver truncate">{editingSection.name}</p>
              </div>
            </div>
          )}
          <FormField label="Code" required>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darksilver" />
              <Input
                value={editCode}
                onChange={(e) => setEditCode(e.target.value)}
                placeholder="e.g. SEC-1A"
                className="h-11 pl-10"
              />
            </div>
          </FormField>
          <FormField label="Name" required>
            <div className="relative">
              <BookOpen className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darksilver" />
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g. Section 1-A"
                className="h-11 pl-10"
              />
            </div>
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
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSaveEdit}
              disabled={updateMutation.isPending || !editCode || !editName}
              className="bg-gradient-to-r from-navy to-royal hover:from-navy hover:to-black text-white shadow-soft"
            >
              <Save className="h-4 w-4 mr-1" />
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
            <Button variant="outline" onClick={() => setEditingSection(null)}>
              <X className="h-4 w-4 mr-1" />
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
