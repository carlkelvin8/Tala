import { useMutation, useQuery } from "@tanstack/react-query" // Import useMutation for creating users and useQuery for fetching the user list
import { apiRequest } from "../lib/api" // Import the generic API request helper
import { ApiResponse } from "../types" // Import the generic API response wrapper type
import { Button } from "../components/ui/button" // Import the reusable Button component
import { Input } from "../components/ui/input" // Import the reusable Input component
import { Select } from "../components/ui/select" // Import the reusable Select component for the role dropdown
import { useForm } from "react-hook-form" // Import useForm for form state management and validation
import { z } from "zod" // Import zod for schema-based validation
import { zodResolver } from "@hookform/resolvers/zod" // Import the zod adapter for react-hook-form
import { useState } from "react" // Import useState for managing search and profile drawer state
import { PageHeader } from "../components/ui/page-header" // Import the PageHeader component
import { FormField } from "../components/ui/form-field" // Import the FormField wrapper for labeled inputs
import { Alert } from "../components/ui/alert" // Import the Alert component for error messages
import { EmptyState } from "../components/ui/empty-state" // Import the EmptyState component for empty list state
import { StatusBadge } from "../components/ui/status-badge" // Import the StatusBadge for active/inactive status display
import { toast } from "sonner" // Import toast for notifications
import { FormSection } from "../components/ui/form-section" // Import the FormSection wrapper for the create form
import { SectionCard } from "../components/ui/section-card" // Import the SectionCard wrapper for the list section
import { DataToolbar } from "../components/ui/data-toolbar" // Import the DataToolbar wrapper for the search input
import { ResponsiveTableCards } from "../components/ui/responsive-table-cards" // Import the responsive table/card component
import { LoadingSkeleton } from "../components/ui/loading-skeleton" // Import the loading skeleton
import { Eye } from "lucide-react" // Import the Eye icon for the view profile button
import { StudentProfileDrawer } from "../components/StudentProfileDrawer" // Import the profile drawer component

// Zod validation schema for the user creation form
const schema = z.object({
  email: z.string().email(), // Email must be a valid email format
  password: z.string().min(8), // Password must be at least 8 characters
  role: z.enum(["ADMIN", "IMPLEMENTOR", "CADET_OFFICER", "STUDENT"]), // Role must be one of the valid role values
  firstName: z.string().min(1), // First name must not be empty
  lastName: z.string().min(1) // Last name must not be empty
})

type FormValues = z.infer<typeof schema> // Derive the TypeScript type from the zod schema

