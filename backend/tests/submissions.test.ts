import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { app } from "../src/app.js"
import { createTestUser, cleanupTestUsers, makeToken, authHeader, json, uniqueId, prisma } from "./setup.js"
import { RoleType, NstpType, AttendanceStatus, DocumentType } from "@prisma/client"

describe("Document Submission Routes", () => {
  const emails: string[] = []
  const submissionIds: string[] = []
  const attendanceIds: string[] = []
  let adminToken = ""
  let implementorToken = ""
  let studentUser: Awaited<ReturnType<typeof createTestUser>>
  let studentToken = ""

  beforeAll(async () => {
    const admin = await createTestUser(RoleType.ADMIN)
    emails.push(admin.email)
    adminToken = makeToken(admin.id, admin.role)

    const implementor = await createTestUser(RoleType.IMPLEMENTOR)
    emails.push(implementor.email)
    implementorToken = makeToken(implementor.id, implementor.role)

    studentUser = await createTestUser(RoleType.STUDENT)
    emails.push(studentUser.email)
    studentToken = makeToken(studentUser.id, studentUser.role)
  })

  afterAll(async () => {
    await prisma.documentSubmission.deleteMany({ where: { id: { in: submissionIds } } })
    await prisma.attendanceRecord.deleteMany({ where: { id: { in: attendanceIds } } })
    await cleanupTestUsers(emails)
  })

  it("POST /api/submissions — student creates a document submission", async () => {
    const res = await app.request("/api/submissions", {
      method: "POST",
      headers: authHeader(studentToken),
      body: json({
        docType: "EXCUSE_LETTER",
        title: "Excuse letter for family emergency",
        fileName: "excuse.pdf",
        fileUrl: "data:application/pdf;base64,AAAA",
        dateFrom: "2026-08-20",
        dateTo: "2026-08-21",
      }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.status).toBe("PENDING")
    expect(body.data.docType).toBe("EXCUSE_LETTER")
    submissionIds.push(body.data.id)
  })

  it("POST /api/submissions — 403 for a non-student", async () => {
    const res = await app.request("/api/submissions", {
      method: "POST",
      headers: authHeader(implementorToken),
      body: json({
        docType: "MEDICAL_CERTIFICATE",
        title: "Medical certificate",
        fileName: "med.pdf",
        fileUrl: "data:application/pdf;base64,BBBB",
      }),
    })
    expect(res.status).toBe(403)
  })

  it("GET /api/submissions/my — returns the student's own submissions", async () => {
    const res = await app.request("/api/submissions/my", { headers: authHeader(studentToken) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data.some((s: any) => s.userId === studentUser.id)).toBe(true)
  })

  it("GET /api/submissions — implementor lists submissions scoped to CWTS", async () => {
    await prisma.user.update({ where: { id: studentUser.id }, data: { program: NstpType.CWTS } })
    const res = await app.request("/api/submissions?status=PENDING", { headers: authHeader(implementorToken) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data).toBeInstanceOf(Array)
    expect(body.data.every((s: any) => s.user?.program === "CWTS")).toBe(true)
  })

  it("PATCH /api/submissions/:id — implementor cannot approve another program's student", async () => {
    // Student is CWTS (set earlier); implantor is locked to ROTC → must be blocked
    await prisma.attendanceRecord.create({
      data: {
        userId: studentUser.id,
        date: new Date("2026-08-20"),
        status: AttendanceStatus.ABSENT,
      },
    })
    const attendance = await prisma.attendanceRecord.findFirst({ where: { userId: studentUser.id, date: new Date("2026-08-20") } })
    attendanceIds.push(attendance!.id)

    const submission = await prisma.documentSubmission.create({
      data: {
        userId: studentUser.id,
        docType: DocumentType.EXCUSE_LETTER,
        title: "Cross-program submission",
        fileName: "x.pdf",
        fileUrl: "data:application/pdf;base64,DDDD",
        dateFrom: new Date("2026-08-19"),
        dateTo: new Date("2026-08-21"),
      },
    })
    submissionIds.push(submission.id)

    const res = await app.request(`/api/submissions/${submission.id}`, {
      method: "PATCH",
      headers: authHeader(implementorToken),
      body: json({ status: "APPROVED" }),
    })
    const body = await res.json()
    expect(body.success).toBe(false)
    const record = await prisma.attendanceRecord.findFirst({
      where: { userId: studentUser.id, date: new Date("2026-08-20") },
    })
    attendanceIds.push(record!.id)
    expect(record?.status).toBe("ABSENT")
  })

  it("PATCH /api/submissions/:id — approving marks matching absences as present (admin)", async () => {
    const submission = await prisma.documentSubmission.create({
      data: {
        userId: studentUser.id,
        docType: DocumentType.MEDICAL_CERTIFICATE,
        title: "Medical certificate for absence",
        fileName: "med.pdf",
        fileUrl: "data:application/pdf;base64,CCCC",
        dateFrom: new Date("2026-08-19"),
        dateTo: new Date("2026-08-21"),
      },
    })
    submissionIds.push(submission.id)

    const res = await app.request(`/api/submissions/${submission.id}`, {
      method: "PATCH",
      headers: authHeader(adminToken),
      body: json({ status: "APPROVED" }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.status).toBe("APPROVED")

    const record = await prisma.attendanceRecord.findFirst({
      where: { userId: studentUser.id, date: new Date("2026-08-20") },
    })
    attendanceIds.push(record!.id)
    expect(record?.status).toBe("PRESENT")
  })

  it("PATCH /api/submissions/:id — rejects already-reviewed submissions", async () => {
    const submission = await prisma.documentSubmission.create({
      data: {
        userId: studentUser.id,
        docType: DocumentType.OTHER_OFFICIAL_DOCUMENT,
        title: "Scholarship document",
        fileName: "doc.pdf",
        fileUrl: "data:application/pdf;base64,DDDD",
      },
    })
    submissionIds.push(submission.id)

    const res = await app.request(`/api/submissions/${submission.id}`, {
      method: "PATCH",
      headers: authHeader(adminToken),
      body: json({ status: "REJECTED" }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.status).toBe("REJECTED")

    const second = await app.request(`/api/submissions/${submission.id}`, {
      method: "PATCH",
      headers: authHeader(adminToken),
      body: json({ status: "APPROVED" }),
    })
    const secondBody = await second.json()
    expect(secondBody.success).toBe(false)
  })
})

describe("Student Dashboard", () => {
  const emails: string[] = []
  let studentUser: Awaited<ReturnType<typeof createTestUser>>
  let studentToken = ""

  beforeAll(async () => {
    studentUser = await createTestUser(RoleType.STUDENT)
    emails.push(studentUser.email)
    studentToken = makeToken(studentUser.id, studentUser.role)
  })

  afterAll(async () => {
    await cleanupTestUsers(emails)
  })

  it("GET /api/dashboard/my — returns enrollment status, total grade, and attendance", async () => {
    const res = await app.request("/api/dashboard/my", { headers: authHeader(studentToken) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toHaveProperty("enrollment")
    expect(body.data).toHaveProperty("totalGrade")
    expect(body.data.totalGrade).toHaveProperty("totalPercent")
    expect(body.data).toHaveProperty("attendance")
    expect(body.data).toHaveProperty("pendingSubmissions")
  })
})