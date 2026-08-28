import { Hono } from "hono"
import { autoSectionHandler } from "../controllers/autoSectioningController.js"
import { authMiddleware } from "../middlewares/auth.js"
import { roleGuard } from "../middlewares/roleGuard.js"
import { RoleType } from "@prisma/client"

export const autoSectioningRoutes = new Hono()

autoSectioningRoutes.use(authMiddleware)
autoSectioningRoutes.post("/", roleGuard([RoleType.ADMIN]), autoSectionHandler)
