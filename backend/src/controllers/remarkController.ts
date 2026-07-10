import { Context } from "hono"
import { ok, fail } from "../lib/response.js"
import { addRemark, getRemarksForStudent, addRecordRemark } from "../services/remarkService.js"
import { getAuthUser } from "../middlewares/auth.js"
import { getPagination } from "../lib/pagination.js"

export async function createRemark(c: Context) {
  try {
    const authUser = getAuthUser(c)
    const body = await c.req.json()
    const remark = await addRemark(body.userId, body.remark, authUser.id)
    return c.json(ok("Remark added", remark))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Failed to add remark"), 400)
  }
}

export async function listRemarks(c: Context) {
  try {
    const userId = c.req.param("userId")
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
    const recordId = c.req.param("recordId")
    const body = await c.req.json()
    const record = await addRecordRemark(recordId, body.remarks)
    return c.json(ok("Remark updated", record))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Failed to update remark"), 400)
  }
}
