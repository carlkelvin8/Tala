import { Hono } from "hono"
import { createQuestion, createSession, endAttempt, listSessions, listAttempts, listQuestions, logEvent, removeQuestion, setSessionStatus, startAttempt, updateQuestion } from "../controllers/examController.js"
import { authMiddleware } from "../middlewares/auth.js"
import { roleGuard } from "../middlewares/roleGuard.js"
import { validateBody } from "../middlewares/zod.js"
import { examAttemptSchema, examQuestionSchema, examQuestionUpdateSchema, examSessionSchema, examStatusSchema, monitoringLogSchema } from "../validators/exams.js"
import { RoleType } from "@prisma/client"

export const examRoutes = new Hono()

examRoutes.use(authMiddleware)
examRoutes.get("/", listSessions)
examRoutes.get("/attempts", listAttempts)
examRoutes.post("/", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]), validateBody(examSessionSchema), createSession)
examRoutes.post("/attempts", roleGuard([RoleType.STUDENT]), validateBody(examAttemptSchema), startAttempt)
examRoutes.post("/attempts/:id/finish", roleGuard([RoleType.STUDENT]), endAttempt)
examRoutes.post("/logs", roleGuard([RoleType.STUDENT]), validateBody(monitoringLogSchema), logEvent)
examRoutes.patch("/:id/status", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]), validateBody(examStatusSchema), setSessionStatus)
examRoutes.post("/:id/questions", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]), validateBody(examQuestionSchema), createQuestion)
examRoutes.get("/:id/questions", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]), listQuestions)
examRoutes.patch("/questions/:questionId", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]), validateBody(examQuestionUpdateSchema), updateQuestion)
examRoutes.delete("/questions/:questionId", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]), removeQuestion)
