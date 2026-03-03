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
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { useRef, useState } from "react"
import * as React from "react"
import {
  Camera,
  Trash2,
  Eye,
  EyeOff,
  Mail,
  Calendar,
  Hash,
  CheckCircle2,
  Lock,
  Edit,
  Save,
  X,
} from "lucide-react"
import { getStoredUser, updateStoredUser, getUserDisplayName } from "../lib/auth"
import { AvatarFrameType } from "../lib/avatar"
import { cn } from "../lib/utils"

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

const roleLabels: Record<string, string> = {
  ADMIN: "Administrator",
  IMPLEMENTOR: "Implementor",
  CADET_OFFICER: "Cadet Officer",
  STUDENT: "Student",
}

const roleAccents: Record<string, { bg: string; text: string; dot: string }> = {
  ADMIN:         { bg: "bg-violet-50",  text: "text-violet-600",  dot: "bg-violet-400" },
  IMPLEMENTOR:   { bg: "bg-sky-50",     text: "text-sky-600",     dot: "bg-sky-400" },
  CADET_OFFICER: { bg: "bg-amber-50",   text: "text-amber-600",   dot: "bg-amber-400" },
  STUDENT:       { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-400" },
}

function PasswordInput({
  show,
  onToggle,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  show: boolean
  onToggle: () => void
  error?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative">
        <Input type={show ? "text" : "password"} className="pr-10" {...props} />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="text-xs text-rose-500">{error}</p>}
    </div>
  )
}

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
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const { data: profileData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["profile"],
    queryFn: () => apiRequest<ApiResponse<any>>("/api/auth/profile"),
    refetchInterval: 10000,
    retry: false
  })

  // Update avatar when profile data changes
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
    defaultValues: {
      firstName: "",
      lastName: "",
      middleName: "",
      contactNo: "",
      address: "",
      birthDate: "",
      gender: "",
    }
  })

  // Update form when profile data loads
  React.useEffect(() => {
    if (profileData?.data?.profile) {
      const profile = profileData.data.profile
      profileForm.reset({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        middleName: profile.middleName || "",
        contactNo: profile.contactNo || "",
        address: profile.address || "",
        birthDate: profile.birthDate ? new Date(profile.birthDate).toISOString().split('T')[0] : "",
        gender: profile.gender || "",
      })
    }
  }, [profileData, profileForm])

  const passwordMutation = useMutation({
    mutationFn: (values: PasswordFormValues) =>
      apiRequest<ApiResponse<any>>("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      toast.success("Password updated")
      passwordForm.reset()
      setIsChangingPassword(false)
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to update password")
    },
  })

  const profileMutation = useMutation({
    mutationFn: (values: ProfileFormValues) =>
      apiRequest<ApiResponse<any>>("/api/auth/profile", {
        method: "PATCH",
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      toast.success("Profile updated successfully")
      setIsEditingProfile(false)
      refetch()
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to update profile")
    },
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
  const createdAt = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : null

  const displayName =
    roleProfile?.firstName && roleProfile?.lastName
      ? `${roleProfile.firstName} ${roleProfile.lastName}`
      : storedUser
      ? getUserDisplayName(storedUser)
      : "Guest"

  const accent = roleAccents[role] ?? roleAccents.STUDENT

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setImageToCrop(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleCropComplete = async (croppedImage: string) => {
    setImageToCrop(null)
    setIsUploadingAvatar(true)
    try {
      await apiRequest<ApiResponse<any>>("/api/auth/avatar", {
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
      await apiRequest<ApiResponse<any>>("/api/auth/avatar", { method: "DELETE" })
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
      await apiRequest<ApiResponse<any>>("/api/auth/avatar-frame", {
        method: "PATCH",
        body: JSON.stringify({ avatarFrame: frame }),
      })
      updateStoredUser({ avatarFrame: frame })
      toast.success("Avatar frame updated")
      // Refetch profile to ensure sync
      refetch()
    } catch (err) {
      // Revert on error
      setSelectedFrame(previousFrame)
      const errorMessage = err instanceof Error ? err.message : "Failed to update frame"
      toast.error(errorMessage)
      console.error("Frame update error:", err)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Profile Settings</h1>
          <p className="mt-2 text-sm text-slate-600">Manage your account information and customize your profile appearance</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm sticky top-6">
              {/* Header Background */}
              <div className={cn("h-20 relative", accent.bg)}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/5" />
              </div>

              <div className="px-6 pb-6">
                {isError ? (
                  <div className="text-center text-sm text-red-600 mt-4">
                    {(error as Error).message === "Unauthorized"
                      ? "Please log out and log back in."
                      : "Unable to load profile."}
                  </div>
                ) : isLoading ? (
                  <div className="flex flex-col items-center gap-4 -mt-10">
                    <div className="h-20 w-20 animate-pulse rounded-full bg-slate-100 ring-4 ring-white" />
                    <div className="h-5 w-32 animate-pulse rounded bg-slate-100" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center">
                    {/* Avatar */}
                    <div className="-mt-10 mb-4 ring-4 ring-white rounded-full">
                      <AvatarWithRing user={storedUser} size="xl" frameType={selectedFrame} showStatusDot={true} />
                    </div>

                    <h2 className="text-xl font-bold text-slate-900">{displayName}</h2>
                    <span className={cn("mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold", accent.bg, accent.text)}>
                      {roleLabels[role] ?? role}
                    </span>

                    {/* Status */}
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                      <CheckCircle2 className={cn("h-3.5 w-3.5", isActive ? "text-emerald-500" : "text-slate-300")} />
                      {isActive ? "Active Account" : "Inactive"}
                    </div>

                    {/* Quick Info */}
                    <div className="mt-6 w-full space-y-3 text-left bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-xs">
                        <Mail className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                        <span className="text-slate-600 truncate">{email}</span>
                      </div>
                      {roleProfile?.studentNo && (
                        <div className="flex items-center gap-2 text-xs">
                          <Hash className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                          <span className="text-slate-600">{roleProfile.studentNo}</span>
                        </div>
                      )}
                      {createdAt && (
                        <div className="flex items-center gap-2 text-xs">
                          <Calendar className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                          <span className="text-slate-600">Joined {createdAt}</span>
                        </div>
                      )}
                    </div>

                    {/* Avatar Actions */}
                    <div className="mt-6 flex gap-2 w-full">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all disabled:opacity-50"
                      >
                        <Camera className="h-4 w-4" />
                        {isUploadingAvatar ? "Uploading..." : "Change Photo"}
                      </button>
                      {avatarPreview && (
                        <button
                          onClick={handleAvatarReset}
                          disabled={isUploadingAvatar}
                          className="flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-600 hover:bg-red-100 hover:border-red-300 transition-all disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {/* Frame Selector */}
                    <div className="mt-6 w-full pt-6 border-t border-slate-200">
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

          {/* Right Column - Forms */}
          <div className="lg:col-span-8 space-y-6">{/* Account Information */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Account Information</h3>
                  <p className="text-xs text-slate-500 mt-1">Update your personal details</p>
                </div>
                {!isEditingProfile && (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </button>
                )}
              </div>

              {isEditingProfile ? (
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                        First name *
                      </label>
                      <Input {...profileForm.register("firstName")} placeholder="First name" />
                      {profileForm.formState.errors.firstName && (
                        <p className="text-xs text-rose-500">{profileForm.formState.errors.firstName.message}</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                        Last name *
                      </label>
                      <Input {...profileForm.register("lastName")} placeholder="Last name" />
                      {profileForm.formState.errors.lastName && (
                        <p className="text-xs text-rose-500">{profileForm.formState.errors.lastName.message}</p>
                      )}
                    </div>
                    {role === "STUDENT" && (
                      <>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                            Middle name
                          </label>
                          <Input {...profileForm.register("middleName")} placeholder="Middle name" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                            Gender
                          </label>
                          <Select {...profileForm.register("gender")}>
                            <option value="">Select gender</option>
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                          </Select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                            Birth date
                          </label>
                          <Input type="date" {...profileForm.register("birthDate")} />
                        </div>
                      </>
                    )}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                        Contact number
                      </label>
                      <Input {...profileForm.register("contactNo")} placeholder="Contact number" />
                    </div>
                    {role === "STUDENT" && (
                      <div className="flex flex-col gap-1.5 sm:col-span-2">
                        <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                          Address
                        </label>
                        <Input {...profileForm.register("address")} placeholder="Address" />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingProfile(false)
                        profileForm.reset()
                      }}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </button>
                    <Button type="submit" size="sm" disabled={profileMutation.isPending}>
                      <Save className="h-3.5 w-3.5 mr-1" />
                      {profileMutation.isPending ? "Saving…" : "Save Changes"}
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      { label: "Email address", value: email, note: "Cannot be changed" },
                      { label: "Account role", value: roleLabels[role] ?? role, note: "Assigned by administrator" },
                      ...(roleProfile?.studentNo  ? [{ label: "Student ID No.", value: roleProfile.studentNo, note: "Cannot be changed" }] : []),
                      ...(roleProfile?.firstName ? [{ label: "First name", value: roleProfile.firstName, note: null }] : []),
                      ...(roleProfile?.lastName  ? [{ label: "Last name",  value: roleProfile.lastName,  note: null }] : []),
                      ...(roleProfile?.middleName ? [{ label: "Middle name", value: roleProfile.middleName, note: null }] : []),
                    ].map(({ label, value, note }) => (
                      <div key={label} className="flex flex-col gap-1">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</p>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                          <p className="text-sm font-medium text-slate-800">{value ?? "—"}</p>
                        </div>
                        {note && <p className="text-[10px] text-slate-500">{note}</p>}
                      </div>
                    ))}
                  </div>

                  <p className="mt-5 text-xs text-slate-500">
                    Click "Edit" to update your personal information.
                  </p>
                </>
              )}
            </div>

            {/* Security / password */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Security</h3>
                  <p className="text-xs text-slate-500 mt-1">Change your login password</p>
                </div>
                {!isChangingPassword && (
                  <button
                    onClick={() => setIsChangingPassword(true)}
                    className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all"
                  >
                    <Lock className="h-4 w-4" />
                    Change
                  </button>
                )}
              </div>

              {isChangingPassword ? (
                <form
                  onSubmit={passwordForm.handleSubmit((v) => passwordMutation.mutateAsync(v))}
                  className="flex flex-col gap-4"
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                        Current password
                      </label>
                      <PasswordInput
                        placeholder="Current password"
                        show={showCurrent}
                        onToggle={() => setShowCurrent((p) => !p)}
                        error={passwordForm.formState.errors.currentPassword?.message}
                        {...passwordForm.register("currentPassword")}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                        New password
                      </label>
                      <PasswordInput
                        placeholder="New password"
                        show={showNew}
                        onToggle={() => setShowNew((p) => !p)}
                        error={passwordForm.formState.errors.newPassword?.message}
                        {...passwordForm.register("newPassword")}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => { setIsChangingPassword(false); passwordForm.reset() }}
                      className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </button>
                    <Button type="submit" size="sm" disabled={passwordMutation.isPending}>
                      <Save className="h-3.5 w-3.5 mr-1" />
                      {passwordMutation.isPending ? "Updating…" : "Update Password"}
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-700">Password</p>
                      <p className="mt-0.5 text-xs text-slate-500">Last changed: unknown</p>
                    </div>
                    <span className="font-mono text-sm tracking-widest text-slate-300">••••••••</span>
                  </div>
                </div>
              )}
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
