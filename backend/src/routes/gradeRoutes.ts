import { Hono } from "hono"
import {
  createCategory,
  createItem,
  encode,
  list,
  getTotal,
  listCategories,
  listItems,
  updateGrade,
  deleteGrade,
  updateItem,
  deleteItem,
  updateCategory,
  deleteCategory
} from "../controllers/gradeController.js"
import { authMiddleware } from "../middlewares/auth.js"
import { roleGuard } from "../middlewares/roleGuard.js"
import { validateBody, validateQuery } from "../middlewares/zod.js"
import { gradeCategorySchema, gradeCategoryUpdateSchema, gradeItemSchema, gradeItemUpdateSchema, gradeQuerySchema, studentGradeSchema, studentGradeUpdateSchema } from "../validators/grades.js"
import { RoleType } from "@prisma/client"

export const gradeRoutes = new Hono()

gradeRoutes.use(authMiddleware)
gradeRoutes.get("/", validateQuery(gradeQuerySchema), list)
gradeRoutes.get("/total", getTotal)
gradeRoutes.get("/categories", listCategories)
gradeRoutes.get("/items", listItems)
gradeRoutes.post("/categories", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]), validateBody(gradeCategorySchema), createCategory)
gradeRoutes.post("/items", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]), validateBody(gradeItemSchema), createItem)
gradeRoutes.post("/", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]), validateBody(studentGradeSchema), encode)
gradeRoutes.patch("/:id", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]), validateBody(studentGradeUpdateSchema), updateGrade)
gradeRoutes.delete("/:id", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]), deleteGrade)
gradeRoutes.patch("/items/:id", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]), validateBody(gradeItemUpdateSchema), updateItem)
gradeRoutes.delete("/items/:id", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]), deleteItem)
gradeRoutes.patch("/categories/:id", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]), validateBody(gradeCategoryUpdateSchema), updateCategory)
gradeRoutes.delete("/categories/:id", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]), deleteCategory)
