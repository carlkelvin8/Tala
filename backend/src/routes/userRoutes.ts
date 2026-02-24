import { Hono } from "hono"
import { create, list, update, getById } from "../controllers/userController.js"
import { authMiddleware } from "../middlewares/auth.js"
import { roleGuard } from "../middlewares/roleGuard.js"
import { validateBody, validateQuery } from "../middlewares/zod.js"
import { userCreateSchema, userQuerySchema, userUpdateSchema } from "../validators/users.js"
import { RoleType } from "@prisma/client"

export const userRoutes = new Hono()

userRoutes.use(authMiddleware)

userRoutes.get("/", roleGuard([RoleType.ADMIN]), validateQuery(userQuerySchema), list)
userRoutes.get("/:id", getById) // Allow all authenticated users to view profiles
userRoutes.post("/", roleGuard([RoleType.ADMIN]), validateBody(userCreateSchema), create)
userRoutes.patch("/:id", roleGuard([RoleType.ADMIN]), validateBody(userUpdateSchema), update)
