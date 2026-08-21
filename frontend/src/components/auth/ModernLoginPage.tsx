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
import { Mail, Lock, Eye, EyeOff, ArrowRight, LogIn } from "lucide-react"

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
          className="text-sm text-darksilver hover:text-black transition-colors"
        >
          Don&apos;t have an account? <span className="font-semibold text-black">Sign up</span>
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        {mutation.error && (
          <Alert variant="danger" className="text-sm">
            {mutation.error instanceof Error ? mutation.error.message : "Login failed"}
          </Alert>
        )}

        <div className="space-y-2">
          <label htmlFor="login-email" className="text-sm font-medium text-black/80">
            Email or Student Number
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-darksilver" />
            <Input
              id="login-email"
              {...form.register("email")}
              type="text"
              placeholder="email@example.com or 2024-12345"
              className="h-11 pl-10 border-silver/30 focus:border-black focus:ring-navy bg-white/50"
              autoComplete="username"
              aria-invalid={Boolean(form.formState.errors.email)}
              aria-describedby={form.formState.errors.email ? "login-email-error" : undefined}
            />
          </div>
          {form.formState.errors.email && (
            <p id="login-email-error" role="alert" className="text-xs text-red-600 mt-1">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="login-password" className="text-sm font-medium text-black/80">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-darksilver" />
            <Input
              id="login-password"
              {...form.register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className="h-11 pl-10 pr-10 border-silver/30 focus:border-black focus:ring-navy bg-white/50"
              autoComplete="current-password"
              aria-invalid={Boolean(form.formState.errors.password)}
              aria-describedby={form.formState.errors.password ? "login-password-error" : undefined}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-darksilver hover:text-darksilver transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {form.formState.errors.password && (
            <p id="login-password-error" role="alert" className="text-xs text-red-600 mt-1">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end">
          <Link to="/forgot-password" className="text-sm text-royal hover:text-navy font-medium transition-colors">
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-gradient-to-r from-navy to-royal hover:from-navy hover:to-black text-white shadow-soft"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? (
            <span className="flex items-center gap-2">
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Signing in...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              Sign in
            </span>
          )}
        </Button>

        <div className="pt-6">
          <p className="text-xs text-darksilver mb-3 font-medium uppercase tracking-wider">Demo accounts</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                form.setValue("email", "admin@nstp.local")
                form.setValue("password", "Password123!")
              }}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-silver/30 bg-white/50 hover:bg-silver/20 hover:border-silver/40 transition-all"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-black">Admin</p>
                <p className="text-[10px] text-darksilver truncate">admin@nstp.local</p>
              </div>
              <ArrowRight className="h-3 w-3 text-silver shrink-0 ml-2" />
            </button>
            <button
              type="button"
              onClick={() => {
                form.setValue("email", "implementor@nstp.local")
                form.setValue("password", "Password123!")
              }}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-silver/30 bg-white/50 hover:bg-silver/20 hover:border-silver/40 transition-all"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-black">Implementor</p>
                <p className="text-[10px] text-darksilver truncate">implementor@nstp.local</p>
              </div>
              <ArrowRight className="h-3 w-3 text-silver shrink-0 ml-2" />
            </button>
            <button
              type="button"
              onClick={() => {
                form.setValue("email", "coordinator@nstp.local")
                form.setValue("password", "Password123!")
              }}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-silver/30 bg-white/50 hover:bg-silver/20 hover:border-silver/40 transition-all"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-black">Coordinator</p>
                <p className="text-[10px] text-darksilver truncate">coordinator@nstp.local</p>
              </div>
              <ArrowRight className="h-3 w-3 text-silver shrink-0 ml-2" />
            </button>
            <button
              type="button"
              onClick={() => {
                form.setValue("email", "cadet@nstp.local")
                form.setValue("password", "Password123!")
              }}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-silver/30 bg-white/50 hover:bg-silver/20 hover:border-silver/40 transition-all"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-black">Cadet Officer</p>
                <p className="text-[10px] text-darksilver truncate">cadet@nstp.local</p>
              </div>
              <ArrowRight className="h-3 w-3 text-silver shrink-0 ml-2" />
            </button>
            <button
              type="button"
              onClick={() => {
                form.setValue("email", "student@nstp.local")
                form.setValue("password", "Password123!")
              }}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl border border-silver/30 bg-white/50 hover:bg-silver/20 hover:border-silver/40 transition-all"
            >
              <div className="min-w-0">
                <p className="text-xs font-semibold text-black">Student</p>
                <p className="text-[10px] text-darksilver truncate">student@nstp.local</p>
              </div>
              <ArrowRight className="h-3 w-3 text-silver shrink-0 ml-2" />
            </button>
          </div>
        </div>
      </form>
    </ModernAuthLayout>
  )
}
