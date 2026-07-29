import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { secureHeaders } from "hono/secure-headers"
import { env } from "./lib/env.js"
import { authRoutes } from "./routes/authRoutes.js"
import { userRoutes } from "./routes/userRoutes.js"
import { enrollmentRoutes } from "./routes/enrollmentRoutes.js"
import { materialRoutes } from "./routes/materialRoutes.js"
import { attendanceRoutes } from "./routes/attendanceRoutes.js"
import { attendanceSessionRoutes } from "./routes/attendanceSessionRoutes.js"
import { gradeRoutes } from "./routes/gradeRoutes.js"
import { meritRoutes } from "./routes/meritRoutes.js"
import { examRoutes } from "./routes/examRoutes.js"
import { sectionRoutes } from "./routes/sectionRoutes.js"
import { courseRoutes } from "./routes/courseRoutes.js"
import { flightRoutes } from "./routes/flightRoutes.js"
import { reportRoutes } from "./routes/reportRoutes.js"
import { dashboardRoutes } from "./routes/dashboardRoutes.js"
import { absenceRoutes } from "./routes/absenceRoutes.js"
import { termRoutes } from "./routes/termRoutes.js"
import { remarkRoutes } from "./routes/remarkRoutes.js"
import { trainingDayRoutes } from "./routes/trainingDayRoutes.js"
import { errorHandler } from "./middlewares/errorHandler.js"
import { ok } from "./lib/response.js"

export const app = new Hono()

app.use(logger())

app.use(
  "/api/*",
  cors({
    origin: env.corsOrigin,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    maxAge: 86400,
  })
)

app.use("*", secureHeaders())

if (process.env.VERCEL !== "1") {
  const { serveStatic } = await import("@hono/node-server/serve-static")
  app.use("/uploads/*", serveStatic({ root: "./" }))
}

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
app.route("/api/courses", courseRoutes)
app.route("/api/flights", flightRoutes)
// Mount report routes at /api/reports
app.route("/api/reports", reportRoutes)
// Mount dashboard summary routes at /api/dashboard
app.route("/api/dashboard", dashboardRoutes)
app.route("/api/absences", absenceRoutes)
app.route("/api/terms", termRoutes)
app.route("/api/remarks", remarkRoutes)
app.route("/api/training", trainingDayRoutes)

// Register the global error handler as a catch-all middleware — runs after all routes
app.use("*", errorHandler)
