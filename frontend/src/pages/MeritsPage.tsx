import { useMutation, useQuery } from "@tanstack/react-query"
import { apiRequest } from "../lib/api"
import { ApiResponse } from "../types"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Select } from "../components/ui/select"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { getStoredUser } from "../lib/auth"
import { PageHeader } from "../components/ui/page-header"
import { FormField } from "../components/ui/form-field"
import { Alert } from "../components/ui/alert"
import { EmptyState } from "../components/ui/empty-state"
import { StatusBadge } from "../components/ui/status-badge"
import { toast } from "sonner"
import { FormSection } from "../components/ui/form-section"
import { SectionCard } from "../components/ui/section-card"
import { ResponsiveTableCards } from "../components/ui/responsive-table-cards"
import { LoadingSkeleton } from "../components/ui/loading-skeleton"
import { useState } from "react"

const schema = z.object({
  studentId: z.string().uuid(),
  type: z.enum(["MERIT", "DEMERIT"]),
  points: z.coerce.number().int(),
  reason: z.string().min(1)
})

type FormValues = z.infer<typeof schema>

export function MeritsPage() {
  const user = getStoredUser()
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { type: "MERIT" } })
  const [studentSearch, setStudentSearch] = useState("")
  const meritsQuery = useQuery({
    queryKey: ["merits"],
    queryFn: () => apiRequest<ApiResponse<any[]>>("/api/merits"),
    refetchInterval: 5000
  })

  const studentsQuery = useQuery({
    queryKey: ["merit-students", studentSearch],
    queryFn: () =>
      apiRequest<ApiResponse<any[]>>(
        `/api/enrollments?search=${encodeURIComponent(studentSearch.trim())}`
      ),
    enabled: studentSearch.trim().length >= 2
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      apiRequest<ApiResponse<any>>("/api/merits", { method: "POST", body: JSON.stringify(values) }),
    onSuccess: () => {
      meritsQuery.refetch()
      toast.success("Merit entry saved")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to save merit entry")
    }
  })

  const onSubmit = form.handleSubmit(async (values) => {
    await mutation.mutateAsync(values)
    form.reset({ studentId: "", reason: "", points: 0, type: "MERIT" })
  })
  const rows = meritsQuery.data?.data ?? []
  const columns = [
    {
      header: "Student",
      cell: (item: any) => <span className="font-medium text-slate-900">{item.student?.email ?? item.studentId}</span>
    },
    {
      header: "Type",
      cell: (item: any) => <StatusBadge status={item.type} />
    },
    {
      header: "Points",
      cell: (item: any) => item.points
    },
    {
      header: "Reason",
      cell: (item: any) => item.reason
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Merits & Demerits" description="Record performance points and discipline notes" />
      {user && user.role !== "STUDENT" && (
        <FormSection title="Assign Merit/Demerit" description="Track point-based performance changes">
          <form className="grid gap-4 md:grid-cols-4" onSubmit={onSubmit}>
            <FormField label="Student" required error={form.formState.errors.studentId?.message}>
              <div className="relative">
                <Input
                  placeholder="Search by email or ID"
                  value={studentSearch}
                  onChange={(event) => setStudentSearch(event.target.value)}
                  autoComplete="off"
                />
                <input type="hidden" {...form.register("studentId")} />
                {studentSearch.trim().length >= 2 && (
                  <div className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
                    {studentsQuery.isLoading ? (
                      <div className="px-3 py-2 text-xs text-slate-500">Searching students...</div>
                    ) : studentsQuery.isError ? (
                      <div className="px-3 py-2 text-xs text-red-500">Unable to search students.</div>
                    ) : (studentsQuery.data?.data ?? []).length === 0 ? (
                      <div className="px-3 py-2 text-xs text-slate-500">No matching students found.</div>
                    ) : (
                      <ul className="max-h-64 overflow-y-auto py-1 text-sm">
                        {(studentsQuery.data?.data ?? []).map((enrollment: any) => (
                          <li
                            key={enrollment.id}
                            className="cursor-pointer px-3 py-2 hover:bg-slate-50"
                            onMouseDown={(event) => {
                              event.preventDefault()
                              form.setValue("studentId", enrollment.userId)
                              setStudentSearch(enrollment.user?.email ?? enrollment.userId)
                            }}
                          >
                            <div className="font-medium text-slate-900">
                              {enrollment.user?.email ?? enrollment.userId}
                            </div>
                            <div className="text-xs text-slate-500">
                              {enrollment.section?.code ?? "-"} · {enrollment.flight?.code ?? "-"}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </FormField>
            <FormField label="Type" required>
              <Select {...form.register("type")}>
                <option value="MERIT">Merit</option>
                <option value="DEMERIT">Demerit</option>
              </Select>
            </FormField>
            <FormField label="Points" required error={form.formState.errors.points?.message}>
              <Input type="number" placeholder="0" {...form.register("points")} />
            </FormField>
            <FormField label="Reason" required error={form.formState.errors.reason?.message}>
              <Input placeholder="Add reason" {...form.register("reason")} />
            </FormField>
            {mutation.isError && <Alert variant="danger" className="md:col-span-4">{(mutation.error as Error).message}</Alert>}
            <div className="md:col-span-4">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </form>
        </FormSection>
      )}
      <SectionCard title="Merits/Demerits" description="Recent merit and demerit records">
        {meritsQuery.isError && <Alert variant="danger">Unable to load merit records.</Alert>}
        {meritsQuery.isLoading ? (
          <LoadingSkeleton rows={3} columns={4} />
        ) : rows.length === 0 ? (
          <EmptyState title="No merits logged" description="Assign a merit or demerit to see it here." />
        ) : (
          <ResponsiveTableCards
            data={rows}
            columns={columns}
            rowKey={(item) => item.id}
            renderTitle={(item) => item.student?.email ?? item.studentId}
          />
        )}
      </SectionCard>
    </div>
  )
}
