import { Context } from "hono"
import { ok, fail } from "../lib/response.js"
import { bulkCheckAbsences, getAbsenceCount, MAX_ABSENCES } from "../services/absenceService.js"

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
    const count = await getAbsenceCount(userId)
    return c.json(ok("Absence count fetched", { count, maxAbsences: MAX_ABSENCES }))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Fetch failed"), 400)
  }
}
