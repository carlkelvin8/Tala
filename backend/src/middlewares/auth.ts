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

  if (!header.startsWith("Bearer ")) {
    return c.json(fail("Unauthorized"), 401)
  }

  const token = header.slice("Bearer ".length)
  let payload
  try {
    payload = verifyAccessToken(token)
  } catch {
    return c.json(fail("Unauthorized"), 401)
  }

  // Keep downstream database/controller errors out of the token-validation catch.
  // Those errors must reach the global error handler as 500 responses, not 401s.
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
    // Fall back to the student's latest APPROVED enrollment section so section
    // scoping never silently collapses to "entire database" when the profile
    // field is out of sync (e.g. legacy students or CSV import without a section).
    if (!sectionId) {
      const enrollment = await prisma.enrollment.findFirst({
        where: { userId: user.id, status: "APPROVED" },
        select: { sectionId: true },
        orderBy: { createdAt: "desc" }
      })
      sectionId = enrollment?.sectionId ?? undefined
    }
  } else if (user.role === RoleType.CADET_OFFICER) {
    const enrollment = await prisma.enrollment.findFirst({
      where: { userId: user.id, status: "APPROVED" },
      select: { sectionId: true },
      orderBy: { createdAt: "desc" }
    })
    sectionId = enrollment?.sectionId ?? undefined
  }

  const authUser: AuthUser = { id: user.id, role: user.role, email: user.email, program: user.program, sectionId }
  c.set("user", authUser)
  await next()
}

export function getAuthUser(c: Context): AuthUser {
  return c.get("user")
}
