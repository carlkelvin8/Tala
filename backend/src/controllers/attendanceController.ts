import { Context } from "hono"
import { ok, fail } from "../lib/response.js"
import { checkIn, checkOut, listAttendance } from "../services/attendanceService.js"
import { getAuthUser } from "../middlewares/auth.js"
import { getPagination } from "../lib/pagination.js"
import { RoleType } from "@prisma/client"

function resolveSectionId(authUser: { role: RoleType; sectionId?: string }, querySectionId?: string): string | undefined {
  if (authUser.role === RoleType.STUDENT || authUser.role === RoleType.CADET_OFFICER) {
    return authUser.sectionId
  }
  return querySectionId
}

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

export async function list(c: Context) {
  const authUser = getAuthUser(c)
  const query = c.req.query()
  const { page, pageSize, skip, take } = getPagination(query)
  const date = query.date ? new Date(query.date) : undefined
  const sectionId = resolveSectionId(authUser, query.sectionId)
  const result = await listAttendance(
    {
      date,
      userId: query.userId,
      sectionId,
      flightId: query.flightId
    },
    skip,
    take
  )
  return c.json(ok("Attendance fetched", result.items, { page, pageSize, total: result.total }))
}
