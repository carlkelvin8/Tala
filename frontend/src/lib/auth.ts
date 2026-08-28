const ACCESS_TOKEN_KEY = "nstp_access_token" // localStorage key used to store the JWT access token
const REFRESH_TOKEN_KEY = "nstp_refresh_token" // localStorage key used to store the JWT refresh token
const USER_KEY = "nstp_user" // localStorage key used to store the serialized authenticated user object

export type AuthUser = {
  id: string
  email: string
  role: "ADMIN" | "IMPLEMENTOR" | "CADET_OFFICER" | "STUDENT"
  program?: "CWTS" | "ROTC" | null
  avatarUrl?: string
  avatarFrame?: string
  firstName?: string
  lastName?: string
  sectionId?: string | null
}

// Persist the authenticated session data to localStorage after a successful login
export function setAuthSession(user: AuthUser, accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken) // Store the JWT access token for use in API request headers
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken) // Store the refresh token for future token renewal
  localStorage.setItem(USER_KEY, JSON.stringify(user)) // Serialize and store the user object as a JSON string
}

// Remove all session data from localStorage, effectively logging the user out
export function clearAuthSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY) // Delete the stored access token
  localStorage.removeItem(REFRESH_TOKEN_KEY) // Delete the stored refresh token
  localStorage.removeItem(USER_KEY) // Delete the stored user object
}

// Retrieve the stored JWT access token from localStorage, or null if not present
export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY) // Returns the raw token string or null
}

// Retrieve the stored JWT refresh token from localStorage, or null if not present
export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY) // Returns the raw refresh token string or null
}

// Retrieve and deserialize the stored user object from localStorage
export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY) // Read the raw JSON string from localStorage
  if (!raw) return null
  try {
    const user = JSON.parse(raw) as Partial<AuthUser>
    if (typeof user.id !== "string" || typeof user.email !== "string" || typeof user.role !== "string") {
      clearAuthSession()
      return null
    }
    return user as AuthUser
  } catch {
    clearAuthSession()
    return null
  }
}

// Merge partial updates into the stored user object without replacing the entire record
export function updateStoredUser(updates: Partial<AuthUser>) {
  const raw = localStorage.getItem(USER_KEY) // Read the current stored user JSON
  if (!raw) { // If no user is stored, do nothing
    return
  }
  const current = JSON.parse(raw) as AuthUser // Deserialize the current user object
  const next = { ...current, ...updates } // Merge the updates over the current user data using spread
  localStorage.setItem(USER_KEY, JSON.stringify(next)) // Serialize and save the merged user back to localStorage
}

// Return a human-readable display name for the user, preferring full name over email
export function getUserDisplayName(user: AuthUser): string {
  if (user.firstName && user.lastName) { // If both first and last name are available
    return `${user.firstName} ${user.lastName}` // Return the full name as "First Last"
  }
  return user.email // Fall back to the email address if name is not set
}

// Generate a short initials string from the user's name or email for use in avatar placeholders
export function getUserInitials(user: AuthUser): string {
  if (user.firstName && user.lastName) { // If both first and last name are available
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase() // Take first character of each name and uppercase them
  }
  return user.email.substring(0, 2).toUpperCase() // Fall back to the first two characters of the email, uppercased
}
