import { Context } from "hono"
import { ok, fail } from "../lib/response.js"
import { getAuthUser } from "../middlewares/auth.js"
import { getPagination } from "../lib/pagination.js"
import { uploadCertificate, reviewCertificate, listCertificates, getUserCertificates } from "../services/medicalCertificateService.js"
import { MedicalCertificateStatus } from "@prisma/client"

export async function uploadHandler(c: Context) {
  try {
    const user = getAuthUser(c)
    const body = await c.req.json()
    const certificate = await uploadCertificate(user.id, {
      fileName: body.fileName,
      fileUrl: body.fileUrl,
      reason: body.reason,
      dateFrom: new Date(body.dateFrom),
      dateTo: new Date(body.dateTo),
    })
    return c.json(ok("Certificate uploaded", certificate))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Upload failed"), 400)
  }
}

export async function reviewHandler(c: Context) {
  try {
    const user = getAuthUser(c)
    const id = c.req.param("id")
    const body = await c.req.json()
    const certificate = await reviewCertificate(id, user.id, body.status as MedicalCertificateStatus, body.remarks)
    return c.json(ok("Certificate reviewed", certificate))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Review failed"), 400)
  }
}

export async function listHandler(c: Context) {
  try {
    const query = c.req.query()
    const { page, pageSize, skip, take } = getPagination(query)
    const result = await listCertificates(
      {
        userId: query.userId,
        status: query.status as MedicalCertificateStatus | undefined,
        search: query.search,
      },
      skip,
      take
    )
    return c.json(ok("Certificates fetched", result.items, { page, pageSize, total: result.total }))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Failed to fetch certificates"), 400)
  }
}

export async function myCertificatesHandler(c: Context) {
  try {
    const user = getAuthUser(c)
    const certificates = await getUserCertificates(user.id)
    return c.json(ok("Certificates fetched", certificates))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Fetch failed"), 400)
  }
}
