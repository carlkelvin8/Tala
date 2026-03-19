import { useMutation, useQuery } from "@tanstack/react-query" // Import useMutation for CRUD operations and useQuery for fetching grades data
import { apiRequest } from "../lib/api" // Import the generic API request helper
import { ApiResponse } from "../types" // Import the generic API response wrapper type
import { Button } from "../components/ui/button" // Import the reusable Button component
import { Input } from "../components/ui/input" // Import the reusable Input component
import { Select } from "../components/ui/select" // Import the Select component for dropdowns
import { useForm } from "react-hook-form" // Import useForm for form state management and validation
import { z } from "zod" // Import zod for schema-based validation
import { zodResolver } from "@hookform/resolvers/zod" // Import the zod adapter for react-hook-form
import { getStoredUser } from "../lib/auth" // Import the function to get the current user for role-based UI
import { PageHeader } from "../components/ui/page-header" // Import the PageHeader component
import { FormField } from "../components/ui/form-field" // Import the FormField wrapper for labeled inputs
import { Alert } from "../components/ui/alert" // Import the Alert component for error messages
import { EmptyState } from "../components/ui/empty-state" // Import the EmptyState component for empty list state
import { toast } from "sonner" // Import toast for notifications
import { FormSection } from "../components/ui/form-section" // Import the FormSection wrapper for create forms
import { SectionCard } from "../components/ui/section-card" // Import the SectionCard wrapper for list sections
import { ResponsiveTableCards } from "../components/ui/responsive-table-cards" // Import the responsive table/card component
import { LoadingSkeleton } from "../components/ui/loading-skeleton" // Import the loading skeleton
import { Badge } from "../components/ui/badge" // Import the Badge component for the performance tracking badge
import { Drawer } from "../components/ui/drawer" // Import the Drawer component for edit panels
import { ConfirmDialog } from "../components/ui/confirm-dialog" // Import the ConfirmDialog for delete confirmations
import { GraduationCap, RefreshCw, Table as TableIcon, Plus, Edit, Trash2 } from "lucide-react" // Import icons for the UI
import { useState } from "react" // Import useState for managing all local state

// Zod schema for encoding a grade entry
const gradeSchema = z.object({
  studentId: z.string().uuid(), // Student ID must be a valid UUID
  gradeItemId: z.string().uuid(), // Grade item ID must be a valid UUID
  score: z.coerce.number().nonnegative() // Score must be a non-negative number (coerce converts string input)
})

// Zod schema for creating a grade category
const categorySchema = z.object({
  name: z.string().min(1, "Name is required"), // Category name must not be empty
  weight: z.coerce.number().optional() // Optional weight percentage (coerce converts string input)
})

// Zod schema for creating a grade item
const itemSchema = z.object({
  title: z.string().min(1, "Title is required"), // Item title must not be empty
  maxScore: z.coerce.number().positive("Max score must be positive"), // Max score must be a positive number
  categoryId: z.string().uuid("Category is required") // Category ID must be a valid UUID
})

type GradeFormValues = z.infer<typeof gradeSchema> // Derive TypeScript type from the grade schema
type CategoryFormValues = z.infer<typeof categorySchema> // Derive TypeScript type from the category schema
type ItemFormValues = z.infer<typeof itemSchema> // Derive TypeScript type from the item schema

