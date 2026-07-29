import { Hono } from "hono"
import { getQRTokenHandler, scanQRHandler, list } from "../controllers/attendanceController.js"
import { authMiddleware } from "../middlewares/auth.js"
import { validateBody, validateQuery } from "../middlewares/zod.js"
import { scanQRSchema, attendanceQuerySchema } from "../validators/attendance.js"

export const attendanceRoutes = new Hono()

attendanceRoutes.use(authMiddleware)
attendanceRoutes.get("/qr-token", getQRTokenHandler)
attendanceRoutes.post("/scan", validateBody(scanQRSchema), scanQRHandler)
attendanceRoutes.get("/", validateQuery(attendanceQuerySchema), list)
