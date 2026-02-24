import { Hono } from "hono"
import { create, list, update, remove } from "../controllers/flightController.js"
import { authMiddleware } from "../middlewares/auth.js"
import { roleGuard } from "../middlewares/roleGuard.js"
import { validateBody } from "../middlewares/zod.js"
import { flightSchema } from "../validators/flights.js"
import { RoleType } from "@prisma/client"

export const flightRoutes = new Hono()

flightRoutes.use(authMiddleware)
flightRoutes.get("/", list)
flightRoutes.post("/", roleGuard([RoleType.ADMIN, RoleType.CADET_OFFICER]), validateBody(flightSchema), create)
flightRoutes.patch("/:id", roleGuard([RoleType.ADMIN, RoleType.CADET_OFFICER]), update)
flightRoutes.delete("/:id", roleGuard([RoleType.ADMIN, RoleType.CADET_OFFICER]), remove)
