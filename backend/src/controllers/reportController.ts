import { Context } from "hono"
import { ok } from "../lib/response.js"
import { enrollmentReport, attendanceReport, gradesReport, meritsReport, toCsv } from "../services/reportService.js"
import { getAuthUser } from "../middlewares/auth.js"
import { RoleType } from "@prisma/client"

function resolveSectionId(authUser: { role: RoleType; sectionId?: string }, querySectionId?: string): string | undefined {
  if (authUser.role === RoleType.STUDENT || authUser.role === RoleType.CADET_OFFICER) {
    return authUser.sectionId
  }
  return querySectionId
}

function parseDateFilters(query: Record<string, string>) {
  return {
    from: query.from ? new Date(query.from) : undefined,
    to: query.to ? new Date(query.to) : undefined,
  }
}

export async function enrollmentReportJson(c: Context) {
  const authUser = getAuthUser(c)
  const query = c.req.query()
  const sectionId = resolveSectionId(authUser, query.sectionId)
  const data = await enrollmentReport({ ...parseDateFilters(query), sectionId, flightId: query.flightId })
  return c.json(ok("Enrollment report fetched", data))
}

export async function enrollmentReportCsv(c: Context) {
  const authUser = getAuthUser(c)
  const query = c.req.query()
  const sectionId = resolveSectionId(authUser, query.sectionId)
  const data = await enrollmentReport({ ...parseDateFilters(query), sectionId, flightId: query.flightId })
  
  const headers = ["ID", "Student Email", "Status", "Section", "Flight", "Created At"]
  
  if (data.length === 0) {
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

export async function attendanceReportCsv(c: Context) {
  const authUser = getAuthUser(c)
  const query = c.req.query()
  const sectionId = resolveSectionId(authUser, query.sectionId)
  const data = await attendanceReport({ ...parseDateFilters(query), sectionId, flightId: query.flightId })

  if (data.length === 0) {
    const csv = "Student Email,Date,Status,Check-In Time,Latitude,Longitude"
    c.header("Content-Type", "text/csv")
    c.header("Content-Disposition", 'attachment; filename="attendance.csv"')
    return c.body(csv)
  }

  const rows = data.map((row) => ({
    studentEmail: row.user.email,
    date: row.date.toISOString().split("T")[0],
    status: row.status,
    checkInAt: row.checkInAt?.toISOString() ?? "",
    latitude: row.latitude ?? "",
    longitude: row.longitude ?? "",
  }))

  const csv = toCsv(rows)
  c.header("Content-Type", "text/csv")
  c.header("Content-Disposition", 'attachment; filename="attendance.csv"')
  return c.body(csv)
}

export async function gradesReportCsv(c: Context) {
  const authUser = getAuthUser(c)
  const query = c.req.query()
  const sectionId = resolveSectionId(authUser, query.sectionId)
  const data = await gradesReport({ sectionId })

  if (data.length === 0) {
    const csv = "Student Email,Category,Item,Score,Max Score"
    c.header("Content-Type", "text/csv")
    c.header("Content-Disposition", 'attachment; filename="grades.csv"')
    return c.body(csv)
  }

  const rows = data.map((row) => ({
    studentEmail: row.student.email,
    category: row.gradeItem.category?.name ?? "",
    item: row.gradeItem.title,
    score: row.score,
    maxScore: row.gradeItem.maxScore,
  }))

  const csv = toCsv(rows)
  c.header("Content-Type", "text/csv")
  c.header("Content-Disposition", 'attachment; filename="grades.csv"')
  return c.body(csv)
}

export async function meritsReportCsv(c: Context) {
  const authUser = getAuthUser(c)
  const query = c.req.query()
  const sectionId = resolveSectionId(authUser, query.sectionId)
  const data = await meritsReport({ ...parseDateFilters(query), sectionId })

  if (data.length === 0) {
    const csv = "Student Email,Type,Points,Reason,Created At"
    c.header("Content-Type", "text/csv")
    c.header("Content-Disposition", 'attachment; filename="merits.csv"')
    return c.body(csv)
  }

  const rows = data.map((row) => ({
    studentEmail: row.student.email,
    type: row.type,
    points: row.points,
    reason: row.reason,
    createdAt: row.createdAt.toISOString(),
  }))

  const csv = toCsv(rows)
  c.header("Content-Type", "text/csv")
  c.header("Content-Disposition", 'attachment; filename="merits.csv"')
  return c.body(csv)
}
