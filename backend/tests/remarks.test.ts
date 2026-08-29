import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { app } from "../src/app.js"
import { createTestUser, cleanupTestUsers, cleanupTestRemarks, makeToken, authHeader, json, uniqueId, prisma } from "./setup.js"
import { RoleType } from "@prisma/client"

describe("Remark Routes", () => {
  const emails: string[] = []
  const remarkIds: string[] = []
  let adminToken = ""
  let studentUser: Awaited<ReturnType<typeof createTestUser>>
  let studentToken = ""
  let remarkId = ""
  let attendanceRecordId = ""

  beforeAll(async () => {
    const admin = await createTestUser(RoleType.ADMIN)
    emails.push(admin.email)
    adminToken = makeToken(admin.id, admin.role)

    studentUser = await createTestUser(RoleType.STUDENT)
    emails.push(studentUser.email)
    studentToken = makeToken(studentUser.id, studentUser.role)

    // Create an attendance record for the student to test record remarks
    const record = await prisma.attendanceRecord.create({
      data: {
        userId: studentUser.id,
        date: new Date(),
        status: "PRESENT",
      },
    })
    attendanceRecordId = record.id
  })

  afterAll(async () => {
    await prisma.attendanceRecord.deleteMany({ where: { id: attendanceRecordId } })
    await cleanupTestRemarks(remarkIds)
    await cleanupTestUsers(emails)
  })

  it("POST /api/remarks — creates a remark (admin)", async () => {
    const res = await app.request("/api/remarks", {
      method: "POST",
      headers: authHeader(adminToken),
      body: json({ userId: studentUser.id, remark: "Good performance in class" }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.remark).toBe("Good performance in class")
    remarkId = body.data.id
    remarkIds.push(remarkId)
  })

  it("POST /api/remarks — 403 for student", async () => {
    const other = await createTestUser(RoleType.STUDENT)
    emails.push(other.email)
    const res = await app.request("/api/remarks", {
      method: "POST",
      headers: authHeader(studentToken),
      body: json({ userId: other.id, remark: "Fail" }),
    })
    expect(res.status).toBe(403)
  })

  it("GET /api/remarks/student/:userId — lists remarks for student", async () => {
    const res = await app.request(`/api/remarks/student/${studentUser.id}`, {
      headers: authHeader(adminToken),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data).toBeInstanceOf(Array)
    expect(body.data.length).toBeGreaterThan(0)
  })

  it("PATCH /api/remarks/record/:recordId — updates record remark", async () => {
    const res = await app.request(`/api/remarks/record/${attendanceRecordId}`, {
      method: "PATCH",
      headers: authHeader(adminToken),
      body: json({ remarks: "Arrived 5 minutes late but participated well" }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
  })

  it("POST /api/remarks — validation: missing remark text", async () => {
    const res = await app.request("/api/remarks", {
      method: "POST",
      headers: authHeader(adminToken),
      body: json({ userId: studentUser.id }),
    })
    expect(res.status).toBe(422)
  })
})
