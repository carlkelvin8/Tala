import type { Context, Next } from "hono"
import { verifyAccessToken } from "../lib/jwt.js"
import { prisma } from "../lib/prisma.js"
import { fail } from "../lib/response.js"
import type { AuthUser } from "../types/auth.js"
import { RoleType } from "@prisma/client"

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

    let sectionId: string | undefined

    if (user.role === RoleType.STUDENT) {
      const profile = await prisma.studentProfile.findUnique({
        where: { userId: user.id },
        select: { sectionId: true }
      })
      sectionId = profile?.sectionId ?? undefined
    } else if (user.role === RoleType.CADET_OFFICER) {
      const enrollment = await prisma.enrollment.findFirst({
        where: { userId: user.id, status: "APPROVED" },
        select: { sectionId: true },
        orderBy: { createdAt: "desc" }
      })
      sectionId = enrollment?.sectionId ?? undefined
    }

    const authUser: AuthUser = { id: user.id, role: user.role, email: user.email, sectionId }
    c.set("user", authUser)
    await next()
  } catch {
    return c.json(fail("Unauthorized"), 401)
  }
}

export function getAuthUser(c: Context): AuthUser {
  return c.get("user")
}
