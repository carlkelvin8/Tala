import { useMutation, useQuery } from "@tanstack/react-query"
import { apiRequest } from "../lib/api"
import { ApiResponse } from "../types"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Select } from "../components/ui/select"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState, useMemo } from "react"
import { FormField } from "../components/ui/form-field"
import { Alert } from "../components/ui/alert"
import { EmptyState } from "../components/ui/empty-state"
import { StatusBadge } from "../components/ui/status-badge"
import { toast } from "sonner"
import { FormSection } from "../components/ui/form-section"
import { SectionCard } from "../components/ui/section-card"
import { ResponsiveTableCards } from "../components/ui/responsive-table-cards"
import { LoadingSkeleton } from "../components/ui/loading-skeleton"
import { Search, Sparkles, Users, UserPlus, Shield, Mail, Lock, User, Eye, RefreshCw } from "lucide-react"
import { cn } from "../lib/utils"
import { StudentProfileDrawer } from "../components/StudentProfileDrawer"

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "IMPLEMENTOR", "CADET_OFFICER", "STUDENT"]),
  program: z.enum(["CWTS", "ROTC"]).optional(),
  firstName: z.string().min(1),
  lastName: z.string().min(1)
})

type FormValues = z.infer<typeof schema>

const ROLE_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  ADMIN: { label: "Admin", color: "text-violet-600", bg: "bg-violet-50" },
  IMPLEMENTOR: { label: "Implementor", color: "text-royal", bg: "bg-sky-50" },
  CADET_OFFICER: { label: "Cadet Officer", color: "text-amber-600", bg: "bg-amber-50" },
  STUDENT: { label: "Student", color: "text-emerald-600", bg: "bg-emerald-50" },
}

