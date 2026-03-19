// Import the Context type from Hono for request/response handling
import { Context } from "hono"
// Import the ok and fail response helpers for standardised API envelopes
import { ok, fail } from "../lib/response.js"
// Import the attendance service functions for business logic
import { checkIn, checkOut, listAttendance } from "../services/attendanceService.js"
// Import the helper to retrieve the authenticated user from context
import { getAuthUser } from "../middlewares/auth.js"
// Import the pagination helper to parse and bound page/pageSize query params
import { getPagination } from "../lib/pagination.js"

/* POST /api/attendance/check-in — record a check-in for the authenticated user */
export async function checkInHandler(c: Context) {
  try {
    // Retrieve the authenticated user from the Hono context
    const authUser = getAuthUser(c)
    // Parse the JSON body containing the user's GPS coordinates
    const body = await c.req.json()
    // Delegate to the attendance service to upsert today's attendance record with PRESENT status
    const record = await checkIn(authUser.id, body.latitude, body.longitude)
    // Return the created/updated attendance record in the response
    return c.json(ok("Checked in", record))
  } catch (error) {
    // Return 400 with the error message if check-in fails
    return c.json(fail(error instanceof Error ? error.message : "Check-in failed"), 400)
  }
}

/* POST /api/attendance/check-out — record a check-out for the authenticated user */
export async function checkOutHandler(c: Context) {
  try {
    // Retrieve the authenticated user from the Hono context
    const authUser = getAuthUser(c)
    // Parse the JSON body containing the user's GPS coordinates at check-out
    const body = await c.req.json()
    // Delegate to the attendance service to upsert today's record with the check-out time
    const record = await checkOut(authUser.id, body.latitude, body.longitude)
    // Return the updated attendance record in the response
    return c.json(ok("Checked out", record))
  } catch (error) {
    // Return 400 with the error message if check-out fails
    return c.json(fail(error instanceof Error ? error.message : "Check-out failed"), 400)
  }
}

/* GET /api/attendance/ — return a paginated list of attendance records */
export async function list(c: Context) {
  // Extract all query parameters from the URL
  const query = c.req.query()
  // Parse and bound the pagination parameters (page, pageSize, skip, take)
  const { page, pageSize, skip, take } = getPagination(query)
  // Parse the optional date filter; convert to a Date object if provided
  const date = query.date ? new Date(query.date) : undefined
  // Delegate to the attendance service with all filters and pagination values
  const result = await listAttendance(
    {
      date,                        // Optional date filter
      userId: query.userId,        // Optional user ID filter
      sectionId: query.sectionId,  // Optional section ID filter
      flightId: query.flightId     // Optional flight/group ID filter
    },
    skip, // Number of records to skip for the current page
    take  // Maximum number of records to return
  )
  // Return the paginated list with metadata (page, pageSize, total)
  return c.json(ok("Attendance fetched", result.items, { page, pageSize, total: result.total }))
}
