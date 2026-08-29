import { Context } from "hono"
import { ok, fail } from "../lib/response.js"
import { bulkCheckAbsences, getAbsenceCount, MAX_ABSENCES } from "../services/absenceService.js"
import { getAuthUser } from "../middlewares/auth.js"
import { getUserById } from "../services/userService.js"
import { resolveScopeProgram } from "../services/programScope.js"
import { RoleType } from "@prisma/client"

export async function checkAll(c: Context) {
  try {
    const result = await bulkCheckAbsences()
    return c.json(ok(`Checked ${result.checked} students, ${result.failed.length} marked as failed`, result))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Check failed"), 500)
  }
}

export async function getCount(c: Context) {
  try {
    const userId = c.req.param("userId")
    const authUser = getAuthUser(c)
    // Students and cadet officers may only read their own absence count
    if (
      (authUser.role === RoleType.STUDENT || authUser.role === RoleType.CADET_OFFICER) &&
      authUser.id !== userId
    ) {
      return c.json(fail("Forbidden"), 403)
    }
    // Implementors are locked to ROTC — cannot read another program's student
    if (authUser.role === RoleType.IMPLEMENTOR) {
      const program = resolveScopeProgram(authUser)
      const target = await getUserById(userId, program)
      if (!target) return c.json(fail("User not found"), 404)
    }
    const count = await getAbsenceCount(userId)
    return c.json(ok("Absence count fetched", { count, maxAbsences: MAX_ABSENCES }))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Fetch failed"), 400)
  }
}
