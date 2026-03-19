// Derive a human-readable full name from a user object that may have different profile types
export function getFullName(user?: {
  studentProfile?: { firstName: string; lastName: string } | null // Optional student profile with name fields
  implementorProfile?: { firstName: string; lastName: string } | null // Optional implementor profile with name fields
  cadetOfficerProfile?: { firstName: string; lastName: string } | null // Optional cadet officer profile with name fields
  email?: string // Fallback email address if no profile name is available
} | null): string {
  if (!user) return "—" // Return an em dash placeholder if no user object is provided
  const p = user.studentProfile ?? user.implementorProfile ?? user.cadetOfficerProfile // Pick the first non-null profile using nullish coalescing
  if (p?.firstName && p?.lastName) return `${p.firstName} ${p.lastName}` // If the profile has both first and last name, return the full name
  return user.email ?? "—" // Fall back to the email address, or em dash if email is also absent
}

// Build an absolute URL for a file path stored in the backend, handling both dev and production environments
export function getApiFileUrl(path?: string | null): string | null {
  if (!path) return null // Return null if no path is provided
  if (path.startsWith("http")) return path // If the path is already an absolute URL, return it as-is
  // In development, the proxy handles /uploads
  // In production, we need the full API URL
  const base = import.meta.env.VITE_API_URL ?? "" // Read the API base URL from the Vite environment variable
  if (base) {
    return `${base.replace(/\/$/, "")}${path}` // Combine the base URL (with trailing slash removed) and the relative path
  }
  // In development with proxy, just return the path
  return path // In dev mode with a Vite proxy, the relative path is sufficient
}
