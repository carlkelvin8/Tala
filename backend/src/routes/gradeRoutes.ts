// Import the Hono router class to create a modular sub-router for grade endpoints
import { Hono } from "hono"
// Import all grade controller functions
import { 
  createCategory,   // Creates a new grade category
  createItem,       // Creates a new grade item within a category
  encode,           // Encodes a student's score for a grade item
  list,             // Lists student grades with optional filters
  listCategories,   // Lists all grade categories
  listItems,        // Lists all grade items with their categories
  updateGrade,      // Updates an existing student grade score
  deleteGrade,      // Deletes a student grade record
  updateItem,       // Updates an existing grade item
  deleteItem,       // Deletes a grade item
  updateCategory,   // Updates an existing grade category
  deleteCategory    // Deletes a grade category
} from "../controllers/gradeController.js"
// Import the authentication middleware to protect all grade routes
import { authMiddleware } from "../middlewares/auth.js"
// Import the role guard factory to restrict write operations to staff roles
import { roleGuard } from "../middlewares/roleGuard.js"
// Import the body and query validation middleware factories
import { validateBody, validateQuery } from "../middlewares/zod.js"
// Import the Zod schemas for grade request validation
import { gradeCategorySchema, gradeItemSchema, gradeQuerySchema, studentGradeSchema } from "../validators/grades.js"
// Import the RoleType enum from Prisma to specify allowed roles
import { RoleType } from "@prisma/client"

// Create a new Hono sub-router for all /api/grades/* routes
export const gradeRoutes = new Hono()

// Apply the auth middleware to every route — all grade routes require login
gradeRoutes.use(authMiddleware)
// GET /api/grades/ — any authenticated user can list grades (filtered by query params)
gradeRoutes.get("/", validateQuery(gradeQuerySchema), list)
// GET /api/grades/categories — any authenticated user can list all grade categories
gradeRoutes.get("/categories", listCategories)
// GET /api/grades/items — any authenticated user can list all grade items
gradeRoutes.get("/items", listItems)
// POST /api/grades/categories — staff only; validate body then create a grade category
gradeRoutes.post("/categories", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]), validateBody(gradeCategorySchema), createCategory)
// POST /api/grades/items — staff only; validate body then create a grade item
gradeRoutes.post("/items", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]), validateBody(gradeItemSchema), createItem)
// POST /api/grades/ — staff only; validate body then encode a student's grade
gradeRoutes.post("/", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]), validateBody(studentGradeSchema), encode)
// PATCH /api/grades/:id — staff only; update a student grade score
gradeRoutes.patch("/:id", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]), updateGrade)
// DELETE /api/grades/:id — staff only; delete a student grade record
gradeRoutes.delete("/:id", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]), deleteGrade)
// PATCH /api/grades/items/:id — staff only; update a grade item
gradeRoutes.patch("/items/:id", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]), updateItem)
// DELETE /api/grades/items/:id — staff only; delete a grade item
gradeRoutes.delete("/items/:id", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]), deleteItem)
// PATCH /api/grades/categories/:id — staff only; update a grade category
gradeRoutes.patch("/categories/:id", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]), updateCategory)
// DELETE /api/grades/categories/:id — staff only; delete a grade category
gradeRoutes.delete("/categories/:id", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]), deleteCategory)
