import { useMutation, useQuery } from "@tanstack/react-query" // Import useMutation for CRUD operations and useQuery for fetching sections
import { apiRequest } from "../lib/api" // Import the generic API request helper
import { ApiResponse } from "../types" // Import the generic API response wrapper type
import { Button } from "../components/ui/button" // Import the reusable Button component
import { Input } from "../components/ui/input" // Import the reusable Input component
import { useForm } from "react-hook-form" // Import useForm for form state management and validation
import { z } from "zod" // Import zod for schema-based validation
import { zodResolver } from "@hookform/resolvers/zod" // Import the zod adapter for react-hook-form
import { getStoredUser } from "../lib/auth" // Import the function to get the current user for role-based UI
import { PageHeader } from "../components/ui/page-header" // Import the PageHeader component
import { FormField } from "../components/ui/form-field" // Import the FormField wrapper for labeled inputs
import { Alert } from "../components/ui/alert" // Import the Alert component for error messages
import { EmptyState } from "../components/ui/empty-state" // Import the EmptyState component for empty list state
import { toast } from "sonner" // Import toast for notifications
import { FormSection } from "../components/ui/form-section" // Import the FormSection wrapper for the create form
import { SectionCard } from "../components/ui/section-card" // Import the SectionCard wrapper for the list section
import { ResponsiveTableCards } from "../components/ui/responsive-table-cards" // Import the responsive table/card component
import { LoadingSkeleton } from "../components/ui/loading-skeleton" // Import the loading skeleton
import { Badge } from "../components/ui/badge" // Import the Badge component for the section count badge
import { Drawer } from "../components/ui/drawer" // Import the Drawer component for the edit panel
import { ConfirmDialog } from "../components/ui/confirm-dialog" // Import the ConfirmDialog for delete confirmation
import { Users, Plus, Edit, Trash2 } from "lucide-react" // Import icons: Users for section items, Plus for create, Edit for edit, Trash2 for delete
import { useState } from "react" // Import useState for managing edit/delete state

// Zod validation schema for the section creation form
const schema = z.object({
  code: z.string().min(1, "Code is required"), // Section code must not be empty
  name: z.string().min(1, "Name is required") // Section name must not be empty
})

type FormValues = z.infer<typeof schema> // Derive the TypeScript type from the zod schema

