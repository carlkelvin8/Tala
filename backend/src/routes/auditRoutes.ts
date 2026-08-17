import { RoleType } from "@prisma/client"
import { Hono } from "hono"
import { list } from "../controllers/auditController.js"
import { authMiddleware } from "../middlewares/auth.js"
import { roleGuard } from "../middlewares/roleGuard.js"
import { validateQuery } from "../middlewares/zod.js"
import { auditQuerySchema } from "../validators/audit.js"

export const auditRoutes = new Hono()
auditRoutes.use(authMiddleware)
auditRoutes.use(roleGuard([RoleType.ADMIN]))
auditRoutes.get("/", validateQuery(auditQuerySchema), list)
