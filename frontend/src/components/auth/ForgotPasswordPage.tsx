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
import { Mail, KeyRound, Lock, Eye, EyeOff, ArrowRight, CheckCircle, ShieldCheck } from "lucide-react"

const emailSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email")
})

const resetSchema = z
  .object({
    code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Please confirm your password")
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
  })

type EmailFormValues = z.infer<typeof emailSchema>
type ResetFormValues = z.infer<typeof resetSchema>

export function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "otp" | "done">("email")
  const [otp, setOtp] = useState("")
  const [ticket, setTicket] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: "" }
  })

  const resetForm = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { code: "", newPassword: "", confirmPassword: "" }
  })

  const forgotPasswordMutation = useMutation({
    mutationFn: (values: EmailFormValues) =>
      apiRequest<ApiResponse<{ otp: string; ticket: string }>>(
        "/api/auth/forgot-password",
        { method: "POST", body: JSON.stringify(values) }
      ),
    onSuccess: (response) => {
      if (response.data?.otp && response.data.ticket) {
        setOtp(response.data.otp)
        setTicket(response.data.ticket)
        toast.success("Verification code generated")
        setStep("otp")
      } else {
        toast.info("If an account exists with this email, a reset code has been generated.")
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to generate reset code")
    }
  })

  const resetPasswordMutation = useMutation({
    mutationFn: (values: ResetFormValues) =>
      apiRequest<ApiResponse<void>>(
        "/api/auth/reset-password",
        { method: "POST", body: JSON.stringify({ ...values, ticket }) }
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
      description={step === "email" ? "Enter your email to receive a verification code" : "Enter the verification code and your new password"}
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
                : "Failed to generate reset code"}
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
                Generating code...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                Get verification code
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

          {otp && (
            <div className="rounded-xl border border-silver/30 bg-silver/10 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-darksilver uppercase tracking-wider">
                <ShieldCheck className="h-3.5 w-3.5" />
                Your verification code
              </div>
              <div className="flex justify-center gap-2">
                {otp.split("").map((digit, i) => (
                  <span
                    key={i}
                    className="flex h-11 w-9 items-center justify-center rounded-lg border border-silver/40 bg-white text-lg font-bold text-navy shadow-sm"
                  >
                    {digit}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-darksilver text-center">
                Demo mode: the code is shown here instead of being emailed. Valid for 10 minutes.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="reset-code" className="text-sm font-medium text-black/80">
              Verification code
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-darksilver" />
              <Input
                id="reset-code"
                {...resetForm.register("code")}
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit code"
                className="h-11 pl-10 border-silver/30 focus:border-black focus:ring-navy bg-white/50 tracking-widest"
                aria-invalid={Boolean(resetForm.formState.errors.code)}
                aria-describedby={resetForm.formState.errors.code ? "reset-code-error" : undefined}
              />
            </div>
            {resetForm.formState.errors.code && (
              <p id="reset-code-error" role="alert" className="text-xs text-red-600 mt-1">
                {resetForm.formState.errors.code.message}
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

          <div className="space-y-2">
            <label htmlFor="reset-confirm-password" className="text-sm font-medium text-black/80">
              Confirm new password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-darksilver" />
              <Input
                id="reset-confirm-password"
                {...resetForm.register("confirmPassword")}
                type={showPassword ? "text" : "password"}
                placeholder="Confirm your new password"
                className="h-11 pl-10 border-silver/30 focus:border-black focus:ring-navy bg-white/50"
                autoComplete="new-password"
                aria-invalid={Boolean(resetForm.formState.errors.confirmPassword)}
                aria-describedby={resetForm.formState.errors.confirmPassword ? "reset-confirm-password-error" : undefined}
              />
            </div>
            {resetForm.formState.errors.confirmPassword && (
              <p id="reset-confirm-password-error" role="alert" className="text-xs text-red-600 mt-1">
                {resetForm.formState.errors.confirmPassword.message}
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
            onClick={() => {
              setStep("email")
              setOtp("")
              setTicket("")
              resetForm.reset()
            }}
            className="w-full text-sm text-darksilver hover:text-black transition-colors"
          >
            Use a different email
          </button>
        </form>
      )}
    </ModernAuthLayout>
  )
}
