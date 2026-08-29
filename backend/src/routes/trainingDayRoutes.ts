import { Hono } from "hono"
import { summary, studentDays, overview } from "../controllers/trainingDayController.js"
import { authMiddleware } from "../middlewares/auth.js"
import { roleGuard } from "../middlewares/roleGuard.js"
import { RoleType } from "@prisma/client"

export const trainingDayRoutes = new Hono()

trainingDayRoutes.use(authMiddleware)
trainingDayRoutes.get("/summary", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]), summary)
trainingDayRoutes.get("/student/:userId", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]), studentDays)
trainingDayRoutes.get("/overview", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]), overview)
