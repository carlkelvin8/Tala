import { Hono } from "hono"
import { summary } from "../controllers/dashboardController.js"
import { authMiddleware } from "../middlewares/auth.js"

export const dashboardRoutes = new Hono()

dashboardRoutes.use(authMiddleware)
dashboardRoutes.get("/", summary)

