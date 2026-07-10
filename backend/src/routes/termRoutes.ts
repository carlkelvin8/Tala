import { Hono } from "hono"
import { create, list, getActive, update, remove } from "../controllers/termController.js"
import { authMiddleware } from "../middlewares/auth.js"
import { roleGuard } from "../middlewares/roleGuard.js"
import { validateBody } from "../middlewares/zod.js"
import { termSchema } from "../validators/terms.js"
import { RoleType } from "@prisma/client"

export const termRoutes = new Hono()

termRoutes.use(authMiddleware)
termRoutes.get("/", list)
termRoutes.get("/active", getActive)
termRoutes.post("/", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]), validateBody(termSchema), create)
termRoutes.patch("/:id", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]), update)
termRoutes.delete("/:id", roleGuard([RoleType.ADMIN]), remove)
