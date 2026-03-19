import { getAccessToken } from "./auth" // Import the function that retrieves the JWT access token from localStorage

const baseUrl = import.meta.env.VITE_API_URL ?? "" // Read the API base URL from the Vite environment variable; fall back to empty string (uses relative URLs / dev proxy)

// Generic async function for making authenticated API requests
export async function apiRequest<T>(path: string, options: RequestInit = {}) {
  const headers = new Headers(options.headers) // Create a mutable Headers object from any headers already in options
  headers.set("Content-Type", "application/json") // Always set Content-Type to JSON for all requests
  const token = getAccessToken() // Retrieve the current JWT access token from localStorage
  if (token) { // Only add the Authorization header if a token exists (user is logged in)
    headers.set("Authorization", `Bearer ${token}`) // Set the Bearer token in the Authorization header for protected endpoints
  }
  const response = await fetch(`${baseUrl}${path}`, { ...options, headers }) // Make the HTTP request by combining the base URL with the path, spreading existing options, and using the updated headers
  const contentType = response.headers.get("content-type") ?? "" // Read the Content-Type header from the response to determine how to parse the body
  const text = await response.text() // Read the entire response body as a raw text string
  const data = text && contentType.includes("application/json") ? JSON.parse(text) : text // If the response has content and is JSON, parse it; otherwise keep it as a plain string
  if (!response.ok) { // If the HTTP status code indicates an error (4xx or 5xx)
    const message =
      typeof data === "object" && data !== null && "message" in data && data.message
        ? String(data.message) // If the parsed response is an object with a "message" field, use that as the error message
        : text
        ? text // If there's raw text but no message field, use the raw text
        : response.statusText || `Request failed (${response.status})` // Fall back to the HTTP status text or a generic message
    throw new Error(message) // Throw an Error with the extracted message so callers can catch it
  }
  return (data ?? {}) as T // Return the parsed data cast to the expected type T; fall back to empty object if data is null/undefined
}
