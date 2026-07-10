import type { Context, Next } from "hono"
import { RoleType } from "@prisma/client"
import { fail } from "../lib/response.js"
import { getAuthUser } from "./auth.js"

const VIEW_ONLY_ROLES: RoleType[] = [RoleType.CADET_OFFICER, RoleType.STUDENT]

export function readOnlyGuard() {
  return async (c: Context, next: Next) => {
    const user = getAuthUser(c)
    if (VIEW_ONLY_ROLES.includes(user.role)) {
      const method = c.req.method
      if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
        return c.json(fail("View-only access. You do not have permission to modify this resource."), 403)
      }
    }
    await next()
  }
}
