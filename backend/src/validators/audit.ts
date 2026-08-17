import { z } from "zod"

export const auditQuerySchema = z.object({
  action: z.string().trim().max(50).optional(),
  entity: z.string().trim().max(80).optional(),
  search: z.string().trim().max(120).optional(),
  page: z.string().optional(),
  pageSize: z.string().optional(),
})
