// Import the Hono router class to create a modular sub-router for exam endpoints
import { Hono } from "hono"
// Import the exam controller functions
import { createSession, endAttempt, listSessions, logEvent, startAttempt } from "../controllers/examController.js"
// Import the authentication middleware to protect all exam routes
import { authMiddleware } from "../middlewares/auth.js"
// Import the role guard factory to restrict session creation to staff roles
import { roleGuard } from "../middlewares/roleGuard.js"
// Import the body validation middleware factory
import { validateBody } from "../middlewares/zod.js"
// Import the Zod schemas for exam request validation
import { examAttemptSchema, examSessionSchema, monitoringLogSchema } from "../validators/exams.js"
// Import the RoleType enum from Prisma to specify allowed roles
import { RoleType } from "@prisma/client"

// Create a new Hono sub-router for all /api/exams/* routes
export const examRoutes = new Hono()

// Apply the auth middleware to every route — all exam routes require login
examRoutes.use(authMiddleware)
// GET /api/exams/ — any authenticated user can list available exam sessions
examRoutes.get("/", listSessions)
// POST /api/exams/ — staff only; validate body then create a new exam session
examRoutes.post("/", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]), validateBody(examSessionSchema), createSession)
// POST /api/exams/attempts — any authenticated user (student) can start an exam attempt
examRoutes.post("/attempts", validateBody(examAttemptSchema), startAttempt)
// POST /api/exams/attempts/:id/finish — any authenticated user can end their own attempt
examRoutes.post("/attempts/:id/finish", endAttempt)
// POST /api/exams/logs — any authenticated user can log a monitoring event during an attempt
examRoutes.post("/logs", validateBody(monitoringLogSchema), logEvent)
