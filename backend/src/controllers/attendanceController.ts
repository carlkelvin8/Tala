import { Context } from "hono"
import { ok, fail } from "../lib/response.js"
import { checkIn, checkOut, listAttendance } from "../services/attendanceService.js"
import { getAuthUser } from "../middlewares/auth.js"
import { getPagination } from "../lib/pagination.js"

export async function checkInHandler(c: Context) {
  try {
    const authUser = getAuthUser(c)
    const body = await c.req.json()
    const record = await checkIn(authUser.id, body.latitude, body.longitude)
    return c.json(ok("Checked in", record))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Check-in failed"), 400)
  }
}

export async function checkOutHandler(c: Context) {
  try {
    const authUser = getAuthUser(c)
    const body = await c.req.json()
    const record = await checkOut(authUser.id, body.latitude, body.longitude)
    return c.json(ok("Checked out", record))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Check-out failed"), 400)
  }
}

export async function list(c: Context) {
  const query = c.req.query()
  const { page, pageSize, skip, take } = getPagination(query)
  const date = query.date ? new Date(query.date) : undefined
  const result = await listAttendance(
    {
      date,
      userId: query.userId,
      sectionId: query.sectionId,
      flightId: query.flightId
    },
    skip,
    take
  )
  return c.json(ok("Attendance fetched", result.items, { page, pageSize, total: result.total }))
}
