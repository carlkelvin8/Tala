// Import the Context and Next types from Hono for the middleware signature
import type { Context, Next } from "hono"
// Import the fail helper to build a standardised error response envelope
import { fail } from "../lib/response.js"

/* Global error-handling middleware — catches any unhandled exception thrown by route handlers */
export async function errorHandler(c: Context, next: Next) {
  try {
    // Attempt to run the next middleware or route handler in the chain
    await next()
  } catch (error) {
    // Log the full error to the server console for debugging and monitoring
    console.error(error)
    // Determine the best human-readable message to return to the client:
    const message =
      error instanceof Error          // If it's a standard Error object, use its message property
        ? error.message
        : typeof error === "string"   // If it's a plain string, use it directly
        ? error
        : typeof error === "object" && error !== null && "message" in error
        // If it's an object with a message property, coerce that property to a string
        ? String((error as { message?: unknown }).message)
        : "Internal server error"     // Fallback for any other unexpected error shape
    // Return a 500 Internal Server Error response with the extracted message
    return c.json(fail(message), 500)
  }
}
