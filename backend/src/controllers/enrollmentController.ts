// Import the Context type from Hono for request/response handling
import { Context } from "hono"
// Import the ok and fail response helpers for standardised API envelopes
import { ok, fail } from "../lib/response.js"
// Import the enrollment service functions for business logic
import { createEnrollment, listEnrollments, updateEnrollmentStatus } from "../services/enrollmentService.js"
// Import the pagination helper to parse and bound page/pageSize query params
import { getPagination } from "../lib/pagination.js"
// Import the EnrollmentStatus enum from Prisma for type-safe status casting
import { EnrollmentStatus } from "@prisma/client"
// Import the Prisma client for direct database queries (used in the update handler)
import { prisma } from "../lib/prisma.js"

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

/* GET /api/enrollments/ — return a paginated list of enrollment records */
export async function list(c: Context) {
  // Extract all query parameters from the URL
  const query = c.req.query()
  // Parse and bound the pagination parameters
  const { page, pageSize, skip, take } = getPagination(query)
  // Delegate to the enrollment service with all filters and pagination values
  const result = await listEnrollments(
    {
      status: query.status as EnrollmentStatus | undefined, // Optional status filter (cast to enum)
      sectionId: query.sectionId,                           // Optional section ID filter
      flightId: query.flightId,                             // Optional flight ID filter
      search: query.search                                  // Optional free-text search
    },
    skip, // Number of records to skip
    take  // Maximum number of records to return
  )
  // Return the paginated list with metadata
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
