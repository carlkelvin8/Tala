// Import the Hono router class to create a modular sub-router for merit/demerit endpoints
import { Hono } from "hono"
// Import the merit controller functions
import { create, list } from "../controllers/meritController.js"
// Import the authentication middleware to protect all merit routes
import { authMiddleware } from "../middlewares/auth.js"
// Import the role guard factory to restrict write operations to staff roles
import { roleGuard } from "../middlewares/roleGuard.js"
// Import the body and query validation middleware factories
import { validateBody, validateQuery } from "../middlewares/zod.js"
// Import the Zod schemas for merit request validation
import { meritQuerySchema, meritSchema } from "../validators/merits.js"
// Import the RoleType enum from Prisma to specify allowed roles
import { RoleType } from "@prisma/client"

// Create a new Hono sub-router for all /api/merits/* routes
export const meritRoutes = new Hono()

// Apply the auth middleware to every route — all merit routes require login
meritRoutes.use(authMiddleware)
// GET /api/merits/ — any authenticated user can list merit/demerit records (filtered by query params)
meritRoutes.get("/", validateQuery(meritQuerySchema), list)
// POST /api/merits/ — staff only; validate body then assign a merit or demerit to a student
meritRoutes.post("/", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]), validateBody(meritSchema), create)
