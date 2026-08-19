import { useMutation, useQuery } from "@tanstack/react-query"
import { apiRequest } from "../lib/api"
import { ApiResponse } from "../types"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Select } from "../components/ui/select"
import { ConfirmDialog } from "../components/ui/confirm-dialog"
import { ImageCropper } from "../components/ui/image-cropper"
import { AvatarWithRing } from "../components/ui/avatar-with-ring"
import { AvatarFrameSelector } from "../components/ui/avatar-frame-selector"
import { useForm } from "react-hook-form"
import { useUnsavedChanges } from "../hooks/useUnsavedChanges"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useRef, useState, useMemo } from "react"
import * as React from "react"
import {
  Camera, Trash2, Eye, EyeOff, Mail, Calendar, Hash, CheckCircle2, Lock, Edit, Save, X, Shield, Clock, Smartphone, MapPin, Cake, User, Sparkles, ChevronRight, Globe, Key, LogOut, RefreshCw, Circle
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { getStoredUser, updateStoredUser, getUserDisplayName } from "../lib/auth"
import { AvatarFrameType } from "../lib/avatar"
import { cn } from "../lib/utils"
import { relativeTime } from "../lib/display"

const passwordSchema = z.object({
  currentPassword: z.string().min(8, "At least 8 characters required"),
  newPassword: z.string().min(8, "At least 8 characters required"),
})
type PasswordFormValues = z.infer<typeof passwordSchema>

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  middleName: z.string().optional(),
  contactNo: z.string().optional(),
  address: z.string().optional(),
  birthDate: z.string().optional(),
  gender: z.string().optional(),
})
type ProfileFormValues = z.infer<typeof profileSchema>

type ProfileResponse = {
  id: string
  email: string
  role: "ADMIN" | "IMPLEMENTOR" | "CADET_OFFICER" | "STUDENT"
  isActive: boolean
  avatarUrl?: string | null
  avatarFrame?: string | null
  createdAt: string
  passwordUpdatedAt: string
  profile?: {
    firstName?: string | null
    lastName?: string | null
    middleName?: string | null
    contactNo?: string | null
    address?: string | null
    birthDate?: string | null
    gender?: string | null
    studentNo?: string | null
  } | null
}

const roleLabels: Record<string, string> = {
  ADMIN: "Administrator",
  IMPLEMENTOR: "Implementor",
  CADET_OFFICER: "Cadet Officer",
  STUDENT: "Student",
}

