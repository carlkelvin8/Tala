import { useMutation, useQuery } from "@tanstack/react-query" // Import useMutation for create/update/delete and useQuery for fetching flights
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
import { Badge } from "../components/ui/badge" // Import the Badge component for the flight count badge
import { Drawer } from "../components/ui/drawer" // Import the Drawer component for the edit panel
import { ConfirmDialog } from "../components/ui/confirm-dialog" // Import the ConfirmDialog for delete confirmation
import { Plane, Plus, Edit, Trash2 } from "lucide-react" // Import icons: Plane for flight items, Plus for create, Edit for edit, Trash2 for delete
import { useState } from "react" // Import useState for managing edit/delete state

// Zod validation schema for the flight creation form
const schema = z.object({
  code: z.string().min(1, "Code is required"), // Flight code must not be empty
  name: z.string().min(1, "Name is required") // Flight name must not be empty
})

type FormValues = z.infer<typeof schema> // Derive the TypeScript type from the zod schema

// The flights management page component
export function FlightsPage() {
  const user = getStoredUser() // Get the current authenticated user for role-based UI
  const canManage = user?.role === "ADMIN" || user?.role === "CADET_OFFICER" // Only admins and cadet officers can create/edit/delete flights
  const form = useForm<FormValues>({ resolver: zodResolver(schema) }) // Initialize the form with zod validation
  const [editingFlight, setEditingFlight] = useState<any | null>(null) // State for the flight currently being edited (null = no edit drawer open)
  const [deletingFlight, setDeletingFlight] = useState<any | null>(null) // State for the flight pending deletion (null = no confirm dialog open)
  const [editCode, setEditCode] = useState("") // State for the edit form's code field value
  const [editName, setEditName] = useState("") // State for the edit form's name field value

  const flightsQuery = useQuery({ // Fetch the list of flights
    queryKey: ["flights"], // Cache key for the flights list
    queryFn: () => apiRequest<ApiResponse<any[]>>("/api/flights"), // Fetch all flights from the API
    refetchInterval: 10000, // Auto-refetch every 10 seconds
    retry: false // Don't retry on failure (show error immediately)
  })

  const mutation = useMutation({ // Mutation for creating a new flight
    mutationFn: (values: FormValues) =>
      apiRequest<ApiResponse<any>>("/api/flights", { // POST to the flights endpoint
        method: "POST",
        body: JSON.stringify(values) // Send the form values as JSON
      }),
    onSuccess: () => {
      flightsQuery.refetch() // Refresh the flights list after creation
      toast.success("Flight created") // Show success notification
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to create flight") // Show error notification
    }
  })

  const updateMutation = useMutation({ // Mutation for updating an existing flight
    mutationFn: ({ id, code, name }: { id: string; code: string; name: string }) =>
      apiRequest<ApiResponse<any>>(`/api/flights/${id}`, { // PATCH to the specific flight endpoint
        method: "PATCH",
        body: JSON.stringify({ code, name }) // Send the updated code and name
      }),
    onSuccess: () => {
      flightsQuery.refetch() // Refresh the flights list after update
      toast.success("Flight updated") // Show success notification
      setEditingFlight(null) // Close the edit drawer
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Update failed") // Show error notification
    }
  })

  const deleteMutation = useMutation({ // Mutation for deleting a flight
    mutationFn: (id: string) =>
      apiRequest<ApiResponse<any>>(`/api/flights/${id}`, { // DELETE to the specific flight endpoint
        method: "DELETE"
      }),
    onSuccess: () => {
      flightsQuery.refetch() // Refresh the flights list after deletion
      toast.success("Flight deleted") // Show success notification
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Delete failed") // Show error notification
    }
  })

  const handleEdit = (flight: any) => { // Handler to open the edit drawer for a specific flight
    setEditingFlight(flight) // Set the flight being edited
    setEditCode(flight.code) // Pre-populate the edit code field with the current value
    setEditName(flight.name) // Pre-populate the edit name field with the current value
  }

  const handleSaveEdit = () => { // Handler to save the edit form
    if (editingFlight) { // Only proceed if a flight is being edited
      updateMutation.mutate({ // Trigger the update mutation
        id: editingFlight.id, // Pass the flight's ID
        code: editCode, // Pass the updated code
        name: editName // Pass the updated name
      })
    }
  }

  const handleDelete = (flight: any) => { // Handler to open the delete confirmation dialog
    setDeletingFlight(flight) // Set the flight pending deletion
  }

  const confirmDelete = () => { // Handler called when the user confirms deletion
    if (deletingFlight) { // Only proceed if a flight is pending deletion
      deleteMutation.mutate(deletingFlight.id) // Trigger the delete mutation with the flight's ID
      setDeletingFlight(null) // Close the confirmation dialog
    }
  }

  const onSubmit = form.handleSubmit(async (values) => { // Form submit handler for creating a new flight
    await mutation.mutateAsync(values) // Trigger the create mutation
    form.reset() // Reset the form after successful creation
  })

  const flights = flightsQuery.data?.data ?? [] // Extract the flights array, defaulting to empty array
  const columns = [ // Column definitions for the responsive table
    {
      header: "Code", // Column header
      cell: (flight: any) => ( // Render the flight code with a plane icon
        <div className="flex items-center gap-2">
          <Plane className="h-4 w-4 text-primary-600" /> {/* Plane icon in primary color */}
          <span className="font-medium text-slate-900">{flight.code}</span> {/* Flight code in bold dark text */}
        </div>
      )
    },
    {
      header: "Name", // Column header
      cell: (flight: any) => flight.name // Render the flight name
    },
    {
      header: "Created", // Column header
      cell: (flight: any) =>
        new Date(flight.createdAt).toLocaleDateString(undefined, { // Format the creation date
          year: "numeric",
          month: "short",
          day: "numeric"
        })
    },
    {
      header: "Actions", // Column header for action buttons
      cell: (flight: any) => { // Render edit and delete buttons
        if (!canManage) return null // Don't render actions for non-managers
        return (
          <div className="flex gap-2"> {/* Row of action buttons */}
            <Button size="sm" variant="outline" onClick={() => handleEdit(flight)}> {/* Edit button */}
              <Edit className="h-4 w-4 mr-1" /> {/* Edit icon */}
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDelete(flight)} // Open delete confirmation
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
        title="Flights"
        description="Manage flight groups and assignments"
        actions={ // Badge showing the total number of flights
          <Badge variant="outline" className="flex items-center gap-1 text-xs">
            <Plane className="h-3 w-3" /> {/* Small plane icon */}
            <span>{flights.length} flights</span> {/* Dynamic count of flights */}
          </Badge>
        }
      />

      {canManage && ( // Only show the create form for admins and cadet officers
        <FormSection title="Create Flight" description="Add a new flight group to the system">
          <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}> {/* Two-column grid form */}
            <FormField label="Code" required error={form.formState.errors.code?.message}> {/* Code field with validation error */}
              <Input placeholder="e.g. FLT-A" {...form.register("code")} /> {/* Code input registered with react-hook-form */}
            </FormField>
            <FormField label="Name" required error={form.formState.errors.name?.message}> {/* Name field with validation error */}
              <Input placeholder="e.g. Alpha Flight" {...form.register("name")} /> {/* Name input registered with react-hook-form */}
            </FormField>
            {mutation.isError && ( // Show error alert if creation failed
              <Alert variant="danger" className="md:col-span-2"> {/* Error alert spanning both columns */}
                {(mutation.error as Error).message}
              </Alert>
            )}
            <div className="md:col-span-2"> {/* Submit button spanning both columns */}
              <Button type="submit" disabled={mutation.isPending}> {/* Submit button, disabled while creating */}
                <Plus className="h-4 w-4 mr-1" /> {/* Plus icon */}
                {mutation.isPending ? "Creating..." : "Create Flight"} {/* Loading text while creating */}
              </Button>
            </div>
          </form>
        </FormSection>
      )}

      <SectionCard title="All Flights" description="Flight groups in the system"> {/* Card wrapper for the flights list */}
        {flightsQuery.isError && ( // Show error alert if fetch failed
          <Alert variant="danger">
            {(flightsQuery.error as Error).message === "Unauthorized"
              ? "Please log out and log back in to refresh your session." // Specific message for auth errors
              : "Unable to load flights."} {/* Generic error message */}
          </Alert>
        )}
        {flightsQuery.isLoading ? ( // Show loading skeleton while fetching
          <LoadingSkeleton rows={3} columns={3} /> // Skeleton matching the table structure
        ) : flights.length === 0 ? ( // Show empty state if no flights exist
          <EmptyState
            title="No flights yet"
            description={
              canManage
                ? "Create your first flight group to organize students." // Message for managers
                : "No flight groups have been created yet." // Message for non-managers
            }
          />
        ) : (
          <ResponsiveTableCards
            data={flights} // Pass the flights array as data
            columns={columns} // Pass the column definitions
            rowKey={(flight) => flight.id} // Use the flight ID as the React key
            renderTitle={(flight) => flight.code} // Use the flight code as the card title on mobile
          />
        )}
      </SectionCard>

      <Drawer // Edit flight drawer
        open={!!editingFlight} // Open when a flight is being edited
        onOpenChange={(open) => !open && setEditingFlight(null)} // Close the drawer by clearing the editing state
        title="Edit Flight" // Drawer title
      >
        <div className="p-4 space-y-4"> {/* Drawer content with padding and spacing */}
          <FormField label="Code" required> {/* Code field in the edit form */}
            <Input
              value={editCode} // Controlled input value
              onChange={(e) => setEditCode(e.target.value)} // Update edit code state on change
              placeholder="e.g. FLT-A" // Placeholder text
            />
          </FormField>
          <FormField label="Name" required> {/* Name field in the edit form */}
            <Input
              value={editName} // Controlled input value
              onChange={(e) => setEditName(e.target.value)} // Update edit name state on change
              placeholder="e.g. Alpha Flight" // Placeholder text
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
              disabled={updateMutation.isPending || !editCode || !editName} // Disable if saving or if required fields are empty
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"} {/* Loading text while saving */}
            </Button>
            <Button variant="outline" onClick={() => setEditingFlight(null)}> {/* Cancel button closes the drawer */}
              Cancel
            </Button>
          </div>
        </div>
      </Drawer>

      <ConfirmDialog // Delete confirmation dialog
        open={!!deletingFlight} // Open when a flight is pending deletion
        onOpenChange={(open) => !open && setDeletingFlight(null)} // Close by clearing the deleting state
        title="Delete Flight" // Dialog title
        description={`Are you sure you want to delete "${deletingFlight?.name}"? This action cannot be undone.`} // Dynamic description with the flight name
        confirmLabel="Delete" // Confirm button label
        cancelLabel="Cancel" // Cancel button label
        destructive // Style the confirm button as destructive (red)
        onConfirm={confirmDelete} // Call the confirm handler when confirmed
      />
    </div>
  )
}
