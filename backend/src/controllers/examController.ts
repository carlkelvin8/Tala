import { Context } from "hono"
import { ok, fail } from "../lib/response.js"
import { createExamSession, endExamAttempt, listExamSessions, logMonitoringEvent, startExamAttempt } from "../services/examService.js"
import { getAuthUser } from "../middlewares/auth.js"

export async function createSession(c: Context) {
  try {
    const body = await c.req.json()
    const session = await createExamSession({
      ...body,
      scheduledAt: new Date(body.scheduledAt)
    })
    return c.json(ok("Exam session created", session))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Create failed"), 400)
  }
}

export async function listSessions(c: Context) {
  const sessions = await listExamSessions()
  return c.json(ok("Exam sessions fetched", sessions))
}

export async function startAttempt(c: Context) {
  try {
    const authUser = getAuthUser(c)
    const body = await c.req.json()
    const attempt = await startExamAttempt(body.examSessionId, authUser.id)
    return c.json(ok("Exam attempt started", attempt))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Start failed"), 400)
  }
}

export async function endAttempt(c: Context) {
  try {
    const authUser = getAuthUser(c)
    const id = c.req.param("id")
    const attempt = await endExamAttempt(id, authUser.id)
    return c.json(ok("Exam attempt ended", attempt))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "End failed"), 400)
  }
}

export async function logEvent(c: Context) {
  try {
    const body = await c.req.json()
    const log = await logMonitoringEvent(body.examAttemptId, body.event)
    return c.json(ok("Event logged", log))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Log failed"), 400)
  }
}
