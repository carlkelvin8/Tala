const ACCESS_TOKEN_KEY = "nstp_access_token" // localStorage key used to store the JWT access token
const REFRESH_TOKEN_KEY = "nstp_refresh_token" // localStorage key used to store the JWT refresh token
const USER_KEY = "nstp_user" // localStorage key used to store the serialized authenticated user object

// Type definition for the authenticated user stored in session
export type AuthUser = {
  id: string // Unique UUID identifier for the user
  email: string // User's email address, used as login credential
  role: "ADMIN" | "IMPLEMENTOR" | "CADET_OFFICER" | "STUDENT" // The user's assigned role, controls access permissions
  avatarUrl?: string // Optional URL to the user's uploaded profile photo
  avatarFrame?: string // Optional identifier for the selected avatar frame style
  firstName?: string // Optional first name, populated after profile setup
  lastName?: string // Optional last name, populated after profile setup
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
  return raw ? (JSON.parse(raw) as AuthUser) : null // Parse and cast to AuthUser if present, otherwise return null
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
