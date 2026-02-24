import { Hono } from "hono"
import { 
  createCategory, 
  createItem, 
  encode, 
  list, 
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
import { gradeCategorySchema, gradeItemSchema, gradeQuerySchema, studentGradeSchema } from "../validators/grades.js"
import { RoleType } from "@prisma/client"

export const gradeRoutes = new Hono()

gradeRoutes.use(authMiddleware)
gradeRoutes.get("/", validateQuery(gradeQuerySchema), list)
gradeRoutes.get("/categories", listCategories)
gradeRoutes.get("/items", listItems)
gradeRoutes.post("/categories", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]), validateBody(gradeCategorySchema), createCategory)
gradeRoutes.post("/items", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]), validateBody(gradeItemSchema), createItem)
gradeRoutes.post("/", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]), validateBody(studentGradeSchema), encode)
gradeRoutes.patch("/:id", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]), updateGrade)
gradeRoutes.delete("/:id", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]), deleteGrade)
gradeRoutes.patch("/items/:id", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]), updateItem)
gradeRoutes.delete("/items/:id", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]), deleteItem)
gradeRoutes.patch("/categories/:id", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]), updateCategory)
gradeRoutes.delete("/categories/:id", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]), deleteCategory)
