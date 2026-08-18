import { Hono } from "hono"
import { listHandler, markReadHandler, markAllReadHandler, unreadCountHandler } from "../controllers/notificationController.js"
import { authMiddleware } from "../middlewares/auth.js"

export const notificationRoutes = new Hono()

notificationRoutes.use(authMiddleware)
notificationRoutes.get("/", listHandler)
notificationRoutes.get("/unread-count", unreadCountHandler)
notificationRoutes.patch("/:id/mark-read", markReadHandler)
notificationRoutes.post("/mark-all-read", markAllReadHandler)
