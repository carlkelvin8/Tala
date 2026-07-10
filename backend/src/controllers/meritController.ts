import { Context } from "hono"
import { ok, fail } from "../lib/response.js"
import { assignMerit, listMerits } from "../services/meritService.js"
import { getAuthUser } from "../middlewares/auth.js"
import { getPagination } from "../lib/pagination.js"
import { MeritType, RoleType } from "@prisma/client"

function resolveSectionId(authUser: { role: RoleType; sectionId?: string }, querySectionId?: string): string | undefined {
  if (authUser.role === RoleType.STUDENT || authUser.role === RoleType.CADET_OFFICER) {
    return authUser.sectionId
  }
  return querySectionId
}

/* POST /api/merits/ — assign a merit or demerit to a student */
export async function create(c: Context) {
  try {
    // Retrieve the authenticated user (the staff member assigning the merit/demerit)
    const authUser = getAuthUser(c)
    // Parse the JSON body containing studentId, type, points, and reason
    const body = await c.req.json()
    // Delegate to the merit service, injecting the encoder's ID for audit purposes
    const merit = await assignMerit({ ...body, encodedById: authUser.id })
    // Return the created merit/demerit record
    return c.json(ok("Merit/Demerit assigned", merit))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Assign failed"), 400)
  }
}

export async function list(c: Context) {
  const authUser = getAuthUser(c)
  const query = c.req.query()
  const { page, pageSize, skip, take } = getPagination(query)
  const sectionId = resolveSectionId(authUser, query.sectionId)
  const result = await listMerits(
    {
      studentId: query.studentId,
      type: query.type as MeritType | undefined,
      sectionId
    },
    skip,
    take
  )
  return c.json(ok("Merit/Demerit fetched", result.items, { page, pageSize, total: result.total }))
}
