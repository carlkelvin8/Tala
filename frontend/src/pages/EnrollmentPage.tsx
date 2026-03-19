import { useMutation, useQuery } from "@tanstack/react-query" // Import useMutation for status/enrollment updates and useQuery for fetching data
import { apiRequest } from "../lib/api" // Import the generic API request helper
import { ApiResponse } from "../types" // Import the generic API response wrapper type
import { Button } from "../components/ui/button" // Import the reusable Button component
import { Select } from "../components/ui/select" // Import the reusable Select component for section/flight dropdowns
import { Alert } from "../components/ui/alert" // Import the Alert component for error messages
import { PageHeader } from "../components/ui/page-header" // Import the PageHeader component
import { EmptyState } from "../components/ui/empty-state" // Import the EmptyState component for empty list state
import { StatusBadge } from "../components/ui/status-badge" // Import the StatusBadge for enrollment status display
import { toast } from "sonner" // Import toast for notifications
import { SectionCard } from "../components/ui/section-card" // Import the SectionCard wrapper for the list section
import { ResponsiveTableCards } from "../components/ui/responsive-table-cards" // Import the responsive table/card component
import { LoadingSkeleton } from "../components/ui/loading-skeleton" // Import the loading skeleton
import { getStoredUser } from "../lib/auth" // Import the function to get the current user for role-based UI
import { Check, X, Eye, Edit } from "lucide-react" // Import icons: Check for approve, X for reject, Eye for view profile, Edit for edit
import { StudentProfileDrawer } from "../components/StudentProfileDrawer" // Import the profile drawer component
import { RefreshIndicator } from "../components/ui/refresh-indicator" // Import the refresh indicator for the page header
import { Drawer } from "../components/ui/drawer" // Import the Drawer component for the edit enrollment panel
import { FormField } from "../components/ui/form-field" // Import the FormField wrapper for labeled inputs
import { useState } from "react" // Import useState for managing drawer and selection state

