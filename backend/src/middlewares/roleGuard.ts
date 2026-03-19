// Import the Context and Next types from Hono for the middleware function signature
import type { Context, Next } from "hono"
// Import the RoleType enum from Prisma to type the allowed roles array
import { RoleType } from "@prisma/client"
// Import the fail helper to build a standardised error response envelope
import { fail } from "../lib/response.js"
// Import the getAuthUser helper to retrieve the authenticated user from context
import { getAuthUser } from "./auth.js"

/* Factory function that returns a middleware enforcing role-based access control */
export function roleGuard(roles: RoleType[]) {
  // Return an async middleware function that Hono will call for the protected route
  return async (c: Context, next: Next) => {
    // Retrieve the authenticated user that was attached to context by authMiddleware
    const user = getAuthUser(c)
    // Check whether the user's role is in the list of permitted roles
    if (!roles.includes(user.role)) {
      // If the role is not allowed, respond with 403 Forbidden and stop the chain
      return c.json(fail("Forbidden"), 403)
    }
    // Role is permitted — pass control to the next middleware or route handler
    await next()
  }
}
