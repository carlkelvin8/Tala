import type { Context } from "hono"
import { getPagination } from "../lib/pagination.js"
import { ok } from "../lib/response.js"
import { listAuditLogs } from "../services/auditService.js"

export async function list(c: Context) {
  const query = c.req.query()
  const { page, pageSize, skip, take } = getPagination(query)
  const result = await listAuditLogs({ action: query.action, entity: query.entity, search: query.search }, skip, take)
  return c.json(ok("Audit logs fetched", result.items, { page, pageSize, total: result.total }))
}
