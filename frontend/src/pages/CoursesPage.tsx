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
import { Select } from "../components/ui/select"
import { MandatoryCourses } from "../components/mandatory-courses"
import { BookOpen, Plus, Edit, Trash2, Search, Save, X, Hash } from "lucide-react"
import { useState } from "react"
import { cn } from "../lib/utils"
import { ProgramType } from "../types"
import { programLabels, programFullLabels } from "../lib/programs"

const schema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  nstpType: z.enum(["CWTS", "ROTC"])
})

type FormValues = z.infer<typeof schema>

const MAX_SECTIONS_PER_COURSE = 50

export function CoursesPage({ program }: { program: ProgramType }) {
  const user = getStoredUser()
  const canManage = user?.role === "ADMIN" || user?.role === "IMPLEMENTOR"
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { nstpType: program } })
  const [editingCourse, setEditingCourse] = useState<any | null>(null)
  const [deletingCourse, setDeletingCourse] = useState<any | null>(null)
  const [editCode, setEditCode] = useState("")
  const [editName, setEditName] = useState("")
  const [editNstpType, setEditNstpType] = useState<"CWTS" | "ROTC">(program)

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
    mutationFn: ({ id, code, name, nstpType }: { id: string; code: string; name: string; nstpType: "CWTS" | "ROTC" }) =>
      apiRequest<ApiResponse<any>>(`/api/courses/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ code, name, nstpType })
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
    setEditNstpType(program)
  }

  const handleSaveEdit = () => {
    if (editingCourse) {
      updateMutation.mutate({
        id: editingCourse.id,
        code: editCode,
        name: editName,
        nstpType: editNstpType
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

  const allCourses = coursesQuery.data?.data ?? []
  const courses = allCourses.filter((course: any) => (course.nstpType ?? "CWTS") === program)
  const columns = [
    {
      header: "Code",
      cell: (course: any) => (
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-royal/10">
            <BookOpen className="h-3.5 w-3.5 text-royal" />
          </span>
          <span className="font-semibold text-black">{course.code}</span>
        </div>
      )
    },
    {
      header: "Name",
      cell: (course: any) => (
        <span className="text-darksilver">{course.name}</span>
      )
    },
    {
      header: "Program",
      cell: (course: any) => {
        const prog = course.nstpType ?? "CWTS"
        return (
          <Badge
            variant={prog === "ROTC" ? "outline" : "outline"}
            className={cn(
              "text-xs font-semibold",
              prog === "ROTC" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-teal-50 text-teal-700 border-teal-200"
            )}
          >
            {programLabels[prog as "CWTS" | "ROTC"]}
          </Badge>
        )
      }
    },
    {
      header: "Sections",
      cell: (course: any) => {
        const count = course._count?.sections ?? 0
        const isFull = count >= MAX_SECTIONS_PER_COURSE
        return (
          <Badge
            variant={isFull ? "danger" : "outline"}
            className={cn(
              "text-xs font-medium",
              !isFull && "bg-white text-darksilver border-silver/30"
            )}
          >
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
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleEdit(course)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-darksilver hover:text-royal hover:bg-sky-50 transition-colors"
              title="Edit"
            >
              <Edit className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(course)}
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-royal to-navy px-6 sm:px-10 py-8 shadow-elevated">
        <div className="absolute inset-0 bg-grid opacity-[0.06]" />
        <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-royal/10 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
            <BookOpen className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-gold text-xs font-medium uppercase tracking-wider mb-1.5">
              <Search className="h-3.5 w-3.5" />
              <span>Course Catalog</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {program === "ROTC" ? "ROTC Courses" : "CWTS Courses"}
            </h1>
            <p className="mt-1 text-sm text-silver max-w-2xl">
              Manage {programFullLabels[program]} courses and their sections (max 50 sections per course).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Badge variant="outline" className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white/10 text-white border-white/20">
              <BookOpen className="h-3.5 w-3.5 text-emerald-400" />
              <span>{courses.length} courses</span>
            </Badge>
          </div>
        </div>
      </div>

      {canManage && (
        <FormSection title="Create Course" description="Add a new course to the system" className="shadow-card">
          <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
            <FormField label="Code" required error={form.formState.errors.code?.message}>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darksilver" />
                <Input placeholder="e.g. NSTP-101" {...form.register("code")} className="h-11 pl-10" />
              </div>
            </FormField>
            <FormField label="Name" required error={form.formState.errors.name?.message}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darksilver" />
                <Input placeholder="e.g. National Service Training Program" {...form.register("name")} className="h-11 pl-10" />
              </div>
            </FormField>
            <FormField label="Program" required>
              <Select {...form.register("nstpType")} className="h-11" disabled>
                <option value="CWTS">Civic Welfare Training Service (CWTS)</option>
                {program === "ROTC" && <option value="ROTC">Reserved Officers' Training Corps (ROTC)</option>}
              </Select>
            </FormField>
            {mutation.isError && (
              <Alert variant="danger" className="md:col-span-2">
                {(mutation.error as Error).message}
              </Alert>
            )}
            <div className="md:col-span-2">
              <Button type="submit" disabled={mutation.isPending} className="bg-gradient-to-r from-navy to-royal hover:from-navy hover:to-black text-white shadow-soft">
                <Plus className="h-4 w-4 mr-1" />
                {mutation.isPending ? "Creating..." : "Create Course"}
              </Button>
            </div>
          </form>
        </FormSection>
      )}

      <SectionCard title="All Courses" description="Courses in the system" className="shadow-card">
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
        <div className="h-1 w-full bg-sky-500" />
        <div className="p-4 space-y-5">
          {editingCourse && (
            <div className="flex items-center gap-3 pb-3 border-b border-silver/20">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50">
                <BookOpen className="h-5 w-5 text-royal" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-black truncate">{editingCourse.code}</p>
                <p className="text-xs text-darksilver truncate">{editingCourse.name}</p>
              </div>
            </div>
          )}
          <FormField label="Code" required>
            <div className="relative">
              <BookOpen className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darksilver" />
              <Input
                value={editCode}
                onChange={(e) => setEditCode(e.target.value)}
                placeholder="e.g. NSTP-101"
                className="h-11 pl-10"
              />
            </div>
          </FormField>
          <FormField label="Name" required>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darksilver" />
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="e.g. National Service Training Program"
                className="h-11 pl-10"
              />
            </div>
          </FormField>
          <FormField label="Program" required>
            <Select value={editNstpType} onChange={(e) => setEditNstpType(e.target.value as "CWTS" | "ROTC")} className="h-11" disabled>
              <option value="CWTS">Civic Welfare Training Service (CWTS)</option>
              {program === "ROTC" && <option value="ROTC">Reserved Officers' Training Corps (ROTC)</option>}
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
            <Button variant="outline" onClick={() => setEditingCourse(null)}>
              <X className="h-4 w-4 mr-1" />
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

      <MandatoryCourses program={program} />
    </div>
  )
}
