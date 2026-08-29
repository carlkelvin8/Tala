import { Context } from "hono"
import { ok, fail } from "../lib/response.js"
import { assignMerit, listMerits, updateMerit, deleteMerit } from "../services/meritService.js"
import { getAuthUser } from "../middlewares/auth.js"
import { getPagination } from "../lib/pagination.js"
import { MeritType, RoleType } from "@prisma/client"

export async function create(c: Context) {
  try {
    const authUser = getAuthUser(c)
    const body = await c.req.json()
    const merit = await assignMerit({ ...body, encodedById: authUser.id })
    return c.json(ok("Merit/Demerit assigned", merit))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Assign failed"), 400)
  }
}

export async function update(c: Context) {
  try {
    const authUser = getAuthUser(c)
    const id = c.req.param("id")
    const body = await c.req.json()
    const merit = await updateMerit(id, body, authUser.id)
    return c.json(ok("Merit/Demerit updated", merit))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Update failed"), 400)
  }
}

export async function remove(c: Context) {
  try {
    const authUser = getAuthUser(c)
    const id = c.req.param("id")
    await deleteMerit(id, authUser.id)
    return c.json(ok("Merit/Demerit deleted"))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Delete failed"), 400)
  }
}

export async function list(c: Context) {
  const authUser = getAuthUser(c)
  const query = c.req.query()
  const { page, pageSize, skip, take } = getPagination(query)
  const filters: { studentId?: string; type?: MeritType; sectionId?: string } = {
    studentId: query.studentId,
    type: query.type as MeritType | undefined
  }
  // Fail closed: a student only ever sees merits of their own section (or, when no
  // section resolves, only their own merit history) — never the whole database.
  if (authUser.role === RoleType.STUDENT) {
    filters.sectionId = authUser.sectionId
    if (!authUser.sectionId) filters.studentId = authUser.id
  } else {
    filters.sectionId = query.sectionId
  }
  const result = await listMerits(filters, skip, take)
  return c.json(ok("Merit/Demerit fetched", result.items, { page, pageSize, total: result.total }))
}
