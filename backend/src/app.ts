import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { secureHeaders } from "hono/secure-headers"
import { requestId } from "hono/request-id"
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
import { auditRoutes } from "./routes/auditRoutes.js"
import { medicalCertificateRoutes } from "./routes/medicalCertificateRoutes.js"
import { submissionRoutes } from "./routes/submissionRoutes.js"
import { notificationRoutes } from "./routes/notificationRoutes.js"
import { autoSectioningRoutes } from "./routes/autoSectioningRoutes.js"
import { leaderboardRoutes } from "./routes/leaderboardRoutes.js"
import { fail, ok } from "./lib/response.js"

export const app = new Hono()

app.onError((error, c) => {
  const id = c.get("requestId")
  console.error(JSON.stringify({ level: "error", requestId: id, method: c.req.method, path: c.req.path, message: error.message, stack: error.stack }))
  return c.json(fail("Internal server error", { requestId: id }), 500)
})

app.use("*", requestId())
app.use(logger())

app.use(
  "/api/*",
  cors({
    origin: (origin) => {
      if (env.corsOrigin.includes(origin)) {
        return origin
      }
      if (env.allowVercelPreviewOrigins && /^https:\/\/[a-z0-9-]+-carlkelvin8s-projects\.vercel\.app$/.test(origin)) {
        return origin
      }
      return null
    },
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
app.route("/api/audit-logs", auditRoutes)
app.route("/api/medical-certificates", medicalCertificateRoutes)
app.route("/api/submissions", submissionRoutes)
app.route("/api/notifications", notificationRoutes)
app.route("/api/auto-sectioning", autoSectioningRoutes)
app.route("/api/leaderboard", leaderboardRoutes)
