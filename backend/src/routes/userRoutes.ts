// Import the Hono router class to create a modular sub-router for user management endpoints
import { Hono } from "hono"
// Import the user controller functions
import { create, list, update, getById } from "../controllers/userController.js"
// Import the authentication middleware to protect all user routes
import { authMiddleware } from "../middlewares/auth.js"
// Import the role guard factory to restrict admin-only operations
import { roleGuard } from "../middlewares/roleGuard.js"
// Import the body and query validation middleware factories
import { validateBody, validateQuery } from "../middlewares/zod.js"
// Import the Zod schemas for user request validation
import { userCreateSchema, userQuerySchema, userUpdateSchema } from "../validators/users.js"
// Import the RoleType enum from Prisma to specify allowed roles
import { RoleType } from "@prisma/client"

// Create a new Hono sub-router for all /api/users/* routes
export const userRoutes = new Hono()

// Apply the auth middleware to every route — all user management routes require login
userRoutes.use(authMiddleware)

// GET /api/users/ — admin only; validate query params then return a paginated list of users
userRoutes.get("/", roleGuard([RoleType.ADMIN]), validateQuery(userQuerySchema), list)
// GET /api/users/:id — Allow all authenticated users to view any user's profile
userRoutes.get("/:id", getById)
// POST /api/users/ — admin only; validate body then create a new user account
userRoutes.post("/", roleGuard([RoleType.ADMIN]), validateBody(userCreateSchema), create)
// PATCH /api/users/:id — admin only; validate body then update a user's role or active status
userRoutes.patch("/:id", roleGuard([RoleType.ADMIN]), validateBody(userUpdateSchema), update)
