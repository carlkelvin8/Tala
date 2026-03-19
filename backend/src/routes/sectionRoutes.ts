// Import the Hono router class to create a modular sub-router for section endpoints
import { Hono } from "hono"
// Import the section controller functions
import { create, list, update, remove } from "../controllers/sectionController.js"
// Import the authentication middleware to protect all section routes
import { authMiddleware } from "../middlewares/auth.js"
// Import the role guard factory to restrict write operations to admin/implementor roles
import { roleGuard } from "../middlewares/roleGuard.js"
// Import the body validation middleware factory
import { validateBody } from "../middlewares/zod.js"
// Import the Zod schema for section request validation
import { sectionSchema } from "../validators/sections.js"
// Import the RoleType enum from Prisma to specify allowed roles
import { RoleType } from "@prisma/client"

// Create a new Hono sub-router for all /api/sections/* routes
export const sectionRoutes = new Hono()

// Apply the auth middleware to every route — all section routes require login
sectionRoutes.use(authMiddleware)
// GET /api/sections/ — any authenticated user can list all sections
sectionRoutes.get("/", list)
// POST /api/sections/ — admin/implementor only; validate body then create a new section
sectionRoutes.post("/", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]), validateBody(sectionSchema), create)
// PATCH /api/sections/:id — admin/implementor only; validate body then update a section
sectionRoutes.patch("/:id", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]), validateBody(sectionSchema), update)
// DELETE /api/sections/:id — admin/implementor only; permanently delete a section
sectionRoutes.delete("/:id", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]), remove)