// The enrollment management page component
export function EnrollmentPage() {
  const currentUser = getStoredUser() // Get the current authenticated user for role-based UI
  const canApprove = currentUser?.role === "ADMIN" || currentUser?.role === "IMPLEMENTOR" // Only admins and implementors can approve/reject enrollments
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null) // State for the user ID whose profile drawer is open
  const [editingEnrollment, setEditingEnrollment] = useState<any | null>(null) // State for the enrollment currently being edited
  const [selectedSection, setSelectedSection] = useState<string>("") // State for the selected section in the edit form
  const [selectedFlight, setSelectedFlight] = useState<string>("") // State for the selected flight in the edit form
  
  const enrollmentsQuery = useQuery({ // Fetch the list of enrollments
    queryKey: ["enrollments"], // Cache key for the enrollments list
    queryFn: () => apiRequest<ApiResponse<any[]>>("/api/enrollments"), // Fetch all enrollments from the API
    retry: false, // Don't retry on failure
    refetchInterval: 5000 // Auto-refetch every 5 seconds
  })

  const sectionsQuery = useQuery({ // Fetch the list of sections for the edit form dropdown
    queryKey: ["sections"], // Cache key for the sections list
    queryFn: () => apiRequest<ApiResponse<any[]>>("/api/sections"), // Fetch all sections from the API
    retry: false // Don't retry on failure
  })

  const flightsQuery = useQuery({ // Fetch the list of flights for the edit form dropdown
    queryKey: ["flights"], // Cache key for the flights list
    queryFn: () => apiRequest<ApiResponse<any[]>>("/api/flights"), // Fetch all flights from the API
    retry: false // Don't retry on failure
  })

  const updateStatusMutation = useMutation({ // Mutation for updating an enrollment's status (approve/reject)
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest<ApiResponse<any>>(`/api/enrollments/${id}/status`, { // PATCH to the enrollment status endpoint
        method: "PATCH",
        body: JSON.stringify({ status }) // Send the new status as JSON
      }),
    onSuccess: () => {
      enrollmentsQuery.refetch() // Refresh the enrollments list after status update
      toast.success("Enrollment status updated") // Show success notification
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Update failed") // Show error notification
    }
  })

  const updateEnrollmentMutation = useMutation({ // Mutation for updating an enrollment's section and flight assignment
    mutationFn: ({ id, sectionId, flightId }: { id: string; sectionId: string; flightId: string }) =>
      apiRequest<ApiResponse<any>>(`/api/enrollments/${id}`, { // PATCH to the enrollment endpoint
        method: "PATCH",
        body: JSON.stringify({ sectionId, flightId }) // Send the updated section and flight IDs
      }),
    onSuccess: () => {
      enrollmentsQuery.refetch() // Refresh the enrollments list after update
      toast.success("Enrollment updated") // Show success notification
      setEditingEnrollment(null) // Close the edit drawer
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Update failed") // Show error notification
    }
  })

  const handleEdit = (enrollment: any) => { // Handler to open the edit drawer for a specific enrollment
    setEditingEnrollment(enrollment) // Set the enrollment being edited
    setSelectedSection(enrollment.sectionId || "") // Pre-populate the section dropdown with the current value
    setSelectedFlight(enrollment.flightId || "") // Pre-populate the flight dropdown with the current value
  }

  const handleSaveEdit = () => { // Handler to save the edit form
    if (editingEnrollment) { // Only proceed if an enrollment is being edited
      updateEnrollmentMutation.mutate({ // Trigger the update mutation
        id: editingEnrollment.id, // Pass the enrollment's ID
        sectionId: selectedSection, // Pass the selected section ID
        flightId: selectedFlight // Pass the selected flight ID
      })
    }
  }

  const handleApprove = (id: string) => { // Handler to approve an enrollment
    updateStatusMutation.mutate({ id, status: "APPROVED" }) // Trigger the status update mutation with APPROVED status
  }

  const handleReject = (id: string) => { // Handler to reject an enrollment
    updateStatusMutation.mutate({ id, status: "REJECTED" }) // Trigger the status update mutation with REJECTED status
  }
  
  const rows = enrollmentsQuery.data?.data ?? [] // Extract the enrollments array, defaulting to empty array
  const sections = sectionsQuery.data?.data ?? [] // Extract the sections array for the edit form dropdown
  const flights = flightsQuery.data?.data ?? [] // Extract the flights array for the edit form dropdown
  
  const columns = [ // Column definitions for the responsive table
    {
      header: "Student", // Column header
      cell: (enrollment: any) => ( // Render the student's email with a view profile button
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-900">{enrollment.user?.email ?? "-"}</span> {/* Student email in bold dark text */}
          <button
            onClick={() => setSelectedUserId(enrollment.userId)} // Open the profile drawer for this student
            className="text-primary-600 hover:text-primary-700" // Primary color button
            title="View Profile" // Tooltip text
          >
            <Eye className="h-4 w-4" /> {/* Eye icon */}
          </button>
        </div>
      )
    },
    {
      header: "Status", // Column header
      cell: (enrollment: any) => <StatusBadge status={enrollment.status} /> // Render PENDING/APPROVED/REJECTED as a colored status badge
    },
    {
      header: "Section", // Column header
      cell: (enrollment: any) => enrollment.section?.code ?? "-" // Render the section code or "-" if not assigned
    },
    {
      header: "Flight", // Column header
      cell: (enrollment: any) => enrollment.flight?.code ?? "-" // Render the flight code or "-" if not assigned
    },
    {
      header: "Actions", // Column header for action buttons
      cell: (enrollment: any) => { // Render approve/reject/edit buttons based on status and role
        if (!canApprove) return null // Don't render actions for non-approvers
        return (
          <div className="flex gap-2"> {/* Row of action buttons */}
            {enrollment.status === "PENDING" && ( // Only show approve/reject for pending enrollments
              <>
                <Button
                  size="sm"
                  onClick={() => handleApprove(enrollment.id)} // Approve this enrollment
                  disabled={updateStatusMutation.isPending} // Disable while a status update is in progress
                  className="bg-green-600 hover:bg-green-700 text-white" // Green button for approve
                >
                  <Check className="h-4 w-4 mr-1" /> {/* Check icon */}
                  Approve
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleReject(enrollment.id)} // Reject this enrollment
                  disabled={updateStatusMutation.isPending} // Disable while a status update is in progress
                  className="bg-red-600 hover:bg-red-700 text-white" // Red button for reject
                >
                  <X className="h-4 w-4 mr-1" /> {/* X icon */}
                  Reject
                </Button>
              </>
            )}
            {enrollment.status === "APPROVED" && ( // Only show edit for approved enrollments
              <Button
                size="sm"
                onClick={() => handleEdit(enrollment)} // Open the edit drawer
                variant="outline" // Outline style for the secondary action
              >
                <Edit className="h-4 w-4 mr-1" /> {/* Edit icon */}
                Edit
              </Button>
            )}
          </div>
        )
      }
    }
  ]

  return (
    <div className="space-y-6"> {/* Vertical stack with spacing between sections */}
      <PageHeader 
        title="Enrollment" 
        description="Manage student enrollment records and assignments"
        actions={<RefreshIndicator isRefetching={enrollmentsQuery.isRefetching} />} // Show a refresh indicator when the query is refetching
      />
      <SectionCard title="Enrollments" description="Student enrollment requests and assignments"> {/* Card wrapper for the enrollments list */}
        {enrollmentsQuery.isError && ( // Show error alert if fetch failed
          <Alert variant="danger">
            {(enrollmentsQuery.error as Error).message === "Unauthorized" 
              ? "Please log in to view enrollments." // Specific message for auth errors
              : "Unable to load enrollments."} {/* Generic error message */}
          </Alert>
        )}
        {enrollmentsQuery.isLoading ? ( // Show loading skeleton while fetching
          <LoadingSkeleton rows={3} columns={4} /> // Skeleton matching the table structure
        ) : rows.length === 0 ? ( // Show empty state if no enrollments exist
          <EmptyState title="No enrollments yet" description="Create a new enrollment to see results here." />
        ) : (
          <ResponsiveTableCards
            data={rows} // Pass the enrollments array as data
            columns={columns} // Pass the column definitions
            rowKey={(enrollment) => enrollment.id} // Use the enrollment ID as the React key
            renderTitle={(enrollment) => enrollment.user?.email ?? "Student"} // Use the student's email as the card title on mobile
          />
        )}
      </SectionCard>
      <StudentProfileDrawer userId={selectedUserId} onClose={() => setSelectedUserId(null)} /> {/* Profile drawer: open when selectedUserId is set */}
      
      {/* Edit Enrollment Drawer */}
      <Drawer
        open={!!editingEnrollment} // Open when an enrollment is being edited
        onOpenChange={(open) => !open && setEditingEnrollment(null)} // Close by clearing the editing state
        title="Edit Enrollment" // Drawer title
      >
        <div className="p-4 space-y-4"> {/* Drawer content with padding and spacing */}
          <p className="text-sm text-slate-600"> {/* Description showing which student is being edited */}
            Assign section and flight for {editingEnrollment?.user?.email} {/* Dynamic student email */}
          </p>
          
          <FormField label="Section"> {/* Section assignment field */}
            <Select
              value={selectedSection} // Controlled select value
              onChange={(e) => setSelectedSection(e.target.value)} // Update selected section state on change
            >
              <option value="">No section</option> {/* Option to remove section assignment */}
              {sections.map((section: any) => ( // Render an option for each available section
                <option key={section.id} value={section.id}> {/* Use section ID as value */}
                  {section.code} - {section.name} {/* Display section code and name */}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Flight"> {/* Flight assignment field */}
            <Select
              value={selectedFlight} // Controlled select value
              onChange={(e) => setSelectedFlight(e.target.value)} // Update selected flight state on change
            >
              <option value="">No flight</option> {/* Option to remove flight assignment */}
              {flights.map((flight: any) => ( // Render an option for each available flight
                <option key={flight.id} value={flight.id}> {/* Use flight ID as value */}
                  {flight.code} - {flight.name} {/* Display flight code and name */}
                </option>
              ))}
            </Select>
          </FormField>

          {updateEnrollmentMutation.isError && ( // Show error alert if update failed
            <Alert variant="danger">
              {(updateEnrollmentMutation.error as Error).message}
            </Alert>
          )}

          <div className="flex gap-2"> {/* Row of action buttons */}
            <Button
              onClick={handleSaveEdit} // Save the edit on click
              disabled={updateEnrollmentMutation.isPending} // Disable while saving
            >
              {updateEnrollmentMutation.isPending ? "Saving..." : "Save Changes"} {/* Loading text while saving */}
            </Button>
            <Button
              variant="outline" // Outline style for the cancel button
              onClick={() => setEditingEnrollment(null)} // Close the drawer without saving
            >
              Cancel
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  )
}
