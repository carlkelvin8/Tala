import { getAccessToken, getRefreshToken, setAuthSession, clearAuthSession, getStoredUser } from "./auth"

const baseUrl = import.meta.env.VITE_API_URL ?? ""

async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = getRefreshToken()
  if (!refreshToken) return false

  try {
    const response = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    })
    if (!response.ok) return false

    const data = await response.json()
    if (data.success && data.data) {
      const storedUser = getStoredUser()
      if (!storedUser) return false
      setAuthSession(storedUser, data.data.accessToken, data.data.refreshToken)
      return true
    }
    return false
  } catch {
    return false
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers)
  const token = getAccessToken()
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json")
  }
  let response = await fetch(`${baseUrl}${path}`, { ...options, headers })

  // If 401, try to refresh the token once
  if (response.status === 401) {
    const refreshed = await tryRefreshToken()
    if (refreshed) {
      const newToken = getAccessToken()
      if (newToken) {
        headers.set("Authorization", `Bearer ${newToken}`)
      }
      response = await fetch(`${baseUrl}${path}`, { ...options, headers })
    } else {
      clearAuthSession()
      window.location.href = "/login"
      throw new Error("Session expired. Please log in again.")
    }
  }

  const contentType = response.headers.get("content-type") ?? ""
  const text = await response.text()
  let data: unknown = text
  if (text && contentType.includes("application/json")) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }
  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null && "message" in data && data.message
        ? String(data.message)
        : text
        ? text
        : response.statusText || `Request failed (${response.status})`
    throw new Error(message)
  }
  return (data ?? {}) as T
}

export async function logoutSession() {
  try {
    await apiRequest("/api/auth/logout", { method: "POST" })
  } finally {
    clearAuthSession()
  }
}
