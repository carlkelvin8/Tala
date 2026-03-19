// Import the Hono router class to create a modular sub-router for dashboard endpoints
import { Hono } from "hono"
// Import the summary controller function that aggregates dashboard statistics
import { summary } from "../controllers/dashboardController.js"
// Import the authentication middleware to protect the dashboard route
import { authMiddleware } from "../middlewares/auth.js"

// Create a new Hono sub-router for all /api/dashboard/* routes
export const dashboardRoutes = new Hono()

// Apply the auth middleware to every route — dashboard data requires a valid session
dashboardRoutes.use(authMiddleware)
// GET /api/dashboard/ — returns aggregated statistics (attendance rate, grade average, merits, enrollments)
dashboardRoutes.get("/", summary)
