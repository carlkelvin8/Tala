import { Hono } from "hono"
import { authMiddleware } from "../middlewares/auth.js"
import { calendarFeed } from "../controllers/calendarController.js"

export const calendarRoutes = new Hono()

calendarRoutes.use(authMiddleware)
calendarRoutes.get("/", calendarFeed)
