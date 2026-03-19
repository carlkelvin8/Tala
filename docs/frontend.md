# Frontend Guide

---

## Project Structure

```
frontend/src/
├── App.tsx                    # Route definitions
├── main.tsx                   # React entry point
├── types/                     # Shared TypeScript types
│   └── index.ts               # ApiResponse<T>, etc.
│
├── lib/
│   ├── api.ts                 # HTTP client (apiRequest)
│   ├── auth.ts                # Auth helpers, localStorage
│   ├── avatar.ts              # DiceBear, frame configs
│   ├── navigation.ts          # Nav items with role filters
│   ├── pagination.ts          # Pagination utilities
│   └── utils.ts               # cn() and other helpers
│
├── pages/
│   ├── DashboardPage.tsx
│   ├── EnrollmentPage.tsx
│   ├── StudentsPage.tsx
│   ├── SectionsPage.tsx
│   ├── FlightsPage.tsx
│   ├── MaterialsPage.tsx
│   ├── AttendancePage.tsx
│   ├── GradesPage.tsx
│   ├── MeritsPage.tsx
│   ├── ExamsPage.tsx
│   ├── ReportsPage.tsx
│   ├── UsersPage.tsx
│   ├── ProfilePage.tsx
│   └── NotFoundPage.tsx
│
└── components/
    ├── ProtectedRoute.tsx      # Auth + role guard
    ├── auth/
    │   ├── ModernLoginPage.tsx
    │   └── ModernRegisterPage.tsx
    ├── layout/
    │   ├── AppLayout.tsx       # Main layout wrapper
    │   ├── ModernAuthLayout.tsx
    │   ├── PremiumAppSidebar.tsx
    │   └── Topbar.tsx
    └── ui/
        ├── avatar-frame-selector.tsx
        ├── avatar-with-ring.tsx
        ├── button.tsx
        ├── confirm-dialog.tsx
        ├── image-cropper.tsx
        ├── input.tsx
        ├── select.tsx
        ├── sidebar.tsx
        └── slider.tsx
```

---

## Key Libraries

### TanStack Query

Used for all server state. Every page uses `useQuery` for fetching and `useMutation` for writes.

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

// Fetch data
const { data, isLoading, isError } = useQuery({
  queryKey: ["grades"],
  queryFn: () => apiRequest<ApiResponse<Grade[]>>("/api/grades"),
  refetchInterval: 5000,
})

// Mutate data
const queryClient = useQueryClient()
const mutation = useMutation({
  mutationFn: (values) => apiRequest("/api/grades", {
    method: "POST",
    body: JSON.stringify(values),
  }),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["grades"] })
    toast.success("Grade saved")
  },
})
```

### React Hook Form + Zod

All forms use React Hook Form with Zod resolvers for validation.

```typescript
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

const schema = z.object({
  score: z.number().min(0).max(100),
})
type FormValues = z.infer<typeof schema>

const form = useForm<FormValues>({ resolver: zodResolver(schema) })
```

### Sonner (Toast Notifications)

```typescript
import { toast } from "sonner"

toast.success("Saved successfully")
toast.error("Something went wrong")
```

---

## API Client

All HTTP requests go through `frontend/src/lib/api.ts`:

```typescript
export async function apiRequest<T>(path: string, options: RequestInit = {}) {
  // Automatically attaches Authorization: Bearer <token>
  // Parses JSON response
  // Throws Error with server message on non-2xx responses
}
```

**Usage:**
```typescript
// GET
const data = await apiRequest<ApiResponse<User[]>>("/api/users")

// POST
const result = await apiRequest<ApiResponse<User>>("/api/users", {
  method: "POST",
  body: JSON.stringify({ email: "...", role: "STUDENT" }),
})

// PATCH
await apiRequest("/api/users/uuid", {
  method: "PATCH",
  body: JSON.stringify({ isActive: false }),
})

// DELETE
await apiRequest("/api/users/uuid", { method: "DELETE" })
```

---

## Auth Utilities

`frontend/src/lib/auth.ts` provides:

```typescript
// Store session after login
setAuthSession(user, accessToken, refreshToken)

// Clear session on logout
clearAuthSession()

// Get stored tokens
getAccessToken()
getRefreshToken()

// Get stored user object
getStoredUser(): AuthUser | null

// Update stored user (e.g., after avatar change)
updateStoredUser({ avatarUrl: "data:image/..." })

// Display helpers
getUserDisplayName(user)  // "Juan Dela Cruz" or email
getUserInitials(user)     // "JD" or first 2 chars of email
```

---

## Avatar System

`frontend/src/lib/avatar.ts` provides:

```typescript
// Get avatar URL (uploaded photo or DiceBear fallback)
getAvatarUrl(user, size)

// Get DiceBear avatar URL
getDiceBearAvatar(user, size)

// Role-based gradient configs
roleGradients.ADMIN    // { from, to, shadow }
roleGradients.STUDENT  // { from, to, shadow }

// Frame type definition
type AvatarFrameType = "none" | "gradient" | "double" | "glow" | "hexagon" | "badge"

