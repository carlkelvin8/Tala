import { Hono } from "hono"
import { getQRTokenHandler, scanQRHandler, list } from "../controllers/attendanceController.js"
import { authMiddleware } from "../middlewares/auth.js"
import { roleGuard } from "../middlewares/roleGuard.js"
import { validateBody, validateQuery } from "../middlewares/zod.js"
import { scanQRSchema, attendanceQuerySchema } from "../validators/attendance.js"
import { rateLimitScan } from "../middlewares/rateLimit.js"
import { RoleType } from "@prisma/client"

export const attendanceRoutes = new Hono()

attendanceRoutes.use(authMiddleware)
attendanceRoutes.get("/qr-token", getQRTokenHandler)
// Only staff may record a scan — students must not proxy-check-in each other.
attendanceRoutes.post("/scan", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]), rateLimitScan, validateBody(scanQRSchema), scanQRHandler)
attendanceRoutes.get("/", validateQuery(attendanceQuerySchema), list)
