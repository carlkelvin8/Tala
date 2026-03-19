// Import the Context and Next types from Hono for middleware function signatures
import type { Context, Next } from "hono"
// Import the JWT verification helper to decode and validate access tokens
import { verifyAccessToken } from "../lib/jwt.js"
// Import the Prisma client to look up the user in the database
import { prisma } from "../lib/prisma.js"
// Import the fail helper to build standardised error response envelopes
import { fail } from "../lib/response.js"
// Import the AuthUser type that describes the shape of the authenticated user stored in context
import type { AuthUser } from "../types/auth.js"

/* Middleware that validates the Bearer token and attaches the authenticated user to context */
export async function authMiddleware(c: Context, next: Next) {
  // Read the Authorization header from the incoming request
  const header = c.req.header("Authorization")
  // If the header is missing, reject the request immediately with 401 Unauthorized
  if (!header) {
    return c.json(fail("Unauthorized"), 401)
  }

  // Strip the "Bearer " prefix to extract the raw JWT string
  const token = header.replace("Bearer ", "")
  try {
    // Verify the token signature and expiry; throws if invalid or expired
    const payload = verifyAccessToken(token)
    // Look up the user in the database using the subject claim (user ID) from the token
    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    // Reject if the user does not exist or has been deactivated
    if (!user || !user.isActive) {
      return c.json(fail("Unauthorized"), 401)
    }
    // Build a minimal AuthUser object containing only the fields needed downstream
    const authUser: AuthUser = { id: user.id, role: user.role, email: user.email }
    // Store the authenticated user in the Hono context so route handlers can access it
    c.set("user", authUser)
    // Pass control to the next middleware or route handler
    await next()
  } catch {
    // Any error during token verification (expired, tampered, etc.) results in 401
    return c.json(fail("Unauthorized"), 401)
  }
}

/* Helper to retrieve the authenticated user from the Hono context in route handlers */
export function getAuthUser(c: Context): AuthUser {
  // Reads the "user" value previously set by authMiddleware
  return c.get("user")
}
