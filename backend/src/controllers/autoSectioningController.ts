import { Context } from "hono"
import { ok, fail } from "../lib/response.js"
import { autoSectionEnrollees } from "../services/autoSectioning.js"

export async function autoSectionHandler(c: Context) {
  try {
    const body = await c.req.json()
    if (!body.courseId || typeof body.courseId !== "string") {
      return c.json(fail("courseId is required"), 400)
    }
    const result = await autoSectionEnrollees(body.courseId)
    return c.json(ok("Auto-sectioning completed", result))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Auto-sectioning failed"), 400)
  }
}
