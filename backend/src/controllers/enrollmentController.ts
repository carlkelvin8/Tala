import { Context } from "hono"
import { ok, fail } from "../lib/response.js"
import { createEnrollment, listEnrollments, updateEnrollmentStatus } from "../services/enrollmentService.js"
import { getPagination } from "../lib/pagination.js"
import { EnrollmentStatus } from "@prisma/client"
import { prisma } from "../lib/prisma.js"

export async function create(c: Context) {
  try {
    const body = await c.req.json()
    const enrollment = await createEnrollment(body)
    return c.json(ok("Enrollment created", enrollment))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Enrollment failed"), 400)
  }
}

export async function list(c: Context) {
  const query = c.req.query()
  const { page, pageSize, skip, take } = getPagination(query)
  const result = await listEnrollments(
    {
      status: query.status as EnrollmentStatus | undefined,
      sectionId: query.sectionId,
      flightId: query.flightId,
      search: query.search
    },
    skip,
    take
  )
  return c.json(ok("Enrollments fetched", result.items, { page, pageSize, total: result.total }))
}

export async function updateStatus(c: Context) {
  try {
    const id = c.req.param("id")
    const body = await c.req.json()
    const enrollment = await updateEnrollmentStatus(id, body.status)
    return c.json(ok("Enrollment updated", enrollment))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Update failed"), 400)
  }
}

export async function update(c: Context) {
  try {
    const id = c.req.param("id")
    const body = await c.req.json()
    const enrollment = await prisma.enrollment.update({
      where: { id },
      data: {
        sectionId: body.sectionId || null,
        flightId: body.flightId || null
      },
      include: {
        user: true,
        section: true,
        flight: true
      }
    })
    return c.json(ok("Enrollment updated", enrollment))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Update failed"), 400)
  }
}
