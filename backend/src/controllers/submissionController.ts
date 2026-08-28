import { Context } from "hono"
import { ok, fail } from "../lib/response.js"
import { getAuthUser } from "../middlewares/auth.js"
import { getPagination } from "../lib/pagination.js"
import { createSubmission, reviewSubmission, listSubmissions, getUserSubmissions } from "../services/documentSubmissionService.js"
import { DocumentStatus, DocumentType, NstpType, RoleType } from "@prisma/client"

const DOC_TYPES = Object.values(DocumentType) as string[]
const STATUSES = Object.values(DocumentStatus) as string[]

/* POST /api/submissions — a student submits a document to the submission box */
export async function createHandler(c: Context) {
  try {
    const user = getAuthUser(c)
    const body = await c.req.json()

    const docType = body.docType as DocumentType | undefined
    if (!docType || !DOC_TYPES.includes(docType)) {
      return c.json(fail("Invalid document type"), 400)
    }
    if (!body.title?.trim() || !body.fileName?.trim() || !body.fileUrl?.trim()) {
      return c.json(fail("Title, file name, and file are required"), 400)
    }

    const submission = await createSubmission(user.id, {
      docType,
      title: body.title.trim(),
      description: body.description?.trim() || undefined,
      fileName: body.fileName.trim(),
      fileUrl: body.fileUrl.trim(),
      dateFrom: body.dateFrom ? new Date(body.dateFrom) : null,
      dateTo: body.dateTo ? new Date(body.dateTo) : null,
    })
    return c.json(ok("Submission received", submission))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Submission failed"), 400)
  }
}

/* GET /api/submissions/my — the authenticated student's own submissions */
export async function mySubmissionsHandler(c: Context) {
  try {
    const user = getAuthUser(c)
    const submissions = await getUserSubmissions(user.id)
    return c.json(ok("Submissions fetched", submissions))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Fetch failed"), 400)
  }
}

/* GET /api/submissions — staff list with filters; implementors are scoped to CWTS */
export async function listHandler(c: Context) {
  try {
    const authUser = getAuthUser(c)
    const query = c.req.query()
    const { page, pageSize, skip, take } = getPagination(query)

    const result = await listSubmissions(
      {
        userId: query.userId,
        status: query.status && STATUSES.includes(query.status) ? (query.status as DocumentStatus) : undefined,
        docType: query.docType && DOC_TYPES.includes(query.docType) ? (query.docType as DocumentType) : undefined,
        program: authUser.role === RoleType.IMPLEMENTOR ? NstpType.ROTC : undefined,
        search: query.search,
      },
      skip,
      take
    )
    return c.json(ok("Submissions fetched", result.items, { page, pageSize, total: result.total }))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Failed to fetch submissions"), 400)
  }
}

/* PATCH /api/submissions/:id — approve or reject a submission */
export async function reviewHandler(c: Context) {
  try {
    const user = getAuthUser(c)
    const id = c.req.param("id")
    const body = await c.req.json()

    const status = body.status as DocumentStatus | undefined
    if (!status || !STATUSES.includes(status)) {
      return c.json(fail("Invalid status"), 400)
    }

    const submission = await reviewSubmission(id, user.id, status, body.remarks)
    return c.json(ok("Submission reviewed", submission))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Review failed"), 400)
  }
}