// Import the Hono router class to create a modular sub-router for attendance endpoints
import { Hono } from "hono"
// Import the attendance controller functions for check-in, check-out, and listing records
import { checkInHandler, checkOutHandler, list } from "../controllers/attendanceController.js"
// Import the authentication middleware to protect all attendance routes
import { authMiddleware } from "../middlewares/auth.js"
// Import the body and query validation middleware factories
import { validateBody, validateQuery } from "../middlewares/zod.js"
// Import the Zod schemas for attendance request validation
import { attendanceCheckInSchema, attendanceCheckOutSchema, attendanceQuerySchema } from "../validators/attendance.js"

// Create a new Hono sub-router for all /api/attendance/* routes
export const attendanceRoutes = new Hono()

// Apply the auth middleware to every route in this sub-router — all attendance routes require login
attendanceRoutes.use(authMiddleware)
// POST /api/attendance/check-in — validate body coordinates then record a check-in
attendanceRoutes.post("/check-in", validateBody(attendanceCheckInSchema), checkInHandler)
// POST /api/attendance/check-out — validate body coordinates then record a check-out
attendanceRoutes.post("/check-out", validateBody(attendanceCheckOutSchema), checkOutHandler)
// GET /api/attendance/ — validate query params then return a paginated list of attendance records
attendanceRoutes.get("/", validateQuery(attendanceQuerySchema), list)
