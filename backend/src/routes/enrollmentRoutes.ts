import { Hono } from "hono"
import { create, list, updateStatus, update, bulkCreate, importStudentsHandler } from "../controllers/enrollmentController.js"
import { authMiddleware } from "../middlewares/auth.js"
import { roleGuard } from "../middlewares/roleGuard.js"
import { validateBody, validateQuery } from "../middlewares/zod.js"
import { enrollmentCreateSchema, enrollmentQuerySchema, enrollmentStatusSchema } from "../validators/enrollment.js"
import { RoleType } from "@prisma/client"

export const enrollmentRoutes = new Hono()

enrollmentRoutes.use(authMiddleware)

enrollmentRoutes.get("/", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]), validateQuery(enrollmentQuerySchema), list)
enrollmentRoutes.post("/", roleGuard([RoleType.ADMIN]), validateBody(enrollmentCreateSchema), create)
enrollmentRoutes.post("/bulk", roleGuard([RoleType.ADMIN]), bulkCreate)
enrollmentRoutes.post("/import", roleGuard([RoleType.ADMIN]), importStudentsHandler)
enrollmentRoutes.patch("/:id/status", roleGuard([RoleType.ADMIN]), validateBody(enrollmentStatusSchema), updateStatus)
enrollmentRoutes.patch("/:id", roleGuard([RoleType.ADMIN]), update)
