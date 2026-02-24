import { Hono } from "hono"
import { create, list, upload, update, remove } from "../controllers/materialController.js"
import { authMiddleware } from "../middlewares/auth.js"
import { roleGuard } from "../middlewares/roleGuard.js"
import { validateBody, validateQuery } from "../middlewares/zod.js"
import { materialCreateSchema, materialQuerySchema } from "../validators/materials.js"
import { RoleType } from "@prisma/client"

export const materialRoutes = new Hono()

materialRoutes.use(authMiddleware)
materialRoutes.get("/", validateQuery(materialQuerySchema), list)
materialRoutes.post(
  "/",
  roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]),
  validateBody(materialCreateSchema),
  create
)
materialRoutes.post(
  "/upload",
  roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]),
  upload
)
materialRoutes.patch(
  "/:id",
  roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]),
  update
)
materialRoutes.delete(
  "/:id",
  roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR, RoleType.CADET_OFFICER]),
  remove
)