// The grades management page component with tabs for grades, items, and categories
export function GradesPage() {
  const user = getStoredUser() // Get the current authenticated user for role-based UI
  const canManage = user?.role !== "STUDENT" // Students can only view grades, not create/edit/delete
  const [activeTab, setActiveTab] = useState<"grades" | "items" | "categories">("grades") // State for the active tab, defaults to grades
  const gradeForm = useForm<GradeFormValues>({ resolver: zodResolver(gradeSchema) }) // Form for encoding grades
  const categoryForm = useForm<CategoryFormValues>({ resolver: zodResolver(categorySchema) }) // Form for creating categories
  const itemForm = useForm<ItemFormValues>({ resolver: zodResolver(itemSchema) }) // Form for creating grade items
  const [studentSearch, setStudentSearch] = useState("") // State for the student search input
  const [showStudentDropdown, setShowStudentDropdown] = useState(false) // State to control the student search dropdown visibility

  // Edit/Delete states for grades
  const [editingGrade, setEditingGrade] = useState<any | null>(null) // State for the grade currently being edited
  const [deletingGrade, setDeletingGrade] = useState<any | null>(null) // State for the grade pending deletion
  const [editGradeScore, setEditGradeScore] = useState<number>(0) // State for the edit grade score field

  // Edit/Delete states for items
  const [editingItem, setEditingItem] = useState<any | null>(null) // State for the grade item currently being edited
  const [deletingItem, setDeletingItem] = useState<any | null>(null) // State for the grade item pending deletion
  const [editItemTitle, setEditItemTitle] = useState("") // State for the edit item title field
  const [editItemMaxScore, setEditItemMaxScore] = useState<number>(0) // State for the edit item max score field
  const [editItemCategoryId, setEditItemCategoryId] = useState("") // State for the edit item category field

  // Edit/Delete states for categories
  const [editingCategory, setEditingCategory] = useState<any | null>(null) // State for the category currently being edited
  const [deletingCategory, setDeletingCategory] = useState<any | null>(null) // State for the category pending deletion
  const [editCategoryName, setEditCategoryName] = useState("") // State for the edit category name field
  const [editCategoryWeight, setEditCategoryWeight] = useState<number | undefined>(undefined) // State for the edit category weight field

  const gradesQuery = useQuery({ // Fetch the list of grade entries
    queryKey: ["grades"], // Cache key for the grades list
    queryFn: () => apiRequest<ApiResponse<any[]>>("/api/grades"), // Fetch all grades from the API
    refetchInterval: 5000, // Auto-refetch every 5 seconds
    retry: false // Don't retry on failure
  })

  const categoriesQuery = useQuery({ // Fetch the list of grade categories
    queryKey: ["grade-categories"], // Cache key for the categories list
    queryFn: () => apiRequest<ApiResponse<any[]>>("/api/grades/categories"), // Fetch all categories from the API
    refetchInterval: 10000, // Auto-refetch every 10 seconds
    retry: false // Don't retry on failure
  })

  const itemsQuery = useQuery({ // Fetch the list of grade items
    queryKey: ["grade-items"], // Cache key for the items list
    queryFn: () => apiRequest<ApiResponse<any[]>>("/api/grades/items"), // Fetch all grade items from the API
    refetchInterval: 10000, // Auto-refetch every 10 seconds
    retry: false // Don't retry on failure
  })

  const studentsQuery = useQuery({ // Fetch matching students based on the search query
    queryKey: ["grade-students", studentSearch], // Cache key includes the search string
    queryFn: () =>
      apiRequest<ApiResponse<any[]>>(
        `/api/enrollments?search=${encodeURIComponent(studentSearch.trim())}` // Search enrollments by the trimmed search string
      ),
    enabled: studentSearch.trim().length >= 2 // Only run when at least 2 characters are typed
  })

  const gradeMutation = useMutation({ // Mutation for encoding a new grade
    mutationFn: (values: GradeFormValues) =>
      apiRequest<ApiResponse<any>>("/api/grades", { method: "POST", body: JSON.stringify(values) }), // POST the grade values
    onSuccess: () => { gradesQuery.refetch(); toast.success("Grade saved") }, // Refresh list and show success
    onError: (error) => { toast.error(error instanceof Error ? error.message : "Unable to save grade") }
  })

  const categoryMutation = useMutation({ // Mutation for creating a new grade category
    mutationFn: (values: CategoryFormValues) =>
      apiRequest<ApiResponse<any>>("/api/grades/categories", { method: "POST", body: JSON.stringify(values) }), // POST the category values
    onSuccess: () => { categoriesQuery.refetch(); toast.success("Category created") }, // Refresh list and show success
    onError: (error) => { toast.error(error instanceof Error ? error.message : "Unable to create category") }
  })

  const itemMutation = useMutation({ // Mutation for creating a new grade item
    mutationFn: (values: ItemFormValues) =>
      apiRequest<ApiResponse<any>>("/api/grades/items", { method: "POST", body: JSON.stringify(values) }), // POST the item values
    onSuccess: () => { itemsQuery.refetch(); toast.success("Grade item created") }, // Refresh list and show success
    onError: (error) => { toast.error(error instanceof Error ? error.message : "Unable to create item") }
  })

  const updateGradeMutation = useMutation({ // Mutation for updating an existing grade
    mutationFn: ({ id, score }: { id: string; score: number }) =>
      apiRequest<ApiResponse<any>>(`/api/grades/${id}`, { method: "PATCH", body: JSON.stringify({ score }) }), // PATCH with the new score
    onSuccess: () => { gradesQuery.refetch(); toast.success("Grade updated"); setEditingGrade(null) },
    onError: (error) => { toast.error(error instanceof Error ? error.message : "Update failed") }
  })

  const deleteGradeMutation = useMutation({ // Mutation for deleting a grade
    mutationFn: (id: string) => apiRequest<ApiResponse<any>>(`/api/grades/${id}`, { method: "DELETE" }), // DELETE the grade
    onSuccess: () => { gradesQuery.refetch(); toast.success("Grade deleted") },
    onError: (error) => { toast.error(error instanceof Error ? error.message : "Delete failed") }
  })

  const updateItemMutation = useMutation({ // Mutation for updating a grade item
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest<ApiResponse<any>>(`/api/grades/items/${id}`, { method: "PATCH", body: JSON.stringify(data) }), // PATCH with the updated item data
    onSuccess: () => { itemsQuery.refetch(); toast.success("Item updated"); setEditingItem(null) },
    onError: (error) => { toast.error(error instanceof Error ? error.message : "Update failed") }
  })

  const deleteItemMutation = useMutation({ // Mutation for deleting a grade item
    mutationFn: (id: string) => apiRequest<ApiResponse<any>>(`/api/grades/items/${id}`, { method: "DELETE" }), // DELETE the item
    onSuccess: () => { itemsQuery.refetch(); toast.success("Item deleted") },
    onError: (error) => { toast.error(error instanceof Error ? error.message : "Delete failed") }
  })

  const updateCategoryMutation = useMutation({ // Mutation for updating a grade category
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest<ApiResponse<any>>(`/api/grades/categories/${id}`, { method: "PATCH", body: JSON.stringify(data) }), // PATCH with the updated category data
    onSuccess: () => { categoriesQuery.refetch(); toast.success("Category updated"); setEditingCategory(null) },
    onError: (error) => { toast.error(error instanceof Error ? error.message : "Update failed") }
  })

  const deleteCategoryMutation = useMutation({ // Mutation for deleting a grade category
    mutationFn: (id: string) => apiRequest<ApiResponse<any>>(`/api/grades/categories/${id}`, { method: "DELETE" }), // DELETE the category
    onSuccess: () => { categoriesQuery.refetch(); toast.success("Category deleted") },
    onError: (error) => { toast.error(error instanceof Error ? error.message : "Delete failed") }
  })

  const onGradeSubmit = gradeForm.handleSubmit(async (values) => { // Grade form submit handler
    await gradeMutation.mutateAsync(values) // Trigger the grade creation mutation
    gradeForm.reset() // Reset the form after successful submission
    setStudentSearch("") // Clear the student search input
  })

  const onCategorySubmit = categoryForm.handleSubmit(async (values) => { // Category form submit handler
    await categoryMutation.mutateAsync(values) // Trigger the category creation mutation
    categoryForm.reset() // Reset the form after successful submission
  })

  const onItemSubmit = itemForm.handleSubmit(async (values) => { // Item form submit handler
    await itemMutation.mutateAsync(values) // Trigger the item creation mutation
    itemForm.reset() // Reset the form after successful submission
  })

  // Grade edit/delete handlers
  const handleEditGrade = (grade: any) => { setEditingGrade(grade); setEditGradeScore(grade.score) } // Open edit drawer and pre-populate score
  const handleSaveGrade = () => { if (editingGrade) updateGradeMutation.mutate({ id: editingGrade.id, score: editGradeScore }) } // Save the edited grade
  const handleDeleteGrade = (grade: any) => { setDeletingGrade(grade) } // Open delete confirmation
  const confirmDeleteGrade = () => { if (deletingGrade) { deleteGradeMutation.mutate(deletingGrade.id); setDeletingGrade(null) } } // Confirm and execute deletion

  // Item edit/delete handlers
  const handleEditItem = (item: any) => { setEditingItem(item); setEditItemTitle(item.title); setEditItemMaxScore(item.maxScore); setEditItemCategoryId(item.categoryId) } // Open edit drawer and pre-populate fields
  const handleSaveItem = () => { if (editingItem) updateItemMutation.mutate({ id: editingItem.id, data: { title: editItemTitle, maxScore: editItemMaxScore, categoryId: editItemCategoryId } }) } // Save the edited item
  const handleDeleteItem = (item: any) => { setDeletingItem(item) } // Open delete confirmation
  const confirmDeleteItem = () => { if (deletingItem) { deleteItemMutation.mutate(deletingItem.id); setDeletingItem(null) } } // Confirm and execute deletion

  // Category edit/delete handlers
  const handleEditCategory = (category: any) => { setEditingCategory(category); setEditCategoryName(category.name); setEditCategoryWeight(category.weight) } // Open edit drawer and pre-populate fields
  const handleSaveCategory = () => { if (editingCategory) updateCategoryMutation.mutate({ id: editingCategory.id, data: { name: editCategoryName, weight: editCategoryWeight } }) } // Save the edited category
  const handleDeleteCategory = (category: any) => { setDeletingCategory(category) } // Open delete confirmation
  const confirmDeleteCategory = () => { if (deletingCategory) { deleteCategoryMutation.mutate(deletingCategory.id); setDeletingCategory(null) } } // Confirm and execute deletion

  const rows = gradesQuery.data?.data ?? [] // Extract the grades array, defaulting to empty array
  const categories = categoriesQuery.data?.data ?? [] // Extract the categories array
  const items = itemsQuery.data?.data ?? [] // Extract the items array

  const gradeColumns = [ // Column definitions for the grades table
    { header: "Student", cell: (grade: any) => <span className="font-medium text-slate-900">{grade.student?.email ?? grade.studentId}</span> }, // Student email or ID
    { header: "Item", cell: (grade: any) => grade.gradeItem?.title ?? "-" }, // Grade item title
    { header: "Score", cell: (grade: any) => `${grade.score} / ${grade.gradeItem?.maxScore ?? 0}` }, // Score out of max score
    { header: "Category", cell: (grade: any) => grade.gradeItem?.category?.name ?? "-" }, // Category name
    ...(canManage ? [{ header: "Actions", cell: (grade: any) => ( // Actions column only for non-students
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => handleEditGrade(grade)}><Edit className="h-4 w-4 mr-1" />Edit</Button>
        <Button size="sm" variant="outline" onClick={() => handleDeleteGrade(grade)} disabled={deleteGradeMutation.isPending} className="text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4 mr-1" />Delete</Button>
      </div>
    )}] : []),
  ]

  const categoryColumns = [ // Column definitions for the categories table
    { header: "Name", cell: (category: any) => <span className="font-medium text-slate-900">{category.name}</span> }, // Category name
    { header: "Weight", cell: (category: any) => category.weight ? `${category.weight}%` : "-" }, // Weight percentage or dash
    ...(canManage ? [{ header: "Actions", cell: (category: any) => ( // Actions column only for non-students
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => handleEditCategory(category)}><Edit className="h-4 w-4 mr-1" />Edit</Button>
        <Button size="sm" variant="outline" onClick={() => handleDeleteCategory(category)} disabled={deleteCategoryMutation.isPending} className="text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4 mr-1" />Delete</Button>
      </div>
    )}] : []),
  ]

  const itemColumns = [ // Column definitions for the grade items table
    { header: "Title", cell: (item: any) => <span className="font-medium text-slate-900">{item.title}</span> }, // Item title
    { header: "Max Score", cell: (item: any) => item.maxScore }, // Maximum score value
    { header: "Category", cell: (item: any) => item.category?.name ?? "-" }, // Category name
    ...(canManage ? [{ header: "Actions", cell: (item: any) => ( // Actions column only for non-students
      <div className="flex gap-2">
        <Button size="sm" variant="outline" onClick={() => handleEditItem(item)}><Edit className="h-4 w-4 mr-1" />Edit</Button>
        <Button size="sm" variant="outline" onClick={() => handleDeleteItem(item)} disabled={deleteItemMutation.isPending} className="text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 className="h-4 w-4 mr-1" />Delete</Button>
      </div>
    )}] : []),
  ]

  return (
    <div className="space-y-6"> {/* Vertical stack with spacing between sections */}
      <PageHeader
        title="Grades"
        description="Manage grade categories, items, and encode student performance."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1 text-xs">
              <GraduationCap className="h-3 w-3" /> {/* Graduation cap icon */}
              <span>Performance tracking</span>
            </Badge>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200"> {/* Tab bar with bottom border */}
        <button
          onClick={() => setActiveTab("grades")} // Switch to the grades tab
          className={`px-4 py-2 text-sm font-medium border-b-2 ${ // Tab button with active/inactive styles
            activeTab === "grades" ? "border-black text-black" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Grades
        </button>
        <button
          onClick={() => setActiveTab("items")} // Switch to the grade items tab
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            activeTab === "items" ? "border-black text-black" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Grade Items
        </button>
        <button
          onClick={() => setActiveTab("categories")} // Switch to the categories tab
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            activeTab === "categories" ? "border-black text-black" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          Categories
        </button>
      </div>

      {/* Grades Tab */}
      {activeTab === "grades" && ( // Only render when the grades tab is active
        <>
          {user && user.role !== "STUDENT" && ( // Only show the encode form for non-students
            <FormSection title="Encode Grade" description="Search for student and enter assessment score.">
              <form className="space-y-4" onSubmit={onGradeSubmit}> {/* Grade encoding form */}
                <FormField label="Student" required error={gradeForm.formState.errors.studentId?.message}>
                  <div className="relative"> {/* Relative container for the student search dropdown */}
                    <Input
                      placeholder="Search by email or ID"
                      value={studentSearch} // Controlled input value
                      onChange={(event) => { setStudentSearch(event.target.value); setShowStudentDropdown(true) }} // Update search and show dropdown
                      onFocus={() => setShowStudentDropdown(true)} // Show dropdown on focus
                      onBlur={() => setTimeout(() => setShowStudentDropdown(false), 200)} // Hide dropdown on blur with delay to allow click
                      autoComplete="off" // Disable browser autocomplete
                    />
                    <input type="hidden" {...gradeForm.register("studentId")} /> {/* Hidden input for the selected student UUID */}
                    {showStudentDropdown && studentSearch.trim().length >= 2 && ( // Show dropdown when typing
                      <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-64 overflow-y-auto"> {/* Dropdown container */}
                        {studentsQuery.isLoading ? (
                          <div className="px-3 py-2 text-xs text-gray-500">Searching students...</div>
                        ) : studentsQuery.isError ? (
                          <div className="px-3 py-2 text-xs text-red-500">Unable to search students.</div>
                        ) : (studentsQuery.data?.data ?? []).length === 0 ? (
                          <div className="px-3 py-2 text-xs text-gray-500">No matching students found.</div>
                        ) : (
                          <ul className="py-1 text-sm"> {/* List of matching students */}
                            {(studentsQuery.data?.data ?? []).map((enrollment: any) => (
                              <li
                                key={enrollment.id}
                                className="cursor-pointer px-3 py-2 hover:bg-gray-50" // Clickable list item
                                onClick={() => { // Select this student on click
                                  gradeForm.setValue("studentId", enrollment.userId) // Set the hidden studentId field
                                  setStudentSearch(enrollment.user?.email ?? enrollment.userId) // Update the visible search input
                                  setShowStudentDropdown(false) // Close the dropdown
                                }}
                              >
                                <div className="font-medium text-black">{enrollment.user?.email ?? enrollment.userId}</div>
                                <div className="text-xs text-gray-500">{enrollment.section?.code ?? "-"} · {enrollment.flight?.code ?? "-"}</div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                </FormField>
                <div className="grid gap-4 md:grid-cols-2"> {/* Two-column grid for item and score fields */}
                  <FormField label="Grade Item" required error={gradeForm.formState.errors.gradeItemId?.message}>
                    <Select {...gradeForm.register("gradeItemId")}> {/* Grade item dropdown */}
                      <option value="">Select item</option>
                      {items.map((item: any) => (
                        <option key={item.id} value={item.id}>{item.title} ({item.category?.name})</option>
                      ))}
                    </Select>
                  </FormField>
                  <FormField label="Score" required error={gradeForm.formState.errors.score?.message}>
                    <Input type="number" placeholder="0" {...gradeForm.register("score")} /> {/* Score number input */}
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
          <SectionCard title="Grades" description="Recent grading activity and encoded performance." contentClassName="space-y-4">
            {gradesQuery.isError && <Alert variant="danger">{(gradesQuery.error as Error).message === "Unauthorized" ? "Please log out and log back in to refresh your session." : "Unable to load grades."}</Alert>}
            {gradesQuery.isLoading ? <LoadingSkeleton rows={3} columns={4} /> : rows.length === 0 ? (
              <EmptyState title="No grades recorded yet" description="Start tracking academic performance by encoding the first grade entry." />
            ) : (
              <ResponsiveTableCards data={rows} columns={gradeColumns} rowKey={(grade) => grade.id} renderTitle={(grade) => grade.gradeItem?.title ?? "Grade"} />
            )}
          </SectionCard>
        </>
      )}

      {/* Grade Items Tab */}
      {activeTab === "items" && ( // Only render when the items tab is active
        <>
          {user && user.role !== "STUDENT" && ( // Only show the create form for non-students
            <FormSection title="Create Grade Item" description="Define a new assessment or activity.">
              <form className="grid gap-4 md:grid-cols-3" onSubmit={onItemSubmit}> {/* Three-column grid form */}
                <FormField label="Title" required error={itemForm.formState.errors.title?.message}>
                  <Input placeholder="e.g. Quiz 1" {...itemForm.register("title")} />
                </FormField>
                <FormField label="Max Score" required error={itemForm.formState.errors.maxScore?.message}>
                  <Input type="number" placeholder="100" {...itemForm.register("maxScore")} />
                </FormField>
                <FormField label="Category" required error={itemForm.formState.errors.categoryId?.message}>
                  <Select {...itemForm.register("categoryId")}>
                    <option value="">Select category</option>
                    {categories.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </Select>
                </FormField>
                {itemMutation.isError && <Alert variant="danger" className="md:col-span-3">{(itemMutation.error as Error).message}</Alert>}
                <div className="md:col-span-3">
                  <Button type="submit" disabled={itemMutation.isPending}>
                    <Plus className="h-4 w-4 mr-1" />{itemMutation.isPending ? "Creating..." : "Create Item"}
                  </Button>
                </div>
              </form>
            </FormSection>
          )}
          <SectionCard title="Grade Items" description="All assessment items and activities.">
            {itemsQuery.isError && <Alert variant="danger">Unable to load items.</Alert>}
            {itemsQuery.isLoading ? <LoadingSkeleton rows={3} columns={3} /> : items.length === 0 ? (
              <EmptyState title="No grade items yet" description="Create your first grade item to get started." />
            ) : (
              <ResponsiveTableCards data={items} columns={itemColumns} rowKey={(item) => item.id} renderTitle={(item) => item.title} />
            )}
          </SectionCard>
        </>
      )}

      {/* Categories Tab */}
      {activeTab === "categories" && ( // Only render when the categories tab is active
        <>
          {user && user.role !== "STUDENT" && ( // Only show the create form for non-students
            <FormSection title="Create Category" description="Define a grading category with optional weight.">
              <form className="grid gap-4 md:grid-cols-2" onSubmit={onCategorySubmit}> {/* Two-column grid form */}
                <FormField label="Name" required error={categoryForm.formState.errors.name?.message}>
                  <Input placeholder="e.g. Quizzes" {...categoryForm.register("name")} />
                </FormField>
                <FormField label="Weight (%)" error={categoryForm.formState.errors.weight?.message}>
                  <Input type="number" placeholder="30" {...categoryForm.register("weight")} />
                </FormField>
                {categoryMutation.isError && <Alert variant="danger" className="md:col-span-2">{(categoryMutation.error as Error).message}</Alert>}
                <div className="md:col-span-2">
                  <Button type="submit" disabled={categoryMutation.isPending}>
                    <Plus className="h-4 w-4 mr-1" />{categoryMutation.isPending ? "Creating..." : "Create Category"}
                  </Button>
                </div>
              </form>
            </FormSection>
          )}
          <SectionCard title="Grade Categories" description="All grading categories and their weights.">
            {categoriesQuery.isError && <Alert variant="danger">Unable to load categories.</Alert>}
            {categoriesQuery.isLoading ? <LoadingSkeleton rows={3} columns={2} /> : categories.length === 0 ? (
              <EmptyState title="No categories yet" description="Create your first category to organize grade items." />
            ) : (
              <ResponsiveTableCards data={categories} columns={categoryColumns} rowKey={(cat) => cat.id} renderTitle={(cat) => cat.name} />
            )}
          </SectionCard>
        </>
      )}

      {/* Edit Grade Drawer */}
      <Drawer open={!!editingGrade} onOpenChange={(open) => !open && setEditingGrade(null)} title="Edit Grade">
        <div className="p-4 space-y-4">
          <FormField label="Student" required><Input value={editingGrade?.student?.email ?? ""} disabled /></FormField> {/* Read-only student field */}
          <FormField label="Grade Item" required><Input value={editingGrade?.gradeItem?.title ?? ""} disabled /></FormField> {/* Read-only item field */}
          <FormField label="Score" required>
            <Input type="number" value={editGradeScore} onChange={(e) => setEditGradeScore(Number(e.target.value))} placeholder="0" /> {/* Editable score field */}
          </FormField>
          {updateGradeMutation.isError && <Alert variant="danger">{(updateGradeMutation.error as Error).message}</Alert>}
          <div className="flex gap-2">
            <Button onClick={handleSaveGrade} disabled={updateGradeMutation.isPending}>{updateGradeMutation.isPending ? "Saving..." : "Save Changes"}</Button>
            <Button variant="outline" onClick={() => setEditingGrade(null)}>Cancel</Button>
          </div>
        </div>
      </Drawer>

      {/* Edit Item Drawer */}
      <Drawer open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)} title="Edit Grade Item">
        <div className="p-4 space-y-4">
          <FormField label="Title" required>
            <Input value={editItemTitle} onChange={(e) => setEditItemTitle(e.target.value)} placeholder="e.g. Quiz 1" /> {/* Editable title field */}
          </FormField>
          <FormField label="Max Score" required>
            <Input type="number" value={editItemMaxScore} onChange={(e) => setEditItemMaxScore(Number(e.target.value))} placeholder="100" /> {/* Editable max score field */}
          </FormField>
          <FormField label="Category" required>
            <Select value={editItemCategoryId} onChange={(e) => setEditItemCategoryId(e.target.value)}> {/* Editable category dropdown */}
              <option value="">Select category</option>
              {categories.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
            </Select>
          </FormField>
          {updateItemMutation.isError && <Alert variant="danger">{(updateItemMutation.error as Error).message}</Alert>}
          <div className="flex gap-2">
            <Button onClick={handleSaveItem} disabled={updateItemMutation.isPending || !editItemTitle}>{updateItemMutation.isPending ? "Saving..." : "Save Changes"}</Button>
            <Button variant="outline" onClick={() => setEditingItem(null)}>Cancel</Button>
          </div>
        </div>
      </Drawer>

      {/* Edit Category Drawer */}
      <Drawer open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)} title="Edit Category">
        <div className="p-4 space-y-4">
          <FormField label="Name" required>
            <Input value={editCategoryName} onChange={(e) => setEditCategoryName(e.target.value)} placeholder="e.g. Quizzes" /> {/* Editable name field */}
          </FormField>
          <FormField label="Weight (%)">
            <Input type="number" value={editCategoryWeight ?? ""} onChange={(e) => setEditCategoryWeight(e.target.value ? Number(e.target.value) : undefined)} placeholder="30" /> {/* Editable weight field */}
          </FormField>
          {updateCategoryMutation.isError && <Alert variant="danger">{(updateCategoryMutation.error as Error).message}</Alert>}
          <div className="flex gap-2">
            <Button onClick={handleSaveCategory} disabled={updateCategoryMutation.isPending || !editCategoryName}>{updateCategoryMutation.isPending ? "Saving..." : "Save Changes"}</Button>
            <Button variant="outline" onClick={() => setEditingCategory(null)}>Cancel</Button>
          </div>
        </div>
      </Drawer>

      {/* Delete Confirmations */}
      <ConfirmDialog open={!!deletingGrade} onOpenChange={(open) => !open && setDeletingGrade(null)} title="Delete Grade" description="Are you sure you want to delete this grade entry? This action cannot be undone." confirmLabel="Delete" cancelLabel="Cancel" destructive onConfirm={confirmDeleteGrade} />
      <ConfirmDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)} title="Delete Grade Item" description={`Are you sure you want to delete "${deletingItem?.title}"? This will also delete all associated grades. This action cannot be undone.`} confirmLabel="Delete" cancelLabel="Cancel" destructive onConfirm={confirmDeleteItem} />
      <ConfirmDialog open={!!deletingCategory} onOpenChange={(open) => !open && setDeletingCategory(null)} title="Delete Category" description={`Are you sure you want to delete "${deletingCategory?.name}"? This will affect all grade items in this category. This action cannot be undone.`} confirmLabel="Delete" cancelLabel="Cancel" destructive onConfirm={confirmDeleteCategory} />
    </div>
  )
}
