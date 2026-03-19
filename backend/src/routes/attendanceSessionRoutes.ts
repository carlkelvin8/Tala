// Import the Hono router class to create a modular sub-router for attendance session endpoints
import { Hono } from "hono"
// Import the authentication middleware to protect all session routes
import { authMiddleware } from "../middlewares/auth.js"
// Import the role guard factory to restrict certain routes to specific roles
import { roleGuard } from "../middlewares/roleGuard.js"
// Import the RoleType enum from Prisma to specify allowed roles
import { RoleType } from "@prisma/client"
// Import all attendance session controller functions
import {
  createSessionHandler,          // Creates a new geo-verified attendance session
  updateHostLocationHandler,     // Updates the host's live GPS coordinates
  setVerifierHandler,            // Assigns a verifier and their initial location
  updateVerifierLocationHandler, // Updates the verifier's live GPS coordinates
  markAttendanceHandler,         // Marks a student's attendance with location verification
  getActiveSessionsHandler,      // Returns all currently active sessions
  endSessionHandler,             // Ends an active session
} from "../controllers/attendanceSessionController.js"

// Create a new Hono sub-router for all /api/attendance-sessions/* routes
export const attendanceSessionRoutes = new Hono()

// All routes require authentication
attendanceSessionRoutes.use("*", authMiddleware)

// Create session (Admin, Implementor, Cadet Officer)
// POST /api/attendance-sessions/ — only staff roles can create sessions
attendanceSessionRoutes.post(
  "/",
  roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]), // Restrict to staff
  createSessionHandler // Delegate to the create session controller
)

// Update host location
// PATCH /api/attendance-sessions/:sessionId/host-location — staff only; updates host GPS
attendanceSessionRoutes.patch(
  "/:sessionId/host-location",
  roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]), // Restrict to staff
  updateHostLocationHandler // Delegate to the update host location controller
)

// Set verifier
// POST /api/attendance-sessions/:sessionId/verifier — staff only; assigns a verifier
attendanceSessionRoutes.post(
  "/:sessionId/verifier",
  roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]), // Restrict to staff
  setVerifierHandler // Delegate to the set verifier controller
)

// Update verifier location
// PATCH /api/attendance-sessions/:sessionId/verifier-location — any authenticated user (verifier updates own location)
attendanceSessionRoutes.patch(
  "/:sessionId/verifier-location",
  updateVerifierLocationHandler // No additional role guard — the service layer checks verifier identity
)

// Mark attendance (Students)
// POST /api/attendance-sessions/:sessionId/mark — any authenticated user can mark their own attendance
attendanceSessionRoutes.post(
  "/:sessionId/mark",
  markAttendanceHandler // Delegate to the mark attendance controller
)

// Get active sessions
// GET /api/attendance-sessions/active — any authenticated user can view active sessions
attendanceSessionRoutes.get(
  "/active",
  getActiveSessionsHandler // Delegate to the get active sessions controller
)

// End session
// POST /api/attendance-sessions/:sessionId/end — staff only; ends an active session
attendanceSessionRoutes.post(
  "/:sessionId/end",
  roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]), // Restrict to staff
  endSessionHandler // Delegate to the end session controller
)
