import { Hono } from "hono"
import { enrollmentReportCsv, enrollmentReportJson, attendanceReportCsv, gradesReportCsv, meritsReportCsv } from "../controllers/reportController.js"
import { authMiddleware } from "../middlewares/auth.js"
import { roleGuard } from "../middlewares/roleGuard.js"
import { validateQuery } from "../middlewares/zod.js"
import { reportQuerySchema } from "../validators/reports.js"
import { RoleType } from "@prisma/client"

export const reportRoutes = new Hono()

reportRoutes.use(authMiddleware)
reportRoutes.use(roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]))

reportRoutes.get("/enrollments", validateQuery(reportQuerySchema), enrollmentReportJson)
reportRoutes.get("/enrollments.csv", validateQuery(reportQuerySchema), enrollmentReportCsv)
reportRoutes.get("/attendance.csv", validateQuery(reportQuerySchema), attendanceReportCsv)
reportRoutes.get("/grades.csv", validateQuery(reportQuerySchema), gradesReportCsv)
reportRoutes.get("/merits.csv", validateQuery(reportQuerySchema), meritsReportCsv)
