import { Context } from "hono"
import { ok, fail } from "../lib/response.js"
import { createEnrollment, listEnrollments, updateEnrollmentStatus } from "../services/enrollmentService.js"
import { getPagination } from "../lib/pagination.js"
import { EnrollmentStatus, RoleType } from "@prisma/client"
import { prisma } from "../lib/prisma.js"
import { getAuthUser } from "../middlewares/auth.js"

function resolveSectionId(authUser: { role: RoleType; sectionId?: string }, querySectionId?: string): string | undefined {
  if (authUser.role === RoleType.STUDENT || authUser.role === RoleType.CADET_OFFICER) {
    return authUser.sectionId
  }
  return querySectionId
}

/* POST /api/enrollments/ — create a new enrollment record */
export async function create(c: Context) {
  try {
    // Parse the JSON body containing userId, optional sectionId, and optional flightId
    const body = await c.req.json()
    // Delegate to the enrollment service to create the record
    const enrollment = await createEnrollment(body)
    // Return the created enrollment object
    return c.json(ok("Enrollment created", enrollment))
  } catch (error) {
    // Return 400 with the error message if creation fails
    return c.json(fail(error instanceof Error ? error.message : "Enrollment failed"), 400)
  }
}

export async function list(c: Context) {
  const authUser = getAuthUser(c)
  const query = c.req.query()
  const { page, pageSize, skip, take } = getPagination(query)
  const sectionId = resolveSectionId(authUser, query.sectionId)
  const result = await listEnrollments(
    {
      status: query.status as EnrollmentStatus | undefined,
      sectionId,
      flightId: query.flightId,
      search: query.search
    },
    skip,
    take
  )
  return c.json(ok("Enrollments fetched", result.items, { page, pageSize, total: result.total }))
}

/* PATCH /api/enrollments/:id/status — approve or reject an enrollment */
export async function updateStatus(c: Context) {
  try {
    // Extract the enrollment ID from the URL path parameter
    const id = c.req.param("id")
    // Parse the JSON body containing the new status value
    const body = await c.req.json()
    // Delegate to the enrollment service to update the status
    const enrollment = await updateEnrollmentStatus(id, body.status)
    // Return the updated enrollment object
    return c.json(ok("Enrollment updated", enrollment))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Update failed"), 400)
  }
}

/* PATCH /api/enrollments/:id — update the section/flight assignment for an enrollment */
export async function update(c: Context) {
  try {
    // Extract the enrollment ID from the URL path parameter
    const id = c.req.param("id")
    // Parse the JSON body containing the new sectionId and/or flightId
    const body = await c.req.json()
    // Directly update the enrollment record using Prisma (bypasses service layer for simplicity)
    const enrollment = await prisma.enrollment.update({
      where: { id }, // Target the specific enrollment by ID
      data: {
        sectionId: body.sectionId || null, // Set to null if falsy (removes assignment)
        flightId: body.flightId || null    // Set to null if falsy (removes assignment)
      },
      include: {
        user: true,    // Include the associated user in the response
        section: true, // Include the associated section in the response
        flight: true   // Include the associated flight in the response
      }
    })
    // Return the updated enrollment with all related data
    return c.json(ok("Enrollment updated", enrollment))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Update failed"), 400)
  }
}
