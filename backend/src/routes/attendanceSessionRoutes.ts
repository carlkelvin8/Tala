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
  getSessionLiveFeedHandler,
  listCalendarHandler,
} from "../controllers/attendanceSessionController.js"

export const attendanceSessionRoutes = new Hono()

attendanceSessionRoutes.use("*", authMiddleware)

attendanceSessionRoutes.post(
  "/",
  roleGuard([RoleType.IMPLEMENTOR]),
  createSessionHandler
)

attendanceSessionRoutes.patch(
  "/:sessionId/host-location",
  roleGuard([RoleType.IMPLEMENTOR]),
  updateHostLocationHandler
)

attendanceSessionRoutes.post(
  "/:sessionId/verifier",
  roleGuard([RoleType.IMPLEMENTOR]),
  setVerifierHandler
)

attendanceSessionRoutes.patch(
  "/:sessionId/verifier-location",
  roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]),
  updateVerifierLocationHandler
)

attendanceSessionRoutes.post(
  "/:sessionId/mark",
  roleGuard([RoleType.STUDENT]),
  markAttendanceHandler
)

attendanceSessionRoutes.get(
  "/active",
  getActiveSessionsHandler
)

attendanceSessionRoutes.get(
  "/calendar",
  listCalendarHandler
)

attendanceSessionRoutes.get(
  "/:sessionId/live",
  roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]),
  getSessionLiveFeedHandler
)

attendanceSessionRoutes.post(
  "/:sessionId/end",
  roleGuard([RoleType.IMPLEMENTOR]),
  endSessionHandler
)
