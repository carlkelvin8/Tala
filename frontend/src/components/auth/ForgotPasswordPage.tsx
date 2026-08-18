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
import { Link } from "react-router-dom"
import { ApiResponse } from "../../types"
import { toast } from "sonner"
import { Mail, KeyRound, Lock, Eye, EyeOff, ArrowRight, CheckCircle } from "lucide-react"

const emailSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email")
})

const resetSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters")
})

type EmailFormValues = z.infer<typeof emailSchema>
type ResetFormValues = z.infer<typeof resetSchema>

export function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "reset" | "done">("email")
  const [resetToken, setResetToken] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" }
  })

  const resetForm = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { token: "", newPassword: "" }
  })

  const forgotPasswordMutation = useMutation({
    mutationFn: (values: EmailFormValues) =>
      apiRequest<ApiResponse<{ resetToken: string }>>(
        "/api/auth/forgot-password",
        { method: "POST", body: JSON.stringify(values) }
      ),
    onSuccess: (response) => {
      if (response.data) {
        setResetToken(response.data.resetToken)
        toast.success("Reset token sent to your email")
        setStep("reset")
        resetForm.setValue("token", response.data.resetToken)
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to send reset token")
    }
  })

  const resetPasswordMutation = useMutation({
    mutationFn: (values: ResetFormValues) =>
      apiRequest<ApiResponse<void>>(
        "/api/auth/reset-password",
        { method: "POST", body: JSON.stringify(values) }
      ),
    onSuccess: () => {
      toast.success("Password reset successfully")
      setStep("done")
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to reset password")
    }
  })

  const onEmailSubmit = emailForm.handleSubmit(async (values) => {
    await forgotPasswordMutation.mutateAsync(values)
  })

  const onResetSubmit = resetForm.handleSubmit(async (values) => {
    await resetPasswordMutation.mutateAsync(values)
  })

  if (step === "done") {
    return (
      <ModernAuthLayout
        title="Password reset successful"
        description="Your password has been updated. You can now sign in with your new password."
        footer={
          <Link
            to="/login"
            className="text-sm text-darksilver hover:text-black transition-colors"
          >
            <span className="font-semibold text-black">Back to sign in</span>
          </Link>
        }
      >
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <Link
            to="/login"
            className="w-full"
          >
            <Button
              type="button"
              className="w-full h-11 bg-gradient-to-r from-navy to-royal hover:from-navy hover:to-black text-white shadow-soft"
            >
              <span className="flex items-center gap-2">
                Sign in
                <ArrowRight className="h-4 w-4" />
              </span>
            </Button>
          </Link>
        </div>
      </ModernAuthLayout>
    )
  }

  return (
    <ModernAuthLayout
      title="Reset your password"
      description="Enter your email to receive a reset token"
      footer={
        <Link
          to="/login"
          className="text-sm text-darksilver hover:text-black transition-colors"
        >
          Back to <span className="font-semibold text-black">sign in</span>
        </Link>
      }
    >
      {step === "email" ? (
        <form onSubmit={onEmailSubmit} className="space-y-5">
          {forgotPasswordMutation.error && (
            <Alert variant="danger" className="text-sm">
              {forgotPasswordMutation.error instanceof Error
                ? forgotPasswordMutation.error.message
                : "Failed to send reset token"}
            </Alert>
          )}

          <div className="space-y-2">
            <label htmlFor="forgot-email" className="text-sm font-medium text-black/80">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-darksilver" />
              <Input
                id="forgot-email"
                {...emailForm.register("email")}
                type="email"
                placeholder="email@example.com"
                className="h-11 pl-10 border-silver/30 focus:border-black focus:ring-navy bg-white/50"
                autoComplete="email"
                aria-invalid={Boolean(emailForm.formState.errors.email)}
                aria-describedby={emailForm.formState.errors.email ? "forgot-email-error" : undefined}
              />
            </div>
            {emailForm.formState.errors.email && (
              <p id="forgot-email-error" role="alert" className="text-xs text-red-600 mt-1">
                {emailForm.formState.errors.email.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-11 bg-gradient-to-r from-navy to-royal hover:from-navy hover:to-black text-white shadow-soft"
            disabled={forgotPasswordMutation.isPending}
          >
            {forgotPasswordMutation.isPending ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending reset token...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Send reset token
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </form>
      ) : (
        <form onSubmit={onResetSubmit} className="space-y-5">
          {resetPasswordMutation.error && (
            <Alert variant="danger" className="text-sm">
              {resetPasswordMutation.error instanceof Error
                ? resetPasswordMutation.error.message
                : "Failed to reset password"}
            </Alert>
          )}

          {resetToken && (
            <Alert variant="success" className="text-sm">
              A reset token has been sent to your email.
            </Alert>
          )}

          <div className="space-y-2">
            <label htmlFor="reset-token" className="text-sm font-medium text-black/80">
              Reset token
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-darksilver" />
              <Input
                id="reset-token"
                {...resetForm.register("token")}
                type="text"
                placeholder="Enter the reset token from your email"
                className="h-11 pl-10 border-silver/30 focus:border-black focus:ring-navy bg-white/50"
                aria-invalid={Boolean(resetForm.formState.errors.token)}
                aria-describedby={resetForm.formState.errors.token ? "reset-token-error" : undefined}
              />
            </div>
            {resetForm.formState.errors.token && (
              <p id="reset-token-error" role="alert" className="text-xs text-red-600 mt-1">
                {resetForm.formState.errors.token.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="reset-password" className="text-sm font-medium text-black/80">
              New password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-darksilver" />
              <Input
                id="reset-password"
                {...resetForm.register("newPassword")}
                type={showPassword ? "text" : "password"}
                placeholder="Enter your new password"
                className="h-11 pl-10 pr-10 border-silver/30 focus:border-black focus:ring-navy bg-white/50"
                autoComplete="new-password"
                aria-invalid={Boolean(resetForm.formState.errors.newPassword)}
                aria-describedby={resetForm.formState.errors.newPassword ? "reset-password-error" : undefined}
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
            {resetForm.formState.errors.newPassword && (
              <p id="reset-password-error" role="alert" className="text-xs text-red-600 mt-1">
                {resetForm.formState.errors.newPassword.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full h-11 bg-gradient-to-r from-navy to-royal hover:from-navy hover:to-black text-white shadow-soft"
            disabled={resetPasswordMutation.isPending}
          >
            {resetPasswordMutation.isPending ? (
              <span className="flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Resetting password...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Reset password
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>

          <button
            type="button"
            onClick={() => setStep("email")}
            className="w-full text-sm text-darksilver hover:text-black transition-colors"
          >
            Use a different email
          </button>
        </form>
      )}
    </ModernAuthLayout>
  )
}
