import { Hono } from "hono"
import { getQRTokenHandler, scanQRHandler, list } from "../controllers/attendanceController.js"
import { authMiddleware } from "../middlewares/auth.js"
import { validateBody, validateQuery } from "../middlewares/zod.js"
import { scanQRSchema, attendanceQuerySchema } from "../validators/attendance.js"
import { rateLimitScan } from "../middlewares/rateLimit.js"

export const attendanceRoutes = new Hono()

attendanceRoutes.use(authMiddleware)
attendanceRoutes.get("/qr-token", getQRTokenHandler)
attendanceRoutes.post("/scan", rateLimitScan, validateBody(scanQRSchema), scanQRHandler)
attendanceRoutes.get("/", validateQuery(attendanceQuerySchema), list)
