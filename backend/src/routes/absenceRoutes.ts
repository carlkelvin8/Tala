import { Hono } from "hono"
import { checkAll, getCount } from "../controllers/absenceController.js"
import { authMiddleware } from "../middlewares/auth.js"
import { roleGuard } from "../middlewares/roleGuard.js"
import { RoleType } from "@prisma/client"

export const absenceRoutes = new Hono()

absenceRoutes.use(authMiddleware)
absenceRoutes.post("/check", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]), checkAll)
absenceRoutes.get("/count/:userId", getCount)
