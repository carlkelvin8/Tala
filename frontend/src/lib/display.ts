// Derive a human-readable full name from a user object that may have different profile types
export function getFullName(user?: {
  studentProfile?: { firstName: string; lastName: string } | null
  implementorProfile?: { firstName: string; lastName: string } | null
  cadetOfficerProfile?: { firstName: string; lastName: string } | null
  email?: string
} | null): string {
  if (!user) return "—"
  const p = user.studentProfile ?? user.implementorProfile ?? user.cadetOfficerProfile
  if (p?.firstName && p?.lastName) return `${p.firstName} ${p.lastName}`
  return user.email ?? "—"
}

// Build an absolute URL for a file path stored in the backend
export function getApiFileUrl(path?: string | null): string | null {
  if (!path) return null
  if (path.startsWith("http")) return path
  const base = import.meta.env.VITE_API_URL ?? ""
  if (base) {
    return `${base.replace(/\/$/, "")}${path}`
  }
  return path
}

// Format a date string as relative time (e.g. "5m ago", "2h ago", "3d ago")
export function relativeTime(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

// Get initials from an email or name string
export function getInitials(name: string): string {
  return name.charAt(0).toUpperCase()
}
