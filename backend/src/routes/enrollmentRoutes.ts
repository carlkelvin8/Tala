import { Hono } from "hono"
import { create, list, updateStatus, update } from "../controllers/enrollmentController.js"
import { authMiddleware } from "../middlewares/auth.js"
import { roleGuard } from "../middlewares/roleGuard.js"
import { validateBody, validateQuery } from "../middlewares/zod.js"
import { enrollmentCreateSchema, enrollmentQuerySchema, enrollmentStatusSchema } from "../validators/enrollment.js"
import { RoleType } from "@prisma/client"

export const enrollmentRoutes = new Hono()

enrollmentRoutes.use(authMiddleware)

enrollmentRoutes.get("/", validateQuery(enrollmentQuerySchema), list)
enrollmentRoutes.post("/", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]), validateBody(enrollmentCreateSchema), create)
enrollmentRoutes.patch("/:id/status", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]), validateBody(enrollmentStatusSchema), updateStatus)
enrollmentRoutes.patch("/:id", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]), update)
