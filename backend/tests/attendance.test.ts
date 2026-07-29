import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { app } from "../src/app.js"
import { createTestUser, cleanupTestUsers, makeToken, authHeader, json, uniqueId, prisma } from "./setup.js"
import { RoleType } from "@prisma/client"

describe("Attendance Routes", () => {
  const emails: string[] = []
  let adminToken = ""
  let studentToken = ""
  let termId = ""
  let sectionId = ""
  let sessionId = ""

  beforeAll(async () => {
    const admin = await createTestUser(RoleType.ADMIN)
    emails.push(admin.email)
    adminToken = makeToken(admin.id, admin.role)

    const stud = await createTestUser(RoleType.STUDENT)
    emails.push(stud.email)
    studentToken = makeToken(stud.id, stud.role)

    // Create a term and section for the session
    const term = await prisma.academicTerm.create({
      data: { name: `ATest-${uniqueId()}`, startDate: new Date("2026-01-01"), endDate: new Date("2026-12-31"), isActive: true },
    })
    termId = term.id

    const section = await prisma.section.create({
      data: { code: `ASEC-${uniqueId()}`, name: "Attendance Test Section" },
    })
    sectionId = section.id
  })

  afterAll(async () => {
    if (sessionId) {
      await prisma.monitoringLog.deleteMany({ where: { examAttempt: { examSession: { id: sessionId } } } })
      await prisma.attendanceRecord.deleteMany({ where: { sessionId } })
      await prisma.attendanceSession.deleteMany({ where: { id: sessionId } })
    }
    await prisma.section.deleteMany({ where: { id: sectionId } })
    await prisma.academicTerm.deleteMany({ where: { id: termId } })
    await cleanupTestUsers(emails)
  })

  it("POST /api/attendance-sessions — creates a session (admin)", async () => {
    const now = new Date()
    const end = new Date(now.getTime() + 3600000)
    const res = await app.request("/api/attendance-sessions", {
      method: "POST",
      headers: authHeader(adminToken),
      body: json({
        title: `Session-${uniqueId()}`,
        date: now.toISOString(),
        startTime: now.toISOString(),
        endTime: end.toISOString(),
        sectionId,
        termId,
        hostLatitude: 14.5995,
        hostLongitude: 120.9842,
      }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    sessionId = body.data.id
  })

  it("POST /api/attendance-sessions — 403 for student", async () => {
    const now = new Date()
    const res = await app.request("/api/attendance-sessions", {
      method: "POST",
      headers: authHeader(studentToken),
      body: json({
        title: "Fail",
        date: now.toISOString(),
        startTime: now.toISOString(),
      }),
    })
    expect(res.status).toBe(403)
  })

  it("GET /api/attendance-sessions/active — lists active sessions", async () => {
    const res = await app.request("/api/attendance-sessions/active", {
      headers: authHeader(adminToken),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data).toBeInstanceOf(Array)
  })

  it("GET /api/attendance — lists attendance records", async () => {
    const res = await app.request("/api/attendance", { headers: authHeader(adminToken) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data).toBeInstanceOf(Array)
  })

  it("GET /api/attendance/qr-token — generates QR token (admin)", async () => {
    const res = await app.request("/api/attendance/qr-token", {
      headers: authHeader(adminToken),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data).toBeDefined()
  })

  it("POST /api/attendance-sessions/:id/end — ends session", async () => {
    const res = await app.request(`/api/attendance-sessions/${sessionId}/end`, {
      method: "POST",
      headers: authHeader(adminToken),
    })
    expect(res.status).toBe(200)
  })
})
