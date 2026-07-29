import { Hono } from "hono"
import { authMiddleware } from "../middlewares/auth.js"
import { roleGuard } from "../middlewares/roleGuard.js"
import { RoleType } from "@prisma/client"
import {
  createSessionHandler,
  updateHostLocationHandler,
  setVerifierHandler,
  updateVerifierLocationHandler,
  markAttendanceHandler,
  getActiveSessionsHandler,
  endSessionHandler,
} from "../controllers/attendanceSessionController.js"

export const attendanceSessionRoutes = new Hono()

attendanceSessionRoutes.use("*", authMiddleware)

attendanceSessionRoutes.post(
  "/",
  roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]),
  createSessionHandler
)

attendanceSessionRoutes.patch(
  "/:sessionId/host-location",
  roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]),
  updateHostLocationHandler
)

attendanceSessionRoutes.post(
  "/:sessionId/verifier",
  roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]),
  setVerifierHandler
)

attendanceSessionRoutes.patch(
  "/:sessionId/verifier-location",
  roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]),
  updateVerifierLocationHandler
)

attendanceSessionRoutes.post(
  "/:sessionId/mark",
  markAttendanceHandler
)

attendanceSessionRoutes.get(
  "/active",
  getActiveSessionsHandler
)

attendanceSessionRoutes.post(
  "/:sessionId/end",
  roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]),
  endSessionHandler
)
