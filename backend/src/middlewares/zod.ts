import { zValidator } from "@hono/zod-validator"
import { ZodSchema } from "zod"
import { fail } from "../lib/response.js"

export function validateBody<T extends ZodSchema>(schema: T) {
  return zValidator("json", schema, (result, c) => {
    if (!result.success) {
      return c.json(fail("Validation error", result.error.flatten()), 422)
    }
  })
}

export function validateQuery<T extends ZodSchema>(schema: T) {
  return zValidator("query", schema, (result, c) => {
    if (!result.success) {
      return c.json(fail("Validation error", result.error.flatten()), 422)
    }
  })
}
