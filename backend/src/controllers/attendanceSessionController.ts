// Import the Context type from Hono for request/response handling
import { Context } from "hono"
// Import the ok and fail response helpers for standardised API envelopes
import { ok, fail } from "../lib/response.js"
// Import the helper to retrieve the authenticated user from context
import { getAuthUser } from "../middlewares/auth.js"
// Import all attendance session service functions
import {
  createSession,                  // Creates a new geo-verified attendance session
  updateHostLocation,             // Updates the host's live GPS coordinates
  setVerifier,                    // Assigns a verifier and their initial location
  updateVerifierLocation,         // Updates the verifier's live GPS coordinates
  markAttendanceWithLocation,     // Marks a student's attendance with full location verification
  getActiveSessions,              // Returns all currently active sessions
  endSession,                     // Ends an active session
} from "../services/attendanceSessionService.js"

/* POST /api/attendance-sessions/ — create a new attendance session */
export async function createSessionHandler(c: Context) {
  try {
    // Retrieve the authenticated user (the session host) from context
    const authUser = getAuthUser(c)
    // Parse the JSON body containing session configuration
    const body = await c.req.json()

    // Delegate to the service to validate coordinates and persist the session
    const session = await createSession({
      title: body.title,                    // Human-readable title for the session
      date: new Date(body.date),            // Date of the session (converted from ISO string)
      hostId: authUser.id,                  // The authenticated user becomes the session host
      hostLatitude: body.latitude,          // Host's initial GPS latitude
      hostLongitude: body.longitude,        // Host's initial GPS longitude
      radiusMeters: body.radiusMeters,      // Allowed radius in metres for student check-in
      requireVerifier: body.requireVerifier, // Whether a verifier must also be in range
      sectionId: body.sectionId,            // Optional section to scope the session
      flightId: body.flightId,              // Optional flight to scope the session
    })

    // Return the created session object
    return c.json(ok("Attendance session created", session))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Failed to create session"), 400)
  }
}

/* PATCH /api/attendance-sessions/:sessionId/host-location — update the host's GPS coordinates */
export async function updateHostLocationHandler(c: Context) {
  try {
    // Retrieve the authenticated user (must be the session host)
    const authUser = getAuthUser(c)
    // Extract the session ID from the URL path parameter
    const { sessionId } = c.req.param()
    // Parse the JSON body containing the new GPS coordinates
    const body = await c.req.json()

    // Delegate to the service to validate and persist the updated host location
    const session = await updateHostLocation(
      sessionId,       // ID of the session to update
      authUser.id,     // Must match the session's hostId (enforced in service layer)
      body.latitude,   // New GPS latitude
      body.longitude   // New GPS longitude
    )

    // Return the updated session object
    return c.json(ok("Host location updated", session))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Failed to update location"), 400)
  }
}

/* POST /api/attendance-sessions/:sessionId/verifier — assign a verifier to the session */
export async function setVerifierHandler(c: Context) {
  try {
    // Extract the session ID from the URL path parameter
    const { sessionId } = c.req.param()
    // Parse the JSON body containing the verifier's ID and initial location
    const body = await c.req.json()

    // Delegate to the service to validate coordinates and assign the verifier
    const session = await setVerifier(
      sessionId,        // ID of the session to update
      body.verifierId,  // UUID of the user being assigned as verifier
      body.latitude,    // Verifier's initial GPS latitude
      body.longitude    // Verifier's initial GPS longitude
    )

    // Return the updated session object
    return c.json(ok("Verifier assigned", session))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Failed to set verifier"), 400)
  }
}

/* PATCH /api/attendance-sessions/:sessionId/verifier-location — update the verifier's GPS coordinates */
export async function updateVerifierLocationHandler(c: Context) {
  try {
    // Retrieve the authenticated user (must be the assigned verifier)
    const authUser = getAuthUser(c)
    // Extract the session ID from the URL path parameter
    const { sessionId } = c.req.param()
    // Parse the JSON body containing the new GPS coordinates
    const body = await c.req.json()

    // Delegate to the service to validate and persist the updated verifier location
    const session = await updateVerifierLocation(
      sessionId,       // ID of the session to update
      authUser.id,     // Must match the session's verifierId (enforced in service layer)
      body.latitude,   // New GPS latitude
      body.longitude   // New GPS longitude
    )

    // Return the updated session object
    return c.json(ok("Verifier location updated", session))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Failed to update location"), 400)
  }
}

/* POST /api/attendance-sessions/:sessionId/mark — mark the authenticated student's attendance */
export async function markAttendanceHandler(c: Context) {
  try {
    // Retrieve the authenticated user (the student marking their attendance)
    const authUser = getAuthUser(c)
    // Extract the session ID from the URL path parameter
    const { sessionId } = c.req.param()
    // Parse the JSON body containing the student's GPS coordinates and timestamp
    const body = await c.req.json()

    // Delegate to the service for full location verification and record creation
    const record = await markAttendanceWithLocation(
      sessionId,                                    // ID of the active session
      authUser.id,                                  // Student's user ID
      body.latitude,                                // Student's GPS latitude
      body.longitude,                               // Student's GPS longitude
      new Date(body.timestamp || Date.now())        // Timestamp from client; fall back to server time
    )

    // Return the created attendance record
    return c.json(ok("Attendance marked successfully", record))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Failed to mark attendance"), 400)
  }
}

/* GET /api/attendance-sessions/active — return all currently active sessions */
export async function getActiveSessionsHandler(c: Context) {
  try {
    // Extract optional filter query parameters
    const query = c.req.query()
    // Delegate to the service to fetch active sessions with optional section/flight filters
    const sessions = await getActiveSessions({
      sectionId: query.sectionId, // Optional section filter
      flightId: query.flightId,   // Optional flight filter
    })

    // Return the list of active sessions
    return c.json(ok("Active sessions fetched", sessions))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Failed to fetch sessions"), 400)
  }
}

/* POST /api/attendance-sessions/:sessionId/end — end an active attendance session */
export async function endSessionHandler(c: Context) {
  try {
    // Retrieve the authenticated user (must be the session host)
    const authUser = getAuthUser(c)
    // Extract the session ID from the URL path parameter
    const { sessionId } = c.req.param()

    // Delegate to the service to validate host identity and mark the session as ended
    const session = await endSession(sessionId, authUser.id)

    // Return the updated (ended) session object
    return c.json(ok("Session ended", session))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Failed to end session"), 400)
  }
}
