import { Context } from "hono"
import { ok, fail } from "../lib/response.js"
import { assignMerit, listMerits } from "../services/meritService.js"
import { getAuthUser } from "../middlewares/auth.js"
import { getPagination } from "../lib/pagination.js"
import { MeritType } from "@prisma/client"

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

export async function list(c: Context) {
  const query = c.req.query()
  const { page, pageSize, skip, take } = getPagination(query)
  const result = await listMerits(
    {
      studentId: query.studentId,
      type: query.type as MeritType | undefined
    },
    skip,
    take
  )
  return c.json(ok("Merit/Demerit fetched", result.items, { page, pageSize, total: result.total }))
}
