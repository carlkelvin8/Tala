import type { Context, Next } from "hono"
import { fail } from "../lib/response.js"

export async function errorHandler(c: Context, next: Next) {
  try {
    await next()
  } catch (error) {
    console.error(error)
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
        ? error
        : typeof error === "object" && error !== null && "message" in error
        ? String((error as { message?: unknown }).message)
        : "Internal server error"
    return c.json(fail(message), 500)
  }
}
