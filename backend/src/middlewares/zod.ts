// Import the zValidator helper from the Hono/Zod integration package
import { zValidator } from "@hono/zod-validator"
// Import the ZodSchema base type so the generic constraint works for any Zod schema
import { ZodSchema } from "zod"
// Import the fail helper to build a standardised error response envelope
import { fail } from "../lib/response.js"

/* Factory that returns a Hono middleware validating the JSON request body against a Zod schema */
export function validateBody<T extends ZodSchema>(schema: T) {
  // zValidator("json", ...) tells Hono to parse and validate the request body as JSON
  return zValidator("json", schema, (result, c) => {
    // If validation fails, result.success is false and result.error contains the details
    if (!result.success) {
      // Return 422 Unprocessable Entity with flattened Zod error details
      return c.json(fail("Validation error", result.error.flatten()), 422)
    }
  })
}

/* Factory that returns a Hono middleware validating query string parameters against a Zod schema */
export function validateQuery<T extends ZodSchema>(schema: T) {
  // zValidator("query", ...) tells Hono to parse and validate the URL query parameters
  return zValidator("query", schema, (result, c) => {
    // If validation fails, return 422 with flattened Zod error details
    if (!result.success) {
      return c.json(fail("Validation error", result.error.flatten()), 422)
    }
  })
}
