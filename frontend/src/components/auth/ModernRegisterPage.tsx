import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { apiRequest } from "../../lib/api"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Select } from "../ui/select"
import { Alert } from "../ui/alert"
import { ModernAuthLayout } from "../layout/ModernAuthLayout"
import { Link, useNavigate } from "react-router-dom"
import { ApiResponse } from "../../types"
import { toast } from "sonner"
import { Mail, Lock, Eye, EyeOff, User, Shield, ArrowRight, CheckCircle2, GraduationCap } from "lucide-react"
import { PasswordStrength } from "./PasswordStrength"
import { useUnsavedChanges } from "../../hooks/useUnsavedChanges"

const schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  studentNo: z.string().min(1, "Student number is required"),
  program: z.enum(["CWTS", "ROTC"], { errorMap: () => ({ message: "Select your NSTP program" }) }),
  email: z.string().email("Please enter a valid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/\d/, "Password must contain at least one number")
    .regex(/[!@#$%^&*(),.?":{}|<>]/, "Password must contain at least one special character")
})

type FormValues = z.infer<typeof schema>

const DEFAULT_ROLE = "STUDENT"

export function ModernRegisterPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState("")

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      studentNo: "",
      program: "CWTS",
      email: "",
      password: ""
    }
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      apiRequest<ApiResponse<{ id: string }>>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ ...values, role: DEFAULT_ROLE })
      }),
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Registration failed")
    }
  })

  useUnsavedChanges(form.formState.isDirty && !mutation.isSuccess)

  const onSubmit = form.handleSubmit(async (values) => {
    await mutation.mutateAsync(values)
    toast.success("Account created successfully! Please sign in.")
    navigate("/login")
  })

  return (
    <ModernAuthLayout
      title="Create your account"
      description="Join the National Service Training Program Management System"
      footer={
        <Link
          to="/login"
          className="text-sm text-darksilver hover:text-black transition-colors"
        >
          Already have an account? <span className="font-semibold text-black">Sign in</span>
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {mutation.isError && (
          <Alert variant="danger" className="text-sm">
            {(mutation.error as Error).message}
          </Alert>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="firstName" className="text-sm font-medium text-black/80">
              First Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-darksilver" />
              <Input
                id="firstName"
                placeholder="Juan"
                className="h-11 pl-10 border-silver/30 focus:border-black focus:ring-navy bg-white/50"
                autoComplete="given-name"
                {...form.register("firstName")}
              />
            </div>
            {form.formState.errors.firstName && (
              <p className="text-xs text-red-600">{form.formState.errors.firstName.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="lastName" className="text-sm font-medium text-black/80">
              Last Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-darksilver" />
              <Input
                id="lastName"
                placeholder="Dela Cruz"
                className="h-11 pl-10 border-silver/30 focus:border-black focus:ring-navy bg-white/50"
                autoComplete="family-name"
                {...form.register("lastName")}
              />
            </div>
            {form.formState.errors.lastName && (
              <p className="text-xs text-red-600">{form.formState.errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="studentNo" className="text-sm font-medium text-black/80">
            Student Number
          </label>
          <div className="relative">
            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-darksilver" />
            <Input
              id="studentNo"
              placeholder="2024-12345"
              className="h-11 pl-10 border-silver/30 focus:border-black focus:ring-navy bg-white/50"
              autoComplete="off"
              {...form.register("studentNo")}
            />
          </div>
          {form.formState.errors.studentNo && (
            <p className="text-xs text-red-600">{form.formState.errors.studentNo.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="program" className="text-sm font-medium text-black/80">
            NSTP Program
          </label>
          <div className="relative">
            <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-darksilver" />
            <Select
              id="program"
              className="h-11 pl-10 border-silver/30 focus:border-black focus:ring-navy bg-white/50"
              {...form.register("program")}
            >
              <option value="CWTS">Civic Welfare Training Service (CWTS)</option>
              <option value="ROTC">Reserved Officers' Training Corps (ROTC)</option>
            </Select>
          </div>
          {form.formState.errors.program && (
            <p className="text-xs text-red-600">{form.formState.errors.program.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-black/80">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-darksilver" />
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              className="h-11 pl-10 border-silver/30 focus:border-black focus:ring-navy bg-white/50"
              autoComplete="email"
              {...form.register("email")}
            />
          </div>
          {form.formState.errors.email && (
            <p className="text-xs text-red-600">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium text-black/80">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-darksilver" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              className="h-11 pl-10 pr-10 border-silver/30 focus:border-black focus:ring-navy bg-white/50"
              autoComplete="new-password"
              {...form.register("password", {
                onChange: (e) => setPassword(e.target.value)
              })}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-darksilver hover:text-darksilver transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <PasswordStrength password={password} />
          {form.formState.errors.password && (
            <p className="text-xs text-red-600">{form.formState.errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-gradient-to-r from-navy to-royal hover:from-navy hover:to-black text-white shadow-soft"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <span className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating account...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Create account
            </span>
          )}
        </Button>
      </form>
    </ModernAuthLayout>
  )
}
