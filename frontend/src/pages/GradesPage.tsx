import { useMutation, useQuery } from "@tanstack/react-query"
import { apiRequest } from "../lib/api"
import { ApiResponse } from "../types"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Select } from "../components/ui/select"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { usePermissions } from "../hooks/usePermissions"
import { getStoredUser } from "../lib/auth"
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
import { GraduationCap, Search, Plus, Edit, Trash2, Save, Sparkles, Hash, Award, BookOpen, ChevronRight, X, RefreshCw, User, Settings2 } from "lucide-react"
import { useState, useEffect } from "react"
import { cn } from "../lib/utils"
import { motion } from "framer-motion"

const gradeSchema = z.object({
  studentId: z.string().uuid(),
  gradeItemId: z.string().uuid(),
  score: z.coerce.number().nonnegative(),
  remarks: z.string().max(500, "Remarks must be 500 characters or less").optional()
})

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  weight: z.coerce.number().optional()
})

const itemSchema = z.object({
  title: z.string().min(1, "Title is required"),
  maxScore: z.coerce.number().positive("Max score must be positive"),
  categoryId: z.string().uuid("Category is required")
})

type GradeFormValues = z.infer<typeof gradeSchema>
type CategoryFormValues = z.infer<typeof categorySchema>
type ItemFormValues = z.infer<typeof itemSchema>

type TabId = "grades" | "items" | "categories" | "computation"

const tabs: { id: TabId; label: string; icon: typeof GraduationCap }[] = [
  { id: "grades",       label: "Grades",        icon: Award },
  { id: "items",        label: "Grade Items",   icon: BookOpen },
  { id: "categories",   label: "Categories",    icon: Hash },
  { id: "computation",  label: "Computation",   icon: Settings2 },
]

