import { Hono } from "hono"
import { create, list, update, remove } from "../controllers/meritController.js"
import { authMiddleware } from "../middlewares/auth.js"
import { roleGuard } from "../middlewares/roleGuard.js"
import { validateBody, validateQuery } from "../middlewares/zod.js"
import { meritQuerySchema, meritSchema, meritUpdateSchema } from "../validators/merits.js"
import { RoleType } from "@prisma/client"

export const meritRoutes = new Hono()

meritRoutes.use(authMiddleware)
meritRoutes.get("/", roleGuard([RoleType.ADMIN, RoleType.STUDENT]), validateQuery(meritQuerySchema), list)
meritRoutes.post("/", roleGuard([RoleType.ADMIN]), validateBody(meritSchema), create)
meritRoutes.patch("/:id", roleGuard([RoleType.ADMIN]), validateBody(meritUpdateSchema), update)
meritRoutes.delete("/:id", roleGuard([RoleType.ADMIN]), remove)
