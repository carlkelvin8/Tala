import { useMutation, useQuery } from "@tanstack/react-query" // Import useMutation for password/profile/avatar updates and useQuery for fetching profile data
import { apiRequest } from "../lib/api" // Import the generic API request helper
import { ApiResponse } from "../types" // Import the generic API response wrapper type
import { Button } from "../components/ui/button" // Import the reusable Button component
import { Input } from "../components/ui/input" // Import the reusable Input component
import { Select } from "../components/ui/select" // Import the Select component for the gender dropdown
import { ConfirmDialog } from "../components/ui/confirm-dialog" // Import the ConfirmDialog for profile update confirmation
import { ImageCropper } from "../components/ui/image-cropper" // Import the ImageCropper for avatar photo editing
import { AvatarWithRing } from "../components/ui/avatar-with-ring" // Import the avatar component with ring/frame support
import { AvatarFrameSelector } from "../components/ui/avatar-frame-selector" // Import the frame selector component
import { useForm } from "react-hook-form" // Import useForm for form state management and validation
import { z } from "zod" // Import zod for schema-based validation
import { zodResolver } from "@hookform/resolvers/zod" // Import the zod adapter for react-hook-form
import { toast } from "sonner" // Import toast for notifications
import { useRef, useState } from "react" // Import useRef for the file input ref and useState for local state
import * as React from "react" // Import all of React for useEffect
import {
  Camera, // Camera icon for the change photo button
  Trash2, // Trash icon for the remove photo button
  Eye, // Eye icon for show password
  EyeOff, // EyeOff icon for hide password
  Mail, // Mail icon for the email field
  Calendar, // Calendar icon for the join date
  Hash, // Hash icon for the student number
  CheckCircle2, // CheckCircle icon for the active status
  Lock, // Lock icon for the change password button
  Edit, // Edit icon for the edit profile button
  Save, // Save icon for the save button
  X, // X icon for the cancel button
} from "lucide-react"
import { getStoredUser, updateStoredUser, getUserDisplayName } from "../lib/auth" // Import auth utilities
import { AvatarFrameType } from "../lib/avatar" // Import the frame type union
import { cn } from "../lib/utils" // Import the cn utility for conditional class merging

// Zod schema for the change password form
const passwordSchema = z.object({
  currentPassword: z.string().min(8, "At least 8 characters required"), // Current password must be at least 8 characters
  newPassword: z.string().min(8, "At least 8 characters required"), // New password must be at least 8 characters
})
type PasswordFormValues = z.infer<typeof passwordSchema> // Derive TypeScript type from the password schema

// Zod schema for the profile edit form
const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"), // First name must not be empty
  lastName: z.string().min(1, "Last name is required"), // Last name must not be empty
  middleName: z.string().optional(), // Middle name is optional
  contactNo: z.string().optional(), // Contact number is optional
  address: z.string().optional(), // Address is optional
  birthDate: z.string().optional(), // Birth date is optional
  gender: z.string().optional(), // Gender is optional
})
type ProfileFormValues = z.infer<typeof profileSchema> // Derive TypeScript type from the profile schema

// Map of role keys to human-readable role labels
const roleLabels: Record<string, string> = {
  ADMIN: "Administrator",
  IMPLEMENTOR: "Implementor",
  CADET_OFFICER: "Cadet Officer",
  STUDENT: "Student",
}

