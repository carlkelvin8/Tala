import { Hono } from "hono"
import { create, list } from "../controllers/meritController.js"
import { authMiddleware } from "../middlewares/auth.js"
import { roleGuard } from "../middlewares/roleGuard.js"
import { validateBody, validateQuery } from "../middlewares/zod.js"
import { meritQuerySchema, meritSchema } from "../validators/merits.js"
import { RoleType } from "@prisma/client"

export const meritRoutes = new Hono()

meritRoutes.use(authMiddleware)
meritRoutes.get("/", validateQuery(meritQuerySchema), list)
meritRoutes.post("/", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]), validateBody(meritSchema), create)
