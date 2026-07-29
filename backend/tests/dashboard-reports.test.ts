import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { app } from "../src/app.js"
import { createTestUser, cleanupTestUsers, makeToken, authHeader, json, uniqueId, prisma } from "./setup.js"
import { RoleType } from "@prisma/client"

describe("Dashboard & Report Routes", () => {
  const emails: string[] = []
  let adminToken = ""
  let studentToken = ""

  beforeAll(async () => {
    const admin = await createTestUser(RoleType.ADMIN)
    emails.push(admin.email)
    adminToken = makeToken(admin.id, admin.role)

    const stud = await createTestUser(RoleType.STUDENT)
    emails.push(stud.email)
    studentToken = makeToken(stud.id, stud.role)
  })

  afterAll(async () => {
    await cleanupTestUsers(emails)
  })

  it("GET /api/dashboard — returns summary", async () => {
    const res = await app.request("/api/dashboard", { headers: authHeader(adminToken) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data).toBeDefined()
  })

  it("GET /api/dashboard — 401 without token", async () => {
    const res = await app.request("/api/dashboard")
    expect(res.status).toBe(401)
  })

  it("GET /api/reports/enrollments — returns enrollment report", async () => {
    const res = await app.request("/api/reports/enrollments", { headers: authHeader(adminToken) })
    expect(res.status).toBe(200)
  })

  it("GET /api/reports/enrollments.csv — returns CSV", async () => {
    const res = await app.request("/api/reports/enrollments.csv", { headers: authHeader(adminToken) })
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text).toContain(",")
  })

  it("GET /api/reports/attendance.csv — returns CSV", async () => {
    const res = await app.request("/api/reports/attendance.csv", { headers: authHeader(adminToken) })
    expect(res.status).toBe(200)
  })

  it("GET /api/reports/grades.csv — returns CSV", async () => {
    const res = await app.request("/api/reports/grades.csv", { headers: authHeader(adminToken) })
    expect(res.status).toBe(200)
  })

  it("GET /api/reports/merits.csv — returns CSV", async () => {
    const res = await app.request("/api/reports/merits.csv", { headers: authHeader(adminToken) })
    expect(res.status).toBe(200)
  })

  it("GET /api/reports/enrollments — 403 for student", async () => {
    const res = await app.request("/api/reports/enrollments", { headers: authHeader(studentToken) })
    expect(res.status).toBe(403)
  })
})
