// Import the Hono router class to create a modular sub-router for flight endpoints
import { Hono } from "hono"
// Import the flight controller functions
import { create, list, update, remove } from "../controllers/flightController.js"
// Import the authentication middleware to protect all flight routes
import { authMiddleware } from "../middlewares/auth.js"
// Import the role guard factory to restrict write operations to admin/cadet officer roles
import { roleGuard } from "../middlewares/roleGuard.js"
// Import the body validation middleware factory
import { validateBody } from "../middlewares/zod.js"
// Import the Zod schema for flight request validation
import { flightSchema } from "../validators/flights.js"
// Import the RoleType enum from Prisma to specify allowed roles
import { RoleType } from "@prisma/client"

// Create a new Hono sub-router for all /api/flights/* routes
export const flightRoutes = new Hono()

// Apply the auth middleware to every route — all flight routes require login
flightRoutes.use(authMiddleware)
// GET /api/flights/ — any authenticated user can list all flights/groups
flightRoutes.get("/", list)
// POST /api/flights/ — admin/cadet officer only; validate body then create a new flight
flightRoutes.post("/", roleGuard([RoleType.ADMIN, RoleType.CADET_OFFICER]), validateBody(flightSchema), create)
// PATCH /api/flights/:id — admin/cadet officer only; update an existing flight's details
flightRoutes.patch("/:id", roleGuard([RoleType.ADMIN, RoleType.CADET_OFFICER]), update)
// DELETE /api/flights/:id — admin/cadet officer only; permanently delete a flight
flightRoutes.delete("/:id", roleGuard([RoleType.ADMIN, RoleType.CADET_OFFICER]), remove)
