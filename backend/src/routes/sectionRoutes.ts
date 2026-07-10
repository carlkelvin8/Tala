import { Hono } from "hono"
import { create, list, update, remove, generate } from "../controllers/sectionController.js"
import { authMiddleware } from "../middlewares/auth.js"
import { roleGuard } from "../middlewares/roleGuard.js"
import { validateBody } from "../middlewares/zod.js"
import { sectionSchema, generateSectionsSchema } from "../validators/sections.js"
import { RoleType } from "@prisma/client"

export const sectionRoutes = new Hono()

sectionRoutes.use(authMiddleware)
sectionRoutes.get("/", list)
sectionRoutes.post("/", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]), validateBody(sectionSchema), create)
sectionRoutes.post("/generate", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]), validateBody(generateSectionsSchema), generate)
sectionRoutes.patch("/:id", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]), validateBody(sectionSchema), update)
sectionRoutes.delete("/:id", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]), remove)
