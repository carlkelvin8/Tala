import { Context } from "hono"
import { ok, fail } from "../lib/response.js"
import { createExamSession, endExamAttempt, listExamSessions, listExamAttempts, logMonitoringEvent, startExamAttempt } from "../services/examService.js"
import { getAuthUser } from "../middlewares/auth.js"
import { RoleType } from "@prisma/client"

function resolveSectionId(authUser: { role: RoleType; sectionId?: string }, querySectionId?: string): string | undefined {
  if (authUser.role === RoleType.STUDENT || authUser.role === RoleType.CADET_OFFICER) {
    return authUser.sectionId
  }
  return querySectionId
}

/* POST /api/exams/ — create a new exam session */
export async function createSession(c: Context) {
  try {
    // Parse the JSON body containing exam session configuration
    const body = await c.req.json()
    // Delegate to the exam service; convert scheduledAt string to a Date object
    const session = await createExamSession({
      ...body,                              // Spread all other fields (title, description, durationMin, etc.)
      scheduledAt: new Date(body.scheduledAt) // Convert the ISO date string to a Date object
    })
    // Return the created exam session object
    return c.json(ok("Exam session created", session))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Create failed"), 400)
  }
}

export async function listSessions(c: Context) {
  const authUser = getAuthUser(c)
  const query = c.req.query()
  const sectionId = resolveSectionId(authUser, query.sectionId)
  const sessions = await listExamSessions(sectionId ? { sectionId } : undefined)
  return c.json(ok("Exam sessions fetched", sessions))
}

/* POST /api/exams/attempts — start a new exam attempt for the authenticated student */
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

/* GET /api/exams/attempts — list the authenticated student's exam attempts */
export async function listAttempts(c: Context) {
  try {
    const authUser = getAuthUser(c)
    const attempts = await listExamAttempts(authUser.id)
    return c.json(ok("Exam attempts fetched", attempts))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Failed to fetch attempts"), 400)
  }
}

/* POST /api/exams/attempts/:id/finish — end an exam attempt */
export async function endAttempt(c: Context) {
  try {
    // Retrieve the authenticated user (must be the student who started the attempt)
    const authUser = getAuthUser(c)
    // Extract the attempt ID from the URL path parameter
    const id = c.req.param("id")
    // Delegate to the exam service to set the endedAt timestamp on the attempt
    const attempt = await endExamAttempt(id, authUser.id)
    // Return the updated attempt object
    return c.json(ok("Exam attempt ended", attempt))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "End failed"), 400)
  }
}

/* POST /api/exams/logs — log a monitoring event during an exam attempt */
export async function logEvent(c: Context) {
  try {
    // Parse the JSON body containing the attempt ID and event description
    const body = await c.req.json()
    // Delegate to the exam service to create the monitoring log record
    const log = await logMonitoringEvent(body.examAttemptId, body.event)
    // Return the created monitoring log object
    return c.json(ok("Event logged", log))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Log failed"), 400)
  }
}
