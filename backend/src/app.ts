// Import the Hono framework — the main web framework used to build this API
import { Hono } from "hono"
// Import the CORS middleware from Hono to handle cross-origin requests
import { cors } from "hono/cors"
// Import the logger middleware from Hono to log incoming HTTP requests to the console
import { logger } from "hono/logger"
// Import the secureHeaders middleware to automatically set security-related HTTP headers
import { secureHeaders } from "hono/secure-headers"
// Import the serveStatic middleware from the Node.js adapter to serve static files from disk
import { serveStatic } from "@hono/node-server/serve-static"
// Import the validated environment configuration object (port, secrets, origins, etc.)
import { env } from "./lib/env.js"
// Import the authentication route handlers (login, register, refresh, etc.)
import { authRoutes } from "./routes/authRoutes.js"
// Import the user management route handlers (CRUD for users)
import { userRoutes } from "./routes/userRoutes.js"
// Import the enrollment route handlers (create, list, update enrollment records)
import { enrollmentRoutes } from "./routes/enrollmentRoutes.js"
// Import the learning material route handlers (upload, list, update materials)
import { materialRoutes } from "./routes/materialRoutes.js"
// Import the attendance route handlers (check-in, check-out, list records)
import { attendanceRoutes } from "./routes/attendanceRoutes.js"
// Import the attendance session route handlers (create/manage geo-verified sessions)
import { attendanceSessionRoutes } from "./routes/attendanceSessionRoutes.js"
// Import the grade route handlers (categories, items, student grades)
import { gradeRoutes } from "./routes/gradeRoutes.js"
// Import the merit/demerit route handlers (assign and list merit records)
import { meritRoutes } from "./routes/meritRoutes.js"
// Import the exam route handlers (sessions, attempts, monitoring logs)
import { examRoutes } from "./routes/examRoutes.js"
// Import the section route handlers (CRUD for class sections)
import { sectionRoutes } from "./routes/sectionRoutes.js"
// Import the flight route handlers (CRUD for cadet flights/groups)
import { flightRoutes } from "./routes/flightRoutes.js"
// Import the report route handlers (enrollment reports in JSON and CSV)
import { reportRoutes } from "./routes/reportRoutes.js"
// Import the dashboard route handlers (summary statistics)
import { dashboardRoutes } from "./routes/dashboardRoutes.js"
// Import the global error handler middleware to catch unhandled errors
import { errorHandler } from "./middlewares/errorHandler.js"
// Import the ok helper to build a standard success response shape
import { ok } from "./lib/response.js"

// Create the root Hono application instance — all routes and middleware attach here
export const app = new Hono()

// Register the built-in Hono request logger so every request is printed to stdout
app.use(logger())

// CORS configuration - MUST be before routes
// Apply CORS middleware only to paths under /api/* to allow browser cross-origin requests
app.use(
  "/api/*",
  cors({
    // List of allowed frontend origins that may call this API
    origin: [
      "https://poetic-boba-a05858.netlify.app", // Production Netlify deployment
      "http://localhost:5173", // Vite dev server default port
      "http://localhost:3000", // Alternative local dev port
    ],
    // HTTP methods the browser is allowed to use in cross-origin requests
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    // HTTP headers the browser is allowed to send in cross-origin requests
    allowHeaders: ["Content-Type", "Authorization"],
    // Allow cookies and credentials to be included in cross-origin requests
    credentials: true,
    // Cache the preflight OPTIONS response for 24 hours (86400 seconds)
    maxAge: 86400,
  })
)

// Apply secure HTTP headers (X-Frame-Options, X-Content-Type-Options, etc.) to all routes
app.use("*", secureHeaders())

// Serve files from the ./uploads directory when the path starts with /uploads/
app.use("/uploads/*", serveStatic({ root: "./" }))

// Health-check route — returns a simple JSON message to confirm the API is running
app.get("/", (c) => c.json(ok("NSTP API running")))
// Mount authentication routes at /api/auth (login, register, refresh, profile, etc.)
app.route("/api/auth", authRoutes)
// Mount user management routes at /api/users
app.route("/api/users", userRoutes)
// Mount enrollment routes at /api/enrollments
app.route("/api/enrollments", enrollmentRoutes)
// Mount learning material routes at /api/materials
app.route("/api/materials", materialRoutes)
// Mount attendance record routes at /api/attendance
app.route("/api/attendance", attendanceRoutes)
// Mount attendance session routes at /api/attendance-sessions
app.route("/api/attendance-sessions", attendanceSessionRoutes)
// Mount grade routes at /api/grades
app.route("/api/grades", gradeRoutes)
// Mount merit/demerit routes at /api/merits
app.route("/api/merits", meritRoutes)
// Mount exam routes at /api/exams
app.route("/api/exams", examRoutes)
// Mount section routes at /api/sections
app.route("/api/sections", sectionRoutes)
// Mount flight/group routes at /api/flights
app.route("/api/flights", flightRoutes)
// Mount report routes at /api/reports
app.route("/api/reports", reportRoutes)
// Mount dashboard summary routes at /api/dashboard
app.route("/api/dashboard", dashboardRoutes)

// Register the global error handler as a catch-all middleware — runs after all routes
app.use("*", errorHandler)