export function UsersPage() {
  const [search, setSearch] = useState("")
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { role: "STUDENT", program: "CWTS" } })
  const selectedRole = form.watch("role")
  // Implementor accounts are locked to the CWTS program
  const isImplementorRole = selectedRole === "IMPLEMENTOR"
  const usersQuery = useQuery({
    queryKey: ["users", search],
    queryFn: () => apiRequest<ApiResponse<any[]>>(`/api/users?search=${encodeURIComponent(search)}`),
    refetchInterval: 30000
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
    form.reset({ email: "", password: "", firstName: "", lastName: "", role: "STUDENT", program: "CWTS" })
  })

  const rows = usersQuery.data?.data ?? []

  const roleCounts = useMemo(() => {
    const counts: Record<string, number> = { total: rows.length, ADMIN: 0, IMPLEMENTOR: 0, CADET_OFFICER: 0, STUDENT: 0 }
    for (const u of rows) {
      if (counts[u.role] !== undefined) counts[u.role]++
    }
    return counts
  }, [rows])

  const columns = [
    {
      header: "Email",
      cell: (user: any) => (
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-navy to-royal text-xs font-bold text-white shadow-soft shrink-0">
            {(user.email?.[0] ?? "?").toUpperCase()}
          </span>
          <span className="font-medium text-black">{user.email}</span>
        </div>
      )
    },
    {
      header: "Role",
      cell: (user: any) => {
        const badge = ROLE_BADGE[user.role] ?? { label: user.role, color: "text-darksilver", bg: "bg-white" }
        return (
          <span className={cn("inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold", badge.bg, badge.color)}>
            <Shield className="h-3 w-3" />
            {badge.label}
          </span>
        )
      }
    },
    {
      header: "Program",
      cell: (user: any) => {
        // Implementors are locked to CWTS regardless of the stored value
        const program = user.role === "IMPLEMENTOR" ? "CWTS" : (user.program ?? null)
        if (!program) return <span className="text-xs text-silver">—</span>
        const isROTC = program === "ROTC"
        return (
          <span className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold",
            isROTC ? "bg-amber-50 text-amber-700" : "bg-teal-50 text-teal-700"
          )}>
            {program}
          </span>
        )
      }
    },
    {
      header: "Status",
      cell: (user: any) => {
        const isActive = user.isActive
        return (
          <span className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold",
            isActive ? "bg-emerald-50 text-emerald-600" : "bg-silver/20 text-darksilver"
          )}>
            <span className={cn("h-1.5 w-1.5 rounded-full", isActive ? "bg-emerald-500" : "bg-darksilver")} />
            {isActive ? "Active" : "Inactive"}
          </span>
        )
      }
    },
    {
      header: "",
      cell: (user: any) => (
        <button
          onClick={() => setSelectedUserId(user.id)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-darksilver hover:text-darksilver hover:bg-white transition-all shrink-0"
          title="View Profile"
        >
          <Eye className="h-4 w-4" />
        </button>
      )
    }
  ]

  const summaryCards = [
    { label: "Total Users", value: roleCounts.total, icon: Users, color: "text-black/80", bg: "bg-silver/20" },
    { label: "Admins", value: roleCounts.ADMIN, icon: Shield, color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Implementors", value: roleCounts.IMPLEMENTOR, icon: UserPlus, color: "text-royal", bg: "bg-sky-50" },
    { label: "Students", value: roleCounts.STUDENT, icon: User, color: "text-emerald-600", bg: "bg-emerald-50" },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-royal to-navy px-6 sm:px-10 py-8 shadow-elevated">
        <div className="absolute inset-0 bg-grid opacity-[0.06]" />
        <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-royal/10 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
            <Users className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-gold text-xs font-medium uppercase tracking-wider mb-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>User Administration</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Users</h1>
            <p className="mt-1 text-sm text-silver max-w-2xl">Create and manage staff and student accounts.</p>
          </div>
        </div>
      </div>

      {rows.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map(({ label, value, icon: SummaryIcon, color, bg }, idx) => (
            <div
              key={label}
              className="flex items-center gap-4 rounded-xl border border-silver/20 bg-white p-5 shadow-card transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5"
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <span className={cn("flex h-12 w-12 items-center justify-center rounded-xl shrink-0", bg)}>
                <SummaryIcon className={cn("h-6 w-6", color)} strokeWidth={1.75} />
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-darksilver">{label}</p>
                <p className={cn("text-2xl font-bold mt-0.5", color)}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <FormSection title="Create User" description="Assign the correct role and details" className="shadow-card">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={onSubmit}>
          <FormField label="Email" required error={form.formState.errors.email?.message}>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darksilver" />
              <Input placeholder="user@school.edu" className="pl-10" {...form.register("email")} />
            </div>
          </FormField>
          <FormField label="Password" required error={form.formState.errors.password?.message}>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darksilver" />
              <Input type="password" placeholder="••••••••" className="pl-10" {...form.register("password")} />
            </div>
          </FormField>
          <FormField label="First name" required error={form.formState.errors.firstName?.message}>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darksilver" />
              <Input placeholder="Juan" className="pl-10" {...form.register("firstName")} />
            </div>
          </FormField>
          <FormField label="Last name" required error={form.formState.errors.lastName?.message}>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darksilver" />
              <Input placeholder="Dela Cruz" className="pl-10" {...form.register("lastName")} />
            </div>
          </FormField>
          <FormField label="Role" required>
            <Select {...form.register("role")}>
              <option value="STUDENT">Student</option>
              <option value="IMPLEMENTOR">Implementor</option>
              <option value="CADET_OFFICER">Cadet Officer</option>
              <option value="ADMIN">Admin</option>
            </Select>
          </FormField>
          <FormField label="Program">
            <Select {...form.register("program")} disabled={isImplementorRole}>
              <option value="CWTS">CWTS</option>
              <option value="ROTC">ROTC</option>
            </Select>
            {isImplementorRole && <p className="mt-1 text-xs text-darksilver">Implementors are locked to CWTS.</p>}
          </FormField>
          {mutation.isError && <Alert variant="danger" className="md:col-span-2">{(mutation.error as Error).message}</Alert>}
          <div className="md:col-span-2">
            <Button type="submit" disabled={mutation.isPending} className="bg-gradient-to-r from-navy to-royal hover:from-navy hover:to-black text-white shadow-soft">
              {mutation.isPending ? "Saving..." : "Create"}
            </Button>
          </div>
        </form>
      </FormSection>

      <SectionCard title="Users" description="Active accounts across the system" className="shadow-card">
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darksilver" />
            <Input
              placeholder="Search by email"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-10 pl-10"
            />
          </div>
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
