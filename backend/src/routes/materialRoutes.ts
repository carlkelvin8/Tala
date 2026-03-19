// Import the Hono router class to create a modular sub-router for material endpoints
import { Hono } from "hono"
// Import the material controller functions
import { create, list, upload, update, remove } from "../controllers/materialController.js"
// Import the authentication middleware to protect all material routes
import { authMiddleware } from "../middlewares/auth.js"
// Import the role guard factory to restrict write operations to staff roles
import { roleGuard } from "../middlewares/roleGuard.js"
// Import the body and query validation middleware factories
import { validateBody, validateQuery } from "../middlewares/zod.js"
// Import the Zod schemas for material request validation
import { materialCreateSchema, materialQuerySchema } from "../validators/materials.js"
// Import the RoleType enum from Prisma to specify allowed roles
import { RoleType } from "@prisma/client"

// Create a new Hono sub-router for all /api/materials/* routes
export const materialRoutes = new Hono()

// Apply the auth middleware to every route — all material routes require login
materialRoutes.use(authMiddleware)
// GET /api/materials/ — any authenticated user can list materials (filtered by query params)
materialRoutes.get("/", validateQuery(materialQuerySchema), list)
// POST /api/materials/ — staff only; validate body then create a new material record
materialRoutes.post(
  "/",
  roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]), // Restrict to staff
  validateBody(materialCreateSchema), // Validate the JSON body against the material schema
  create // Delegate to the create material controller
)
// POST /api/materials/upload — staff only; handle multipart file upload and save to disk
materialRoutes.post(
  "/upload",
  roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]), // Restrict to staff
  upload // Delegate to the file upload controller
)
// PATCH /api/materials/:id — staff only; update an existing material's metadata
materialRoutes.patch(
  "/:id",
  roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]), // Restrict to staff
  update // Delegate to the update material controller
)
// DELETE /api/materials/:id — staff only; delete a material record
materialRoutes.delete(
  "/:id",
  roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]), // Restrict to staff
  remove // Delegate to the delete material controller
)
