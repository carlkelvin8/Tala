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

export function getApiFileUrl(path?: string | null): string | null {
  if (!path) return null
  if (path.startsWith("http")) return path
  // In development, the proxy handles /uploads
  // In production, we need the full API URL
  const base = import.meta.env.VITE_API_URL ?? ""
  if (base) {
    return `${base.replace(/\/$/, "")}${path}`
  }
  // In development with proxy, just return the path
  return path
}
