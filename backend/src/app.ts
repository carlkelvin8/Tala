import { Hono } from "hono"
import { cors } from "hono/cors"
import { logger } from "hono/logger"
import { secureHeaders } from "hono/secure-headers"
import { serveStatic } from "@hono/node-server/serve-static"
import { env } from "./lib/env.js"
import { authRoutes } from "./routes/authRoutes.js"
import { userRoutes } from "./routes/userRoutes.js"
import { enrollmentRoutes } from "./routes/enrollmentRoutes.js"
import { materialRoutes } from "./routes/materialRoutes.js"
import { attendanceRoutes } from "./routes/attendanceRoutes.js"
import { gradeRoutes } from "./routes/gradeRoutes.js"
import { meritRoutes } from "./routes/meritRoutes.js"
import { examRoutes } from "./routes/examRoutes.js"
import { sectionRoutes } from "./routes/sectionRoutes.js"
import { flightRoutes } from "./routes/flightRoutes.js"
import { reportRoutes } from "./routes/reportRoutes.js"
import { dashboardRoutes } from "./routes/dashboardRoutes.js"
import { errorHandler } from "./middlewares/errorHandler.js"
import { ok } from "./lib/response.js"

export const app = new Hono()

app.use(logger())

app.use(
  "*",
  cors({
    origin: "*", // Temporarily allow all origins for testing
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
)

app.use("*", secureHeaders())

app.use("/uploads/*", serveStatic({ root: "./" }))

app.get("/", (c) => c.json(ok("NSTP API running")))
app.route("/api/auth", authRoutes)
app.route("/api/users", userRoutes)
app.route("/api/enrollments", enrollmentRoutes)
app.route("/api/materials", materialRoutes)
app.route("/api/attendance", attendanceRoutes)
app.route("/api/grades", gradeRoutes)
app.route("/api/merits", meritRoutes)
app.route("/api/exams", examRoutes)
app.route("/api/sections", sectionRoutes)
app.route("/api/flights", flightRoutes)
app.route("/api/reports", reportRoutes)
app.route("/api/dashboard", dashboardRoutes)

app.use("*", errorHandler)