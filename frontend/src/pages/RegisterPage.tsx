import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { apiRequest } from "../lib/api"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Select } from "../components/ui/select"
import { Alert } from "../components/ui/alert"
import { FormField } from "../components/ui/form-field"
import { AuthLayout } from "../components/layout/AuthLayout"
import { Link, useNavigate } from "react-router-dom"
import { ApiResponse } from "../types"
import { toast } from "sonner"
import { User as UserIcon, Mail, Lock, Shield } from "lucide-react"
import { useState } from "react"

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "IMPLEMENTOR", "CADET_OFFICER", "STUDENT"]),
  firstName: z.string().min(1),
  lastName: z.string().min(1)
})

type FormValues = z.infer<typeof schema>

export function RegisterPage() {
  const navigate = useNavigate()
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { role: "STUDENT" } })
  const [showPassword, setShowPassword] = useState(false)
  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      apiRequest<ApiResponse<{ id: string }>>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(values)
      }),
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Registration failed")
    }
  })

  const onSubmit = form.handleSubmit(async (values) => {
    await mutation.mutateAsync(values)
    toast.success("Account created successfully")
    navigate("/login")
  })

  return (
    <AuthLayout
      title="Create your account"
      description="Set up access for students and staff"
      sideTitle="Start coordinating NSTP programs"
      sideDescription="Onboard students and leaders with clear roles and fast access."
      sideItems={[
        "Role-based access controls",
        "Structured enrollment workflows",
        "Centralized performance tracking",
        "Quick access to reports"
      ]}
      footer={
        <span>
          Already have access?{" "}
          <Link className="font-medium text-black hover:underline" to="/login">
            Sign in
          </Link>
        </span>
      }
    >
      <form className="grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
        <FormField label="First name" htmlFor="firstName" required error={form.formState.errors.firstName?.message}>
          <div className="relative">
            <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darksilver" />
            <Input id="firstName" placeholder="Juan" className="h-9 pl-9" {...form.register("firstName")} />
          </div>
        </FormField>
        <FormField label="Last name" htmlFor="lastName" required error={form.formState.errors.lastName?.message}>
          <div className="relative">
            <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darksilver" />
            <Input id="lastName" placeholder="Dela Cruz" className="h-9 pl-9" {...form.register("lastName")} />
          </div>
        </FormField>
        <FormField label="Email" htmlFor="email" required error={form.formState.errors.email?.message} className="md:col-span-2">
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darksilver" />
            <Input id="email" type="email" placeholder="you@school.edu" className="h-9 pl-9" {...form.register("email")} />
          </div>
        </FormField>
        <FormField label="Password" htmlFor="password" required error={form.formState.errors.password?.message}>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darksilver" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="h-9 pr-14 pl-9"
              {...form.register("password")}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 h-6 -translate-y-1/2 text-xs text-darksilver hover:text-black/80"
              onClick={() => setShowPassword((prev) => !prev)}
            >
              {showPassword ? "Hide" : "Show"}
            </Button>
          </div>
          <p className="mt-1 text-xs text-darksilver">Use at least 8 characters. Avoid sharing credentials.</p>
        </FormField>
        <FormField label="Role" htmlFor="role" required>
          <Select id="role" className="h-9" {...form.register("role")}>
            <option value="STUDENT">Student</option>
            <option value="IMPLEMENTOR">Implementor (CWTS)</option>
            <option value="CADET_OFFICER">Cadet Officer (ROTC)</option>
            <option value="ADMIN">Admin</option>
          </Select>
        </FormField>
        {mutation.isError && <Alert variant="danger" className="md:col-span-2">{(mutation.error as Error).message}</Alert>}
        <div className="md:col-span-2">
          <Button className="h-10 w-full" type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Creating..." : "Create account"}
          </Button>
        </div>
        <div className="md:col-span-2 space-y-3">
          <div className="flex items-center gap-3 text-xs text-darksilver">
            <div className="flex-1 h-px bg-silver/30" />
            <span>Account policy</span>
            <div className="flex-1 h-px bg-silver/30" />
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-silver/30 bg-white px-4 py-3 text-xs text-darksilver">
            <Shield className="h-4 w-4 text-darksilver" />
            <span>
              Accounts are role-based. Admin reviews may be required based on your selected role and program.
            </span>
          </div>
        </div>
      </form>
    </AuthLayout>
  )
}
