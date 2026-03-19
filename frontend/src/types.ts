// Define a union type for all possible user roles in the system
export type RoleType = "ADMIN" | "IMPLEMENTOR" | "CADET_OFFICER" | "STUDENT"

// Define a generic wrapper type for all API responses from the backend
export type ApiResponse<T> = {
  success: boolean // Whether the request succeeded (true) or failed (false)
  message: string // Human-readable message describing the result or error
  data?: T // Optional payload of type T; present on successful responses
  meta?: { // Optional pagination metadata returned by list endpoints
    page?: number // Current page number (1-based)
    pageSize?: number // Number of items per page
    total?: number // Total number of items across all pages
  }
}
