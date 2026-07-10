import { Hono } from "hono"
import { summary, studentDays, overview } from "../controllers/trainingDayController.js"
import { authMiddleware } from "../middlewares/auth.js"

export const trainingDayRoutes = new Hono()

trainingDayRoutes.use(authMiddleware)
trainingDayRoutes.get("/summary", summary)
trainingDayRoutes.get("/student/:userId", studentDays)
trainingDayRoutes.get("/overview", overview)
