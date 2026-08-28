import { Hono } from "hono"
import { create, list, getById, update, remove, mandatory } from "../controllers/courseController.js"
import { authMiddleware } from "../middlewares/auth.js"
import { roleGuard } from "../middlewares/roleGuard.js"
import { validateBody } from "../middlewares/zod.js"
import { courseSchema } from "../validators/courses.js"
import { RoleType } from "@prisma/client"

export const courseRoutes = new Hono()

courseRoutes.use(authMiddleware)
courseRoutes.get("/", list)
courseRoutes.get("/mandatory", mandatory)
courseRoutes.get("/:id", getById)
courseRoutes.post("/", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]), validateBody(courseSchema), create)
courseRoutes.patch("/:id", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]), validateBody(courseSchema), update)
courseRoutes.delete("/:id", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]), remove)
