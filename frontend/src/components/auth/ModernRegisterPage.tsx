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
import { User as UserIcon, Mail, Lock, Eye, EyeOff, Shield } from "lucide-react"
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
          className="block text-sm font-medium text-black hover:text-gray-700"
        >
          Already have an account? Sign in
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
            <label htmlFor="firstName" className="text-sm font-medium text-black">
              First Name
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="firstName"
                placeholder="Juan"
                className="pl-10 h-11"
                {...form.register("firstName")}
              />
            </div>
            {form.formState.errors.firstName && (
              <p className="text-xs text-red-600 mt-1">{form.formState.errors.firstName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="lastName" className="text-sm font-medium text-black">
              Last Name
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="lastName"
                placeholder="Dela Cruz"
                className="pl-10 h-11"
                {...form.register("lastName")}
              />
            </div>
            {form.formState.errors.lastName && (
              <p className="text-xs text-red-600 mt-1">{form.formState.errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="studentNo" className="text-sm font-medium text-black">
            Student Number
          </label>
          <div className="relative">
            <Shield className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="studentNo"
              placeholder="2024-12345"
              className="pl-10 h-11"
              {...form.register("studentNo")}
            />
          </div>
          {form.formState.errors.studentNo && (
            <p className="text-xs text-red-600 mt-1">{form.formState.errors.studentNo.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-black">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              className="pl-10 h-11"
              {...form.register("email")}
            />
          </div>
          {form.formState.errors.email && (
            <p className="text-xs text-red-600 mt-1">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-black">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              className="pl-10 pr-11 h-11"
              {...form.register("password", {
                onChange: (e) => setPassword(e.target.value)
              })}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <PasswordStrength password={password} />
          {form.formState.errors.password && (
            <p className="text-xs text-red-600 mt-1">{form.formState.errors.password.message}</p>
          )}
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <Shield className="h-4 w-4 mt-0.5 text-gray-500 flex-shrink-0" />
          <div className="text-xs text-gray-600">
            <p className="font-medium mb-1 text-black">Account Security</p>
            <p>All new accounts are created as Students by default. Use a strong password to protect your account.</p>
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full h-11 text-base font-medium mt-6"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Creating account..." : "Create account"}
        </Button>
      </form>
    </ModernAuthLayout>
  )
}