import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { apiRequest } from "../../lib/api"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Alert } from "../ui/alert"
import { ModernAuthLayout } from "../layout/ModernAuthLayout"
import { Link, useNavigate } from "react-router-dom"
import { ApiResponse } from "../../types"
import { toast } from "sonner"
import { User as UserIcon, Mail, Lock, Eye, EyeOff, Shield, ArrowRight, CheckCircle2 } from "lucide-react"
import { PasswordStrength } from "./PasswordStrength"

const schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  studentNo: z.string().min(1, "Student number is required"),
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

  const onSubmit = form.handleSubmit(async (values) => {
    await mutation.mutateAsync(values)
    toast.success("Account created successfully! Please sign in.")
    navigate("/login")
  })

  return (
    <ModernAuthLayout
      title="Create your account"
      description="Join the NSTP Command Center"
      footer={
        <Link 
          to="/login" 
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          Already have an account? <span className="font-semibold text-slate-900">Sign in</span>
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        {mutation.isError && (
          <Alert variant="danger" className="text-sm">
            {(mutation.error as Error).message}
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="firstName" className="text-sm font-medium text-slate-900">
              First Name
            </label>
            <Input
              id="firstName"
              placeholder="Juan"
              className="h-11 border-slate-300 focus:border-slate-900 focus:ring-slate-900"
              autoComplete="given-name"
              {...form.register("firstName")}
            />
            {form.formState.errors.firstName && (
              <p className="text-xs text-red-600 mt-1">
                {form.formState.errors.firstName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="lastName" className="text-sm font-medium text-slate-900">
              Last Name
            </label>
            <Input
              id="lastName"
              placeholder="Dela Cruz"
              className="h-11 border-slate-300 focus:border-slate-900 focus:ring-slate-900"
              autoComplete="family-name"
              {...form.register("lastName")}
            />
            {form.formState.errors.lastName && (
              <p className="text-xs text-red-600 mt-1">
                {form.formState.errors.lastName.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="studentNo" className="text-sm font-medium text-slate-900">
            Student Number
          </label>
          <Input
            id="studentNo"
            placeholder="2024-12345"
            className="h-11 border-slate-300 focus:border-slate-900 focus:ring-slate-900"
            autoComplete="off"
            {...form.register("studentNo")}
          />
          {form.formState.errors.studentNo && (
            <p className="text-xs text-red-600 mt-1">
              {form.formState.errors.studentNo.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-slate-900">
            Email Address
          </label>
          <Input
            id="email"
            type="email"
            placeholder="your.email@example.com"
            className="h-11 border-slate-300 focus:border-slate-900 focus:ring-slate-900"
            autoComplete="email"
            {...form.register("email")}
          />
          {form.formState.errors.email && (
            <p className="text-xs text-red-600 mt-1">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-slate-900">
            Password
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              className="h-11 pr-10 border-slate-300 focus:border-slate-900 focus:ring-slate-900"
              autoComplete="new-password"
              {...form.register("password", {
                onChange: (e) => setPassword(e.target.value)
              })}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <PasswordStrength password={password} />
          {form.formState.errors.password && (
            <p className="text-xs text-red-600 mt-1">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        <Button 
          type="submit" 
          className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <span className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating account...
            </span>
          ) : (
            "Create account"
          )}
        </Button>

        <div className="pt-5 border-t border-slate-200">
          <p className="text-xs text-slate-500">
            Password must be at least 8 characters and include uppercase, lowercase, numbers, and special characters.
          </p>
        </div>
      </form>
    </ModernAuthLayout>
  )
}
