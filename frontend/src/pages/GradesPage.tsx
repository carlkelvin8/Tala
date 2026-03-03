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
import { GraduationCap, RefreshCw, Table as TableIcon, Plus, Edit, Trash2 } from "lucide-react"
import { useState } from "react"

const gradeSchema = z.object({
  studentId: z.string().uuid(),
  gradeItemId: z.string().uuid(),
  score: z.coerce.number().nonnegative()
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

export function GradesPage() {
  const user = getStoredUser()
  const canManage = user?.role !== "STUDENT"
  const [activeTab, setActiveTab] = useState<"grades" | "items" | "categories">("grades")
  const gradeForm = useForm<GradeFormValues>({ resolver: zodResolver(gradeSchema) })
  const categoryForm = useForm<CategoryFormValues>({ resolver: zodResolver(categorySchema) })
  const itemForm = useForm<ItemFormValues>({ resolver: zodResolver(itemSchema) })
  const [studentSearch, setStudentSearch] = useState("")
  const [showStudentDropdown, setShowStudentDropdown] = useState(false)
  
  // Edit/Delete states for grades
  const [editingGrade, setEditingGrade] = useState<any | null>(null)
  const [deletingGrade, setDeletingGrade] = useState<any | null>(null)
  const [editGradeScore, setEditGradeScore] = useState<number>(0)
  
  // Edit/Delete states for items
  const [editingItem, setEditingItem] = useState<any | null>(null)
  const [deletingItem, setDeletingItem] = useState<any | null>(null)
  const [editItemTitle, setEditItemTitle] = useState("")
  const [editItemMaxScore, setEditItemMaxScore] = useState<number>(0)
  const [editItemCategoryId, setEditItemCategoryId] = useState("")
  
  // Edit/Delete states for categories
  const [editingCategory, setEditingCategory] = useState<any | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<any | null>(null)
  const [editCategoryName, setEditCategoryName] = useState("")
  const [editCategoryWeight, setEditCategoryWeight] = useState<number | undefined>(undefined)
  
  const gradesQuery = useQuery({
    queryKey: ["grades"],
    queryFn: () => apiRequest<ApiResponse<any[]>>("/api/grades"),
    refetchInterval: 5000,
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

  const gradeMutation = useMutation({
    mutationFn: (values: GradeFormValues) =>
      apiRequest<ApiResponse<any>>("/api/grades", { method: "POST", body: JSON.stringify(values) }),
    onSuccess: () => {
      gradesQuery.refetch()
      toast.success("Grade saved")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to save grade")
    }
  })

  const categoryMutation = useMutation({
    mutationFn: (values: CategoryFormValues) =>
      apiRequest<ApiResponse<any>>("/api/grades/categories", { method: "POST", body: JSON.stringify(values) }),
    onSuccess: () => {
      categoriesQuery.refetch()
      toast.success("Category created")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to create category")
    }
  })

  const itemMutation = useMutation({
    mutationFn: (values: ItemFormValues) =>
      apiRequest<ApiResponse<any>>("/api/grades/items", { method: "POST", body: JSON.stringify(values) }),
    onSuccess: () => {
      itemsQuery.refetch()
      toast.success("Grade item created")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to create item")
    }
  })

  // Update/Delete mutations for grades
  const updateGradeMutation = useMutation({
    mutationFn: ({ id, score }: { id: string; score: number }) =>
      apiRequest<ApiResponse<any>>(`/api/grades/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ score }),
      }),
    onSuccess: () => {
      gradesQuery.refetch()
      toast.success("Grade updated")
      setEditingGrade(null)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Update failed")
    },
  })

  const deleteGradeMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest<ApiResponse<any>>(`/api/grades/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      gradesQuery.refetch()
      toast.success("Grade deleted")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Delete failed")
    },
  })

  // Update/Delete mutations for items
  const updateItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest<ApiResponse<any>>(`/api/grades/items/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      itemsQuery.refetch()
      toast.success("Item updated")
      setEditingItem(null)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Update failed")
    },
  })

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest<ApiResponse<any>>(`/api/grades/items/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      itemsQuery.refetch()
      toast.success("Item deleted")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Delete failed")
    },
  })

  // Update/Delete mutations for categories
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest<ApiResponse<any>>(`/api/grades/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      categoriesQuery.refetch()
      toast.success("Category updated")
      setEditingCategory(null)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Update failed")
    },
  })

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest<ApiResponse<any>>(`/api/grades/categories/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      categoriesQuery.refetch()
      toast.success("Category deleted")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Delete failed")
    },
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

  // Handlers for grades
  const handleEditGrade = (grade: any) => {
    setEditingGrade(grade)
    setEditGradeScore(grade.score)
  }

  const handleSaveGrade = () => {
    if (editingGrade) {
      updateGradeMutation.mutate({ id: editingGrade.id, score: editGradeScore })
    }
  }

  const handleDeleteGrade = (grade: any) => {
    setDeletingGrade(grade)
  }

  const confirmDeleteGrade = () => {
    if (deletingGrade) {
      deleteGradeMutation.mutate(deletingGrade.id)
      setDeletingGrade(null)
    }
  }

  // Handlers for items
  const handleEditItem = (item: any) => {
    setEditingItem(item)
    setEditItemTitle(item.title)
    setEditItemMaxScore(item.maxScore)
    setEditItemCategoryId(item.categoryId)
  }

  const handleSaveItem = () => {
    if (editingItem) {
      updateItemMutation.mutate({
        id: editingItem.id,
        data: {
          title: editItemTitle,
          maxScore: editItemMaxScore,
          categoryId: editItemCategoryId,
        },
      })
    }
  }

  const handleDeleteItem = (item: any) => {
    setDeletingItem(item)
  }

  const confirmDeleteItem = () => {
    if (deletingItem) {
      deleteItemMutation.mutate(deletingItem.id)
      setDeletingItem(null)
    }
  }

  // Handlers for categories
  const handleEditCategory = (category: any) => {
    setEditingCategory(category)
    setEditCategoryName(category.name)
    setEditCategoryWeight(category.weight)
  }

  const handleSaveCategory = () => {
    if (editingCategory) {
      updateCategoryMutation.mutate({
        id: editingCategory.id,
        data: {
          name: editCategoryName,
          weight: editCategoryWeight,
        },
      })
    }
  }

  const handleDeleteCategory = (category: any) => {
    setDeletingCategory(category)
  }

  const confirmDeleteCategory = () => {
    if (deletingCategory) {
      deleteCategoryMutation.mutate(deletingCategory.id)
      setDeletingCategory(null)
    }
  }
  
  const rows = gradesQuery.data?.data ?? []
  const categories = categoriesQuery.data?.data ?? []
  const items = itemsQuery.data?.data ?? []
  
  const gradeColumns = [
    {
      header: "Student",
      cell: (grade: any) => <span className="font-medium text-slate-900">{grade.student?.email ?? grade.studentId}</span>
    },
    {
      header: "Item",
      cell: (grade: any) => grade.gradeItem?.title ?? "-"
    },
    {
      header: "Score",
      cell: (grade: any) => `${grade.score} / ${grade.gradeItem?.maxScore ?? 0}`
    },
    {
      header: "Category",
      cell: (grade: any) => grade.gradeItem?.category?.name ?? "-"
    },
    ...(canManage ? [{
      header: "Actions",
      cell: (grade: any) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleEditGrade(grade)}>
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDeleteGrade(grade)}
            disabled={deleteGradeMutation.isPending}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      ),
    }] : []),
  ]

  const categoryColumns = [
    {
      header: "Name",
      cell: (category: any) => <span className="font-medium text-slate-900">{category.name}</span>
    },
    {
      header: "Weight",
      cell: (category: any) => category.weight ? `${category.weight}%` : "-"
    },
    ...(canManage ? [{
      header: "Actions",
      cell: (category: any) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleEditCategory(category)}>
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDeleteCategory(category)}
            disabled={deleteCategoryMutation.isPending}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      ),
    }] : []),
  ]

  const itemColumns = [
    {
      header: "Title",
      cell: (item: any) => <span className="font-medium text-slate-900">{item.title}</span>
    },
    {
      header: "Max Score",
      cell: (item: any) => item.maxScore
    },
    {
      header: "Category",
      cell: (item: any) => item.category?.name ?? "-"
    },
    ...(canManage ? [{
      header: "Actions",
      cell: (item: any) => (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleEditItem(item)}>
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDeleteItem(item)}
            disabled={deleteItemMutation.isPending}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      ),
    }] : []),
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grades"
        description="Manage grade categories, items, and encode student performance."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1 text-xs">
              <GraduationCap className="h-3 w-3" />
              <span>Performance tracking</span>
            </Badge>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("grades")}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            activeTab === "grades"
              ? "border-black text-black"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Grades
        </button>
        <button
          onClick={() => setActiveTab("items")}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            activeTab === "items"
              ? "border-black text-black"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Grade Items
        </button>
        <button
          onClick={() => setActiveTab("categories")}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            activeTab === "categories"
              ? "border-black text-black"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Categories
        </button>
      </div>

      {/* Grades Tab */}
      {activeTab === "grades" && (
        <>
          {user && user.role !== "STUDENT" && (
            <FormSection title="Encode Grade" description="Search for student and enter assessment score.">
              <form className="space-y-4" onSubmit={onGradeSubmit}>
                <FormField label="Student" required error={gradeForm.formState.errors.studentId?.message}>
                  <div className="relative">
                    <Input
                      placeholder="Search by email or ID"
                      value={studentSearch}
                      onChange={(event) => {
                        setStudentSearch(event.target.value)
                        setShowStudentDropdown(true)
                      }}
                      onFocus={() => setShowStudentDropdown(true)}
                      onBlur={() => setTimeout(() => setShowStudentDropdown(false), 200)}
                      autoComplete="off"
                    />
                    <input type="hidden" {...gradeForm.register("studentId")} />
                    {showStudentDropdown && studentSearch.trim().length >= 2 && (
                      <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-64 overflow-y-auto">
                        {studentsQuery.isLoading ? (
                          <div className="px-3 py-2 text-xs text-gray-500">Searching students...</div>
                        ) : studentsQuery.isError ? (
                          <div className="px-3 py-2 text-xs text-red-500">Unable to search students.</div>
                        ) : (studentsQuery.data?.data ?? []).length === 0 ? (
                          <div className="px-3 py-2 text-xs text-gray-500">No matching students found.</div>
                        ) : (
                          <ul className="py-1 text-sm">
                            {(studentsQuery.data?.data ?? []).map((enrollment: any) => (
                              <li
                                key={enrollment.id}
                                className="cursor-pointer px-3 py-2 hover:bg-gray-50"
                                onClick={() => {
                                  gradeForm.setValue("studentId", enrollment.userId)
                                  setStudentSearch(enrollment.user?.email ?? enrollment.userId)
                                  setShowStudentDropdown(false)
                                }}
                              >
                                <div className="font-medium text-black">
                                  {enrollment.user?.email ?? enrollment.userId}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {enrollment.section?.code ?? "-"} · {enrollment.flight?.code ?? "-"}
                                </div>
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
                    <Select {...gradeForm.register("gradeItemId")}>
                      <option value="">Select item</option>
                      {items.map((item: any) => (
                        <option key={item.id} value={item.id}>
                          {item.title} ({item.category?.name})
                        </option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label="Score" required error={gradeForm.formState.errors.score?.message}>
                    <Input type="number" placeholder="0" {...gradeForm.register("score")} />
                  </FormField>
                </div>
                {gradeMutation.isError && <Alert variant="danger">{(gradeMutation.error as Error).message}</Alert>}
                <div>
                  <Button type="submit" disabled={gradeMutation.isPending}>
                    {gradeMutation.isPending ? "Saving..." : "Save Grade"}
                  </Button>
                </div>
              </form>
            </FormSection>
          )}
          <SectionCard
            title="Grades"
            description="Recent grading activity and encoded performance."
            contentClassName="space-y-4"
          >
            {gradesQuery.isError && (
              <Alert variant="danger">
                {(gradesQuery.error as Error).message === "Unauthorized" 
                  ? "Please log out and log back in to refresh your session." 
                  : "Unable to load grades."}
              </Alert>
            )}
            {gradesQuery.isLoading ? (
              <LoadingSkeleton rows={3} columns={4} />
            ) : rows.length === 0 ? (
              <EmptyState
                title="No grades recorded yet"
                description="Start tracking academic performance by encoding the first grade entry."
              />
            ) : (
              <ResponsiveTableCards
                data={rows}
                columns={gradeColumns}
                rowKey={(grade) => grade.id}
                renderTitle={(grade) => grade.gradeItem?.title ?? "Grade"}
              />
            )}
          </SectionCard>
        </>
      )}

      {/* Grade Items Tab */}
      {activeTab === "items" && (
        <>
          {user && user.role !== "STUDENT" && (
            <FormSection title="Create Grade Item" description="Define a new assessment or activity.">
              <form className="grid gap-4 md:grid-cols-3" onSubmit={onItemSubmit}>
                <FormField label="Title" required error={itemForm.formState.errors.title?.message}>
                  <Input placeholder="e.g. Quiz 1" {...itemForm.register("title")} />
                </FormField>
                <FormField label="Max Score" required error={itemForm.formState.errors.maxScore?.message}>
                  <Input type="number" placeholder="100" {...itemForm.register("maxScore")} />
                </FormField>
                <FormField label="Category" required error={itemForm.formState.errors.categoryId?.message}>
                  <Select {...itemForm.register("categoryId")}>
                    <option value="">Select category</option>
                    {categories.map((cat: any) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </Select>
                </FormField>
                {itemMutation.isError && <Alert variant="danger" className="md:col-span-3">{(itemMutation.error as Error).message}</Alert>}
                <div className="md:col-span-3">
                  <Button type="submit" disabled={itemMutation.isPending}>
                    <Plus className="h-4 w-4 mr-1" />
                    {itemMutation.isPending ? "Creating..." : "Create Item"}
                  </Button>
                </div>
              </form>
            </FormSection>
          )}
          <SectionCard title="Grade Items" description="All assessment items and activities.">
            {itemsQuery.isError && <Alert variant="danger">Unable to load items.</Alert>}
            {itemsQuery.isLoading ? (
              <LoadingSkeleton rows={3} columns={3} />
            ) : items.length === 0 ? (
              <EmptyState title="No grade items yet" description="Create your first grade item to get started." />
            ) : (
              <ResponsiveTableCards
                data={items}
                columns={itemColumns}
                rowKey={(item) => item.id}
                renderTitle={(item) => item.title}
              />
            )}
          </SectionCard>
        </>
      )}

      {/* Categories Tab */}
      {activeTab === "categories" && (
        <>
          {user && user.role !== "STUDENT" && (
            <FormSection title="Create Category" description="Define a grading category with optional weight.">
              <form className="grid gap-4 md:grid-cols-2" onSubmit={onCategorySubmit}>
                <FormField label="Name" required error={categoryForm.formState.errors.name?.message}>
                  <Input placeholder="e.g. Quizzes" {...categoryForm.register("name")} />
                </FormField>
                <FormField label="Weight (%)" error={categoryForm.formState.errors.weight?.message}>
                  <Input type="number" placeholder="30" {...categoryForm.register("weight")} />
                </FormField>
                {categoryMutation.isError && <Alert variant="danger" className="md:col-span-2">{(categoryMutation.error as Error).message}</Alert>}
                <div className="md:col-span-2">
                  <Button type="submit" disabled={categoryMutation.isPending}>
                    <Plus className="h-4 w-4 mr-1" />
                    {categoryMutation.isPending ? "Creating..." : "Create Category"}
                  </Button>
                </div>
              </form>
            </FormSection>
          )}
          <SectionCard title="Grade Categories" description="All grading categories and their weights.">
            {categoriesQuery.isError && <Alert variant="danger">Unable to load categories.</Alert>}
            {categoriesQuery.isLoading ? (
              <LoadingSkeleton rows={3} columns={2} />
            ) : categories.length === 0 ? (
              <EmptyState title="No categories yet" description="Create your first category to organize grade items." />
            ) : (
              <ResponsiveTableCards
                data={categories}
                columns={categoryColumns}
                rowKey={(cat) => cat.id}
                renderTitle={(cat) => cat.name}
              />
            )}
          </SectionCard>
        </>
      )}
      
      {/* Edit Grade Drawer */}
      <Drawer
        open={!!editingGrade}
        onOpenChange={(open) => !open && setEditingGrade(null)}
        title="Edit Grade"
      >
        <div className="p-4 space-y-4">
          <FormField label="Student" required>
            <Input value={editingGrade?.student?.email ?? ""} disabled />
          </FormField>
          <FormField label="Grade Item" required>
            <Input value={editingGrade?.gradeItem?.title ?? ""} disabled />
          </FormField>
          <FormField label="Score" required>
            <Input
              type="number"
              value={editGradeScore}
              onChange={(e) => setEditGradeScore(Number(e.target.value))}
              placeholder="0"
            />
          </FormField>
          {updateGradeMutation.isError && (
            <Alert variant="danger">{(updateGradeMutation.error as Error).message}</Alert>
          )}
          <div className="flex gap-2">
            <Button onClick={handleSaveGrade} disabled={updateGradeMutation.isPending}>
              {updateGradeMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
            <Button variant="outline" onClick={() => setEditingGrade(null)}>
              Cancel
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Edit Item Drawer */}
      <Drawer
        open={!!editingItem}
        onOpenChange={(open) => !open && setEditingItem(null)}
        title="Edit Grade Item"
      >
        <div className="p-4 space-y-4">
          <FormField label="Title" required>
            <Input
              value={editItemTitle}
              onChange={(e) => setEditItemTitle(e.target.value)}
              placeholder="e.g. Quiz 1"
            />
          </FormField>
          <FormField label="Max Score" required>
            <Input
              type="number"
              value={editItemMaxScore}
              onChange={(e) => setEditItemMaxScore(Number(e.target.value))}
              placeholder="100"
            />
          </FormField>
          <FormField label="Category" required>
            <Select value={editItemCategoryId} onChange={(e) => setEditItemCategoryId(e.target.value)}>
              <option value="">Select category</option>
              {categories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </Select>
          </FormField>
          {updateItemMutation.isError && (
            <Alert variant="danger">{(updateItemMutation.error as Error).message}</Alert>
          )}
          <div className="flex gap-2">
            <Button onClick={handleSaveItem} disabled={updateItemMutation.isPending || !editItemTitle}>
              {updateItemMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Cancel
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Edit Category Drawer */}
      <Drawer
        open={!!editingCategory}
        onOpenChange={(open) => !open && setEditingCategory(null)}
        title="Edit Category"
      >
        <div className="p-4 space-y-4">
          <FormField label="Name" required>
            <Input
              value={editCategoryName}
              onChange={(e) => setEditCategoryName(e.target.value)}
              placeholder="e.g. Quizzes"
            />
          </FormField>
          <FormField label="Weight (%)">
            <Input
              type="number"
              value={editCategoryWeight ?? ""}
              onChange={(e) => setEditCategoryWeight(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="30"
            />
          </FormField>
          {updateCategoryMutation.isError && (
            <Alert variant="danger">{(updateCategoryMutation.error as Error).message}</Alert>
          )}
          <div className="flex gap-2">
            <Button onClick={handleSaveCategory} disabled={updateCategoryMutation.isPending || !editCategoryName}>
              {updateCategoryMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
            <Button variant="outline" onClick={() => setEditingCategory(null)}>
              Cancel
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Delete Confirmations */}
      <ConfirmDialog
        open={!!deletingGrade}
        onOpenChange={(open) => !open && setDeletingGrade(null)}
        title="Delete Grade"
        description={`Are you sure you want to delete this grade entry? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={confirmDeleteGrade}
      />

      <ConfirmDialog
        open={!!deletingItem}
        onOpenChange={(open) => !open && setDeletingItem(null)}
        title="Delete Grade Item"
        description={`Are you sure you want to delete "${deletingItem?.title}"? This will also delete all associated grades. This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={confirmDeleteItem}
      />

      <ConfirmDialog
        open={!!deletingCategory}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
        title="Delete Category"
        description={`Are you sure you want to delete "${deletingCategory?.name}"? This will affect all grade items in this category. This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={confirmDeleteCategory}
      />
    </div>
  )
}
