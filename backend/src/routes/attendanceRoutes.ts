import { Hono } from "hono"
import { checkInHandler, checkOutHandler, list } from "../controllers/attendanceController.js"
import { authMiddleware } from "../middlewares/auth.js"
import { validateBody, validateQuery } from "../middlewares/zod.js"
import { attendanceCheckInSchema, attendanceCheckOutSchema, attendanceQuerySchema } from "../validators/attendance.js"

export const attendanceRoutes = new Hono()

attendanceRoutes.use(authMiddleware)
attendanceRoutes.post("/check-in", validateBody(attendanceCheckInSchema), checkInHandler)
attendanceRoutes.post("/check-out", validateBody(attendanceCheckOutSchema), checkOutHandler)
attendanceRoutes.get("/", validateQuery(attendanceQuerySchema), list)
