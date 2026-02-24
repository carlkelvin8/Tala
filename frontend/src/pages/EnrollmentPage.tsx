import { useMutation, useQuery } from "@tanstack/react-query"
import { apiRequest } from "../lib/api"
import { ApiResponse } from "../types"
import { Button } from "../components/ui/button"
import { Select } from "../components/ui/select"
import { Alert } from "../components/ui/alert"
import { PageHeader } from "../components/ui/page-header"
import { EmptyState } from "../components/ui/empty-state"
import { StatusBadge } from "../components/ui/status-badge"
import { toast } from "sonner"
import { SectionCard } from "../components/ui/section-card"
import { ResponsiveTableCards } from "../components/ui/responsive-table-cards"
import { LoadingSkeleton } from "../components/ui/loading-skeleton"
import { getStoredUser } from "../lib/auth"
import { Check, X, Eye, Edit } from "lucide-react"
import { StudentProfileDrawer } from "../components/StudentProfileDrawer"
import { RefreshIndicator } from "../components/ui/refresh-indicator"
import { Drawer } from "../components/ui/drawer"
import { FormField } from "../components/ui/form-field"
import { useState } from "react"

export function EnrollmentPage() {
  const currentUser = getStoredUser()
  const canApprove = currentUser?.role === "ADMIN" || currentUser?.role === "IMPLEMENTOR"
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [editingEnrollment, setEditingEnrollment] = useState<any | null>(null)
  const [selectedSection, setSelectedSection] = useState<string>("")
  const [selectedFlight, setSelectedFlight] = useState<string>("")
  
  const enrollmentsQuery = useQuery({
    queryKey: ["enrollments"],
    queryFn: () => apiRequest<ApiResponse<any[]>>("/api/enrollments"),
    retry: false,
    refetchInterval: 5000
  })

  const sectionsQuery = useQuery({
    queryKey: ["sections"],
    queryFn: () => apiRequest<ApiResponse<any[]>>("/api/sections"),
    retry: false
  })

  const flightsQuery = useQuery({
    queryKey: ["flights"],
    queryFn: () => apiRequest<ApiResponse<any[]>>("/api/flights"),
    retry: false
  })

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest<ApiResponse<any>>(`/api/enrollments/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      }),
    onSuccess: () => {
      enrollmentsQuery.refetch()
      toast.success("Enrollment status updated")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Update failed")
    }
  })

  const updateEnrollmentMutation = useMutation({
    mutationFn: ({ id, sectionId, flightId }: { id: string; sectionId: string; flightId: string }) =>
      apiRequest<ApiResponse<any>>(`/api/enrollments/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ sectionId, flightId })
      }),
    onSuccess: () => {
      enrollmentsQuery.refetch()
      toast.success("Enrollment updated")
      setEditingEnrollment(null)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Update failed")
    }
  })

  const handleEdit = (enrollment: any) => {
    setEditingEnrollment(enrollment)
    setSelectedSection(enrollment.sectionId || "")
    setSelectedFlight(enrollment.flightId || "")
  }

  const handleSaveEdit = () => {
    if (editingEnrollment) {
      updateEnrollmentMutation.mutate({
        id: editingEnrollment.id,
        sectionId: selectedSection,
        flightId: selectedFlight
      })
    }
  }

  const handleApprove = (id: string) => {
    updateStatusMutation.mutate({ id, status: "APPROVED" })
  }

  const handleReject = (id: string) => {
    updateStatusMutation.mutate({ id, status: "REJECTED" })
  }
  
  const rows = enrollmentsQuery.data?.data ?? []
  const sections = sectionsQuery.data?.data ?? []
  const flights = flightsQuery.data?.data ?? []
  
  const columns = [
    {
      header: "Student",
      cell: (enrollment: any) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-900">{enrollment.user?.email ?? "-"}</span>
          <button
            onClick={() => setSelectedUserId(enrollment.userId)}
            className="text-primary-600 hover:text-primary-700"
            title="View Profile"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      )
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
    },
    {
      header: "Actions",
      cell: (enrollment: any) => {
        if (!canApprove) return null
        return (
          <div className="flex gap-2">
            {enrollment.status === "PENDING" && (
              <>
                <Button
                  size="sm"
                  onClick={() => handleApprove(enrollment.id)}
                  disabled={updateStatusMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleReject(enrollment.id)}
                  disabled={updateStatusMutation.isPending}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <X className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </>
            )}
            {enrollment.status === "APPROVED" && (
              <Button
                size="sm"
                onClick={() => handleEdit(enrollment)}
                variant="outline"
              >
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
          </div>
        )
      }
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Enrollment" 
        description="Manage student enrollment records and assignments"
        actions={<RefreshIndicator isRefetching={enrollmentsQuery.isRefetching} />}
      />
      <SectionCard title="Enrollments" description="Student enrollment requests and assignments">
        {enrollmentsQuery.isError && (
          <Alert variant="danger">
            {(enrollmentsQuery.error as Error).message === "Unauthorized" 
              ? "Please log in to view enrollments." 
              : "Unable to load enrollments."}
          </Alert>
        )}
        {enrollmentsQuery.isLoading ? (
          <LoadingSkeleton rows={3} columns={4} />
        ) : rows.length === 0 ? (
          <EmptyState title="No enrollments yet" description="Create a new enrollment to see results here." />
        ) : (
          <ResponsiveTableCards
            data={rows}
            columns={columns}
            rowKey={(enrollment) => enrollment.id}
            renderTitle={(enrollment) => enrollment.user?.email ?? "Student"}
          />
        )}
      </SectionCard>
      <StudentProfileDrawer userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      
      {/* Edit Enrollment Drawer */}
      <Drawer
        open={!!editingEnrollment}
        onOpenChange={(open) => !open && setEditingEnrollment(null)}
        title="Edit Enrollment"
      >
        <div className="p-4 space-y-4">
          <p className="text-sm text-slate-600">
            Assign section and flight for {editingEnrollment?.user?.email}
          </p>
          
          <FormField label="Section">
            <Select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
            >
              <option value="">No section</option>
              {sections.map((section: any) => (
                <option key={section.id} value={section.id}>
                  {section.code} - {section.name}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Flight">
            <Select
              value={selectedFlight}
              onChange={(e) => setSelectedFlight(e.target.value)}
            >
              <option value="">No flight</option>
              {flights.map((flight: any) => (
                <option key={flight.id} value={flight.id}>
                  {flight.code} - {flight.name}
                </option>
              ))}
            </Select>
          </FormField>

          {updateEnrollmentMutation.isError && (
            <Alert variant="danger">
              {(updateEnrollmentMutation.error as Error).message}
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleSaveEdit}
              disabled={updateEnrollmentMutation.isPending}
            >
              {updateEnrollmentMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setEditingEnrollment(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Drawer>
    </div>
  )
}
