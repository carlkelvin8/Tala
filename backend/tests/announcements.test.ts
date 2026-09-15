import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { app } from "../src/app.js"
import { createTestUser, cleanupTestUsers, makeToken, authHeader, json, uniqueId } from "./setup.js"
import { prisma } from "./setup.js"
import { RoleType } from "@prisma/client"

describe("Announcement Routes", () => {
  const emails: string[] = []
  const announcementIds: string[] = []
  let adminToken = ""
  let studentToken = ""

  beforeAll(async () => {
    const admin = await createTestUser(RoleType.ADMIN)
    emails.push(admin.email)
    adminToken = makeToken(admin.id, admin.role)

    const student = await createTestUser(RoleType.STUDENT)
    emails.push(student.email)
    studentToken = makeToken(student.id, student.role)
  })

  afterAll(async () => {
    if (announcementIds.length) await prisma.announcement.deleteMany({ where: { id: { in: announcementIds } } })
    await cleanupTestUsers(emails)
  })

  it("POST /api/announcements — creates an announcement", async () => {
    const res = await app.request("/api/announcements", {
      method: "POST",
      headers: authHeader(adminToken),
      body: json({ title: "Orientation Rescheduled", body: "Orientation moved to Friday.", program: "CWTS" }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.title).toBe("Orientation Rescheduled")
    expect(body.data.program).toBe("CWTS")
    announcementIds.push(body.data.id)
  })

  it("POST /api/announcements — 403 for student", async () => {
    const res = await app.request("/api/announcements", {
      method: "POST",
      headers: authHeader(studentToken),
      body: json({ title: "Nope", body: "Nope" }),
    })
    expect(res.status).toBe(403)
  })

  it("GET /api/announcements — lists announcements", async () => {
    const res = await app.request("/api/announcements", { headers: authHeader(adminToken) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data).toBeInstanceOf(Array)
  })

  it("GET /api/announcements?program=CWTS — filters by program", async () => {
    const res = await app.request("/api/announcements?program=CWTS", { headers: authHeader(adminToken) })
    const body = await res.json()
    expect(res.status).toBe(200)
    for (const a of body.data) {
      expect(["CWTS", null]).toContain(a.program)
    }
  })

  it("PATCH /api/announcements/:id — updates an announcement", async () => {
    const id = announcementIds[0]
    const res = await app.request(`/api/announcements/${id}`, {
      method: "PATCH",
      headers: authHeader(adminToken),
      body: json({ title: "Orientation Rescheduled (Updated)" }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.title).toBe("Orientation Rescheduled (Updated)")
  })

  it("DELETE /api/announcements/:id — deletes an announcement", async () => {
    const id = announcementIds[0]
    const res = await app.request(`/api/announcements/${id}`, {
      method: "DELETE",
      headers: authHeader(adminToken),
    })
    expect(res.status).toBe(200)
  })
})