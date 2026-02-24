import type { Context, Next } from "hono"
import { verifyAccessToken } from "../lib/jwt.js"
import { prisma } from "../lib/prisma.js"
import { fail } from "../lib/response.js"
import type { AuthUser } from "../types/auth.js"

export async function authMiddleware(c: Context, next: Next) {
  const header = c.req.header("Authorization")
  if (!header) {
    return c.json(fail("Unauthorized"), 401)
  }

  const token = header.replace("Bearer ", "")
  try {
    const payload = verifyAccessToken(token)
    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user || !user.isActive) {
      return c.json(fail("Unauthorized"), 401)
    }
    const authUser: AuthUser = { id: user.id, role: user.role, email: user.email }
    c.set("user", authUser)
    await next()
  } catch {
    return c.json(fail("Unauthorized"), 401)
  }
}

export function getAuthUser(c: Context): AuthUser {
  return c.get("user")
}
