import type { Context, Next } from "hono"
import { RoleType } from "@prisma/client"
import { fail } from "../lib/response.js"
import { getAuthUser } from "./auth.js"

export function roleGuard(roles: RoleType[]) {
  return async (c: Context, next: Next) => {
    const user = getAuthUser(c)
    if (!roles.includes(user.role)) {
      return c.json(fail("Forbidden"), 403)
    }
    await next()
  }
}
