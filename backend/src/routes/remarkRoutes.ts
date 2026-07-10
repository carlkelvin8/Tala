import { Hono } from "hono"
import { createRemark, listRemarks, updateRecordRemark } from "../controllers/remarkController.js"
import { authMiddleware } from "../middlewares/auth.js"
import { roleGuard } from "../middlewares/roleGuard.js"
import { validateBody } from "../middlewares/zod.js"
import { remarkSchema } from "../validators/terms.js"
import { RoleType } from "@prisma/client"

export const remarkRoutes = new Hono()

remarkRoutes.use(authMiddleware)
remarkRoutes.post("/", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]), validateBody(remarkSchema), createRemark)
remarkRoutes.get("/student/:userId", listRemarks)
remarkRoutes.patch("/record/:recordId", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]), updateRecordRemark)
