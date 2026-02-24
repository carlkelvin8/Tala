import { Context } from "hono"
import { ok } from "../lib/response.js"
import { enrollmentReport, toCsv } from "../services/reportService.js"

export async function enrollmentReportJson(c: Context) {
  const query = c.req.query()
  const data = await enrollmentReport({
    from: query.from ? new Date(query.from) : undefined,
    to: query.to ? new Date(query.to) : undefined,
    sectionId: query.sectionId,
    flightId: query.flightId
  })
  return c.json(ok("Enrollment report fetched", data))
}

export async function enrollmentReportCsv(c: Context) {
  const query = c.req.query()
  const data = await enrollmentReport({
    from: query.from ? new Date(query.from) : undefined,
    to: query.to ? new Date(query.to) : undefined,
    sectionId: query.sectionId,
    flightId: query.flightId
  })
  
  // Always include headers even if no data
  const headers = ["ID", "Student Email", "Status", "Section", "Flight", "Created At"]
  
  if (data.length === 0) {
    // Return CSV with headers only
    const csv = headers.join(",")
    c.header("Content-Type", "text/csv")
    c.header("Content-Disposition", 'attachment; filename="enrollments.csv"')
    return c.body(csv)
  }
  
  const rows = data.map((row) => ({
    id: row.id,
    studentEmail: row.user.email,
    status: row.status,
    section: row.section?.code ?? "",
    flight: row.flight?.code ?? "",
    createdAt: row.createdAt.toISOString()
  }))
  
  const csv = toCsv(rows)
  c.header("Content-Type", "text/csv")
  c.header("Content-Disposition", 'attachment; filename="enrollments.csv"')
  return c.body(csv)
}