export function GradesPage() {
  const perms = usePermissions()
  const currentUser = getStoredUser()
  const isStudent = currentUser?.role === "STUDENT"

  // Students see only their final/displayed grades. Internal management
  // (grade items catalog, category weights, computation config) stays
  // staff-only — backend grade logic is untouched.
  const visibleTabs = isStudent ? tabs.filter((t) => t.id === "grades") : tabs
  const [activeTab, setActiveTab] = useState<TabId>("grades")
  const gradeForm = useForm<GradeFormValues>({ resolver: zodResolver(gradeSchema) })
  const categoryForm = useForm<CategoryFormValues>({ resolver: zodResolver(categorySchema) })
  const itemForm = useForm<ItemFormValues>({ resolver: zodResolver(itemSchema) })
  const [studentSearch, setStudentSearch] = useState("")
  const [showStudentDropdown, setShowStudentDropdown] = useState(false)

  const [editingGrade, setEditingGrade] = useState<any | null>(null)
  const [deletingGrade, setDeletingGrade] = useState<any | null>(null)
  const [editGradeScore, setEditGradeScore] = useState<number>(0)
  const [editGradeRemarks, setEditGradeRemarks] = useState("")

  const [editingItem, setEditingItem] = useState<any | null>(null)
  const [deletingItem, setDeletingItem] = useState<any | null>(null)
  const [editItemTitle, setEditItemTitle] = useState("")
  const [editItemMaxScore, setEditItemMaxScore] = useState<number>(0)
  const [editItemCategoryId, setEditItemCategoryId] = useState("")

  const [editingCategory, setEditingCategory] = useState<any | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<any | null>(null)
  const [editCategoryName, setEditCategoryName] = useState("")
  const [editCategoryWeight, setEditCategoryWeight] = useState<number | undefined>(undefined)

  const [configPassingGrade, setConfigPassingGrade] = useState<number>(75)
  const [configComputationMode, setConfigComputationMode] = useState<"weighted" | "average">("weighted")

  const configQuery = useQuery({
    queryKey: ["grade-config"],
    queryFn: () => apiRequest<ApiResponse<{ passingGrade: number; computationMode: "weighted" | "average" }>>("/api/grades/config"),
    refetchInterval: 10000,
    retry: false,
  })

  const updateConfigMutation = useMutation({
    mutationFn: (data: { passingGrade: number; computationMode: "weighted" | "average" }) =>
      apiRequest<ApiResponse<{ passingGrade: number; computationMode: "weighted" | "average" }>>("/api/grades/config", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      configQuery.refetch()
      toast.success("Computation settings saved")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to update settings")
    },
  })

  // Keep the editable form in sync with the latest saved configuration
  useEffect(() => {
    const config = configQuery.data?.data
    if (!config) return
    setConfigPassingGrade(config.passingGrade)
    setConfigComputationMode(config.computationMode)
  }, [configQuery.data])

  const gradesQuery = useQuery({
    queryKey: ["grades", currentUser?.id],
    queryFn: () => apiRequest<ApiResponse<any[]>>(isStudent ? `/api/grades?studentId=${currentUser?.id}` : "/api/grades"),
    refetchInterval: 30000,
    retry: false
  })

  const categoriesQuery = useQuery({
    queryKey: ["grade-categories"],
    queryFn: () => apiRequest<ApiResponse<any[]>>("/api/grades/categories"),
    refetchInterval: 10000,
    retry: false
  })

  const itemsQuery = useQuery({
    queryKey: ["grade-items"],
    queryFn: () => apiRequest<ApiResponse<any[]>>("/api/grades/items"),
    refetchInterval: 10000,
    retry: false
  })

  const studentsQuery = useQuery({
    queryKey: ["grade-students", studentSearch],
    queryFn: () =>
      apiRequest<ApiResponse<any[]>>(
        `/api/enrollments?search=${encodeURIComponent(studentSearch.trim())}`
      ),
    enabled: studentSearch.trim().length >= 2
  })

  const totalQuery = useQuery({
    queryKey: ["grade-total", currentUser?.id],
    queryFn: () =>
      apiRequest<ApiResponse<{ totalPercent: number | null; passingGrade: number; computationMode: "weighted" | "average"; breakdown: Array<{ name: string; weight: number | null; score: number; max: number; percent: number | null }> }>>(
        isStudent ? `/api/grades/total?studentId=${currentUser?.id}` : "/api/grades/total"
      ),
    refetchInterval: 30000,
    retry: false
  })

  const gradeMutation = useMutation({
    mutationFn: (values: GradeFormValues) =>
      apiRequest<ApiResponse<any>>("/api/grades", { method: "POST", body: JSON.stringify(values) }),
    onSuccess: () => { gradesQuery.refetch(); toast.success("Grade saved") },
    onError: (error) => { toast.error(error instanceof Error ? error.message : "Unable to save grade") }
  })

  const categoryMutation = useMutation({
    mutationFn: (values: CategoryFormValues) =>
      apiRequest<ApiResponse<any>>("/api/grades/categories", { method: "POST", body: JSON.stringify(values) }),
    onSuccess: () => { categoriesQuery.refetch(); toast.success("Category created") },
    onError: (error) => { toast.error(error instanceof Error ? error.message : "Unable to create category") }
  })

  const itemMutation = useMutation({
    mutationFn: (values: ItemFormValues) =>
      apiRequest<ApiResponse<any>>("/api/grades/items", { method: "POST", body: JSON.stringify(values) }),
    onSuccess: () => { itemsQuery.refetch(); toast.success("Grade item created") },
    onError: (error) => { toast.error(error instanceof Error ? error.message : "Unable to create item") }
  })

  const updateGradeMutation = useMutation({
    mutationFn: ({ id, score, remarks }: { id: string; score: number; remarks: string }) =>
      apiRequest<ApiResponse<any>>(`/api/grades/${id}`, { method: "PATCH", body: JSON.stringify({ score, remarks }) }),
    onSuccess: () => { gradesQuery.refetch(); toast.success("Grade updated"); setEditingGrade(null) },
    onError: (error) => { toast.error(error instanceof Error ? error.message : "Update failed") }
  })

  const deleteGradeMutation = useMutation({
    mutationFn: (id: string) => apiRequest<ApiResponse<any>>(`/api/grades/${id}`, { method: "DELETE" }),
    onSuccess: () => { gradesQuery.refetch(); toast.success("Grade deleted") },
    onError: (error) => { toast.error(error instanceof Error ? error.message : "Delete failed") }
  })

  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest<ApiResponse<any>>(`/api/grades/items/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => { itemsQuery.refetch(); toast.success("Item updated"); setEditingItem(null) },
    onError: (error) => { toast.error(error instanceof Error ? error.message : "Update failed") }
  })

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => apiRequest<ApiResponse<any>>(`/api/grades/items/${id}`, { method: "DELETE" }),
    onSuccess: () => { itemsQuery.refetch(); toast.success("Item deleted") },
    onError: (error) => { toast.error(error instanceof Error ? error.message : "Delete failed") }
  })

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest<ApiResponse<any>>(`/api/grades/categories/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    onSuccess: () => { categoriesQuery.refetch(); toast.success("Category updated"); setEditingCategory(null) },
    onError: (error) => { toast.error(error instanceof Error ? error.message : "Update failed") }
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => apiRequest<ApiResponse<any>>(`/api/grades/categories/${id}`, { method: "DELETE" }),
    onSuccess: () => { categoriesQuery.refetch(); toast.success("Category deleted") },
    onError: (error) => { toast.error(error instanceof Error ? error.message : "Delete failed") }
  })

  const onGradeSubmit = gradeForm.handleSubmit(async (values) => {
    await gradeMutation.mutateAsync(values)
    gradeForm.reset()
    setStudentSearch("")
  })

  const onCategorySubmit = categoryForm.handleSubmit(async (values) => {
    await categoryMutation.mutateAsync(values)
    categoryForm.reset()
  })

  const onItemSubmit = itemForm.handleSubmit(async (values) => {
    await itemMutation.mutateAsync(values)
    itemForm.reset()
  })

  const handleEditGrade = (grade: any) => { setEditingGrade(grade); setEditGradeScore(grade.score); setEditGradeRemarks(grade.remarks ?? "") }
  const handleSaveGrade = () => { if (editingGrade) updateGradeMutation.mutate({ id: editingGrade.id, score: editGradeScore, remarks: editGradeRemarks }) }
  const handleDeleteGrade = (grade: any) => { setDeletingGrade(grade) }
  const confirmDeleteGrade = () => { if (deletingGrade) { deleteGradeMutation.mutate(deletingGrade.id); setDeletingGrade(null) } }

  const handleEditItem = (item: any) => { setEditingItem(item); setEditItemTitle(item.title); setEditItemMaxScore(item.maxScore); setEditItemCategoryId(item.categoryId) }
  const handleSaveItem = () => { if (editingItem) updateItemMutation.mutate({ id: editingItem.id, data: { title: editItemTitle, maxScore: editItemMaxScore, categoryId: editItemCategoryId } }) }
  const handleDeleteItem = (item: any) => { setDeletingItem(item) }
  const confirmDeleteItem = () => { if (deletingItem) { deleteItemMutation.mutate(deletingItem.id); setDeletingItem(null) } }

  const handleEditCategory = (category: any) => { setEditingCategory(category); setEditCategoryName(category.name); setEditCategoryWeight(category.weight) }
  const handleSaveCategory = () => { if (editingCategory) updateCategoryMutation.mutate({ id: editingCategory.id, data: { name: editCategoryName, weight: editCategoryWeight } }) }
  const handleDeleteCategory = (category: any) => { setDeletingCategory(category) }
  const confirmDeleteCategory = () => { if (deletingCategory) { deleteCategoryMutation.mutate(deletingCategory.id); setDeletingCategory(null) } }

  const rows = gradesQuery.data?.data ?? []
  const categories = categoriesQuery.data?.data ?? []
  const items = itemsQuery.data?.data ?? []

  // Passing grade from saved configuration (falls back to the standard 75)
  const passingGrade = configQuery.data?.data?.passingGrade ?? totalQuery.data?.data?.passingGrade ?? 75
  const computationMode = configQuery.data?.data?.computationMode ?? totalQuery.data?.data?.computationMode ?? "weighted"

  const gradeColumns = [
    {
      header: "Student",
      cell: (grade: any) => {
        const profile = grade.student?.studentProfile
        const name = profile?.firstName && profile?.lastName ? `${profile.firstName} ${profile.lastName}` : null
        const initial = name ? profile.firstName[0] : (grade.student?.email?.[0] ?? "?").toUpperCase()
        return (
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-navy to-royal text-xs font-bold text-white shadow-soft shrink-0">
              {initial}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-black truncate">{name || grade.student?.email || "-"}</p>
              {name && grade.student?.email && <p className="text-xs text-darksilver truncate">{grade.student.email}</p>}
            </div>
          </div>
        )
      }
    },
    {
      header: "Item",
      cell: (grade: any) => (
        <span className="text-sm font-medium text-black/80">{grade.gradeItem?.title ?? "-"}</span>
      )
    },
    {
      header: "Score",
      cell: (grade: any) => {
        const pct = grade.gradeItem?.maxScore ? Math.round((grade.score / grade.gradeItem.maxScore) * 100) : 0
        const isGood = pct >= passingGrade
        return (
          <div className="flex items-center gap-2">
            <span className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-bold",
              isGood ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50"
            )}>
              {grade.score} / {grade.gradeItem?.maxScore ?? 0}
            </span>
            {grade.gradeItem?.maxScore && (
              <span className={cn("text-xs font-semibold", isGood ? "text-emerald-500" : "text-red-400")}>
                ({pct}%)
              </span>
            )}
          </div>
        )
      }
    },
    {
      header: "Remarks",
      cell: (grade: any) => grade.remarks
        ? <span className="block max-w-[220px] truncate text-sm text-black/80" title={grade.remarks}>{grade.remarks}</span>
        : <span className="text-xs text-darksilver">—</span>
    },
    {
      header: "Category",
      cell: (grade: any) => (
        <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-600">
          {grade.gradeItem?.category?.name ?? "-"}
        </span>
      )
    },
    {
      header: "Total",
      cell: (grade: any) => {
        const total = grade.totalGrade
        if (total == null) return <span className="text-xs text-darksilver">—</span>
        const isGood = total >= passingGrade
        return (
          <span className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-bold",
            isGood ? "text-emerald-600 bg-emerald-50" : "text-red-600 bg-red-50"
          )}>
            {Math.round(total)}%
          </span>
        )
      }
    },
    ...(perms.canEdit || perms.canDelete ? [{
      header: "",
      cell: (grade: any) => (
        <div className="flex gap-1">
          {perms.canEdit && (
            <button onClick={() => handleEditGrade(grade)} className="flex h-8 w-8 items-center justify-center rounded-lg text-darksilver hover:text-darksilver hover:bg-white transition-all" title="Edit">
              <Edit className="h-3.5 w-3.5" />
            </button>
          )}
          {perms.canDelete && (
            <button onClick={() => handleDeleteGrade(grade)} disabled={deleteGradeMutation.isPending} className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-50" title="Delete">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )
    }] : []),
  ]

  const categoryColumns = [
    { header: "Name", cell: (cat: any) => <span className="font-semibold text-black">{cat.name}</span> },
    { header: "Weight", cell: (cat: any) => cat.weight ? <span className="inline-flex items-center rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-darksilver">{cat.weight}%</span> : <span className="text-xs text-darksilver">—</span> },
    ...(perms.canEdit || perms.canDelete ? [{
      header: "",
      cell: (cat: any) => (
        <div className="flex gap-1">
          {perms.canEdit && <button onClick={() => handleEditCategory(cat)} className="flex h-8 w-8 items-center justify-center rounded-lg text-darksilver hover:text-darksilver hover:bg-white transition-all" title="Edit"><Edit className="h-3.5 w-3.5" /></button>}
          {perms.canDelete && <button onClick={() => handleDeleteCategory(cat)} disabled={deleteCategoryMutation.isPending} className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-50" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>}
        </div>
      )
    }] : []),
  ]

  const itemColumns = [
    { header: "Title", cell: (item: any) => <span className="font-semibold text-black">{item.title}</span> },
    { header: "Max Score", cell: (item: any) => <span className="inline-flex items-center rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-semibold text-royal">{item.maxScore}</span> },
    { header: "Category", cell: (item: any) => <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-600">{item.category?.name ?? "-"}</span> },
    ...(perms.canEdit || perms.canDelete ? [{
      header: "",
      cell: (item: any) => (
        <div className="flex gap-1">
          {perms.canEdit && <button onClick={() => handleEditItem(item)} className="flex h-8 w-8 items-center justify-center rounded-lg text-darksilver hover:text-darksilver hover:bg-white transition-all" title="Edit"><Edit className="h-3.5 w-3.5" /></button>}
          {perms.canDelete && <button onClick={() => handleDeleteItem(item)} disabled={deleteItemMutation.isPending} className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all disabled:opacity-50" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>}
        </div>
      )
    }] : []),
  ]

  return (
    <div className="space-y-6">
      <motion.div
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-royal to-navy px-6 sm:px-10 pt-8 pb-0 shadow-elevated"
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
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 pb-6">
          <motion.div
            className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20"
            initial={{ opacity: 0, scale: 0.7, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] as const }}
          >
            <GraduationCap className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
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
              <span>Academic Performance</span>
            </motion.div>
            <motion.h1
              className="text-xl sm:text-2xl font-bold text-white tracking-tight"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.28, ease: [0.16, 1, 0.3, 1] as const }}
            >
              Grades
            </motion.h1>
            <motion.p
              className="mt-1 text-sm text-silver max-w-2xl"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.36, ease: [0.16, 1, 0.3, 1] as const }}
            >
              Manage grade categories, items, and encode student performance.
            </motion.p>
          </div>
        </div>

        <motion.div
          className="relative flex gap-1"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.42, ease: [0.16, 1, 0.3, 1] as const }}
        >
          {visibleTabs.map(({ id, label, icon: TabIcon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "relative flex items-center gap-2 px-4 sm:px-6 py-3 text-sm font-medium transition-all duration-200 rounded-t-xl",
                activeTab === id
                  ? "bg-white text-black shadow-soft"
                  : "text-silver hover:text-white hover:bg-white/5"
              )}
            >
              <TabIcon className="h-4 w-4" strokeWidth={activeTab === id ? 2.5 : 1.75} />
              {label}
            </button>
          ))}
        </motion.div>
      </motion.div>

      {activeTab === "grades" && (
        <>
          {isStudent && (totalQuery.data?.data ?? null) && (
            <SectionCard title="Total Grade — This Semester" description="Your combined grade across all categories." className="shadow-card">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-2xl shadow-soft",
                    (totalQuery.data?.data?.totalPercent ?? 0) >= passingGrade ? "bg-gradient-to-br from-emerald-500 to-emerald-600" : "bg-gradient-to-br from-rose-500 to-rose-600"
                  )}>
                    <span className="text-2xl font-extrabold text-white">{Math.round(totalQuery.data?.data?.totalPercent ?? 0)}%</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-white/80">Semester</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-black">Overall Grade</p>
                    <p className="text-xs text-darksilver">Combined across all graded categories</p>
                    {(totalQuery.data?.data?.totalPercent ?? 0) >= passingGrade ? (
                      <span className="mt-2 inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600">Passing ({passingGrade}%)</span>
                    ) : (
                      <span className="mt-2 inline-flex items-center rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600">Failing (&lt;{passingGrade}%)</span>
                    )}
                  </div>
                </div>
              </div>
            </SectionCard>
          )}
          {perms.canCreate && (
            <FormSection title="Encode Grade" description="Search for student and enter assessment score." className="shadow-card">
              <form className="space-y-5" onSubmit={onGradeSubmit}>
                <FormField label="Student" required error={gradeForm.formState.errors.studentId?.message}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darksilver" />
                    <Input
                      placeholder="Search by email or ID"
                      value={studentSearch}
                      onChange={(event) => { setStudentSearch(event.target.value); setShowStudentDropdown(true) }}
                      onFocus={() => setShowStudentDropdown(true)}
                      onBlur={() => setTimeout(() => setShowStudentDropdown(false), 200)}
                      autoComplete="off"
                      className="h-11 pl-10"
                    />
                    <input type="hidden" {...gradeForm.register("studentId")} />
                    {showStudentDropdown && studentSearch.trim().length >= 2 && (
                      <div className="absolute z-50 mt-1 w-full rounded-xl border border-silver/30 bg-white shadow-elevated max-h-64 overflow-y-auto">
                        {studentsQuery.isLoading ? (
                          <div className="px-4 py-3 text-xs text-darksilver">Searching students...</div>
                        ) : studentsQuery.isError ? (
                          <div className="px-4 py-3 text-xs text-red-500">Unable to search students.</div>
                        ) : (studentsQuery.data?.data ?? []).length === 0 ? (
                          <div className="px-4 py-3 text-xs text-darksilver">No matching students found.</div>
                        ) : (
                          <ul className="py-1 text-sm">
                            {(studentsQuery.data?.data ?? []).map((enrollment: any) => (
                              <li
                                key={enrollment.id}
                                className="flex items-center gap-3 cursor-pointer px-4 py-2.5 hover:bg-white transition-colors"
                                onClick={() => {
                                  gradeForm.setValue("studentId", enrollment.userId)
                                  setStudentSearch(enrollment.user?.email ?? enrollment.userId)
                                  setShowStudentDropdown(false)
                                }}
                              >
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-navy to-royal text-[10px] font-bold text-white shrink-0">
                                  {(enrollment.user?.email?.[0] ?? "?").toUpperCase()}
                                </span>
                                <div>
                                  <div className="font-medium text-black">{enrollment.user?.email ?? enrollment.userId}</div>
                                  <div className="text-xs text-darksilver">{enrollment.section?.code ?? "-"} · {enrollment.flight?.code ?? "-"}</div>
                                </div>
                                <ChevronRight className="h-4 w-4 ml-auto text-silver" />
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                </FormField>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="Grade Item" required error={gradeForm.formState.errors.gradeItemId?.message}>
                    <Select {...gradeForm.register("gradeItemId")} className="h-11">
                      <option value="">Select item</option>
                      {items.map((item: any) => (
                        <option key={item.id} value={item.id}>{item.title} ({item.category?.name})</option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label="Score" required error={gradeForm.formState.errors.score?.message}>
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darksilver" />
                      <Input type="number" placeholder="0" {...gradeForm.register("score")} className="h-11 pl-10" />
                    </div>
                  </FormField>
                </div>
                <FormField label="Remarks" error={gradeForm.formState.errors.remarks?.message}>
                  <Input placeholder="Optional remarks (e.g. Needs improvement on drills)" maxLength={500} {...gradeForm.register("remarks")} className="h-11" />
                </FormField>
                {gradeMutation.isError && <Alert variant="danger">{(gradeMutation.error as Error).message}</Alert>}
                <Button type="submit" disabled={gradeMutation.isPending} className="bg-gradient-to-r from-navy to-royal hover:from-navy hover:to-black text-white shadow-soft">
                  {gradeMutation.isPending ? (
                    <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" />Saving…</span>
                  ) : (
                    <span className="flex items-center gap-2"><Award className="h-4 w-4" />Save Grade</span>
                  )}
                </Button>
              </form>
            </FormSection>
          )}
          <SectionCard title="Grades" description="Recent grading activity and encoded performance." className="shadow-card">
            {gradesQuery.isError && <Alert variant="danger">{(gradesQuery.error as Error).message === "Unauthorized" ? "Please log out and log back in to refresh your session." : "Unable to load grades."}</Alert>}
            {gradesQuery.isLoading ? <LoadingSkeleton rows={3} columns={4} /> : rows.length === 0 ? (
              <EmptyState title="No grades recorded yet" description="Start tracking academic performance by encoding the first grade entry." />
            ) : (
              <ResponsiveTableCards data={rows} columns={gradeColumns} rowKey={(grade) => grade.id} renderTitle={(grade) => grade.gradeItem?.title ?? "Grade"} />
            )}
          </SectionCard>
        </>
      )}

      {activeTab === "items" && (
        <>
          {perms.canCreate && (
            <FormSection title="Create Grade Item" description="Define a new assessment or activity." className="shadow-card">
              <form className="grid gap-4 md:grid-cols-3" onSubmit={onItemSubmit}>
                <FormField label="Title" required error={itemForm.formState.errors.title?.message}>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darksilver" />
                    <Input placeholder="e.g. Quiz 1" {...itemForm.register("title")} className="h-11 pl-10" />
                  </div>
                </FormField>
                <FormField label="Max Score" required error={itemForm.formState.errors.maxScore?.message}>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darksilver" />
                    <Input type="number" placeholder="100" {...itemForm.register("maxScore")} className="h-11 pl-10" />
                  </div>
                </FormField>
                <FormField label="Category" required error={itemForm.formState.errors.categoryId?.message}>
                  <Select {...itemForm.register("categoryId")} className="h-11">
                    <option value="">Select category</option>
                    {categories.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </Select>
                </FormField>
                {itemMutation.isError && <Alert variant="danger" className="md:col-span-3">{(itemMutation.error as Error).message}</Alert>}
                <div className="md:col-span-3">
                  <Button type="submit" disabled={itemMutation.isPending} className="bg-gradient-to-r from-navy to-royal hover:from-navy hover:to-black text-white shadow-soft">
                    {itemMutation.isPending ? (
                      <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" />Creating…</span>
                    ) : (
                      <span className="flex items-center gap-2"><Plus className="h-4 w-4" />Create Item</span>
                    )}
                  </Button>
                </div>
              </form>
            </FormSection>
          )}
          <SectionCard title="Grade Items" description="All assessment items and activities." className="shadow-card">
            {itemsQuery.isError && <Alert variant="danger">Unable to load items.</Alert>}
            {itemsQuery.isLoading ? <LoadingSkeleton rows={3} columns={3} /> : items.length === 0 ? (
              <EmptyState title="No grade items yet" description="Create your first grade item to get started." />
            ) : (
              <ResponsiveTableCards data={items} columns={itemColumns} rowKey={(item) => item.id} renderTitle={(item) => item.title} />
            )}
          </SectionCard>
        </>
      )}

      {activeTab === "categories" && (
        <>
          {perms.canCreate && (
            <FormSection title="Create Category" description="Define a grading category with optional weight." className="shadow-card">
              <form className="grid gap-4 md:grid-cols-2" onSubmit={onCategorySubmit}>
                <FormField label="Name" required error={categoryForm.formState.errors.name?.message}>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darksilver" />
                    <Input placeholder="e.g. Quizzes" {...categoryForm.register("name")} className="h-11 pl-10" />
                  </div>
                </FormField>
                <FormField label="Weight (%)" error={categoryForm.formState.errors.weight?.message}>
                  <Input type="number" placeholder="30" {...categoryForm.register("weight")} className="h-11" />
                </FormField>
                {categoryMutation.isError && <Alert variant="danger" className="md:col-span-2">{(categoryMutation.error as Error).message}</Alert>}
                <div className="md:col-span-2">
                  <Button type="submit" disabled={categoryMutation.isPending} className="bg-gradient-to-r from-navy to-royal hover:from-navy hover:to-black text-white shadow-soft">
                    {categoryMutation.isPending ? (
                      <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" />Creating…</span>
                    ) : (
                      <span className="flex items-center gap-2"><Plus className="h-4 w-4" />Create Category</span>
                    )}
                  </Button>
                </div>
              </form>
            </FormSection>
          )}
          <SectionCard title="Grade Categories" description="All grading categories and their weights." className="shadow-card">
            {categoriesQuery.isError && <Alert variant="danger">Unable to load categories.</Alert>}
            {categoriesQuery.isLoading ? <LoadingSkeleton rows={3} columns={2} /> : categories.length === 0 ? (
              <EmptyState title="No categories yet" description="Create your first category to organize grade items." />
            ) : (
              <ResponsiveTableCards data={categories} columns={categoryColumns} rowKey={(cat) => cat.id} renderTitle={(cat) => cat.name} />
            )}
          </SectionCard>
        </>
      )}

      {activeTab === "computation" && (perms.canEdit || perms.canCreate) && (
        <>
          <SectionCard
            title="Grade Computation Settings"
            description="Configure how the overall student grade is calculated and when a student passes."
            className="shadow-card"
          >
            <div className="space-y-6">
              {configQuery.isError && <Alert variant="danger">Unable to load configuration.</Alert>}
              {configQuery.isLoading ? (
                <LoadingSkeleton rows={2} columns={2} />
              ) : (
                <>
                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField label="Passing Grade (%)" hint="Minimum percentage to pass">
                      <div className="relative">
                        <Award className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darksilver" />
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          value={configPassingGrade}
                          onChange={(e) => {
                            const v = Number(e.target.value)
                            if (v > 0 && v <= 100) setConfigPassingGrade(v)
                          }}
                          className="h-11 pl-10"
                        />
                      </div>
                    </FormField>
                    <FormField label="Computation Mode" hint="How the total grade percentage is derived">
                      <div className="relative">
                        <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darksilver" />
                        <Select
                          value={configComputationMode}
                          onChange={(e) => setConfigComputationMode(e.target.value as "weighted" | "average")}
                          className="h-11 pl-10"
                        >
                          <option value="weighted">Weighted by category</option>
                          <option value="average">Simple average of all scores</option>
                        </Select>
                      </div>
                    </FormField>
                  </div>

                  <div className="rounded-xl border border-silver/20 bg-slate-50 dark:bg-slate-800/60 p-4 text-sm text-darksilver space-y-1">
                    <p className="font-medium text-black">How it works</p>
                    <ul className="list-disc pl-5 space-y-0.5">
                      <li><strong>Weighted by category:</strong> Each category contributes to the total by its assigned weight. Ungraded categories are ignored and do not lower the grade.</li>
                      <li><strong>Simple average:</strong> The total is the sum of all scores divided by the sum of all maximum scores, regardless of category weights.</li>
                      <li><strong>Passing Grade:</strong> Students scoring at or above this threshold are shown as <span className="font-semibold text-emerald-600">Passing</span>; below is <span className="font-semibold text-rose-600">Failing</span>.</li>
                    </ul>
                  </div>

                  {updateConfigMutation.isError && <Alert variant="danger">{(updateConfigMutation.error as Error).message}</Alert>}

                  <Button
                    onClick={() => updateConfigMutation.mutate({ passingGrade: configPassingGrade, computationMode: configComputationMode })}
                    disabled={updateConfigMutation.isPending}
                    className="bg-gradient-to-r from-navy to-royal hover:from-navy hover:to-black text-white shadow-soft"
                  >
                    {updateConfigMutation.isPending ? (
                      <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" />Saving…</span>
                    ) : (
                      <span className="flex items-center gap-2"><Save className="h-4 w-4" />Save Settings</span>
                    )}
                  </Button>
                </>
              )}
            </div>
          </SectionCard>
        </>
      )}

      <Drawer open={!!editingGrade} onOpenChange={(open) => !open && setEditingGrade(null)} title="Edit Grade">
        <div className="h-1 w-full bg-emerald-500" />
        <div className="p-4 space-y-5">
          {editingGrade && (
            <div className="flex items-center gap-3 pb-3 border-b border-silver/20">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-navy to-royal text-sm font-bold text-white shrink-0">
                {(editingGrade.student?.email?.[0] ?? "?").toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-black truncate">{editingGrade.student?.email ?? "Student"}</p>
                <p className="text-xs text-darksilver">{editingGrade.gradeItem?.title} · {editingGrade.gradeItem?.category?.name}</p>
              </div>
            </div>
          )}
          <FormField label="Score" required>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darksilver" />
              <Input type="number" value={editGradeScore} onChange={(e) => setEditGradeScore(Number(e.target.value))} placeholder="0" className="h-11 pl-10" />
            </div>
          </FormField>
          <FormField label="Remarks">
            <Input value={editGradeRemarks} onChange={(e) => setEditGradeRemarks(e.target.value)} maxLength={500} placeholder="Optional remarks" className="h-11" />
          </FormField>
          {updateGradeMutation.isError && <Alert variant="danger">{(updateGradeMutation.error as Error).message}</Alert>}
          <div className="flex gap-2">
            <Button onClick={handleSaveGrade} disabled={updateGradeMutation.isPending} className="bg-gradient-to-r from-navy to-royal hover:from-navy hover:to-black text-white shadow-soft">
              {updateGradeMutation.isPending ? (
                <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" />Saving…</span>
              ) : (
                <span className="flex items-center gap-2"><Save className="h-4 w-4" />Save Changes</span>
              )}
            </Button>
            <Button variant="outline" onClick={() => setEditingGrade(null)}><X className="h-4 w-4 mr-1" />Cancel</Button>
          </div>
        </div>
      </Drawer>

      <Drawer open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)} title="Edit Grade Item">
        <div className="h-1 w-full bg-sky-500" />
        <div className="p-4 space-y-5">
          {editingItem && (
            <div className="flex items-center gap-3 pb-3 border-b border-silver/20">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50">
                <BookOpen className="h-5 w-5 text-royal" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-black truncate">{editingItem.title}</p>
                <p className="text-xs text-darksilver">Max: {editingItem.maxScore}</p>
              </div>
            </div>
          )}
          <FormField label="Title" required>
            <Input value={editItemTitle} onChange={(e) => setEditItemTitle(e.target.value)} placeholder="e.g. Quiz 1" className="h-11" />
          </FormField>
          <FormField label="Max Score" required>
            <Input type="number" value={editItemMaxScore} onChange={(e) => setEditItemMaxScore(Number(e.target.value))} placeholder="100" className="h-11" />
          </FormField>
          <FormField label="Category" required>
            <Select value={editItemCategoryId} onChange={(e) => setEditItemCategoryId(e.target.value)} className="h-11">
              <option value="">Select category</option>
              {categories.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </Select>
          </FormField>
          {updateItemMutation.isError && <Alert variant="danger">{(updateItemMutation.error as Error).message}</Alert>}
          <div className="flex gap-2">
            <Button onClick={handleSaveItem} disabled={updateItemMutation.isPending || !editItemTitle} className="bg-gradient-to-r from-navy to-royal hover:from-navy hover:to-black text-white shadow-soft">
              {updateItemMutation.isPending ? (
                <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" />Saving…</span>
              ) : (
                <span className="flex items-center gap-2"><Save className="h-4 w-4" />Save Changes</span>
              )}
            </Button>
            <Button variant="outline" onClick={() => setEditingItem(null)}><X className="h-4 w-4 mr-1" />Cancel</Button>
          </div>
        </div>
      </Drawer>

      <Drawer open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)} title="Edit Category">
        <div className="h-1 w-full bg-violet-500" />
        <div className="p-4 space-y-5">
          {editingCategory && (
            <div className="flex items-center gap-3 pb-3 border-b border-silver/20">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50">
                <Hash className="h-5 w-5 text-violet-600" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-black truncate">{editingCategory.name}</p>
                <p className="text-xs text-darksilver">{editingCategory.weight ? `${editingCategory.weight}% weight` : "No weight set"}</p>
              </div>
            </div>
          )}
          <FormField label="Name" required>
            <Input value={editCategoryName} onChange={(e) => setEditCategoryName(e.target.value)} placeholder="e.g. Quizzes" className="h-11" />
          </FormField>
          <FormField label="Weight (%)">
            <Input type="number" value={editCategoryWeight ?? ""} onChange={(e) => setEditCategoryWeight(e.target.value ? Number(e.target.value) : undefined)} placeholder="30" className="h-11" />
          </FormField>
          {updateCategoryMutation.isError && <Alert variant="danger">{(updateCategoryMutation.error as Error).message}</Alert>}
          <div className="flex gap-2">
            <Button onClick={handleSaveCategory} disabled={updateCategoryMutation.isPending || !editCategoryName} className="bg-gradient-to-r from-navy to-royal hover:from-navy hover:to-black text-white shadow-soft">
              {updateCategoryMutation.isPending ? (
                <span className="flex items-center gap-2"><RefreshCw className="h-4 w-4 animate-spin" />Saving…</span>
              ) : (
                <span className="flex items-center gap-2"><Save className="h-4 w-4" />Save Changes</span>
              )}
            </Button>
            <Button variant="outline" onClick={() => setEditingCategory(null)}><X className="h-4 w-4 mr-1" />Cancel</Button>
          </div>
        </div>
      </Drawer>

      <ConfirmDialog open={!!deletingGrade} onOpenChange={(open) => !open && setDeletingGrade(null)} title="Delete Grade" description="Are you sure you want to delete this grade entry? This action cannot be undone." confirmLabel="Delete" cancelLabel="Cancel" destructive onConfirm={confirmDeleteGrade} />
      <ConfirmDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)} title="Delete Grade Item" description={`Are you sure you want to delete "${deletingItem?.title}"? This will also delete all associated grades. This action cannot be undone.`} confirmLabel="Delete" cancelLabel="Cancel" destructive onConfirm={confirmDeleteItem} />
      <ConfirmDialog open={!!deletingCategory} onOpenChange={(open) => !open && setDeletingCategory(null)} title="Delete Category" description={`Are you sure you want to delete "${deletingCategory?.name}"? This will affect all grade items in this category. This action cannot be undone.`} confirmLabel="Delete" cancelLabel="Cancel" destructive onConfirm={confirmDeleteCategory} />
    </div>
  )
}
