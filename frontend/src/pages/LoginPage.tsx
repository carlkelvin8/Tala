import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { apiRequest } from "../lib/api"
import { setAuthSession } from "../lib/auth"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Alert } from "../components/ui/alert"
import { FormField } from "../components/ui/form-field"
import { AuthLayout } from "../components/layout/AuthLayout"
import { Link, useNavigate } from "react-router-dom"
import { ApiResponse } from "../types"
import { toast } from "sonner"
import { Mail, Lock } from "lucide-react"

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const form = useForm<FormValues>({ resolver: zodResolver(schema) })
  const [showPassword, setShowPassword] = useState(false)
  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      apiRequest<ApiResponse<{ user: { id: string; email: string; role: "ADMIN" | "IMPLEMENTOR" | "CADET_OFFICER" | "STUDENT" }; accessToken: string; refreshToken: string }>>(
        "/api/auth/login",
        { method: "POST", body: JSON.stringify(values) }
      ),
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Login failed")
    }
  })

  const onSubmit = form.handleSubmit(async (values) => {
    const response = await mutation.mutateAsync(values)
    if (response.data) {
      setAuthSession(response.data.user, response.data.accessToken, response.data.refreshToken)
      toast.success("Welcome back")
      navigate("/dashboard")
    }
  })

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to manage your NSTP dashboard"
      sideTitle="Everything in one command center"
      sideDescription="Track attendance, materials, grades, and reports with a unified view."
      sideItems={[
        "Real-time enrollment visibility",
        "Centralized learning materials",
        "Merit and demerit tracking",
        "Exam monitoring overview"
      ]}
      footer={
        <span>
          New here?{" "}
          <Link className="font-medium text-black hover:underline" to="/register">
            Create an account
          </Link>
        </span>
      }
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <FormField
          label="Email"
          htmlFor="email"
          required
          error={form.formState.errors.email?.message}
        >
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darksilver" />
            <Input
              id="email"
              type="email"
              placeholder="you@school.edu"
              className="h-9 bg-white/70 pl-9"
              {...form.register("email")}
            />
          </div>
        </FormField>
        <FormField
          label="Password"
          htmlFor="password"
          required
          error={form.formState.errors.password?.message}
        >
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-darksilver" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="h-9 bg-white/70 pl-9 pr-14"
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
        </FormField>
        <div className="flex items-center justify-between">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-black/80">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border border-silver/40 text-black accent-black"
            />
            Remember me
          </label>
          <button
            type="button"
            className="text-sm text-black/80 underline-offset-4 hover:underline"
            onClick={() => toast.info("Please contact your administrator to reset your password")}
          >
            Forgot password?
          </button>
        </div>
        {mutation.isError && <Alert variant="danger">{(mutation.error as Error).message}</Alert>}
        <Button className="h-10 w-full text-base shadow-sm" type="submit" disabled={mutation.isPending}>
          {mutation.isPending ? (
            <>
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/60 border-t-white" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>
        {/* compact: removed extra info blocks to reduce height */}
      </form>
    </AuthLayout>
  )
}
