import { useQuery } from "@tanstack/react-query" // Import useQuery for fetching the enrollment/student list
import { apiRequest } from "../lib/api" // Import the generic API request helper
import { ApiResponse } from "../types" // Import the generic API response wrapper type
import { Input } from "../components/ui/input" // Import the reusable Input component for the search field
import { useState } from "react" // Import useState for managing the search query state
import { PageHeader } from "../components/ui/page-header" // Import the PageHeader component for the page title and description
import { Alert } from "../components/ui/alert" // Import the Alert component for error messages
import { EmptyState } from "../components/ui/empty-state" // Import the EmptyState component for when no results are found
import { StatusBadge } from "../components/ui/status-badge" // Import the StatusBadge component for enrollment status display
import { SectionCard } from "../components/ui/section-card" // Import the SectionCard wrapper for the table section
import { DataToolbar } from "../components/ui/data-toolbar" // Import the DataToolbar wrapper for the search input
import { ResponsiveTableCards } from "../components/ui/responsive-table-cards" // Import the responsive table/card component for the student list
import { LoadingSkeleton } from "../components/ui/loading-skeleton" // Import the loading skeleton for the loading state

// The students directory page component
export function StudentsPage() {
  const [search, setSearch] = useState("") // State for the search query string, starts empty
  const query = useQuery({ // Fetch the list of enrollments, re-fetching when the search query changes
    queryKey: ["enrollments", search], // Cache key includes the search string so different searches are cached separately
    queryFn: () => apiRequest<ApiResponse<any[]>>(`/api/enrollments?search=${encodeURIComponent(search)}`) // Fetch enrollments with the search query URL-encoded
  })
  const rows = query.data?.data ?? [] // Extract the enrollment array from the response, defaulting to empty array
  const columns = [ // Column definitions for the responsive table
    {
      header: "Email", // Column header label
      cell: (enrollment: any) => <span className="font-medium text-slate-900">{enrollment.user?.email ?? "-"}</span> // Render the student's email in bold dark text, or "-" if not available
    },
    {
      header: "Status", // Column header label
      cell: (enrollment: any) => <StatusBadge status={enrollment.status} /> // Render the enrollment status as a colored badge
    },
    {
      header: "Section", // Column header label
      cell: (enrollment: any) => enrollment.section?.code ?? "-" // Render the section code or "-" if not assigned
    },
    {
      header: "Flight", // Column header label
      cell: (enrollment: any) => enrollment.flight?.code ?? "-" // Render the flight code or "-" if not assigned
    }
  ]

  return (
    <div className="space-y-6"> {/* Vertical stack with spacing between sections */}
      <PageHeader title="Students" description="Browse and filter enrolled learners" /> {/* Page title and description */}
      <SectionCard title="Enrollment Directory" description="Search by student email to narrow results"> {/* Card wrapper for the table section */}
        <div className="space-y-4"> {/* Vertical stack with spacing between toolbar and table */}
          <DataToolbar> {/* Toolbar wrapper for the search input */}
            <Input placeholder="Search by email" value={search} onChange={(event) => setSearch(event.target.value)} /> {/* Search input that updates the search state on every keystroke */}
          </DataToolbar>
          {query.isError && <Alert variant="danger">Unable to load students.</Alert>} {/* Show error alert if the query failed */}
          {query.isLoading ? ( // Show loading skeleton while data is being fetched
            <LoadingSkeleton rows={3} columns={4} /> // Skeleton with 3 rows and 4 columns matching the table structure
          ) : rows.length === 0 ? ( // Show empty state if no results were found
            <EmptyState title="No students found" description="Try adjusting your search query." /> // Empty state with helpful message
          ) : (
            <ResponsiveTableCards
              data={rows} // Pass the enrollment rows as data
              columns={columns} // Pass the column definitions
              rowKey={(enrollment) => enrollment.id} // Use the enrollment ID as the React key
              renderTitle={(enrollment) => enrollment.user?.email ?? "Student"} // Use the student's email as the card title on mobile
            />
          )}
        </div>
      </SectionCard>
    </div>
  )
}