// Frame metadata
avatarFrames.gradient  // { name: "Gradient Ring", description: "..." }
```

### AvatarWithRing Component

```tsx
import { AvatarWithRing } from "../components/ui/avatar-with-ring"

// Basic usage
<AvatarWithRing user={user} size="md" />

// With frame and status dot
<AvatarWithRing
  user={user}
  size="xl"
  frameType="glow"
  showStatusDot={true}
/>
```

**Props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `user` | `AuthUser \| null` | — | User object |
| `size` | `"sm" \| "md" \| "lg" \| "xl"` | `"md"` | Avatar size |
| `frameType` | `AvatarFrameType` | user's saved frame | Frame style override |
| `showStatusDot` | `boolean` | `false` | Show role-colored dot |
| `className` | `string` | — | Additional CSS classes |

### AvatarFrameSelector Component

```tsx
import { AvatarFrameSelector } from "../components/ui/avatar-frame-selector"

<AvatarFrameSelector
  user={user}
  selectedFrame={selectedFrame}
  onSelectFrame={(frame) => handleFrameChange(frame)}
/>
```

---

## Navigation

`frontend/src/lib/navigation.ts` defines nav items with role-based filtering:

```typescript
export const navItems = [
  { path: "/dashboard", label: "Dashboard", roles: ["ADMIN", "IMPLEMENTOR", "CADET_OFFICER", "STUDENT"] },
  { path: "/enrollment", label: "Enrollment", roles: ["ADMIN", "IMPLEMENTOR", "CADET_OFFICER"] },
  { path: "/students", label: "Students", roles: ["ADMIN", "IMPLEMENTOR", "CADET_OFFICER"] },
  // ...
]
```

The sidebar filters this list based on the current user's role.

---

## Layout Components

### AppLayout

Wraps all authenticated pages (except Dashboard which has its own layout).

```
AppLayout
├── PremiumAppSidebar (desktop: fixed left, mobile: drawer)
├── Topbar (header with page title and user menu)
└── <Outlet /> (page content)
```

### PremiumAppSidebar

- Shows user profile card with avatar, name, and role badge
- Navigation links filtered by role
- Sign out button
- Responsive: hidden on mobile, shown as drawer

### Topbar

- Shows current page title
- Shows user avatar and name
- Active session indicator
- Sign out button with confirmation dialog

---

## Styling

The project uses **TailwindCSS** with a consistent design system:

### Color Palette

| Usage | Color |
|---|---|
| Primary text | `slate-900` |
| Secondary text | `slate-600`, `slate-500` |
| Borders | `slate-200` |
| Backgrounds | `white`, `slate-50` |
| Active nav | `slate-900` (bg) + `white` (text) |
| Danger | `red-600`, `red-50` |

### Role Colors

| Role | Color |
|---|---|
| ADMIN | Violet (`violet-500`, `violet-50`, `violet-600`) |
| IMPLEMENTOR | Sky (`sky-500`, `sky-50`, `sky-600`) |
| CADET_OFFICER | Amber (`amber-500`, `amber-50`, `amber-600`) |
| STUDENT | Emerald (`emerald-500`, `emerald-50`, `emerald-600`) |

### Utility Function

```typescript
import { cn } from "../lib/utils"

// Merges Tailwind classes safely
cn("base-class", condition && "conditional-class", "another-class")
```

---

## Form Patterns

All forms follow this pattern:

```tsx
const form = useForm<FormValues>({ resolver: zodResolver(schema) })

const mutation = useMutation({
  mutationFn: (values) => apiRequest("/api/endpoint", {
    method: "POST",
    body: JSON.stringify(values),
  }),
  onSuccess: () => {
    toast.success("Saved!")
    form.reset()
  },
  onError: (error) => {
    toast.error(error instanceof Error ? error.message : "Failed")
  },
})

return (
  <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))}>
    <Input {...form.register("fieldName")} />
    {form.formState.errors.fieldName && (
      <p className="text-xs text-red-500">
        {form.formState.errors.fieldName.message}
      </p>
    )}
    <Button type="submit" disabled={mutation.isPending}>
      {mutation.isPending ? "Saving..." : "Save"}
    </Button>
  </form>
)
```

---

## Confirm Dialog

Used for destructive actions:

```tsx
import { ConfirmDialog } from "../components/ui/confirm-dialog"

<ConfirmDialog
  open={confirmOpen}
  onOpenChange={setConfirmOpen}
  title="Delete this record?"
  description="This action cannot be undone."
  confirmLabel="Delete"
  onConfirm={handleDelete}
  destructive
/>
```

---

## Image Cropper

Used for profile photo uploads:

```tsx
import { ImageCropper } from "../components/ui/image-cropper"

{imageToCrop && (
  <ImageCropper
    image={imageToCrop}
    onCropComplete={(croppedDataUri) => handleUpload(croppedDataUri)}
    onCancel={() => setImageToCrop(null)}
  />
)}
```

Features:
- Zoom control (1x–3x)
- Rotation control (0°–360°)
- Outputs JPEG at 85% quality
- Dark overlay modal
