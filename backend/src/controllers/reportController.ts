import { Context } from "hono"
import { ok } from "../lib/response.js"
import { enrollmentReport, toCsv } from "../services/reportService.js"
import { getAuthUser } from "../middlewares/auth.js"
import { RoleType } from "@prisma/client"

function resolveSectionId(authUser: { role: RoleType; sectionId?: string }, querySectionId?: string): string | undefined {
  if (authUser.role === RoleType.STUDENT || authUser.role === RoleType.CADET_OFFICER) {
    return authUser.sectionId
  }
  return querySectionId
}

export async function enrollmentReportJson(c: Context) {
  const authUser = getAuthUser(c)
  const query = c.req.query()
  const sectionId = resolveSectionId(authUser, query.sectionId)
  const data = await enrollmentReport({
    from: query.from ? new Date(query.from) : undefined,
    to: query.to ? new Date(query.to) : undefined,
    sectionId,
    flightId: query.flightId
  })
  return c.json(ok("Enrollment report fetched", data))
}

export async function enrollmentReportCsv(c: Context) {
  const authUser = getAuthUser(c)
  const query = c.req.query()
  const sectionId = resolveSectionId(authUser, query.sectionId)
  const data = await enrollmentReport({
    from: query.from ? new Date(query.from) : undefined,
    to: query.to ? new Date(query.to) : undefined,
    sectionId,
    flightId: query.flightId
  })
  
  // Always include headers even if no data
  const headers = ["ID", "Student Email", "Status", "Section", "Flight", "Created At"]
  
  if (data.length === 0) {
    // Return CSV with headers only — ensures the file is still valid even with no records
    const csv = headers.join(",")
    c.header("Content-Type", "text/csv")                                          // Set MIME type to CSV
    c.header("Content-Disposition", 'attachment; filename="enrollments.csv"')    // Trigger file download
    return c.body(csv) // Return the header-only CSV string as the response body
  }
  
  // Map each enrollment record to a flat object with the desired CSV columns
  const rows = data.map((row) => ({
    id: row.id,                          // Enrollment UUID
    studentEmail: row.user.email,        // Student's email address
    status: row.status,                  // Enrollment status (PENDING, APPROVED, REJECTED)
    section: row.section?.code ?? "",    // Section code or empty string if not assigned
    flight: row.flight?.code ?? "",      // Flight code or empty string if not assigned
    createdAt: row.createdAt.toISOString() // ISO 8601 timestamp of enrollment creation
  }))
  
  // Convert the array of row objects to a CSV string using the report service helper
  const csv = toCsv(rows)
  c.header("Content-Type", "text/csv")                                          // Set MIME type to CSV
  c.header("Content-Disposition", 'attachment; filename="enrollments.csv"')    // Trigger file download
  return c.body(csv) // Return the full CSV string as the response body
}
