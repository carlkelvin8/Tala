import { Hono } from "hono"
import { uploadHandler, reviewHandler, listHandler, myCertificatesHandler } from "../controllers/medicalCertificateController.js"
import { authMiddleware } from "../middlewares/auth.js"
import { roleGuard } from "../middlewares/roleGuard.js"
import { RoleType } from "@prisma/client"

export const medicalCertificateRoutes = new Hono()

medicalCertificateRoutes.use(authMiddleware)
medicalCertificateRoutes.get("/", roleGuard([RoleType.ADMIN, RoleType.IMPLEMENTOR]), listHandler)
medicalCertificateRoutes.get("/my", myCertificatesHandler)
medicalCertificateRoutes.post("/", roleGuard([RoleType.STUDENT]), uploadHandler)
medicalCertificateRoutes.patch("/:id", roleGuard([RoleType.IMPLEMENTOR]), reviewHandler)
