import { Context } from "hono"
import { ok, fail } from "../lib/response.js"
import { getTrainingDaySummary, getStudentTrainingDays, getTermAttendanceOverview } from "../services/trainingDayService.js"

export async function summary(c: Context) {
  try {
    const termId = c.req.query("termId")
    const sectionId = c.req.query("sectionId")
    if (!termId) return c.json(fail("termId is required"), 400)
    const result = await getTrainingDaySummary(termId, sectionId)
    return c.json(ok("Training day summary fetched", result))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Failed to fetch summary"), 400)
  }
}

export async function studentDays(c: Context) {
  try {
    const userId = c.req.param("userId")
    const termId = c.req.query("termId")
    if (!termId) return c.json(fail("termId is required"), 400)
    const result = await getStudentTrainingDays(userId, termId)
    return c.json(ok("Student training days fetched", result))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Failed to fetch student days"), 400)
  }
}

export async function overview(c: Context) {
  try {
    const termId = c.req.query("termId")
    if (!termId) return c.json(fail("termId is required"), 400)
    const result = await getTermAttendanceOverview(termId)
    return c.json(ok("Term attendance overview fetched", result))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Failed to fetch overview"), 400)
  }
}
