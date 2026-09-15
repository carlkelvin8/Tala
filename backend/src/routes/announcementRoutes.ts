import { Hono } from "hono"
import { create, list, update, remove } from "../controllers/announcementController.js"
import { authMiddleware } from "../middlewares/auth.js"
import { roleGuard } from "../middlewares/roleGuard.js"
import { validateBody, validateQuery } from "../middlewares/zod.js"
import { announcementCreateSchema, announcementUpdateSchema, announcementQuerySchema } from "../validators/announcements.js"
import { RoleType } from "@prisma/client"

export const announcementRoutes = new Hono()

announcementRoutes.use(authMiddleware)
announcementRoutes.get("/", validateQuery(announcementQuerySchema), list)
announcementRoutes.post("/", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]), validateBody(announcementCreateSchema), create)
announcementRoutes.patch("/:id", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]), validateBody(announcementUpdateSchema), update)
announcementRoutes.delete("/:id", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]), remove)