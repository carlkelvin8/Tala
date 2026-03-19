import { useMutation, useQuery } from "@tanstack/react-query" // Import useMutation for CRUD operations and useQuery for fetching materials
import { apiRequest } from "../lib/api" // Import the generic API request helper
import { ApiResponse } from "../types" // Import the generic API response wrapper type
import { Input } from "../components/ui/input" // Import the reusable Input component
import { Textarea } from "../components/ui/textarea" // Import the Textarea component for the description field
import { Button } from "../components/ui/button" // Import the reusable Button component
import { Select } from "../components/ui/select" // Import the Select component for the category dropdown
import { getStoredUser, getAccessToken } from "../lib/auth" // Import auth utilities: get current user and access token for file uploads
import { useForm } from "react-hook-form" // Import useForm for form state management and validation
import { z } from "zod" // Import zod for schema-based validation
import { zodResolver } from "@hookform/resolvers/zod" // Import the zod adapter for react-hook-form
import { PageHeader } from "../components/ui/page-header" // Import the PageHeader component
import { FormField } from "../components/ui/form-field" // Import the FormField wrapper for labeled inputs
import { Alert } from "../components/ui/alert" // Import the Alert component for error messages
import { EmptyState } from "../components/ui/empty-state" // Import the EmptyState component for empty list state
import { toast } from "sonner" // Import toast for notifications
import { FormSection } from "../components/ui/form-section" // Import the FormSection wrapper for the create form
import { SectionCard } from "../components/ui/section-card" // Import the SectionCard wrapper for the list section
import { ResponsiveTableCards } from "../components/ui/responsive-table-cards" // Import the responsive table/card component
import { LoadingSkeleton } from "../components/ui/loading-skeleton" // Import the loading skeleton
import { getFullName, getApiFileUrl } from "../lib/display" // Import display utilities: getFullName for creator name, getApiFileUrl for file URLs
import { useRef, useState } from "react" // Import useRef for file input refs and useState for local state
import { Drawer } from "../components/ui/drawer" // Import the Drawer component for the edit panel
import { ConfirmDialog } from "../components/ui/confirm-dialog" // Import the ConfirmDialog for delete confirmation
import { Paperclip, X, FileText, ExternalLink, Edit, Trash2, Eye } from "lucide-react" // Import icons for the UI

// Zod validation schema for the material creation form
const schema = z.object({
  title: z.string().min(1, "Title is required"), // Title must not be empty
  description: z.string().optional(), // Description is optional
  category: z.enum(["MODULE", "LECTURE", "ANNOUNCEMENT", "ACTIVITY"]), // Category must be one of the valid values
})
type FormValues = z.infer<typeof schema> // Derive the TypeScript type from the zod schema

// Map of category values to Tailwind color classes for the category badge
const categoryColors: Record<string, string> = {
  MODULE:       "bg-violet-50 text-violet-700", // Violet badge for modules
  LECTURE:      "bg-sky-50 text-sky-700", // Sky blue badge for lectures
  ANNOUNCEMENT: "bg-amber-50 text-amber-700", // Amber badge for announcements
  ACTIVITY:     "bg-emerald-50 text-emerald-700", // Emerald badge for activities
}

