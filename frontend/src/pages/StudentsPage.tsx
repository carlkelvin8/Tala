import { useQuery } from "@tanstack/react-query"
import { apiRequest } from "../lib/api"
import { ApiResponse } from "../types"
import { Input } from "../components/ui/input"
import { useState } from "react"
import { PageHeader } from "../components/ui/page-header"
import { Alert } from "../components/ui/alert"
import { EmptyState } from "../components/ui/empty-state"
import { StatusBadge } from "../components/ui/status-badge"
import { SectionCard } from "../components/ui/section-card"
import { DataToolbar } from "../components/ui/data-toolbar"
import { ResponsiveTableCards } from "../components/ui/responsive-table-cards"
import { LoadingSkeleton } from "../components/ui/loading-skeleton"

export function StudentsPage() {
  const [search, setSearch] = useState("")
  const query = useQuery({
    queryKey: ["enrollments", search],
    queryFn: () => apiRequest<ApiResponse<any[]>>(`/api/enrollments?search=${encodeURIComponent(search)}`)
  })
  const rows = query.data?.data ?? []
  const columns = [
    {
      header: "Email",
      cell: (enrollment: any) => <span className="font-medium text-slate-900">{enrollment.user?.email ?? "-"}</span>
    },
    {
      header: "Status",
      cell: (enrollment: any) => <StatusBadge status={enrollment.status} />
    },
    {
      header: "Section",
      cell: (enrollment: any) => enrollment.section?.code ?? "-"
    },
    {
      header: "Flight",
      cell: (enrollment: any) => enrollment.flight?.code ?? "-"
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Students" description="Browse and filter enrolled learners" />
      <SectionCard title="Enrollment Directory" description="Search by student email to narrow results">
        <div className="space-y-4">
          <DataToolbar>
            <Input placeholder="Search by email" value={search} onChange={(event) => setSearch(event.target.value)} />
          </DataToolbar>
          {query.isError && <Alert variant="danger">Unable to load students.</Alert>}
          {query.isLoading ? (
            <LoadingSkeleton rows={3} columns={4} />
          ) : rows.length === 0 ? (
            <EmptyState title="No students found" description="Try adjusting your search query." />
          ) : (
            <ResponsiveTableCards
              data={rows}
              columns={columns}
              rowKey={(enrollment) => enrollment.id}
              renderTitle={(enrollment) => enrollment.user?.email ?? "Student"}
            />
          )}
        </div>
      </SectionCard>
    </div>
  )
}
