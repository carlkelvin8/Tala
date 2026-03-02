import { Hono } from "hono"
import { auth } from "../middlewares/auth.js"
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

// All routes require authentication
attendanceSessionRoutes.use("*", auth)

// Create session (Admin, Implementor, Cadet Officer)
attendanceSessionRoutes.post(
  "/",
  roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]),
  createSessionHandler
)

// Update host location
attendanceSessionRoutes.patch(
  "/:sessionId/host-location",
  roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]),
  updateHostLocationHandler
)

// Set verifier
attendanceSessionRoutes.post(
  "/:sessionId/verifier",
  roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]),
  setVerifierHandler
)

// Update verifier location
attendanceSessionRoutes.patch(
  "/:sessionId/verifier-location",
  updateVerifierLocationHandler
)

// Mark attendance (Students)
attendanceSessionRoutes.post(
  "/:sessionId/mark",
  markAttendanceHandler
)

// Get active sessions
attendanceSessionRoutes.get(
  "/active",
  getActiveSessionsHandler
)

// End session
attendanceSessionRoutes.post(
  "/:sessionId/end",
  roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]),
  endSessionHandler
)
