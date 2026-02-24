import { Hono } from "hono"
import { createSession, endAttempt, listSessions, logEvent, startAttempt } from "../controllers/examController.js"
import { authMiddleware } from "../middlewares/auth.js"
import { roleGuard } from "../middlewares/roleGuard.js"
import { validateBody } from "../middlewares/zod.js"
import { examAttemptSchema, examSessionSchema, monitoringLogSchema } from "../validators/exams.js"
import { RoleType } from "@prisma/client"

export const examRoutes = new Hono()

examRoutes.use(authMiddleware)
examRoutes.get("/", listSessions)
examRoutes.post("/", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]), validateBody(examSessionSchema), createSession)
examRoutes.post("/attempts", validateBody(examAttemptSchema), startAttempt)
examRoutes.post("/attempts/:id/finish", endAttempt)
examRoutes.post("/logs", validateBody(monitoringLogSchema), logEvent)
