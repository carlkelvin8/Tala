import { Context } from "hono"
import { ok, fail } from "../lib/response.js"
import { getAuthUser } from "../middlewares/auth.js"
import {
  createSession,
  updateHostLocation,
  setVerifier,
  updateVerifierLocation,
  markAttendanceWithLocation,
  getActiveSessions,
  endSession,
} from "../services/attendanceSessionService.js"

export async function createSessionHandler(c: Context) {
  try {
    const authUser = getAuthUser(c)
    const body = await c.req.json()

    const session = await createSession({
      title: body.title,
      date: new Date(body.date),
      hostId: authUser.id,
      hostLatitude: body.latitude,
      hostLongitude: body.longitude,
      radiusMeters: body.radiusMeters,
      requireVerifier: body.requireVerifier,
      sectionId: body.sectionId,
      flightId: body.flightId,
    })

    return c.json(ok("Attendance session created", session))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Failed to create session"), 400)
  }
}

export async function updateHostLocationHandler(c: Context) {
  try {
    const authUser = getAuthUser(c)
    const { sessionId } = c.req.param()
    const body = await c.req.json()

    const session = await updateHostLocation(
      sessionId,
      authUser.id,
      body.latitude,
      body.longitude
    )

    return c.json(ok("Host location updated", session))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Failed to update location"), 400)
  }
}

export async function setVerifierHandler(c: Context) {
  try {
    const { sessionId } = c.req.param()
    const body = await c.req.json()

    const session = await setVerifier(
      sessionId,
      body.verifierId,
      body.latitude,
      body.longitude
    )

    return c.json(ok("Verifier assigned", session))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Failed to set verifier"), 400)
  }
}

export async function updateVerifierLocationHandler(c: Context) {
  try {
    const authUser = getAuthUser(c)
    const { sessionId } = c.req.param()
    const body = await c.req.json()

    const session = await updateVerifierLocation(
      sessionId,
      authUser.id,
      body.latitude,
      body.longitude
    )

    return c.json(ok("Verifier location updated", session))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Failed to update location"), 400)
  }
}

export async function markAttendanceHandler(c: Context) {
  try {
    const authUser = getAuthUser(c)
    const { sessionId } = c.req.param()
    const body = await c.req.json()

    const record = await markAttendanceWithLocation(
      sessionId,
      authUser.id,
      body.latitude,
      body.longitude,
      new Date(body.timestamp || Date.now())
    )

    return c.json(ok("Attendance marked successfully", record))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Failed to mark attendance"), 400)
  }
}

export async function getActiveSessionsHandler(c: Context) {
  try {
    const query = c.req.query()
    const sessions = await getActiveSessions({
      sectionId: query.sectionId,
      flightId: query.flightId,
    })

    return c.json(ok("Active sessions fetched", sessions))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Failed to fetch sessions"), 400)
  }
}

export async function endSessionHandler(c: Context) {
  try {
    const authUser = getAuthUser(c)
    const { sessionId } = c.req.param()

    const session = await endSession(sessionId, authUser.id)

    return c.json(ok("Session ended", session))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Failed to end session"), 400)
  }
}
