import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { apiRequest } from "../../lib/api"
import { setAuthSession } from "../../lib/auth"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Alert } from "../ui/alert"
import { ModernAuthLayout } from "../layout/ModernAuthLayout"
import { Link, useNavigate } from "react-router-dom"
import { ApiResponse } from "../../types"
import { toast } from "sonner"
import { Mail, Lock, Eye, EyeOff, User, Shield, ArrowRight } from "lucide-react"

const schema = z.object({
  email: z.string().min(1, "Email or Student Number is required"),
  password: z.string().min(8, "Password must be at least 8 characters")
})

type FormValues = z.infer<typeof schema>

export function ModernLoginPage() {
  const navigate = useNavigate()
  const form = useForm<FormValues>({ 
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: ""
    }
  })
  const [showPassword, setShowPassword] = useState(false)
  
  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      apiRequest<ApiResponse<{ 
        user: { 
          id: string; 
          email: string; 
          role: "ADMIN" | "IMPLEMENTOR" | "CADET_OFFICER" | "STUDENT";
          firstName?: string;
          lastName?: string;
          avatarUrl?: string;
          avatarFrame?: string;
        }; 
        accessToken: string; 
        refreshToken: string 
      }>>(
        "/api/auth/login",
        { method: "POST", body: JSON.stringify(values) }
      ),
    onSuccess: (response) => {
      if (response.data) {
        setAuthSession(response.data.user, response.data.accessToken, response.data.refreshToken)
        toast.success("Welcome back!")
        navigate("/dashboard")
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Login failed")
    }
  })

  const onSubmit = form.handleSubmit(async (values) => {
    await mutation.mutateAsync(values)
  })

  return (
    <ModernAuthLayout
      title="Welcome back"
      description="Sign in to your account to continue"
      footer={
        <Link 
          to="/register" 
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          Don't have an account? <span className="font-semibold text-slate-900">Sign up</span>
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="space-y-6">
        {mutation.error && (
          <Alert variant="danger" className="text-sm">
            {mutation.error instanceof Error ? mutation.error.message : "Login failed"}
          </Alert>
        )}
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-900">
            Email or Student Number
          </label>
          <Input
            {...form.register("email")}
            type="text"
            placeholder="email@example.com or 2024-12345"
            className="h-11 border-slate-300 focus:border-slate-900 focus:ring-slate-900"
            autoComplete="username"
          />
          {form.formState.errors.email && (
            <p className="text-xs text-red-600 mt-1">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-900">
            Password
          </label>
          <div className="relative">
            <Input
              {...form.register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className="h-11 pr-10 border-slate-300 focus:border-slate-900 focus:ring-slate-900"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
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
              Signing in...
            </span>
          ) : (
            "Sign in"
          )}
        </Button>

        {/* Demo Accounts */}
        <div className="pt-6 border-t border-slate-200">
          <p className="text-xs text-slate-500 mb-3">Demo accounts for testing:</p>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                form.setValue("email", "admin@nstp.local")
                form.setValue("password", "Password123!")
              }}
              className="w-full text-left px-4 py-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">Admin Account</p>
                  <p className="text-xs text-slate-500">admin@nstp.local</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                form.setValue("email", "student@nstp.local")
                form.setValue("password", "Password123!")
              }}
              className="w-full text-left px-4 py-2.5 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">Student Account</p>
                  <p className="text-xs text-slate-500">student@nstp.local</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400" />
              </div>
            </button>
          </div>
        </div>
      </form>
    </ModernAuthLayout>
  )
}