// The sections management page component
export function SectionsPage() {
  const user = getStoredUser() // Get the current authenticated user for role-based UI
  const canManage = user?.role === "ADMIN" || user?.role === "IMPLEMENTOR" // Only admins and implementors can create/edit/delete sections
  const form = useForm<FormValues>({ resolver: zodResolver(schema) }) // Initialize the form with zod validation
  const [editingSection, setEditingSection] = useState<any | null>(null) // State for the section currently being edited
  const [deletingSection, setDeletingSection] = useState<any | null>(null) // State for the section pending deletion
  const [editCode, setEditCode] = useState("") // State for the edit form's code field value
  const [editName, setEditName] = useState("") // State for the edit form's name field value

  const sectionsQuery = useQuery({ // Fetch the list of sections
    queryKey: ["sections"], // Cache key for the sections list
    queryFn: () => apiRequest<ApiResponse<any[]>>("/api/sections"), // Fetch all sections from the API
    refetchInterval: 10000, // Auto-refetch every 10 seconds
    retry: false // Don't retry on failure
  })

  const mutation = useMutation({ // Mutation for creating a new section
    mutationFn: (values: FormValues) =>
      apiRequest<ApiResponse<any>>("/api/sections", { // POST to the sections endpoint
        method: "POST",
        body: JSON.stringify(values) // Send the form values as JSON
      }),
    onSuccess: () => {
      sectionsQuery.refetch() // Refresh the sections list after creation
      toast.success("Section created") // Show success notification
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to create section") // Show error notification
    }
  })

  const updateMutation = useMutation({ // Mutation for updating an existing section
    mutationFn: ({ id, code, name }: { id: string; code: string; name: string }) =>
      apiRequest<ApiResponse<any>>(`/api/sections/${id}`, { // PATCH to the specific section endpoint
        method: "PATCH",
        body: JSON.stringify({ code, name }) // Send the updated code and name
      }),
    onSuccess: () => {
      sectionsQuery.refetch() // Refresh the sections list after update
      toast.success("Section updated") // Show success notification
      setEditingSection(null) // Close the edit drawer
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Update failed") // Show error notification
    }
  })

  const deleteMutation = useMutation({ // Mutation for deleting a section
    mutationFn: (id: string) =>
      apiRequest<ApiResponse<any>>(`/api/sections/${id}`, { // DELETE to the specific section endpoint
        method: "DELETE"
      }),
    onSuccess: () => {
      sectionsQuery.refetch() // Refresh the sections list after deletion
      toast.success("Section deleted") // Show success notification
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Delete failed") // Show error notification
    }
  })

  const handleEdit = (section: any) => { // Handler to open the edit drawer for a specific section
    setEditingSection(section) // Set the section being edited
    setEditCode(section.code) // Pre-populate the edit code field
    setEditName(section.name) // Pre-populate the edit name field
  }

  const handleSaveEdit = () => { // Handler to save the edit form
    if (editingSection) { // Only proceed if a section is being edited
      updateMutation.mutate({ // Trigger the update mutation
        id: editingSection.id, // Pass the section's ID
        code: editCode, // Pass the updated code
        name: editName // Pass the updated name
      })
    }
  }

  const handleDelete = (section: any) => { // Handler to open the delete confirmation dialog
    setDeletingSection(section) // Set the section pending deletion
  }

  const confirmDelete = () => { // Handler called when the user confirms deletion
    if (deletingSection) { // Only proceed if a section is pending deletion
      deleteMutation.mutate(deletingSection.id) // Trigger the delete mutation
      setDeletingSection(null) // Close the confirmation dialog
    }
  }

  const onSubmit = form.handleSubmit(async (values) => { // Form submit handler for creating a new section
    await mutation.mutateAsync(values) // Trigger the create mutation
    form.reset() // Reset the form after successful creation
  })

  const sections = sectionsQuery.data?.data ?? [] // Extract the sections array, defaulting to empty array
  const columns = [ // Column definitions for the responsive table
    {
      header: "Code", // Column header
      cell: (section: any) => ( // Render the section code with a users icon
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary-600" /> {/* Users icon in primary color */}
          <span className="font-medium text-slate-900">{section.code}</span> {/* Section code in bold dark text */}
        </div>
      )
    },
    {
      header: "Name", // Column header
      cell: (section: any) => section.name // Render the section name
    },
    {
      header: "Created", // Column header
      cell: (section: any) =>
        new Date(section.createdAt).toLocaleDateString(undefined, { // Format the creation date
          year: "numeric",
          month: "short",
          day: "numeric"
        })
    },
    {
      header: "Actions", // Column header for action buttons
      cell: (section: any) => { // Render edit and delete buttons
        if (!canManage) return null // Don't render actions for non-managers
        return (
          <div className="flex gap-2"> {/* Row of action buttons */}
            <Button size="sm" variant="outline" onClick={() => handleEdit(section)}> {/* Edit button */}
              <Edit className="h-4 w-4 mr-1" /> {/* Edit icon */}
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDelete(section)} // Open delete confirmation
              disabled={deleteMutation.isPending} // Disable while a delete is in progress
              className="text-red-600 hover:text-red-700 hover:bg-red-50" // Red styling for destructive action
            >
              <Trash2 className="h-4 w-4 mr-1" /> {/* Trash icon */}
              Delete
            </Button>
          </div>
        )
      }
    }
  ]

  return (
    <div className="space-y-6"> {/* Vertical stack with spacing between sections */}
      <PageHeader
        title="Sections"
        description="Manage class sections and student groups"
        actions={ // Badge showing the total number of sections
          <Badge variant="outline" className="flex items-center gap-1 text-xs">
            <Users className="h-3 w-3" /> {/* Small users icon */}
            <span>{sections.length} sections</span> {/* Dynamic count of sections */}
          </Badge>
        }
      />

      {canManage && ( // Only show the create form for admins and implementors
        <FormSection title="Create Section" description="Add a new class section to the system">
          <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}> {/* Two-column grid form */}
            <FormField label="Code" required error={form.formState.errors.code?.message}> {/* Code field with validation error */}
              <Input placeholder="e.g. SEC-1A" {...form.register("code")} /> {/* Code input registered with react-hook-form */}
            </FormField>
            <FormField label="Name" required error={form.formState.errors.name?.message}> {/* Name field with validation error */}
              <Input placeholder="e.g. Section 1-A" {...form.register("name")} /> {/* Name input registered with react-hook-form */}
            </FormField>
            {mutation.isError && ( // Show error alert if creation failed
              <Alert variant="danger" className="md:col-span-2"> {/* Error alert spanning both columns */}
                {(mutation.error as Error).message}
              </Alert>
            )}
            <div className="md:col-span-2"> {/* Submit button spanning both columns */}
              <Button type="submit" disabled={mutation.isPending}> {/* Submit button, disabled while creating */}
                <Plus className="h-4 w-4 mr-1" /> {/* Plus icon */}
                {mutation.isPending ? "Creating..." : "Create Section"} {/* Loading text while creating */}
              </Button>
            </div>
          </form>
        </FormSection>
      )}

      <SectionCard title="All Sections" description="Class sections in the system"> {/* Card wrapper for the sections list */}
        {sectionsQuery.isError && ( // Show error alert if fetch failed
          <Alert variant="danger">
            {(sectionsQuery.error as Error).message === "Unauthorized"
              ? "Please log out and log back in to refresh your session." // Specific message for auth errors
              : "Unable to load sections."} {/* Generic error message */}
          </Alert>
        )}
        {sectionsQuery.isLoading ? ( // Show loading skeleton while fetching
          <LoadingSkeleton rows={3} columns={3} /> // Skeleton matching the table structure
        ) : sections.length === 0 ? ( // Show empty state if no sections exist
          <EmptyState
            title="No sections yet"
            description={
              canManage
                ? "Create your first section to organize students." // Message for managers
                : "No sections have been created yet." // Message for non-managers
            }
          />
        ) : (
          <ResponsiveTableCards
            data={sections} // Pass the sections array as data
            columns={columns} // Pass the column definitions
            rowKey={(section) => section.id} // Use the section ID as the React key
            renderTitle={(section) => section.code} // Use the section code as the card title on mobile
          />
        )}
      </SectionCard>

      {/* Edit Section Drawer */}
      <Drawer
        open={!!editingSection} // Open when a section is being edited
        onOpenChange={(open) => !open && setEditingSection(null)} // Close by clearing the editing state
        title="Edit Section" // Drawer title
      >
        <div className="p-4 space-y-4"> {/* Drawer content with padding and spacing */}
          <FormField label="Code" required> {/* Code field in the edit form */}
            <Input
              value={editCode} // Controlled input value
              onChange={(e) => setEditCode(e.target.value)} // Update edit code state on change
              placeholder="e.g. SEC-1A" // Placeholder text
            />
          </FormField>

          <FormField label="Name" required> {/* Name field in the edit form */}
            <Input
              value={editName} // Controlled input value
              onChange={(e) => setEditName(e.target.value)} // Update edit name state on change
              placeholder="e.g. Section 1-A" // Placeholder text
            />
          </FormField>

          {updateMutation.isError && ( // Show error alert if update failed
            <Alert variant="danger">
              {(updateMutation.error as Error).message}
            </Alert>
          )}

          <div className="flex gap-2"> {/* Row of action buttons */}
            <Button
              onClick={handleSaveEdit} // Save the edit on click
              disabled={updateMutation.isPending || !editCode || !editName} // Disable if saving or required fields are empty
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"} {/* Loading text while saving */}
            </Button>
            <Button variant="outline" onClick={() => setEditingSection(null)}> {/* Cancel button closes the drawer */}
              Cancel
            </Button>
          </div>
        </div>
      </Drawer>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={!!deletingSection} // Open when a section is pending deletion
        onOpenChange={(open) => !open && setDeletingSection(null)} // Close by clearing the deleting state
        title="Delete Section" // Dialog title
        description={`Are you sure you want to delete "${deletingSection?.code}"? This action cannot be undone.`} // Dynamic description with the section code
        confirmLabel="Delete" // Confirm button label
        cancelLabel="Cancel" // Cancel button label
        destructive // Style the confirm button as destructive (red)
        onConfirm={confirmDelete} // Call the confirm handler when confirmed
      />
    </div>
  )
}
