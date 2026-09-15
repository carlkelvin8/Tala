import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { app } from "../src/app.js"
import { createTestUser, cleanupTestUsers, makeToken, authHeader, json } from "./setup.js"
import { prisma } from "./setup.js"
import { RoleType } from "@prisma/client"

describe("Grade Config Routes", () => {
  const emails: string[] = []
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
    await cleanupTestUsers(emails)
  })

  it("GET /api/grades/config — returns a config", async () => {
    const res = await app.request("/api/grades/config", { headers: authHeader(adminToken) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(typeof body.data.passingGrade).toBe("number")
    expect(["weighted", "average"]).toContain(body.data.computationMode)
  })

  it("GET /api/grades/config — accessible to student too", async () => {
    const res = await app.request("/api/grades/config", { headers: authHeader(studentToken) })
    expect(res.status).toBe(200)
  })

  it("PATCH /api/grades/config — updates the config", async () => {
    const res = await app.request("/api/grades/config", {
      method: "PATCH",
      headers: authHeader(adminToken),
      body: json({ passingGrade: 80, computationMode: "average" }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.passingGrade).toBe(80)
    expect(body.data.computationMode).toBe("average")
  })

  it("PATCH /api/grades/config — rejects invalid values", async () => {
    const res = await app.request("/api/grades/config", {
      method: "PATCH",
      headers: authHeader(adminToken),
      body: json({ passingGrade: 150, computationMode: "bogus" }),
    })
    expect(res.status).toBe(422)
  })

  it("PATCH /api/grades/config — 403 for student", async () => {
    const res = await app.request("/api/grades/config", {
      method: "PATCH",
      headers: authHeader(studentToken),
      body: json({ passingGrade: 75 }),
    })
    expect(res.status).toBe(403)
  })

  it("PATCH /api/grades/config — restores defaults", async () => {
    const res = await app.request("/api/grades/config", {
      method: "PATCH",
      headers: authHeader(adminToken),
      body: json({ passingGrade: 75, computationMode: "weighted" }),
    })
    expect(res.status).toBe(200)
  })
})