import { Context } from "hono"
import { ok, fail } from "../lib/response.js"
import { addRemark, getRemarksForStudent, addRecordRemark } from "../services/remarkService.js"
import { getAuthUser } from "../middlewares/auth.js"
import { getUserById } from "../services/userService.js"
import { resolveScopeProgram } from "../services/programScope.js"
import { assertUserInProgram } from "../services/programGuard.js"
import { getPagination } from "../lib/pagination.js"
import { prisma } from "../lib/prisma.js"
import { RoleType } from "@prisma/client"

export async function createRemark(c: Context) {
  try {
    const authUser = getAuthUser(c)
    const body = await c.req.json()
    // Implementors are locked to ROTC — they may not write remarks on other programs
    const program = resolveScopeProgram(authUser)
    if (program) {
      const target = await getUserById(body.userId, program)
      if (!target) return c.json(fail("User not found"), 404)
    }
    const remark = await addRemark(body.userId, body.remark, authUser.id)
    return c.json(ok("Remark added", remark))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Failed to add remark"), 400)
  }
}

export async function listRemarks(c: Context) {
  try {
    const userId = c.req.param("userId")
    const authUser = getAuthUser(c)
    // Students and cadet officers may only read their own remarks
    if (
      (authUser.role === RoleType.STUDENT || authUser.role === RoleType.CADET_OFFICER) &&
      authUser.id !== userId
    ) {
      return c.json(fail("Forbidden"), 403)
    }
    // Implementors are locked to ROTC — cannot read another program's student
    if (authUser.role === RoleType.IMPLEMENTOR) {
      const program = resolveScopeProgram(authUser)
      const target = await getUserById(userId, program)
      if (!target) return c.json(fail("User not found"), 404)
    }
    const query = c.req.query()
    const { skip, take } = getPagination(query)
    const result = await getRemarksForStudent(userId, skip, take)
    return c.json(ok("Remarks fetched", result.items, { page: Number(query.page) || 1, pageSize: take, total: result.total }))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Failed to fetch remarks"), 400)
  }
}

export async function updateRecordRemark(c: Context) {
  try {
    const authUser = getAuthUser(c)
    const recordId = c.req.param("recordId")
    const body = await c.req.json()
    // Scope the attendance record's owner to the caller's program before writing
    const record = await prisma.attendanceRecord.findUnique({
      where: { id: recordId },
      select: { userId: true }
    })
    if (!record) {
      return c.json(fail("Attendance record not found"), 404)
    }
    await assertUserInProgram(record.userId, resolveScopeProgram(authUser))
    const updated = await addRecordRemark(recordId, body.remarks)
    return c.json(ok("Remark updated", updated))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Failed to update remark"), 400)
  }
}
