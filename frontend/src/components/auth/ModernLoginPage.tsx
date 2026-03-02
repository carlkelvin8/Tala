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
import { Mail, Lock, Eye, EyeOff } from "lucide-react"

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
      description="Sign in to your NSTP Command Center"
      footer={
        <div className="space-y-3">
          <Link 
            to="/register" 
            className="block text-sm font-medium text-black hover:text-gray-700"
          >
            Don't have an account? Sign up
          </Link>
          <button
            type="button"
            className="text-sm text-gray-500 hover:text-black"
            title="Contact administrator for password reset"
          >
            Forgot your password?
          </button>
        </div>
      }
    >
      <form onSubmit={onSubmit} className="space-y-6">
        {mutation.error && (
          <Alert variant="danger" className="text-sm">
            {mutation.error instanceof Error ? mutation.error.message : "Login failed"}
          </Alert>
        )}
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-black">Email or Student Number</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              {...form.register("email")}
              type="text"
              placeholder="email@example.com or 2024-12345"
              className="pl-10 h-11"
            />
          </div>
          {form.formState.errors.email && (
            <p className="text-xs text-red-600 mt-1">{form.formState.errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-black">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              {...form.register("password")}
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className="pl-10 pr-11 h-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {form.formState.errors.password && (
            <p className="text-xs text-red-600 mt-1">{form.formState.errors.password.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-11 text-base font-medium mt-8"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </ModernAuthLayout>
  )
}