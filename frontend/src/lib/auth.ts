const ACCESS_TOKEN_KEY = "nstp_access_token"
const REFRESH_TOKEN_KEY = "nstp_refresh_token"
const USER_KEY = "nstp_user"

export type AuthUser = {
  id: string
  email: string
  role: "ADMIN" | "IMPLEMENTOR" | "CADET_OFFICER" | "STUDENT"
  avatarUrl?: string
  avatarFrame?: string
  firstName?: string
  lastName?: string
}

export function setAuthSession(user: AuthUser, accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuthSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function getStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(USER_KEY)
  return raw ? (JSON.parse(raw) as AuthUser) : null
}

export function updateStoredUser(updates: Partial<AuthUser>) {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) {
    return
  }
  const current = JSON.parse(raw) as AuthUser
  const next = { ...current, ...updates }
  localStorage.setItem(USER_KEY, JSON.stringify(next))
}

export function getUserDisplayName(user: AuthUser): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`
  }
  return user.email
}

export function getUserInitials(user: AuthUser): string {
  if (user.firstName && user.lastName) {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
  }
  return user.email.substring(0, 2).toUpperCase()
}