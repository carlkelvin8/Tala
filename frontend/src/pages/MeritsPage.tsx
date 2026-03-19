import { useMutation, useQuery } from "@tanstack/react-query" // Import useMutation for creating merit entries and useQuery for fetching the list
import { apiRequest } from "../lib/api" // Import the generic API request helper
import { ApiResponse } from "../types" // Import the generic API response wrapper type
import { Button } from "../components/ui/button" // Import the reusable Button component
import { Input } from "../components/ui/input" // Import the reusable Input component
import { Select } from "../components/ui/select" // Import the reusable Select component for the type dropdown
import { useForm } from "react-hook-form" // Import useForm for form state management and validation
import { z } from "zod" // Import zod for schema-based validation
import { zodResolver } from "@hookform/resolvers/zod" // Import the zod adapter for react-hook-form
import { getStoredUser } from "../lib/auth" // Import the function to get the current user for role-based UI
import { PageHeader } from "../components/ui/page-header" // Import the PageHeader component
import { FormField } from "../components/ui/form-field" // Import the FormField wrapper for labeled inputs
import { Alert } from "../components/ui/alert" // Import the Alert component for error messages
import { EmptyState } from "../components/ui/empty-state" // Import the EmptyState component for empty list state
import { StatusBadge } from "../components/ui/status-badge" // Import the StatusBadge for merit/demerit type display
import { toast } from "sonner" // Import toast for notifications
import { FormSection } from "../components/ui/form-section" // Import the FormSection wrapper for the create form
import { SectionCard } from "../components/ui/section-card" // Import the SectionCard wrapper for the list section
import { ResponsiveTableCards } from "../components/ui/responsive-table-cards" // Import the responsive table/card component
import { LoadingSkeleton } from "../components/ui/loading-skeleton" // Import the loading skeleton
import { useState } from "react" // Import useState for the student search state

// Zod validation schema for the merit/demerit creation form
const schema = z.object({
  studentId: z.string().uuid(), // Student ID must be a valid UUID
  type: z.enum(["MERIT", "DEMERIT"]), // Type must be either MERIT or DEMERIT
  points: z.coerce.number().int(), // Points must be an integer (coerce converts string input to number)
  reason: z.string().min(1) // Reason must not be empty
})

type FormValues = z.infer<typeof schema> // Derive the TypeScript type from the zod schema

