import { Context } from "hono"
import { ok, fail } from "../lib/response.js"
import { getAuthUser } from "../middlewares/auth.js"
import { getCalendarData } from "../services/calendarService.js"

/* GET /api/calendar?from&to — combined calendar feed (sessions, exams,
   dated announcements) in a single request */
export async function calendarFeed(c: Context) {
  try {
    const authUser = getAuthUser(c)
    const from = c.req.query("from") ? new Date(c.req.query("from")!) : undefined
    const to = c.req.query("to") ? new Date(c.req.query("to")!) : undefined
    const data = await getCalendarData(authUser, { from, to })
    return c.json(ok("Calendar feed fetched", data))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Failed to fetch calendar"), 400)
  }
}