// The user management page component (admin only)
export function UsersPage() {
  const [search, setSearch] = useState("") // State for the search query string
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null) // State for the user ID whose profile drawer is open (null = closed)
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { role: "STUDENT" } }) // Initialize the form with zod validation and STUDENT as the default role
  const usersQuery = useQuery({ // Fetch the list of users, re-fetching when the search query changes
    queryKey: ["users", search], // Cache key includes the search string
    queryFn: () => apiRequest<ApiResponse<any[]>>(`/api/users?search=${encodeURIComponent(search)}`), // Fetch users with the search query URL-encoded
    refetchInterval: 5000 // Auto-refetch every 5 seconds
  })

  const mutation = useMutation({ // Mutation for creating a new user
    mutationFn: (values: FormValues) =>
      apiRequest<ApiResponse<any>>("/api/users", { method: "POST", body: JSON.stringify(values) }), // POST the form values to the users endpoint
    onSuccess: () => {
      usersQuery.refetch() // Refresh the users list after creation
      toast.success("User created") // Show success notification
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to create user") // Show error notification
    }
  })

  const onSubmit = form.handleSubmit(async (values) => { // Form submit handler (runs validation first)
    await mutation.mutateAsync(values) // Trigger the create mutation
    form.reset({ email: "", password: "", firstName: "", lastName: "", role: "STUDENT" }) // Reset the form to default values after successful creation
  })

  const rows = usersQuery.data?.data ?? [] // Extract the users array, defaulting to empty array
  const columns = [ // Column definitions for the responsive table
    {
      header: "Email", // Column header
      cell: (user: any) => ( // Render the user's email with a view profile button
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-900">{user.email}</span> {/* User email in bold dark text */}
          <button
            onClick={() => setSelectedUserId(user.id)} // Open the profile drawer for this user
            className="text-primary-600 hover:text-primary-700" // Primary color button that darkens on hover
            title="View Profile" // Tooltip text
          >
            <Eye className="h-4 w-4" /> {/* Eye icon for viewing the profile */}
          </button>
        </div>
      )
    },
    {
      header: "Role", // Column header
      cell: (user: any) => user.role // Render the user's role string
    },
    {
      header: "Status", // Column header
      cell: (user: any) => <StatusBadge status={user.isActive ? "ACTIVE" : "INACTIVE"} /> // Render active/inactive as a colored status badge
    }
  ]

  return (
    <div className="space-y-6"> {/* Vertical stack with spacing between sections */}
      <PageHeader title="User Management" description="Create and manage staff and student accounts" /> {/* Page title and description */}
      <FormSection title="Create User" description="Assign the correct role and details"> {/* Form section wrapper */}
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}> {/* Two-column grid form */}
          <FormField label="Email" required error={form.formState.errors.email?.message}> {/* Email field with validation error */}
            <Input placeholder="user@school.edu" {...form.register("email")} /> {/* Email input registered with react-hook-form */}
          </FormField>
          <FormField label="Password" required error={form.formState.errors.password?.message}> {/* Password field with validation error */}
            <Input type="password" placeholder="••••••••" {...form.register("password")} /> {/* Password input registered with react-hook-form */}
          </FormField>
          <FormField label="First name" required error={form.formState.errors.firstName?.message}> {/* First name field with validation error */}
            <Input placeholder="Juan" {...form.register("firstName")} /> {/* First name input registered with react-hook-form */}
          </FormField>
          <FormField label="Last name" required error={form.formState.errors.lastName?.message}> {/* Last name field with validation error */}
            <Input placeholder="Dela Cruz" {...form.register("lastName")} /> {/* Last name input registered with react-hook-form */}
          </FormField>
          <FormField label="Role" required> {/* Role field */}
            <Select {...form.register("role")}> {/* Role dropdown registered with react-hook-form */}
              <option value="STUDENT">Student</option> {/* Student role option */}
              <option value="IMPLEMENTOR">Implementor</option> {/* Implementor role option */}
              <option value="CADET_OFFICER">Cadet Officer</option> {/* Cadet Officer role option */}
              <option value="ADMIN">Admin</option> {/* Admin role option */}
            </Select>
          </FormField>
          {mutation.isError && <Alert variant="danger" className="md:col-span-2">{(mutation.error as Error).message}</Alert>} {/* Error alert spanning both columns */}
          <div className="md:col-span-2"> {/* Submit button spanning both columns */}
            <Button type="submit" disabled={mutation.isPending}> {/* Submit button, disabled while creating */}
              {mutation.isPending ? "Saving..." : "Create"} {/* Loading text while creating */}
            </Button>
          </div>
        </form>
      </FormSection>
      <SectionCard title="Users" description="Active accounts across the system"> {/* Card wrapper for the users list */}
        <div className="space-y-4"> {/* Vertical stack with spacing between toolbar and table */}
          <DataToolbar> {/* Toolbar wrapper for the search input */}
            <Input placeholder="Search by email" value={search} onChange={(event) => setSearch(event.target.value)} /> {/* Search input that updates the search state */}
          </DataToolbar>
          {usersQuery.isError && <Alert variant="danger">Unable to load users.</Alert>} {/* Error alert if fetch failed */}
          {usersQuery.isLoading ? ( // Show loading skeleton while fetching
            <LoadingSkeleton rows={3} columns={3} /> // Skeleton matching the table structure
          ) : rows.length === 0 ? ( // Show empty state if no users found
            <EmptyState title="No users found" description="Try adjusting your search query." />
          ) : (
            <ResponsiveTableCards
              data={rows} // Pass the users array as data
              columns={columns} // Pass the column definitions
              rowKey={(user) => user.id} // Use the user ID as the React key
              renderTitle={(user) => user.email} // Use the user's email as the card title on mobile
            />
          )}
        </div>
      </SectionCard>
      <StudentProfileDrawer userId={selectedUserId} onClose={() => setSelectedUserId(null)} /> {/* Profile drawer: open when selectedUserId is set, close by clearing it */}
    </div>
  )
}
