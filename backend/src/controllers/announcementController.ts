import { Context } from "hono"
import { ok, fail } from "../lib/response.js"
import { createAnnouncement, listAnnouncements, updateAnnouncement, deleteAnnouncement } from "../services/announcementService.js"
import { getPagination } from "../lib/pagination.js"
import { getAuthUser } from "../middlewares/auth.js"
import { resolveScopeProgram } from "../services/programScope.js"
import { NstpType } from "@prisma/client"

/* GET /api/announcements — return a paginated list of announcements */
export async function list(c: Context) {
  try {
    const authUser = getAuthUser(c)
    const query = c.req.query()
    const { page, pageSize, skip, take } = getPagination(query)
    const program = query.program?.toUpperCase() === "CWTS" || query.program?.toUpperCase() === "ROTC"
      ? (query.program.toUpperCase() as NstpType)
      : undefined
    const result = await listAnnouncements({ program }, skip, take, resolveScopeProgram(authUser))
    return c.json(ok("Announcements fetched", result.items, { page, pageSize, total: result.total }))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Failed to fetch announcements"), 400)
  }
}

/* POST /api/announcements — create a new announcement */
export async function create(c: Context) {
  try {
    const authUser = getAuthUser(c)
    const body = await c.req.json()
    const announcement = await createAnnouncement({
      title: body.title,
      body: body.body,
      program: body.program as NstpType | undefined,
      createdById: authUser.id,
      scopeProgram: resolveScopeProgram(authUser),
    })
    return c.json(ok("Announcement created", announcement))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Create failed"), 400)
  }
}

/* PATCH /api/announcements/:id — update an existing announcement */
export async function update(c: Context) {
  try {
    const authUser = getAuthUser(c)
    const id = c.req.param("id")
    const body = await c.req.json()
    const announcement = await updateAnnouncement(
      id,
      { title: body.title, body: body.body, program: body.program },
      authUser.id,
      resolveScopeProgram(authUser)
    )
    return c.json(ok("Announcement updated", announcement))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Update failed"), 400)
  }
}

/* DELETE /api/announcements/:id — delete an announcement */
export async function remove(c: Context) {
  try {
    const authUser = getAuthUser(c)
    const id = c.req.param("id")
    await deleteAnnouncement(id, authUser.id, resolveScopeProgram(authUser))
    return c.json(ok("Announcement deleted"))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Delete failed"), 400)
  }
}