// Map of role keys to Tailwind color classes for the role badge and accent elements
const roleAccents: Record<string, { bg: string; text: string; dot: string }> = {
  ADMIN:         { bg: "bg-violet-50",  text: "text-violet-600",  dot: "bg-violet-400" }, // Violet accent for admins
  IMPLEMENTOR:   { bg: "bg-sky-50",     text: "text-sky-600",     dot: "bg-sky-400" }, // Sky blue accent for implementors
  CADET_OFFICER: { bg: "bg-amber-50",   text: "text-amber-600",   dot: "bg-amber-400" }, // Amber accent for cadet officers
  STUDENT:       { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-400" }, // Emerald accent for students
}

// Reusable password input component with show/hide toggle
function PasswordInput({
  show, // Whether the password is currently visible
  onToggle, // Callback to toggle visibility
  error, // Optional validation error message
  ...props // All other standard input props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  show: boolean
  onToggle: () => void
  error?: string
}) {
  return (
    <div className="flex flex-col gap-1.5"> {/* Vertical stack for input and error message */}
      <div className="relative"> {/* Relative container for the toggle button positioning */}
        <Input type={show ? "text" : "password"} className="pr-10" {...props} /> {/* Input with right padding for the toggle button */}
        <button
          type="button" // Prevent form submission
          onClick={onToggle} // Toggle visibility on click
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors" // Vertically centered toggle button
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />} {/* Show EyeOff when visible, Eye when hidden */}
        </button>
      </div>
      {error && <p className="text-xs text-rose-500">{error}</p>} {/* Show validation error if present */}
    </div>
  )
}

