import { Hono } from "hono"
import { authMiddleware } from "../middlewares/auth.js"
import { roleGuard } from "../middlewares/roleGuard.js"
import { RoleType } from "@prisma/client"
import { ok, fail } from "../lib/response.js"
import { getAuthUser } from "../middlewares/auth.js"
import { getLeaderboard } from "../services/leaderboardService.js"
import { prisma } from "../lib/prisma.js"

export const leaderboardRoutes = new Hono()

leaderboardRoutes.use("*", authMiddleware)
leaderboardRoutes.use(roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER, RoleType.STUDENT]))

/* GET /api/leaderboard — gamified attendance ranking (students see their own section) */
leaderboardRoutes.get("/", async (c) => {
  try {
    const authUser = getAuthUser(c)
    let sectionId = c.req.query("sectionId") || undefined

    if (!sectionId && authUser.role === RoleType.STUDENT) {
      const profile = await prisma.studentProfile.findUnique({
        where: { userId: authUser.id },
        select: { sectionId: true },
      })
      sectionId = profile?.sectionId ?? undefined
    }

    const entries = await getLeaderboard({ sectionId })
    return c.json(ok("Leaderboard fetched", entries))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Failed to fetch leaderboard"), 400)
  }
})
