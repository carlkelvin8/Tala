import { Hono } from "hono"
import { create, list, update, remove } from "../controllers/sectionController.js"
import { authMiddleware } from "../middlewares/auth.js"
import { roleGuard } from "../middlewares/roleGuard.js"
import { validateBody } from "../middlewares/zod.js"
import { sectionSchema } from "../validators/sections.js"
import { RoleType } from "@prisma/client"

export const sectionRoutes = new Hono()

sectionRoutes.use(authMiddleware)
sectionRoutes.get("/", list)
sectionRoutes.post("/", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]), validateBody(sectionSchema), create)
sectionRoutes.patch("/:id", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]), validateBody(sectionSchema), update)
sectionRoutes.delete("/:id", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]), remove)
