import { Context } from "hono"
import { ok, fail } from "../lib/response.js"
import { generateQRToken, scanQR, listAttendance } from "../services/attendanceService.js"
import { getAuthUser } from "../middlewares/auth.js"
import { getPagination } from "../lib/pagination.js"
import { NstpType, RoleType } from "@prisma/client"

function resolveSectionId(authUser: { role: RoleType; sectionId?: string }, querySectionId?: string): string | undefined {
  if (authUser.role === RoleType.STUDENT || authUser.role === RoleType.CADET_OFFICER) {
    return authUser.sectionId
  }
  return querySectionId
}

/* Implementors are locked to ROTC. Admins may target a program via ?program=.
   Everyone else is scoped to their account-level program. */
function resolveScopeProgram(authUser: { role: RoleType; program?: NstpType | null }, rawProgram?: string): NstpType | null {
  if (authUser.role === RoleType.IMPLEMENTOR) return NstpType.ROTC
  if (authUser.role === RoleType.ADMIN) {
    const program = rawProgram?.toUpperCase()
    return program === "ROTC" || program === "CWTS" ? (program as NstpType) : null
  }
  return authUser.program ?? null
}

export async function getQRTokenHandler(c: Context) {
  try {
    const authUser = getAuthUser(c)
    const result = await generateQRToken(authUser.id)
    return c.json(ok("QR token generated", result))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Failed to generate QR token"), 400)
  }
}

export async function scanQRHandler(c: Context) {
  try {
    const authUser = getAuthUser(c)
    const body = await c.req.json()
    const result = await scanQR(body.token, authUser.id, resolveScopeProgram(authUser))
    return c.json(ok("Attendance recorded", result))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Scan failed"), 400)
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
      flightId: query.flightId,
      program: resolveScopeProgram(authUser, query.program) ?? undefined
    },
    skip,
    take
  )
  return c.json(ok("Attendance fetched", result.items, { page, pageSize, total: result.total }))
}