// The learning materials management page component
export function MaterialsPage() {
  const user = getStoredUser() // Get the current authenticated user for role-based UI
  const canManage = user?.role !== "STUDENT" // Students can only view materials, not create/edit/delete
  const fileInputRef = useRef<HTMLInputElement>(null) // Ref to the hidden file input for the create form
  const editFileInputRef = useRef<HTMLInputElement>(null) // Ref to the hidden file input for the edit form
  const [selectedFile, setSelectedFile] = useState<File | null>(null) // State for the selected file in the create form
  const [isUploading, setIsUploading] = useState(false) // State to track whether a file upload is in progress
  const [editingMaterial, setEditingMaterial] = useState<any | null>(null) // State for the material currently being edited
  const [deletingMaterial, setDeletingMaterial] = useState<any | null>(null) // State for the material pending deletion
  const [editTitle, setEditTitle] = useState("") // State for the edit form's title field
  const [editDescription, setEditDescription] = useState("") // State for the edit form's description field
  const [editCategory, setEditCategory] = useState<string>("MODULE") // State for the edit form's category field
  const [editFile, setEditFile] = useState<File | null>(null) // State for the new file selected in the edit form
  const [editFileUrl, setEditFileUrl] = useState<string | null>(null) // State for the existing file URL in the edit form

  const form = useForm<FormValues>({ // Initialize the form with zod validation and MODULE as the default category
    resolver: zodResolver(schema),
    defaultValues: { category: "MODULE" },
  })

  const materialsQuery = useQuery({ // Fetch the list of materials
    queryKey: ["materials"], // Cache key for the materials list
    queryFn: () => apiRequest<ApiResponse<any[]>>("/api/materials"), // Fetch all materials from the API
    refetchInterval: 5000 // Auto-refetch every 5 seconds
  })

  const mutation = useMutation({ // Mutation for creating a new material
    mutationFn: (values: FormValues & { fileUrl?: string }) => // Include optional fileUrl from the upload step
      apiRequest<ApiResponse<any>>("/api/materials", { // POST to the materials endpoint
        method: "POST",
        body: JSON.stringify(values), // Send the form values as JSON
      }),
    onSuccess: () => {
      materialsQuery.refetch() // Refresh the materials list after creation
      toast.success("Material saved") // Show success notification
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to save material") // Show error notification
    },
  })

  const updateMutation = useMutation({ // Mutation for updating an existing material
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest<ApiResponse<any>>(`/api/materials/${id}`, { // PATCH to the specific material endpoint
        method: "PATCH",
        body: JSON.stringify(data), // Send the updated data as JSON
      }),
    onSuccess: () => {
      materialsQuery.refetch() // Refresh the materials list after update
      toast.success("Material updated") // Show success notification
      setEditingMaterial(null) // Close the edit drawer
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Update failed") // Show error notification
    },
  })

  const deleteMutation = useMutation({ // Mutation for deleting a material
    mutationFn: (id: string) =>
      apiRequest<ApiResponse<any>>(`/api/materials/${id}`, { // DELETE to the specific material endpoint
        method: "DELETE",
      }),
    onSuccess: () => {
      materialsQuery.refetch() // Refresh the materials list after deletion
      toast.success("Material deleted") // Show success notification
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Delete failed") // Show error notification
    },
  })

  const onSubmit = form.handleSubmit(async (values) => { // Form submit handler for creating a new material
    setIsUploading(true) // Set uploading state to show loading UI
    try {
      let fileUrl: string | undefined // Variable to hold the uploaded file URL
      if (selectedFile) { // Only upload if a file was selected
        const formData = new FormData() // Create a FormData object for the multipart upload
        formData.append("file", selectedFile) // Append the selected file to the form data
        const token = getAccessToken() // Get the JWT token for authentication
        const base = import.meta.env.VITE_API_URL ?? "" // Get the API base URL
        const res = await fetch(`${base}/api/materials/upload`, { // Upload the file to the materials upload endpoint
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {}, // Include the auth token if available
          body: formData, // Send the multipart form data
        })
        if (!res.ok) { // If the upload failed
          const json = await res.json() // Parse the error response
          throw new Error(json.message ?? "File upload failed") // Throw an error with the server's message
        }
        const json = await res.json() // Parse the successful upload response
        fileUrl = json.data?.fileUrl // Extract the uploaded file URL from the response
      }
      await mutation.mutateAsync({ ...values, fileUrl }) // Create the material record with the form values and optional file URL
      form.reset({ title: "", description: "", category: "MODULE" }) // Reset the form after successful creation
      setSelectedFile(null) // Clear the selected file
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit material") // Show error notification
    } finally {
      setIsUploading(false) // Always reset the uploading state
    }
  })

  const handleEdit = (material: any) => { // Handler to open the edit drawer for a specific material
    setEditingMaterial(material) // Set the material being edited
    setEditTitle(material.title) // Pre-populate the title field
    setEditDescription(material.description || "") // Pre-populate the description field
    setEditCategory(material.category) // Pre-populate the category field
    setEditFileUrl(material.fileUrl || null) // Pre-populate the existing file URL
    setEditFile(null) // Clear any previously selected new file
  }

  const handleSaveEdit = async () => { // Async handler to save the edit form
    if (!editingMaterial) return // Only proceed if a material is being edited
    setIsUploading(true) // Set uploading state
    try {
      let fileUrl = editFileUrl // Start with the existing file URL
      if (editFile) { // Only upload if a new file was selected
        const formData = new FormData() // Create a FormData object for the multipart upload
        formData.append("file", editFile) // Append the new file
        const token = getAccessToken() // Get the JWT token
        const base = import.meta.env.VITE_API_URL ?? "" // Get the API base URL
        const res = await fetch(`${base}/api/materials/upload`, { // Upload the new file
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {}, // Include auth token
          body: formData, // Send the multipart form data
        })
        if (!res.ok) { // If the upload failed
          const json = await res.json() // Parse the error response
          throw new Error(json.message ?? "File upload failed") // Throw an error
        }
        const json = await res.json() // Parse the successful upload response
        fileUrl = json.data?.fileUrl // Extract the new file URL
      }
      await updateMutation.mutateAsync({ // Update the material record
        id: editingMaterial.id, // Pass the material's ID
        data: { // Pass the updated data
          title: editTitle, // Updated title
          description: editDescription, // Updated description
          category: editCategory, // Updated category
          fileUrl, // Updated file URL (new or existing)
        },
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update material") // Show error notification
    } finally {
      setIsUploading(false) // Always reset the uploading state
    }
  }

  const handleDelete = (material: any) => { // Handler to open the delete confirmation dialog
    setDeletingMaterial(material) // Set the material pending deletion
  }

  const confirmDelete = () => { // Handler called when the user confirms deletion
    if (deletingMaterial) { // Only proceed if a material is pending deletion
      deleteMutation.mutate(deletingMaterial.id) // Trigger the delete mutation
      setDeletingMaterial(null) // Close the confirmation dialog
    }
  }

  const handleViewFile = (fileUrl: string) => { // Handler to open a material's file in a new tab
    const url = getApiFileUrl(fileUrl) // Convert the relative path to an absolute URL
    if (url) { // Only open if a valid URL was returned
      window.open(url, "_blank", "noopener,noreferrer") // Open in a new tab with security attributes
    }
  }

  const rows = materialsQuery.data?.data ?? [] // Extract the materials array, defaulting to empty array

  const columns = [ // Column definitions for the responsive table
    {
      header: "Title", // Column header
      cell: (m: any) => ( // Render the material title with an optional file icon
        <div className="flex items-center gap-2">
          {m.fileUrl && ( // Only show the file icon if a file is attached
            <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" /> // Blue file icon
          )}
          <span className="font-medium text-slate-900">{m.title}</span> // Material title in bold dark text
        </div>
      ),
    },
    {
      header: "Category", // Column header
      cell: (m: any) => ( // Render the category as a colored badge
        <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-semibold ${categoryColors[m.category] ?? "bg-slate-50 text-slate-600"}`}> {/* Apply category-specific colors */}
          {m.category} {/* Category value text */}
        </span>
      ),
    },
    {
      header: "Created By", // Column header
      cell: (m: any) => ( // Render the creator's name and email
        <div className="leading-tight">
          <p className="text-sm text-slate-800">{getFullName(m.createdBy)}</p> {/* Creator's full name using the display utility */}
          {m.createdBy?.email && ( // Only show email if available
            <p className="text-xs text-slate-400">{m.createdBy.email}</p> // Creator's email in muted text
          )}
        </div>
      ),
    },
    {
      header: "Date", // Column header
      cell: (m: any) =>
        m.createdAt
          ? new Date(m.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) // Format the creation date
          : "—", // Show em dash if no date
    },
    {
      header: "File", // Column header
      cell: (m: any) => ( // Render a view file button or "No file" text
        <div>
          {m.fileUrl ? ( // Only show the button if a file is attached
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleViewFile(m.fileUrl)} // Open the file in a new tab
              title="View or download file" // Tooltip text
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" // Blue styling for the file button
            >
              <ExternalLink className="h-4 w-4 mr-1" /> {/* External link icon */}
              View File
            </Button>
          ) : (
            <span className="text-xs text-slate-400">No file</span> // Show "No file" if no attachment
          )}
        </div>
      ),
    },
    ...(canManage ? [{ // Only add the actions column for non-student roles
      header: "Actions", // Column header
      cell: (m: any) => ( // Render edit and delete buttons
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => handleEdit(m)}> {/* Edit button */}
            <Edit className="h-4 w-4 mr-1" /> {/* Edit icon */}
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleDelete(m)} // Open delete confirmation
            disabled={deleteMutation.isPending} // Disable while a delete is in progress
            className="text-red-600 hover:text-red-700 hover:bg-red-50" // Red styling for destructive action
          >
            <Trash2 className="h-4 w-4 mr-1" /> {/* Trash icon */}
            Delete
          </Button>
        </div>
      ),
    }] : []), // Empty array if user is a student (no actions column)
  ]

  return (
    <div className="space-y-6"> {/* Vertical stack with spacing between sections */}
      <PageHeader title="Learning Materials" description="Publish, organize, and review NSTP learning resources" /> {/* Page title and description */}

      {user && user.role !== "STUDENT" && ( // Only show the create form for non-student roles
        <FormSection
          title="Upload Learning Material"
          description="Share modules, lectures, and activities with students"
        >
          <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}> {/* Two-column grid form */}
            <FormField label="Title" required error={form.formState.errors.title?.message} className="md:col-span-2"> {/* Title field spanning both columns */}
              <Input placeholder="e.g. NSTP Orientation Module 1" {...form.register("title")} /> {/* Title input registered with react-hook-form */}
            </FormField>

            <FormField label="Category" required> {/* Category field */}
              <Select {...form.register("category")}> {/* Category dropdown registered with react-hook-form */}
                <option value="MODULE">Module</option> {/* Module option */}
                <option value="LECTURE">Lecture</option> {/* Lecture option */}
                <option value="ANNOUNCEMENT">Announcement</option> {/* Announcement option */}
                <option value="ACTIVITY">Activity</option> {/* Activity option */}
              </Select>
            </FormField>

            <FormField label="Attachment" hint="PDF, Word, PowerPoint, image, or MP4"> {/* File attachment field */}
              <div
                className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-3.5 text-sm text-slate-500 transition-colors hover:border-slate-400 hover:bg-slate-50" // Dashed border dropzone-style button
                onClick={() => fileInputRef.current?.click()} // Trigger the hidden file input on click
              >
                {selectedFile ? ( // Show the selected file name if a file is chosen
                  <>
                    <FileText className="h-4 w-4 shrink-0 text-sky-500" /> {/* Blue file icon */}
                    <span className="flex-1 truncate text-slate-700">{selectedFile.name}</span> {/* File name, truncated if too long */}
                    <button
                      type="button" // Prevent form submission
                      className="text-slate-400 hover:text-red-500" // Red on hover for the remove button
                      onClick={(e) => { e.stopPropagation(); setSelectedFile(null) }} // Remove the selected file without triggering the file picker
                    >
                      <X className="h-4 w-4" /> {/* X icon to remove the file */}
                    </button>
                  </>
                ) : (
                  <>
                    <Paperclip className="h-4 w-4 shrink-0" /> {/* Paperclip icon when no file is selected */}
                    <span>Choose file…</span> {/* Placeholder text */}
                  </>
                )}
              </div>
              <input
                ref={fileInputRef} // Attach the ref for programmatic triggering
                type="file" // File input type
                className="hidden" // Hide the native file input
                accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4" // Restrict to allowed file types
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)} // Update the selected file state when a file is chosen
              />
            </FormField>

            <FormField label="Description" className="md:col-span-2"> {/* Description field spanning both columns */}
              <Textarea placeholder="Add a brief description for students" {...form.register("description")} /> {/* Textarea registered with react-hook-form */}
            </FormField>

            {mutation.isError && ( // Show error alert if creation failed
              <Alert variant="danger" className="md:col-span-2"> {/* Error alert spanning both columns */}
                {(mutation.error as Error).message}
              </Alert>
            )}

            <div className="md:col-span-2"> {/* Submit button spanning both columns */}
              <Button type="submit" disabled={mutation.isPending || isUploading}> {/* Disable while saving or uploading */}
                {isUploading ? "Uploading…" : mutation.isPending ? "Saving…" : "Save Material"} {/* Dynamic button text */}
              </Button>
            </div>
          </form>
        </FormSection>
      )}

      <SectionCard title="Materials" description="Latest uploads and announcements"> {/* Card wrapper for the materials list */}
        {materialsQuery.isError && <Alert variant="danger">Unable to load materials.</Alert>} {/* Error alert if fetch failed */}
        {materialsQuery.isLoading ? ( // Show loading skeleton while fetching
          <LoadingSkeleton rows={3} columns={4} /> // Skeleton matching the table structure
        ) : rows.length === 0 ? ( // Show empty state if no materials exist
          <EmptyState title="No materials yet" description="Upload a new learning resource to get started." />
        ) : (
          <ResponsiveTableCards
            data={rows} // Pass the materials array as data
            columns={columns} // Pass the column definitions
            rowKey={(m) => m.id} // Use the material ID as the React key
            renderTitle={(m) => m.title} // Use the material title as the card title on mobile
          />
        )}
      </SectionCard>

      <Drawer // Edit material drawer
        open={!!editingMaterial} // Open when a material is being edited
        onOpenChange={(open) => !open && setEditingMaterial(null)} // Close by clearing the editing state
        title="Edit Learning Material" // Drawer title
      >
        <div className="p-4 space-y-4"> {/* Drawer content with padding and spacing */}
          <FormField label="Title" required> {/* Title field in the edit form */}
            <Input
              value={editTitle} // Controlled input value
              onChange={(e) => setEditTitle(e.target.value)} // Update edit title state on change
              placeholder="e.g. NSTP Orientation Module 1" // Placeholder text
            />
          </FormField>

          <FormField label="Category" required> {/* Category field in the edit form */}
            <Select value={editCategory} onChange={(e) => setEditCategory(e.target.value)}> {/* Controlled select */}
              <option value="MODULE">Module</option> {/* Module option */}
              <option value="LECTURE">Lecture</option> {/* Lecture option */}
              <option value="ANNOUNCEMENT">Announcement</option> {/* Announcement option */}
              <option value="ACTIVITY">Activity</option> {/* Activity option */}
            </Select>
          </FormField>

          <FormField label="Attachment" hint="PDF, Word, PowerPoint, image, or MP4"> {/* File attachment field in the edit form */}
            <div
              className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-3.5 text-sm text-slate-500 transition-colors hover:border-slate-400 hover:bg-slate-50" // Dashed border dropzone-style button
              onClick={() => editFileInputRef.current?.click()} // Trigger the hidden file input on click
            >
              {editFile ? ( // Show the new file name if a new file is selected
                <>
                  <FileText className="h-4 w-4 shrink-0 text-sky-500" /> {/* Blue file icon */}
                  <span className="flex-1 truncate text-slate-700">{editFile.name}</span> {/* New file name */}
                  <button
                    type="button" // Prevent form submission
                    className="text-slate-400 hover:text-red-500" // Red on hover
                    onClick={(e) => { e.stopPropagation(); setEditFile(null) }} // Remove the new file selection
                  >
                    <X className="h-4 w-4" /> {/* X icon */}
                  </button>
                </>
              ) : editFileUrl ? ( // Show the existing file indicator if no new file is selected
                <>
                  <FileText className="h-4 w-4 shrink-0 text-sky-500" /> {/* Blue file icon */}
                  <span className="flex-1 truncate text-slate-700">Current file attached</span> {/* Existing file indicator */}
                  <button
                    type="button" // Prevent form submission
                    className="text-sky-600 hover:text-sky-700 text-xs" // Blue view button
                    onClick={(e) => { e.stopPropagation(); handleViewFile(editFileUrl) }} // View the existing file
                  >
                    View
                  </button>
                </>
              ) : (
                <>
                  <Paperclip className="h-4 w-4 shrink-0" /> {/* Paperclip icon when no file */}
                  <span>Choose file…</span> {/* Placeholder text */}
                </>
              )}
            </div>
            <input
              ref={editFileInputRef} // Attach the ref for programmatic triggering
              type="file" // File input type
              className="hidden" // Hide the native file input
              accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4" // Restrict to allowed file types
              onChange={(e) => setEditFile(e.target.files?.[0] ?? null)} // Update the edit file state when a file is chosen
            />
          </FormField>

          <FormField label="Description"> {/* Description field in the edit form */}
            <Textarea
              value={editDescription} // Controlled textarea value
              onChange={(e) => setEditDescription(e.target.value)} // Update edit description state on change
              placeholder="Add a brief description for students" // Placeholder text
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
              disabled={updateMutation.isPending || isUploading || !editTitle} // Disable if saving, uploading, or title is empty
            >
              {isUploading ? "Uploading..." : updateMutation.isPending ? "Saving..." : "Save Changes"} {/* Dynamic button text */}
            </Button>
            <Button variant="outline" onClick={() => setEditingMaterial(null)}> {/* Cancel button closes the drawer */}
              Cancel
            </Button>
          </div>
        </div>
      </Drawer>

      <ConfirmDialog // Delete confirmation dialog
        open={!!deletingMaterial} // Open when a material is pending deletion
        onOpenChange={(open) => !open && setDeletingMaterial(null)} // Close by clearing the deleting state
        title="Delete Material" // Dialog title
        description={`Are you sure you want to delete "${deletingMaterial?.title}"? This action cannot be undone.`} // Dynamic description with the material title
        confirmLabel="Delete" // Confirm button label
        cancelLabel="Cancel" // Cancel button label
        destructive // Style the confirm button as destructive (red)
        onConfirm={confirmDelete} // Call the confirm handler when confirmed
      />
    </div>
  )
}
