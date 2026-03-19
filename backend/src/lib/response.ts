/* Shape of optional pagination metadata attached to list responses */
export type ApiMeta = {
  page?: number     // Current page number (1-based)
  pageSize?: number // Number of items per page
  total?: number    // Total number of matching records across all pages
}

/* Standard envelope shape for every API response returned by this server */
export type ApiResponse<T> = {
  success: boolean  // true for successful responses, false for errors
  message: string   // Human-readable description of the result
  data?: T          // Optional payload — present on success, may be absent on errors
  meta?: ApiMeta    // Optional pagination metadata for list endpoints
}

/* Build a successful API response envelope with an optional data payload and pagination meta */
export function ok<T>(message: string, data?: T, meta?: ApiMeta): ApiResponse<T> {
  // success is always true; message, data, and meta are passed through as-is
  return { success: true, message, data, meta }
}

/* Build a failure API response envelope with an optional error details payload */
export function fail(message: string, data?: unknown): ApiResponse<unknown> {
  // success is always false; data may carry validation error details or be omitted
  return { success: false, message, data }
}
