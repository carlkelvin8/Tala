import { Hono } from "hono"
import { createHandler, mySubmissionsHandler, listHandler, reviewHandler } from "../controllers/submissionController.js"
import { authMiddleware } from "../middlewares/auth.js"
import { roleGuard } from "../middlewares/roleGuard.js"
import { RoleType } from "@prisma/client"

export const submissionRoutes = new Hono()

submissionRoutes.use(authMiddleware)
submissionRoutes.get("/", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]), listHandler)
submissionRoutes.get("/my", roleGuard([RoleType.STUDENT]), mySubmissionsHandler)
submissionRoutes.post("/", roleGuard([RoleType.STUDENT]), createHandler)
submissionRoutes.patch("/:id", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]), reviewHandler)