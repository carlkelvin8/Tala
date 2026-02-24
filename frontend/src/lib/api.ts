import { getAccessToken } from "./auth"

const baseUrl = import.meta.env.VITE_API_URL ?? ""

export async function apiRequest<T>(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers)
  headers.set("Content-Type", "application/json")
  const token = getAccessToken()
  if (token) {
    headers.set("Authorization", `Bearer ${token}`)
  }
  const response = await fetch(`${baseUrl}${path}`, { ...options, headers })
  const contentType = response.headers.get("content-type") ?? ""
  const text = await response.text()
  const data = text && contentType.includes("application/json") ? JSON.parse(text) : text
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