const roleAccents: Record<string, { bg: string; text: string; dot: string; gradient: string; light: string; dark: string; ring: string }> = {
  ADMIN:         { bg: "bg-violet-50",  text: "text-violet-600",  dot: "bg-violet-400",  gradient: "from-violet-600 via-violet-500 to-purple-700",  light: "bg-violet-500/10", dark: "bg-violet-950", ring: "ring-violet-500/30" },
  IMPLEMENTOR:   { bg: "bg-sky-50",     text: "text-royal",     dot: "bg-sky-400",     gradient: "from-sky-600 via-sky-500 to-blue-700",      light: "bg-royal/10",   dark: "bg-sky-950",   ring: "ring-sky-500/30" },
  CADET_OFFICER: { bg: "bg-amber-50",   text: "text-amber-600",   dot: "bg-amber-400",   gradient: "from-amber-600 via-amber-500 to-orange-700", light: "bg-amber-500/10", dark: "bg-amber-950", ring: "ring-amber-500/30" },
  STUDENT:       { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-400", gradient: "from-emerald-600 via-emerald-500 to-teal-700", light: "bg-emerald-500/10", dark: "bg-emerald-950", ring: "ring-emerald-500/30" },
}

const roleIcons: Record<string, typeof Shield> = {
  ADMIN: Shield,
  IMPLEMENTOR: Shield,
  CADET_OFFICER: Shield,
  STUDENT: User,
}

const strengthLabels = ["Weak", "Fair", "Good", "Strong", "Very Strong"]
const strengthColors = ["bg-red-500", "bg-orange-500", "bg-amber-500", "bg-emerald-500", "bg-emerald-600"]

function getPasswordStrength(pw: string): number {
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[a-z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return Math.min(score, strengthLabels.length - 1)
}

function PasswordInput({
  show, onToggle, error, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  show: boolean
  onToggle: () => void
  error?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative group">
        <Input type={show ? "text" : "password"} className="h-12 pl-4 pr-12 bg-white border-silver/30 focus:border-black focus:ring-navy transition-all" {...props} />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-darksilver hover:text-darksilver transition-colors"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}

function FieldCard({ icon: Icon, label, value, note }: { icon: LucideIcon; label: string; value: string; note?: string | null }) {
  return (
    <div className="group flex items-start gap-3 rounded-xl border border-silver/20 bg-white p-4 transition-all duration-200 hover:border-silver/30 hover:shadow-soft">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-darksilver transition-colors group-hover:bg-silver/20">
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-darksilver">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-black/80 break-all">{value || "—"}</p>
        {note && <p className="mt-0.5 text-[10px] text-darksilver">{note}</p>}
      </div>
    </div>
  )
}

type TabId = "account" | "security"

export function ProfilePage() {
  const storedUser = getStoredUser()
  const [avatarPreview, setAvatarPreview] = useState<string | null>(storedUser?.avatarUrl ?? null)
  const [selectedFrame, setSelectedFrame] = useState<AvatarFrameType>((storedUser?.avatarFrame as AvatarFrameType) || "gradient")
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [pendingProfileData, setPendingProfileData] = useState<ProfileFormValues | null>(null)
  const [imageToCrop, setImageToCrop] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabId>("account")
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const { data: profileData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["profile"],
    queryFn: () => apiRequest<ApiResponse<ProfileResponse>>("/api/auth/profile"),
    refetchInterval: 10000,
    retry: false
  })

  React.useEffect(() => {
    if (profileData?.data?.avatarUrl) {
      setAvatarPreview(profileData.data.avatarUrl)
      updateStoredUser({ avatarUrl: profileData.data.avatarUrl })
    }
    if (profileData?.data?.avatarFrame) {
      setSelectedFrame(profileData.data.avatarFrame as AvatarFrameType)
      updateStoredUser({ avatarFrame: profileData.data.avatarFrame })
    }
  }, [profileData])

  const passwordForm = useForm<PasswordFormValues>({ resolver: zodResolver(passwordSchema) })
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: "", lastName: "", middleName: "", contactNo: "", address: "", birthDate: "", gender: "" }
  })
  useUnsavedChanges(
    (isEditingProfile && profileForm.formState.isDirty) ||
    (isChangingPassword && passwordForm.formState.isDirty)
  )

  React.useEffect(() => {
    if (profileData?.data?.profile) {
      const p = profileData.data.profile
      profileForm.reset({
        firstName: p.firstName || "",
        lastName: p.lastName || "",
        middleName: p.middleName || "",
        contactNo: p.contactNo || "",
        address: p.address || "",
        birthDate: p.birthDate ? new Date(p.birthDate).toISOString().split('T')[0] : "",
        gender: p.gender || "",
      })
    }
  }, [profileData, profileForm])

  const passwordMutation = useMutation({
    mutationFn: (values: PasswordFormValues) =>
      apiRequest<ApiResponse<never>>("/api/auth/change-password", { method: "POST", body: JSON.stringify(values) }),
    onSuccess: () => { toast.success("Password updated"); passwordForm.reset(); setIsChangingPassword(false) },
    onError: (error) => { toast.error(error instanceof Error ? error.message : "Unable to update password") }
  })

  const profileMutation = useMutation({
    mutationFn: (values: ProfileFormValues) =>
      apiRequest<ApiResponse<never>>("/api/auth/profile", { method: "PATCH", body: JSON.stringify(values) }),
    onSuccess: () => { toast.success("Profile updated successfully"); setIsEditingProfile(false); refetch() },
    onError: (error) => { toast.error(error instanceof Error ? error.message : "Unable to update profile") }
  })

  const handleProfileSubmit = profileForm.handleSubmit((values) => {
    setPendingProfileData(values)
    setShowConfirmDialog(true)
  })

  const confirmProfileUpdate = () => {
    if (pendingProfileData) {
      profileMutation.mutate(pendingProfileData)
      setShowConfirmDialog(false)
      setPendingProfileData(null)
    }
  }

  const profile = profileData?.data
  const roleProfile = profile?.profile
  const email = profile?.email ?? storedUser?.email ?? "—"
  const role = profile?.role ?? storedUser?.role ?? "STUDENT"
  const isActive = profile?.isActive ?? true
  const createdAt = profile?.createdAt ? new Date(profile.createdAt) : null
  const formattedCreatedAt = createdAt ? createdAt.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : null

  const displayName = roleProfile?.firstName && roleProfile?.lastName
    ? `${roleProfile.firstName} ${roleProfile.lastName}`
    : storedUser ? getUserDisplayName(storedUser) : "Guest"

  const accent = roleAccents[role] ?? roleAccents.STUDENT
  const RoleIcon = roleIcons[role] ?? Shield
  const hour = new Date().getHours()
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"

  const watchedPassword = passwordForm.watch("newPassword")
  const strength = watchedPassword ? getPasswordStrength(watchedPassword) : -1

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }
    const reader = new FileReader()
    reader.onload = () => { setImageToCrop(reader.result as string) }
    reader.readAsDataURL(file)
  }

  const handleCropComplete = async (croppedImage: string) => {
    setImageToCrop(null)
    setIsUploadingAvatar(true)
    try {
      await apiRequest<ApiResponse<{ avatarUrl: string }>>("/api/auth/avatar", {
        method: "PATCH",
        body: JSON.stringify({ avatarUrl: croppedImage }),
      })
      setAvatarPreview(croppedImage)
      updateStoredUser({ avatarUrl: croppedImage })
      toast.success("Profile photo updated")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save photo")
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e)
  }

  const handleAvatarReset = async () => {
    setIsUploadingAvatar(true)
    try {
      await apiRequest<ApiResponse<never>>("/api/auth/avatar", { method: "DELETE" })
      setAvatarPreview(null)
      updateStoredUser({ avatarUrl: undefined })
      toast.success("Profile photo removed")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove photo")
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleFrameChange = async (frame: AvatarFrameType) => {
    const previousFrame = selectedFrame
    setSelectedFrame(frame)
    try {
      await apiRequest<ApiResponse<{ avatarFrame: string }>>("/api/auth/avatar-frame", {
        method: "PATCH",
        body: JSON.stringify({ avatarFrame: frame }),
      })
      updateStoredUser({ avatarFrame: frame })
      toast.success("Avatar frame updated")
      refetch()
    } catch (err) {
      setSelectedFrame(previousFrame)
      toast.error(err instanceof Error ? err.message : "Failed to update frame")
    }
  }

  const tabs: { id: TabId; label: string; icon: LucideIcon }[] = [
    { id: "account", label: "Account", icon: User },
    { id: "security", label: "Security", icon: Lock },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-white/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-10 animate-fade-in">

        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-royal to-navy px-6 sm:px-10 py-8 mb-8 shadow-elevated">
          <div className="absolute inset-0 bg-grid opacity-[0.06]" />
          <div className="absolute -top-32 -right-32 h-80 w-80 rounded-full bg-gold/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-royal/10 blur-3xl" />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20">
              <User className="h-7 w-7 sm:h-8 sm:w-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-gold text-xs font-medium uppercase tracking-wider mb-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{greeting}, {displayName?.split(" ")[0] || "there"}</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Profile Settings</h1>
              <p className="mt-1 text-sm text-silver max-w-2xl">Manage your account information, security, and customize your profile appearance.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4 lg:sticky lg:top-6 self-start">
            <div className="bg-white rounded-2xl border border-silver/30 overflow-hidden shadow-elevated transition-all duration-200 hover:shadow-elevated">
              <div className={cn("h-28 relative overflow-hidden bg-gradient-to-br", accent.gradient)}>
                <div className="absolute inset-0 bg-grid opacity-[0.08]" />
                <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
              </div>

              <div className="px-6 pb-6">
                {isError ? (
                  <div className="flex flex-col items-center justify-center gap-4 py-8">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
                      <Shield className="h-6 w-6 text-red-400" />
                    </span>
                    <div className="text-center">
                      <p className="text-sm font-semibold text-black">Failed to load profile</p>
                      <p className="mt-1 text-xs text-darksilver">{(error as Error).message === "Unauthorized" ? "Session expired. Please log in again." : "Unable to load profile."}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => refetch()} className="mt-1">
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                      Retry
                    </Button>
                  </div>
                ) : isLoading ? (
                  <div className="flex flex-col items-center gap-4 -mt-14">
                    <div className="h-28 w-28 animate-pulse rounded-full bg-silver/20 ring-4 ring-white" />
                    <div className="h-6 w-40 animate-pulse rounded-lg bg-silver/20" />
                    <div className="h-5 w-24 animate-pulse rounded-full bg-silver/20" />
                    <div className="mt-4 w-full space-y-3">
                      {[1,2,3].map((i) => (
                        <div key={i} className="h-10 w-full animate-pulse rounded-xl bg-white" />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center">
                    <div className="-mt-14 mb-5 ring-4 ring-white rounded-full transition-transform duration-300 hover:scale-105">
                      <AvatarWithRing user={storedUser} size="xl" frameType={selectedFrame} showStatusDot={true} />
                    </div>

                    <h2 className="text-xl font-bold text-black">{displayName}</h2>
                    <span className={cn("mt-2 inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold shadow-soft", accent.bg, accent.text)}>
                      <RoleIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
                      {roleLabels[role] ?? role}
                    </span>

                    <div className="mt-3 flex items-center gap-2 text-xs text-darksilver">
                      <span className={cn("flex h-2 w-2 rounded-full", isActive ? "bg-emerald-500 animate-pulse" : "bg-silver/40")} />
                      {isActive ? "Active Account" : "Inactive"}
                    </div>

                    <div className="mt-6 w-full space-y-2.5">
                      {[
                        { icon: Mail, label: email, sub: "Email address" },
                        ...(roleProfile?.studentNo ? [{ icon: Hash, label: roleProfile.studentNo, sub: "Student ID" }] : []),
                        ...(formattedCreatedAt ? [{ icon: Calendar, label: formattedCreatedAt, sub: "Joined" }] : []),
                      ].map(({ icon: Icon, label, sub }, i) => (
                        <div key={i} className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 transition-all duration-200 hover:bg-silver/20/70">
                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-soft">
                            <Icon className="h-3.5 w-3.5 text-darksilver" />
                          </span>
                          <div className="min-w-0 text-left flex-1">
                            <p className="text-[10px] font-semibold uppercase tracking-widest text-darksilver">{sub}</p>
                            <p className="text-xs font-medium text-black/80 truncate">{label}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {createdAt && (
                      <div className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl border border-silver/20 bg-gradient-to-r from-transparent via-white/50 to-transparent px-4 py-2.5">
                        <Clock className="h-3.5 w-3.5 text-darksilver" />
                        <span className="text-[10px] font-medium text-darksilver tracking-wide uppercase">Member for {relativeTime(createdAt.toISOString())}</span>
                      </div>
                    )}

                    <div className="mt-6 flex gap-2 w-full">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-silver/30 bg-white px-4 py-3 text-xs font-semibold text-black/80 hover:bg-silver/10 hover:border-silver/40 transition-all disabled:opacity-50 shadow-soft hover:shadow-card-hover"
                      >
                        {isUploadingAvatar ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Camera className="h-4 w-4" />
                        )}
                        {isUploadingAvatar ? "Uploading..." : "Photo"}
                      </button>
                      {avatarPreview && (
                        <button
                          onClick={handleAvatarReset}
                          disabled={isUploadingAvatar}
                          className="flex items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-medium text-red-600 hover:bg-red-100 hover:border-red-200 transition-all disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="mt-6 w-full pt-6 border-t border-silver/20">
                      <div className="text-left mb-3">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-darksilver">Avatar Frame</p>
                      </div>
                      <AvatarFrameSelector
                        user={storedUser}
                        selectedFrame={selectedFrame}
                        onSelectFrame={handleFrameChange}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-2xl border border-silver/30 overflow-hidden shadow-elevated">
              <div className="border-b border-silver/20">
                <div className="flex">
                  {tabs.map(({ id, label, icon: TabIcon }) => (
                    <button
                      key={id}
                      onClick={() => setActiveTab(id)}
                      className={cn(
                        "relative flex items-center gap-2 px-5 sm:px-6 py-4 text-sm font-medium transition-all duration-200",
                        activeTab === id
                          ? "text-black"
                          : "text-darksilver hover:text-darksilver"
                      )}
                    >
                      {activeTab === id && (
                        <div className={cn("absolute inset-x-0 bottom-0 h-0.5", accent.dot.replace("bg-", "bg-"))} />
                      )}
                      <TabIcon className="h-4 w-4" strokeWidth={activeTab === id ? 2.5 : 1.75} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-5 sm:p-7">
                {activeTab === "account" && (
                  <div className="animate-fade-in">
                    <div className="flex items-center justify-between mb-7">
                      <div>
                        <h3 className="text-lg font-bold text-black">Account Information</h3>
                        <p className="text-sm text-darksilver mt-0.5">Update your personal details</p>
                      </div>
                      {!isEditingProfile && (
                        <button
                          onClick={() => setIsEditingProfile(true)}
                          className="flex items-center gap-2 rounded-xl border border-silver/30 bg-white px-4 py-2.5 text-sm font-semibold text-black/80 hover:bg-silver/10 hover:border-silver/40 transition-all shadow-soft hover:shadow-card-hover"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </button>
                      )}
                    </div>

                    {isEditingProfile ? (
                      <form onSubmit={handleProfileSubmit}>
                        <div className="grid gap-5 sm:grid-cols-2">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-semibold uppercase tracking-widest text-darksilver">First name *</label>
                            <Input {...profileForm.register("firstName")} placeholder="First name" className="h-12 bg-white border-silver/30 focus:border-black focus:ring-navy" />
                            {profileForm.formState.errors.firstName && <p className="text-xs text-red-500">{profileForm.formState.errors.firstName.message}</p>}
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-semibold uppercase tracking-widest text-darksilver">Last name *</label>
                            <Input {...profileForm.register("lastName")} placeholder="Last name" className="h-12 bg-white border-silver/30 focus:border-black focus:ring-navy" />
                            {profileForm.formState.errors.lastName && <p className="text-xs text-red-500">{profileForm.formState.errors.lastName.message}</p>}
                          </div>
                          {role === "STUDENT" && (
                            <>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-semibold uppercase tracking-widest text-darksilver">Middle name</label>
                                <Input {...profileForm.register("middleName")} placeholder="Middle name" className="h-12 bg-white border-silver/30 focus:border-black focus:ring-navy" />
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-semibold uppercase tracking-widest text-darksilver">Gender</label>
                                <Select {...profileForm.register("gender")} className="h-12 bg-white border-silver/30">
                                  <option value="">Select gender</option>
                                  <option value="MALE">Male</option>
                                  <option value="FEMALE">Female</option>
                                </Select>
                              </div>
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-semibold uppercase tracking-widest text-darksilver">Birth date</label>
                                <Input type="date" {...profileForm.register("birthDate")} className="h-12 bg-white border-silver/30 focus:border-black focus:ring-navy" />
                              </div>
                            </>
                          )}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-semibold uppercase tracking-widest text-darksilver">Contact number</label>
                            <Input {...profileForm.register("contactNo")} placeholder="+63 912 345 6789" className="h-12 bg-white border-silver/30 focus:border-black focus:ring-navy" />
                          </div>
                          {role === "STUDENT" && (
                            <div className="flex flex-col gap-1.5 sm:col-span-2">
                              <label className="text-[10px] font-semibold uppercase tracking-widest text-darksilver">Address</label>
                              <Input {...profileForm.register("address")} placeholder="House No., Street, Barangay, City" className="h-12 bg-white border-silver/30 focus:border-black focus:ring-navy" />
                            </div>
                          )}
                        </div>

                        <div className="flex justify-end gap-3 mt-7 pt-5 border-t border-silver/20">
                          <button
                            type="button"
                            onClick={() => { setIsEditingProfile(false); profileForm.reset() }}
                            className="flex items-center gap-2 rounded-xl border border-silver/30 bg-white px-5 py-2.5 text-sm font-medium text-black/80 hover:bg-silver/10 transition-all"
                          >
                            <X className="h-4 w-4" />
                            Cancel
                          </button>
                          <Button type="submit" disabled={profileMutation.isPending} className="h-auto bg-gradient-to-r from-navy to-royal hover:from-navy hover:to-black text-white shadow-soft px-5 py-2.5">
                            {profileMutation.isPending ? (
                              <span className="flex items-center gap-2">
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                Saving…
                              </span>
                            ) : (
                              <span className="flex items-center gap-2">
                                <Save className="h-4 w-4" />
                                Save Changes
                              </span>
                            )}
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-6">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <FieldCard icon={Mail} label="Email address" value={email} note="Cannot be changed" />
                          <FieldCard icon={Shield} label="Account role" value={roleLabels[role] ?? role} note="Assigned by administrator" />
                          {roleProfile?.studentNo && (
                            <FieldCard icon={Hash} label="Student ID No." value={roleProfile.studentNo} note="Cannot be changed" />
                          )}
                          {roleProfile?.firstName && (
                            <FieldCard icon={User} label="First name" value={roleProfile.firstName} />
                          )}
                          {roleProfile?.lastName && (
                            <FieldCard icon={User} label="Last name" value={roleProfile.lastName} />
                          )}
                          {roleProfile?.middleName && (
                            <FieldCard icon={User} label="Middle name" value={roleProfile.middleName} />
                          )}
                          {roleProfile?.contactNo && (
                            <FieldCard icon={Smartphone} label="Contact number" value={roleProfile.contactNo} />
                          )}
                          {roleProfile?.gender && (
                            <FieldCard icon={User} label="Gender" value={roleProfile.gender === "MALE" ? "Male" : roleProfile.gender === "FEMALE" ? "Female" : roleProfile.gender} />
                          )}
                          {roleProfile?.birthDate && (
                            <FieldCard icon={Cake} label="Birth date" value={new Date(roleProfile.birthDate).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })} />
                          )}
                          {roleProfile?.address && (
                            <FieldCard icon={MapPin} label="Address" value={roleProfile.address} />
                          )}
                        </div>
                        <p className="text-xs text-darksilver flex items-center gap-1.5 pt-2">
                          <Edit className="h-3 w-3" />
                          Click "Edit" above to update your personal information
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "security" && (
                  <div className="animate-fade-in space-y-8">
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-lg font-bold text-black">Password</h3>
                          <p className="text-sm text-darksilver mt-0.5">Change your login password</p>
                        </div>
                        {!isChangingPassword && (
                          <button
                            onClick={() => setIsChangingPassword(true)}
                            className="flex items-center gap-2 rounded-xl border border-silver/30 bg-white px-4 py-2.5 text-sm font-semibold text-black/80 hover:bg-silver/10 hover:border-silver/40 transition-all shadow-soft hover:shadow-card-hover"
                          >
                            <Key className="h-4 w-4" />
                            Change
                          </button>
                        )}
                      </div>

                      {isChangingPassword ? (
                        <form
                          onSubmit={passwordForm.handleSubmit((v) => passwordMutation.mutateAsync(v))}
                          className="space-y-5"
                        >
                          <div className="grid gap-5 sm:grid-cols-2">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-semibold uppercase tracking-widest text-darksilver">Current password</label>
                              <PasswordInput
                                placeholder="Enter current password"
                                show={showCurrent}
                                onToggle={() => setShowCurrent((p) => !p)}
                                error={passwordForm.formState.errors.currentPassword?.message}
                                {...passwordForm.register("currentPassword")}
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-semibold uppercase tracking-widest text-darksilver">New password</label>
                              <PasswordInput
                                placeholder="Enter new password"
                                show={showNew}
                                onToggle={() => setShowNew((p) => !p)}
                                error={passwordForm.formState.errors.newPassword?.message}
                                {...passwordForm.register("newPassword")}
                              />
                            </div>
                          </div>

                          {strength >= 0 && (
                            <div className="rounded-xl border border-silver/20 bg-white/50 p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-semibold text-darksilver">Password strength</span>
                                <span className={cn("text-xs font-bold", strength >= 3 ? "text-emerald-600" : strength >= 2 ? "text-amber-600" : "text-red-600")}>
                                  {strengthLabels[strength]}
                                </span>
                              </div>
                              <div className="flex gap-1">
                                {strengthLabels.map((_, i) => (
                                  <div
                                    key={i}
                                    className={cn(
                                      "h-1.5 flex-1 rounded-full transition-all duration-300",
                                      i <= strength ? strengthColors[strength] : "bg-silver/30"
                                    )}
                                  />
                                ))}
                              </div>
                              <ul className="mt-3 space-y-1">
                                {[
                                  { check: watchedPassword.length >= 8, label: "At least 8 characters" },
                                  { check: /[A-Z]/.test(watchedPassword), label: "One uppercase letter" },
                                  { check: /[a-z]/.test(watchedPassword), label: "One lowercase letter" },
                                  { check: /\d/.test(watchedPassword), label: "One number" },
                                  { check: /[^A-Za-z0-9]/.test(watchedPassword), label: "One special character" },
                                ].map(({ check, label }) => (
                                  <li key={label} className="flex items-center gap-2 text-xs">
                                    <span className={cn("flex h-3.5 w-3.5 items-center justify-center", check ? "text-emerald-500" : "text-silver")}>
                                      <Circle className={cn("h-3 w-3", check && "fill-emerald-500")} strokeWidth={check ? 0 : 1.5} />
                                    </span>
                                    <span className={check ? "text-black/80" : "text-darksilver"}>{label}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          <div className="flex justify-end gap-3 pt-2 border-t border-silver/20">
                            <button
                              type="button"
                              onClick={() => { setIsChangingPassword(false); passwordForm.reset() }}
                              className="flex items-center gap-2 rounded-xl border border-silver/30 bg-white px-5 py-2.5 text-sm font-medium text-black/80 hover:bg-silver/10 transition-all"
                            >
                              <X className="h-4 w-4" />
                              Cancel
                            </button>
                            <Button type="submit" disabled={passwordMutation.isPending} className="h-auto bg-gradient-to-r from-navy to-royal hover:from-navy hover:to-black text-white shadow-soft px-5 py-2.5">
                              {passwordMutation.isPending ? (
                                <span className="flex items-center gap-2">
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                  Updating…
                                </span>
                              ) : (
                                <span className="flex items-center gap-2">
                                  <Save className="h-4 w-4" />
                                  Update Password
                                </span>
                              )}
                            </Button>
                          </div>
                        </form>
                      ) : (
                        <div className="rounded-xl border border-silver/20 bg-white/70 p-5 transition-all duration-200 hover:border-silver/30 hover:shadow-soft">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-soft">
                                <Lock className="h-4.5 w-4.5 text-darksilver" />
                              </span>
                              <div>
                                <p className="text-sm font-semibold text-black/80">Password</p>
                                <p className="text-xs text-darksilver mt-0.5">Last changed: {profile?.passwordUpdatedAt ? relativeTime(profile.passwordUpdatedAt) : "Not changed yet"}</p>
                              </div>
                            </div>
                            <span className="font-mono text-xl tracking-widest text-silver select-none">••••••••</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-silver/20 pt-8">
                      <div>
                        <h3 className="text-lg font-bold text-black">Sessions</h3>
                        <p className="text-sm text-darksilver mt-0.5">Manage your active sessions</p>
                      </div>
                      <div className="mt-5 rounded-xl border border-silver/20 bg-white/70 p-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-soft">
                              <Globe className="h-4.5 w-4.5 text-darksilver" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-black/80">Current session</p>
                              <p className="text-xs text-darksilver mt-0.5">Signed in as {email}</p>
                            </div>
                          </div>
                          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-semibold text-emerald-600">
                            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Active now
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

      {imageToCrop && (
        <ImageCropper
          image={imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={() => setImageToCrop(null)}
        />
      )}

      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title="Confirm Profile Update"
        description="Are you sure you want to update your profile information? This will change your personal details."
        confirmLabel="Update Profile"
        cancelLabel="Cancel"
        onConfirm={confirmProfileUpdate}
      />
    </div>
  )
}