// The profile settings page component
export function ProfilePage() {
  const storedUser = getStoredUser() // Read the current user from localStorage for initial state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(storedUser?.avatarUrl ?? null) // State for the avatar preview URL (null = no custom avatar)
  const [selectedFrame, setSelectedFrame] = useState<AvatarFrameType>((storedUser?.avatarFrame as AvatarFrameType) || "gradient") // State for the selected avatar frame style
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false) // State to track avatar upload progress
  const [showCurrent, setShowCurrent] = useState(false) // State to toggle current password visibility
  const [showNew, setShowNew] = useState(false) // State to toggle new password visibility
  const [isChangingPassword, setIsChangingPassword] = useState(false) // State to show/hide the change password form
  const [isEditingProfile, setIsEditingProfile] = useState(false) // State to show/hide the edit profile form
  const [showConfirmDialog, setShowConfirmDialog] = useState(false) // State to show/hide the profile update confirmation dialog
  const [pendingProfileData, setPendingProfileData] = useState<ProfileFormValues | null>(null) // State to hold the profile data pending confirmation
  const [imageToCrop, setImageToCrop] = useState<string | null>(null) // State for the image to crop (null = no cropper open)
  const fileInputRef = useRef<HTMLInputElement | null>(null) // Ref to the hidden file input for avatar upload

  const { data: profileData, isLoading, isError, error, refetch } = useQuery({ // Fetch the user's profile data
    queryKey: ["profile"], // Cache key for the profile
    queryFn: () => apiRequest<ApiResponse<any>>("/api/auth/profile"), // Fetch the authenticated user's profile
    refetchInterval: 10000, // Auto-refetch every 10 seconds
    retry: false // Don't retry on failure
  })

  // Update avatar when profile data changes
  React.useEffect(() => { // Effect to sync avatar and frame state with the fetched profile data
    if (profileData?.data?.avatarUrl) { // If the profile has an avatar URL
      setAvatarPreview(profileData.data.avatarUrl) // Update the avatar preview
      updateStoredUser({ avatarUrl: profileData.data.avatarUrl }) // Sync to localStorage
    }
    if (profileData?.data?.avatarFrame) { // If the profile has a frame preference
      setSelectedFrame(profileData.data.avatarFrame as AvatarFrameType) // Update the selected frame
      updateStoredUser({ avatarFrame: profileData.data.avatarFrame }) // Sync to localStorage
    }
  }, [profileData]) // Re-run when profile data changes

  const passwordForm = useForm<PasswordFormValues>({ resolver: zodResolver(passwordSchema) }) // Initialize the password form with zod validation
  const profileForm = useForm<ProfileFormValues>({ // Initialize the profile form with zod validation and empty defaults
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: "", lastName: "", middleName: "", contactNo: "", address: "", birthDate: "", gender: "" }
  })

  // Update form when profile data loads
  React.useEffect(() => { // Effect to populate the profile form when data is fetched
    if (profileData?.data?.profile) { // Only populate if profile data is available
      const profile = profileData.data.profile
      profileForm.reset({ // Reset the form with the fetched profile values
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        middleName: profile.middleName || "",
        contactNo: profile.contactNo || "",
        address: profile.address || "",
        birthDate: profile.birthDate ? new Date(profile.birthDate).toISOString().split('T')[0] : "", // Format date as YYYY-MM-DD for the date input
        gender: profile.gender || "",
      })
    }
  }, [profileData, profileForm]) // Re-run when profile data or form instance changes

  const passwordMutation = useMutation({ // Mutation for changing the password
    mutationFn: (values: PasswordFormValues) =>
      apiRequest<ApiResponse<any>>("/api/auth/change-password", { method: "POST", body: JSON.stringify(values) }), // POST the password change request
    onSuccess: () => { toast.success("Password updated"); passwordForm.reset(); setIsChangingPassword(false) }, // Reset form and close on success
    onError: (error) => { toast.error(error instanceof Error ? error.message : "Unable to update password") }
  })

  const profileMutation = useMutation({ // Mutation for updating the profile
    mutationFn: (values: ProfileFormValues) =>
      apiRequest<ApiResponse<any>>("/api/auth/profile", { method: "PATCH", body: JSON.stringify(values) }), // PATCH the profile with updated values
    onSuccess: () => { toast.success("Profile updated successfully"); setIsEditingProfile(false); refetch() }, // Close form and refresh on success
    onError: (error) => { toast.error(error instanceof Error ? error.message : "Unable to update profile") }
  })

  const handleProfileSubmit = profileForm.handleSubmit((values) => { // Profile form submit handler
    setPendingProfileData(values) // Store the form values pending confirmation
    setShowConfirmDialog(true) // Open the confirmation dialog
  })

  const confirmProfileUpdate = () => { // Handler called when the user confirms the profile update
    if (pendingProfileData) { // Only proceed if there's pending data
      profileMutation.mutate(pendingProfileData) // Trigger the profile update mutation
      setShowConfirmDialog(false) // Close the confirmation dialog
      setPendingProfileData(null) // Clear the pending data
    }
  }

  const profile = profileData?.data // Extract the profile object from the API response
  const roleProfile = profile?.profile // Extract the role-specific profile (student/implementor/cadet officer)

  const email = profile?.email ?? storedUser?.email ?? "—" // Get the email from profile or localStorage fallback
  const role = profile?.role ?? storedUser?.role ?? "STUDENT" // Get the role from profile or localStorage fallback
  const isActive = profile?.isActive ?? true // Get the active status, defaulting to true
  const createdAt = profile?.createdAt // Get the account creation date
    ? new Date(profile.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })
    : null

  const displayName = // Derive the display name from the profile or localStorage
    roleProfile?.firstName && roleProfile?.lastName
      ? `${roleProfile.firstName} ${roleProfile.lastName}` // Use full name if available
      : storedUser ? getUserDisplayName(storedUser) : "Guest" // Fall back to localStorage name or "Guest"

  const accent = roleAccents[role] ?? roleAccents.STUDENT // Get the role accent colors, defaulting to student

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { // Handler for file input change
    const file = e.target.files?.[0] // Get the first selected file
    e.target.value = "" // Reset the input value to allow re-selecting the same file
    if (!file) return // Exit if no file was selected
    if (!file.type.startsWith("image/")) { // Validate that the file is an image
      toast.error("Please select an image file") // Show error for non-image files
      return
    }
    const reader = new FileReader() // Create a FileReader to read the file as a data URL
    reader.onload = () => { setImageToCrop(reader.result as string) } // Set the image to crop when reading is complete
    reader.readAsDataURL(file) // Start reading the file as a base64 data URL
  }

  const handleCropComplete = async (croppedImage: string) => { // Async handler called when the user applies the crop
    setImageToCrop(null) // Close the image cropper
    setIsUploadingAvatar(true) // Set uploading state
    try {
      await apiRequest<ApiResponse<any>>("/api/auth/avatar", { // Upload the cropped image to the avatar endpoint
        method: "PATCH",
        body: JSON.stringify({ avatarUrl: croppedImage }), // Send the base64 image as the avatar URL
      })
      setAvatarPreview(croppedImage) // Update the avatar preview with the cropped image
      updateStoredUser({ avatarUrl: croppedImage }) // Sync the new avatar URL to localStorage
      toast.success("Profile photo updated") // Show success notification
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save photo") // Show error notification
    } finally {
      setIsUploadingAvatar(false) // Always reset the uploading state
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => { // Handler for the file input change event
    handleFileSelect(e) // Delegate to the file select handler
  }

  const handleAvatarReset = async () => { // Async handler to remove the custom avatar
    setIsUploadingAvatar(true) // Set uploading state
    try {
      await apiRequest<ApiResponse<any>>("/api/auth/avatar", { method: "DELETE" }) // DELETE the avatar from the backend
      setAvatarPreview(null) // Clear the avatar preview
      updateStoredUser({ avatarUrl: undefined }) // Remove the avatar URL from localStorage
      toast.success("Profile photo removed") // Show success notification
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove photo") // Show error notification
    } finally {
      setIsUploadingAvatar(false) // Always reset the uploading state
    }
  }

  const handleFrameChange = async (frame: AvatarFrameType) => { // Async handler to change the avatar frame style
    const previousFrame = selectedFrame // Store the current frame for rollback on error
    setSelectedFrame(frame) // Optimistically update the frame state
    try {
      await apiRequest<ApiResponse<any>>("/api/auth/avatar-frame", { // Update the frame preference in the backend
        method: "PATCH",
        body: JSON.stringify({ avatarFrame: frame }), // Send the new frame type
      })
      updateStoredUser({ avatarFrame: frame }) // Sync the new frame to localStorage
      toast.success("Avatar frame updated") // Show success notification
      refetch() // Refresh the profile to ensure sync
    } catch (err) {
      setSelectedFrame(previousFrame) // Revert to the previous frame on error
      toast.error(err instanceof Error ? err.message : "Failed to update frame") // Show error notification
      console.error("Frame update error:", err) // Log the error for debugging
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-slate-100"> {/* Full-height page with subtle gradient background */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8"> {/* Centered content container with max width and responsive padding */}
        {/* Page Header */}
        <div className="mb-8"> {/* Header section with bottom margin */}
          <h1 className="text-3xl font-bold text-slate-900">Profile Settings</h1> {/* Page title */}
          <p className="mt-2 text-sm text-slate-600">Manage your account information and customize your profile appearance</p> {/* Page description */}
        </div>

        <div className="grid gap-6 lg:grid-cols-12"> {/* 12-column grid for the two-column layout */}
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-4"> {/* Left column takes 4 of 12 columns on large screens */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm sticky top-6"> {/* Sticky profile card */}
              {/* Header Background */}
              <div className={cn("h-20 relative", accent.bg)}> {/* Colored header strip using role accent color */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-black/5" /> {/* Subtle gradient overlay on the header strip */}
              </div>

              <div className="px-6 pb-6"> {/* Card content with padding */}
                {isError ? ( // Show error state if profile fetch failed
                  <div className="text-center text-sm text-red-600 mt-4">
                    {(error as Error).message === "Unauthorized"
                      ? "Please log out and log back in." // Auth error message
                      : "Unable to load profile."} {/* Generic error message */}
                  </div>
                ) : isLoading ? ( // Show loading skeleton while fetching
                  <div className="flex flex-col items-center gap-4 -mt-10">
                    <div className="h-20 w-20 animate-pulse rounded-full bg-slate-100 ring-4 ring-white" /> {/* Pulsing avatar skeleton */}
                    <div className="h-5 w-32 animate-pulse rounded bg-slate-100" /> {/* Pulsing name skeleton */}
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center"> {/* Centered profile content */}
                    {/* Avatar */}
                    <div className="-mt-10 mb-4 ring-4 ring-white rounded-full"> {/* Avatar pulled up to overlap the header strip */}
                      <AvatarWithRing user={storedUser} size="xl" frameType={selectedFrame} showStatusDot={true} /> {/* Extra-large avatar with selected frame and status dot */}
                    </div>

                    <h2 className="text-xl font-bold text-slate-900">{displayName}</h2> {/* User's display name */}
                    <span className={cn("mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold", accent.bg, accent.text)}> {/* Role badge with role-specific colors */}
                      {roleLabels[role] ?? role} {/* Human-readable role label */}
                    </span>

                    {/* Status */}
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500"> {/* Active status row */}
                      <CheckCircle2 className={cn("h-3.5 w-3.5", isActive ? "text-emerald-500" : "text-slate-300")} /> {/* Green check if active, gray if inactive */}
                      {isActive ? "Active Account" : "Inactive"} {/* Status text */}
                    </div>

                    {/* Quick Info */}
                    <div className="mt-6 w-full space-y-3 text-left bg-slate-50 rounded-xl p-4"> {/* Quick info box with light background */}
                      <div className="flex items-center gap-2 text-xs"> {/* Email row */}
                        <Mail className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" /> {/* Mail icon */}
                        <span className="text-slate-600 truncate">{email}</span> {/* Email, truncated if too long */}
                      </div>
                      {roleProfile?.studentNo && ( // Only show student number if available
                        <div className="flex items-center gap-2 text-xs">
                          <Hash className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" /> {/* Hash icon */}
                          <span className="text-slate-600">{roleProfile.studentNo}</span> {/* Student number */}
                        </div>
                      )}
                      {createdAt && ( // Only show join date if available
                        <div className="flex items-center gap-2 text-xs">
                          <Calendar className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" /> {/* Calendar icon */}
                          <span className="text-slate-600">Joined {createdAt}</span> {/* Formatted join date */}
                        </div>
                      )}
                    </div>

                    {/* Avatar Actions */}
                    <div className="mt-6 flex gap-2 w-full"> {/* Row of avatar action buttons */}
                      <button
                        onClick={() => fileInputRef.current?.click()} // Trigger the hidden file input
                        disabled={isUploadingAvatar} // Disable while uploading
                        className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all disabled:opacity-50" // Full-width button with hover effects
                      >
                        <Camera className="h-4 w-4" /> {/* Camera icon */}
                        {isUploadingAvatar ? "Uploading..." : "Change Photo"} {/* Loading text while uploading */}
                      </button>
                      {avatarPreview && ( // Only show the remove button if a custom avatar exists
                        <button
                          onClick={handleAvatarReset} // Remove the avatar on click
                          disabled={isUploadingAvatar} // Disable while uploading
                          className="flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-600 hover:bg-red-100 hover:border-red-300 transition-all disabled:opacity-50" // Red button for destructive action
                        >
                          <Trash2 className="h-4 w-4" /> {/* Trash icon */}
                        </button>
                      )}
                    </div>

                    {/* Frame Selector */}
                    <div className="mt-6 w-full pt-6 border-t border-slate-200"> {/* Frame selector section with top border */}
                      <AvatarFrameSelector
                        user={storedUser} // Pass the current user for avatar previews
                        selectedFrame={selectedFrame} // Pass the currently selected frame
                        onSelectFrame={handleFrameChange} // Handle frame selection changes
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Forms */}
          <div className="lg:col-span-8 space-y-6"> {/* Right column takes 8 of 12 columns, with spacing between cards */}
            {/* Account Information */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"> {/* Account info card */}
              <div className="flex items-center justify-between mb-6"> {/* Card header row */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Account Information</h3> {/* Card title */}
                  <p className="text-xs text-slate-500 mt-1">Update your personal details</p> {/* Card subtitle */}
                </div>
                {!isEditingProfile && ( // Only show the Edit button when not in edit mode
                  <button
                    onClick={() => setIsEditingProfile(true)} // Enter edit mode
                    className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all"
                  >
                    <Edit className="h-4 w-4" /> {/* Edit icon */}
                    Edit
                  </button>
                )}
              </div>

              {isEditingProfile ? ( // Show the edit form when in edit mode
                <form onSubmit={handleProfileSubmit} className="space-y-4"> {/* Profile edit form */}
                  <div className="grid gap-4 sm:grid-cols-2"> {/* Two-column grid for form fields */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">First name *</label>
                      <Input {...profileForm.register("firstName")} placeholder="First name" />
                      {profileForm.formState.errors.firstName && <p className="text-xs text-rose-500">{profileForm.formState.errors.firstName.message}</p>}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Last name *</label>
                      <Input {...profileForm.register("lastName")} placeholder="Last name" />
                      {profileForm.formState.errors.lastName && <p className="text-xs text-rose-500">{profileForm.formState.errors.lastName.message}</p>}
                    </div>
                    {role === "STUDENT" && ( // Only show student-specific fields for students
                      <>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Middle name</label>
                          <Input {...profileForm.register("middleName")} placeholder="Middle name" />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Gender</label>
                          <Select {...profileForm.register("gender")}>
                            <option value="">Select gender</option>
                            <option value="MALE">Male</option>
                            <option value="FEMALE">Female</option>
                          </Select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Birth date</label>
                          <Input type="date" {...profileForm.register("birthDate")} />
                        </div>
                      </>
                    )}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Contact number</label>
                      <Input {...profileForm.register("contactNo")} placeholder="Contact number" />
                    </div>
                    {role === "STUDENT" && ( // Only show address for students
                      <div className="flex flex-col gap-1.5 sm:col-span-2">
                        <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Address</label>
                        <Input {...profileForm.register("address")} placeholder="Address" />
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-1"> {/* Form action buttons */}
                    <button
                      type="button"
                      onClick={() => { setIsEditingProfile(false); profileForm.reset() }} // Cancel and reset the form
                      className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <X className="h-3.5 w-3.5" /> {/* X icon */}
                      Cancel
                    </button>
                    <Button type="submit" size="sm" disabled={profileMutation.isPending}>
                      <Save className="h-3.5 w-3.5 mr-1" /> {/* Save icon */}
                      {profileMutation.isPending ? "Saving…" : "Save Changes"}
                    </Button>
                  </div>
                </form>
              ) : ( // Show the read-only profile view when not in edit mode
                <>
                  <div className="grid gap-4 sm:grid-cols-2"> {/* Two-column grid for profile fields */}
                    {[
                      { label: "Email address", value: email, note: "Cannot be changed" }, // Email is read-only
                      { label: "Account role", value: roleLabels[role] ?? role, note: "Assigned by administrator" }, // Role is read-only
                      ...(roleProfile?.studentNo  ? [{ label: "Student ID No.", value: roleProfile.studentNo, note: "Cannot be changed" }] : []), // Student number if available
                      ...(roleProfile?.firstName ? [{ label: "First name", value: roleProfile.firstName, note: null }] : []), // First name if available
                      ...(roleProfile?.lastName  ? [{ label: "Last name",  value: roleProfile.lastName,  note: null }] : []), // Last name if available
                      ...(roleProfile?.middleName ? [{ label: "Middle name", value: roleProfile.middleName, note: null }] : []), // Middle name if available
                    ].map(({ label, value, note }) => ( // Render each profile field
                      <div key={label} className="flex flex-col gap-1"> {/* Field container */}
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</p> {/* Field label */}
                        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5"> {/* Read-only field box */}
                          <p className="text-sm font-medium text-slate-800">{value ?? "—"}</p> {/* Field value or em dash */}
                        </div>
                        {note && <p className="text-[10px] text-slate-500">{note}</p>} {/* Optional note below the field */}
                      </div>
                    ))}
                  </div>
                  <p className="mt-5 text-xs text-slate-500">Click "Edit" to update your personal information.</p> {/* Instruction text */}
                </>
              )}
            </div>

            {/* Security / password */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm"> {/* Security card */}
              <div className="flex items-center justify-between mb-6"> {/* Card header row */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Security</h3> {/* Card title */}
                  <p className="text-xs text-slate-500 mt-1">Change your login password</p> {/* Card subtitle */}
                </div>
                {!isChangingPassword && ( // Only show the Change button when not in change mode
                  <button
                    onClick={() => setIsChangingPassword(true)} // Enter change password mode
                    className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all"
                  >
                    <Lock className="h-4 w-4" /> {/* Lock icon */}
                    Change
                  </button>
                )}
              </div>

              {isChangingPassword ? ( // Show the change password form when in change mode
                <form
                  onSubmit={passwordForm.handleSubmit((v) => passwordMutation.mutateAsync(v))} // Submit handler triggers the password mutation
                  className="flex flex-col gap-4"
                >
                  <div className="grid gap-4 sm:grid-cols-2"> {/* Two-column grid for password fields */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Current password</label>
                      <PasswordInput
                        placeholder="Current password"
                        show={showCurrent} // Controlled visibility state
                        onToggle={() => setShowCurrent((p) => !p)} // Toggle visibility
                        error={passwordForm.formState.errors.currentPassword?.message} // Validation error
                        {...passwordForm.register("currentPassword")} // Register with react-hook-form
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">New password</label>
                      <PasswordInput
                        placeholder="New password"
                        show={showNew} // Controlled visibility state
                        onToggle={() => setShowNew((p) => !p)} // Toggle visibility
                        error={passwordForm.formState.errors.newPassword?.message} // Validation error
                        {...passwordForm.register("newPassword")} // Register with react-hook-form
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1"> {/* Form action buttons */}
                    <button
                      type="button"
                      onClick={() => { setIsChangingPassword(false); passwordForm.reset() }} // Cancel and reset the form
                      className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <X className="h-3.5 w-3.5" /> {/* X icon */}
                      Cancel
                    </button>
                    <Button type="submit" size="sm" disabled={passwordMutation.isPending}>
                      <Save className="h-3.5 w-3.5 mr-1" /> {/* Save icon */}
                      {passwordMutation.isPending ? "Updating…" : "Update Password"}
                    </Button>
                  </div>
                </form>
              ) : ( // Show the read-only password display when not in change mode
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3.5"> {/* Password display box */}
                  <div className="flex items-center justify-between"> {/* Row with label and masked password */}
                    <div>
                      <p className="text-xs font-semibold text-slate-700">Password</p> {/* Field label */}
                      <p className="mt-0.5 text-xs text-slate-500">Last changed: unknown</p> {/* Last changed info */}
                    </div>
                    <span className="font-mono text-sm tracking-widest text-slate-300">••••••••</span> {/* Masked password dots */}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} /> {/* Hidden file input for avatar upload, triggered programmatically */}

      {imageToCrop && ( // Only render the image cropper when an image is selected
        <ImageCropper
          image={imageToCrop} // The base64 image to crop
          onCropComplete={handleCropComplete} // Handle the cropped result
          onCancel={() => setImageToCrop(null)} // Close the cropper without saving
        />
      )}

      <ConfirmDialog // Profile update confirmation dialog
        open={showConfirmDialog} // Controlled by state
        onOpenChange={setShowConfirmDialog} // Update state when dialog open/close changes
        title="Confirm Profile Update" // Dialog title
        description="Are you sure you want to update your profile information? This will change your personal details." // Dialog description
        confirmLabel="Update Profile" // Confirm button label
        cancelLabel="Cancel" // Cancel button label
        onConfirm={confirmProfileUpdate} // Call the confirm handler when confirmed
      />
    </div>
  )
}
