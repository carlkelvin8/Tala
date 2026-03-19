// Import the Hono router class to create a modular sub-router for enrollment endpoints
import { Hono } from "hono"
// Import the enrollment controller functions
import { create, list, updateStatus, update } from "../controllers/enrollmentController.js"
// Import the authentication middleware to protect all enrollment routes
import { authMiddleware } from "../middlewares/auth.js"
// Import the role guard factory to restrict write operations to staff roles
import { roleGuard } from "../middlewares/roleGuard.js"
// Import the body and query validation middleware factories
import { validateBody, validateQuery } from "../middlewares/zod.js"
// Import the Zod schemas for enrollment request validation
import { enrollmentCreateSchema, enrollmentQuerySchema, enrollmentStatusSchema } from "../validators/enrollment.js"
// Import the RoleType enum from Prisma to specify allowed roles
import { RoleType } from "@prisma/client"

// Create a new Hono sub-router for all /api/enrollments/* routes
export const enrollmentRoutes = new Hono()

// Apply the auth middleware to every route — all enrollment routes require login
enrollmentRoutes.use(authMiddleware)

// GET /api/enrollments/ — any authenticated user can list enrollments (filtered by query params)
enrollmentRoutes.get("/", validateQuery(enrollmentQuerySchema), list)
// POST /api/enrollments/ — staff only; validate body then create a new enrollment record
enrollmentRoutes.post("/", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]), validateBody(enrollmentCreateSchema), create)
// PATCH /api/enrollments/:id/status — staff only; validate body then approve or reject an enrollment
enrollmentRoutes.patch("/:id/status", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]), validateBody(enrollmentStatusSchema), updateStatus)
// PATCH /api/enrollments/:id — admin/implementor only; update section/flight assignment for an enrollment
enrollmentRoutes.patch("/:id", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]), update)
