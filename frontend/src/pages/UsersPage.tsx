import { useMutation, useQuery } from "@tanstack/react-query"
import { apiRequest } from "../lib/api"
import { ApiResponse } from "../types"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Select } from "../components/ui/select"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { PageHeader } from "../components/ui/page-header"
import { FormField } from "../components/ui/form-field"
import { Alert } from "../components/ui/alert"
import { EmptyState } from "../components/ui/empty-state"
import { StatusBadge } from "../components/ui/status-badge"
import { toast } from "sonner"
import { FormSection } from "../components/ui/form-section"
import { SectionCard } from "../components/ui/section-card"
import { DataToolbar } from "../components/ui/data-toolbar"
import { ResponsiveTableCards } from "../components/ui/responsive-table-cards"
import { LoadingSkeleton } from "../components/ui/loading-skeleton"
import { Eye } from "lucide-react"
import { StudentProfileDrawer } from "../components/StudentProfileDrawer"

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "IMPLEMENTOR", "CADET_OFFICER", "STUDENT"]),
  firstName: z.string().min(1),
  lastName: z.string().min(1)
})

type FormValues = z.infer<typeof schema>

export function UsersPage() {
  const [search, setSearch] = useState("")
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { role: "STUDENT" } })
  const usersQuery = useQuery({
    queryKey: ["users", search],
    queryFn: () => apiRequest<ApiResponse<any[]>>(`/api/users?search=${encodeURIComponent(search)}`),
    refetchInterval: 5000
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      apiRequest<ApiResponse<any>>("/api/users", { method: "POST", body: JSON.stringify(values) }),
    onSuccess: () => {
      usersQuery.refetch()
      toast.success("User created")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to create user")
    }
  })

  const onSubmit = form.handleSubmit(async (values) => {
    await mutation.mutateAsync(values)
    form.reset({ email: "", password: "", firstName: "", lastName: "", role: "STUDENT" })
  })

  const rows = usersQuery.data?.data ?? []
  const columns = [
    {
      header: "Email",
      cell: (user: any) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-900">{user.email}</span>
          <button
            onClick={() => setSelectedUserId(user.id)}
            className="text-primary-600 hover:text-primary-700"
            title="View Profile"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      )
    },
    {
      header: "Role",
      cell: (user: any) => user.role
    },
    {
      header: "Status",
      cell: (user: any) => <StatusBadge status={user.isActive ? "ACTIVE" : "INACTIVE"} />
    }
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="User Management" description="Create and manage staff and student accounts" />
      <FormSection title="Create User" description="Assign the correct role and details">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <FormField label="Email" required error={form.formState.errors.email?.message}>
            <Input placeholder="user@school.edu" {...form.register("email")} />
          </FormField>
          <FormField label="Password" required error={form.formState.errors.password?.message}>
            <Input type="password" placeholder="••••••••" {...form.register("password")} />
          </FormField>
          <FormField label="First name" required error={form.formState.errors.firstName?.message}>
            <Input placeholder="Juan" {...form.register("firstName")} />
          </FormField>
          <FormField label="Last name" required error={form.formState.errors.lastName?.message}>
            <Input placeholder="Dela Cruz" {...form.register("lastName")} />
          </FormField>
          <FormField label="Role" required>
            <Select {...form.register("role")}>
              <option value="STUDENT">Student</option>
              <option value="IMPLEMENTOR">Implementor</option>
              <option value="CADET_OFFICER">Cadet Officer</option>
              <option value="ADMIN">Admin</option>
            </Select>
          </FormField>
          {mutation.isError && <Alert variant="danger" className="md:col-span-2">{(mutation.error as Error).message}</Alert>}
          <div className="md:col-span-2">
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Create"}
            </Button>
          </div>
        </form>
      </FormSection>
      <SectionCard title="Users" description="Active accounts across the system">
        <div className="space-y-4">
          <DataToolbar>
            <Input placeholder="Search by email" value={search} onChange={(event) => setSearch(event.target.value)} />
          </DataToolbar>
          {usersQuery.isError && <Alert variant="danger">Unable to load users.</Alert>}
          {usersQuery.isLoading ? (
            <LoadingSkeleton rows={3} columns={3} />
          ) : rows.length === 0 ? (
            <EmptyState title="No users found" description="Try adjusting your search query." />
          ) : (
            <ResponsiveTableCards
              data={rows}
              columns={columns}
              rowKey={(user) => user.id}
              renderTitle={(user) => user.email}
            />
          )}
        </div>
      </SectionCard>
      <StudentProfileDrawer userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
    </div>
  )
}