// The merits and demerits management page component
export function MeritsPage() {
  const user = getStoredUser() // Get the current authenticated user for role-based UI rendering
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { type: "MERIT" } }) // Initialize the form with zod validation and MERIT as the default type
  const [studentSearch, setStudentSearch] = useState("") // State for the student search input value
  const meritsQuery = useQuery({ // Fetch the list of merit/demerit records
    queryKey: ["merits"], // Cache key for the merits list
    queryFn: () => apiRequest<ApiResponse<any[]>>("/api/merits"), // Fetch all merit records from the API
    refetchInterval: 5000 // Auto-refetch every 5 seconds to keep the list current
  })

  const studentsQuery = useQuery({ // Fetch matching students based on the search query
    queryKey: ["merit-students", studentSearch], // Cache key includes the search string
    queryFn: () =>
      apiRequest<ApiResponse<any[]>>(
        `/api/enrollments?search=${encodeURIComponent(studentSearch.trim())}` // Search enrollments by the trimmed search string
      ),
    enabled: studentSearch.trim().length >= 2 // Only run the query when at least 2 characters are typed
  })

  const mutation = useMutation({ // Set up the mutation for creating a new merit/demerit entry
    mutationFn: (values: FormValues) =>
      apiRequest<ApiResponse<any>>("/api/merits", { method: "POST", body: JSON.stringify(values) }), // POST the form values to the merits endpoint
    onSuccess: () => {
      meritsQuery.refetch() // Refresh the merits list after a successful creation
      toast.success("Merit entry saved") // Show success notification
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to save merit entry") // Show error notification
    }
  })

  const onSubmit = form.handleSubmit(async (values) => { // Form submit handler (runs validation first)
    await mutation.mutateAsync(values) // Trigger the creation mutation
    form.reset({ studentId: "", reason: "", points: 0, type: "MERIT" }) // Reset the form to default values after successful submission
  })
  const rows = meritsQuery.data?.data ?? [] // Extract the merit records array, defaulting to empty array
  const columns = [ // Column definitions for the responsive table
    {
      header: "Student", // Column header
      cell: (item: any) => <span className="font-medium text-slate-900">{item.student?.email ?? item.studentId}</span> // Show student email or ID as fallback
    },
    {
      header: "Type", // Column header
      cell: (item: any) => <StatusBadge status={item.type} /> // Render MERIT or DEMERIT as a colored status badge
    },
    {
      header: "Points", // Column header
      cell: (item: any) => item.points // Render the point value
    },
    {
      header: "Reason", // Column header
      cell: (item: any) => item.reason // Render the reason text
    }
  ]

  return (
    <div className="space-y-6"> {/* Vertical stack with spacing between sections */}
      <PageHeader title="Merits & Demerits" description="Record performance points and discipline notes" /> {/* Page title and description */}
      {user && user.role !== "STUDENT" && ( // Only show the create form for non-student roles
        <FormSection title="Assign Merit/Demerit" description="Track point-based performance changes"> {/* Form section wrapper */}
          <form className="grid gap-4 md:grid-cols-4" onSubmit={onSubmit}> {/* 4-column grid form */}
            <FormField label="Student" required error={form.formState.errors.studentId?.message}> {/* Student field with validation error display */}
              <div className="relative"> {/* Relative container for the dropdown positioning */}
                <Input
                  placeholder="Search by email or ID" // Placeholder text
                  value={studentSearch} // Controlled input value
                  onChange={(event) => setStudentSearch(event.target.value)} // Update search state on input change
                  autoComplete="off" // Disable browser autocomplete to avoid conflicts with the custom dropdown
                />
                <input type="hidden" {...form.register("studentId")} /> {/* Hidden input to store the selected student's UUID in the form */}
                {studentSearch.trim().length >= 2 && ( // Only show the dropdown when at least 2 characters are typed
                  <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg"> {/* Dropdown container positioned below the input */}
                    {studentsQuery.isLoading ? ( // Show loading state while searching
                      <div className="px-3 py-2 text-xs text-slate-500">Searching students...</div>
                    ) : studentsQuery.isError ? ( // Show error state if the search failed
                      <div className="px-3 py-2 text-xs text-red-500">Unable to search students.</div>
                    ) : (studentsQuery.data?.data ?? []).length === 0 ? ( // Show empty state if no matches found
                      <div className="px-3 py-2 text-xs text-slate-500">No matching students found.</div>
                    ) : (
                      <ul className="max-h-64 overflow-y-auto py-1 text-sm"> {/* Scrollable list of matching students */}
                        {(studentsQuery.data?.data ?? []).map((enrollment: any) => ( // Iterate over matching enrollments
                          <li
                            key={enrollment.id} // Use enrollment ID as React key
                            className="cursor-pointer px-3 py-2 hover:bg-slate-50" // Clickable list item with hover background
                            onMouseDown={(event) => { // Use onMouseDown instead of onClick to fire before the input's onBlur
                              event.preventDefault() // Prevent the input from losing focus before the value is set
                              form.setValue("studentId", enrollment.userId) // Set the hidden studentId field to the selected user's UUID
                              setStudentSearch(enrollment.user?.email ?? enrollment.userId) // Update the visible search input with the selected student's email
                            }}
                          >
                            <div className="font-medium text-slate-900">
                              {enrollment.user?.email ?? enrollment.userId} {/* Show student email or UUID */}
                            </div>
                            <div className="text-xs text-slate-500">
                              {enrollment.section?.code ?? "-"} · {enrollment.flight?.code ?? "-"} {/* Show section and flight codes */}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </FormField>
            <FormField label="Type" required> {/* Type field */}
              <Select {...form.register("type")}> {/* Dropdown registered with react-hook-form */}
                <option value="MERIT">Merit</option> {/* Merit option */}
                <option value="DEMERIT">Demerit</option> {/* Demerit option */}
              </Select>
            </FormField>
            <FormField label="Points" required error={form.formState.errors.points?.message}> {/* Points field with validation error */}
              <Input type="number" placeholder="0" {...form.register("points")} /> {/* Number input for points */}
            </FormField>
            <FormField label="Reason" required error={form.formState.errors.reason?.message}> {/* Reason field with validation error */}
              <Input placeholder="Add reason" {...form.register("reason")} /> {/* Text input for the reason */}
            </FormField>
            {mutation.isError && <Alert variant="danger" className="md:col-span-4">{(mutation.error as Error).message}</Alert>} {/* Error alert spanning all 4 columns */}
            <div className="md:col-span-4"> {/* Submit button spanning all 4 columns */}
              <Button type="submit" disabled={mutation.isPending}> {/* Submit button, disabled while saving */}
                {mutation.isPending ? "Saving..." : "Save"} {/* Show loading text while saving */}
              </Button>
            </div>
          </form>
        </FormSection>
      )}
      <SectionCard title="Merits/Demerits" description="Recent merit and demerit records"> {/* Card wrapper for the records list */}
        {meritsQuery.isError && <Alert variant="danger">Unable to load merit records.</Alert>} {/* Error alert if fetch failed */}
        {meritsQuery.isLoading ? ( // Show loading skeleton while fetching
          <LoadingSkeleton rows={3} columns={4} /> // Skeleton matching the table structure
        ) : rows.length === 0 ? ( // Show empty state if no records exist
          <EmptyState title="No merits logged" description="Assign a merit or demerit to see it here." />
        ) : (
          <ResponsiveTableCards
            data={rows} // Pass the merit records as data
            columns={columns} // Pass the column definitions
            rowKey={(item) => item.id} // Use the record ID as the React key
            renderTitle={(item) => item.student?.email ?? item.studentId} // Use student email as the card title on mobile
          />
        )}
      </SectionCard>
    </div>
  )
}
