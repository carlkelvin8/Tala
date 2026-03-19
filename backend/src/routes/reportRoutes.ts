// Import the Hono router class to create a modular sub-router for report endpoints
import { Hono } from "hono"
// Import the report controller functions for JSON and CSV enrollment reports
import { enrollmentReportCsv, enrollmentReportJson } from "../controllers/reportController.js"
// Import the authentication middleware to protect all report routes
import { authMiddleware } from "../middlewares/auth.js"
// Import the role guard factory to restrict reports to staff roles
import { roleGuard } from "../middlewares/roleGuard.js"
// Import the query validation middleware factory
import { validateQuery } from "../middlewares/zod.js"
// Import the Zod schema for report query parameter validation
import { reportQuerySchema } from "../validators/reports.js"
// Import the RoleType enum from Prisma to specify allowed roles
import { RoleType } from "@prisma/client"

// Create a new Hono sub-router for all /api/reports/* routes
export const reportRoutes = new Hono()

// Apply the auth middleware to every route — all report routes require login
reportRoutes.use(authMiddleware)
// Apply the role guard to every route — only staff can access reports
reportRoutes.use(roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]))
// GET /api/reports/enrollments — validate query params then return enrollment report as JSON
reportRoutes.get("/enrollments", validateQuery(reportQuerySchema), enrollmentReportJson)
// GET /api/reports/enrollments.csv — validate query params then return enrollment report as a CSV file download
reportRoutes.get("/enrollments.csv", validateQuery(reportQuerySchema), enrollmentReportCsv)
