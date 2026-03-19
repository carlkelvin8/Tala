// Import the Context type from Hono for request/response handling
import { Context } from "hono"
// Import the ok response helper for standardised API envelopes
import { ok } from "../lib/response.js"
// Import the report service functions for data retrieval and CSV conversion
import { enrollmentReport, toCsv } from "../services/reportService.js"

/* GET /api/reports/enrollments — return the enrollment report as JSON */
export async function enrollmentReportJson(c: Context) {
  // Extract all query parameters from the URL
  const query = c.req.query()
  // Delegate to the report service with optional date range and section/flight filters
  const data = await enrollmentReport({
    from: query.from ? new Date(query.from) : undefined,   // Convert 'from' date string to Date or undefined
    to: query.to ? new Date(query.to) : undefined,         // Convert 'to' date string to Date or undefined
    sectionId: query.sectionId,                            // Optional section ID filter
    flightId: query.flightId                               // Optional flight ID filter
  })
  // Return the enrollment data as a JSON response
  return c.json(ok("Enrollment report fetched", data))
}

/* GET /api/reports/enrollments.csv — return the enrollment report as a downloadable CSV file */
export async function enrollmentReportCsv(c: Context) {
  // Extract all query parameters from the URL
  const query = c.req.query()
  // Delegate to the report service with the same filters as the JSON endpoint
  const data = await enrollmentReport({
    from: query.from ? new Date(query.from) : undefined,   // Convert 'from' date string to Date or undefined
    to: query.to ? new Date(query.to) : undefined,         // Convert 'to' date string to Date or undefined
    sectionId: query.sectionId,                            // Optional section ID filter
    flightId: query.flightId                               // Optional flight ID filter
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
