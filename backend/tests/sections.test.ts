import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { app } from "../src/app.js"
import { createTestUser, cleanupTestUsers, cleanupTestCourses, cleanupTestSections, makeToken, authHeader, json, uniqueId, prisma } from "./setup.js"
import { RoleType } from "@prisma/client"

describe("Section Routes", () => {
  const emails: string[] = []
  const courseCodes: string[] = []
  const sectionCodes: string[] = []
  let adminToken = ""
  let studentToken = ""
  let courseId = ""

  beforeAll(async () => {
    const admin = await createTestUser(RoleType.ADMIN)
    emails.push(admin.email)
    adminToken = makeToken(admin.id, admin.role)

    const stud = await createTestUser(RoleType.STUDENT)
    emails.push(stud.email)
    studentToken = makeToken(stud.id, stud.role)

    const code = `CRS-${uniqueId()}`
    courseCodes.push(code)
    const courseRes = await app.request("/api/courses", {
      method: "POST",
      headers: authHeader(adminToken),
      body: json({ code, name: "Section Test Course" }),
    })
    const courseBody = await courseRes.json()
    courseId = courseBody.data.id
  })

  afterAll(async () => {
    await cleanupTestSections(sectionCodes)
    await cleanupTestCourses(courseCodes)
    await cleanupTestUsers(emails)
  })

  it("POST /api/sections — creates a section", async () => {
    const code = `SEC-${uniqueId()}`
    sectionCodes.push(code)
    const res = await app.request("/api/sections", {
      method: "POST",
      headers: authHeader(adminToken),
      body: json({ code, name: "Section A", courseId }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.code).toBe(code)
  })

  it("POST /api/sections — 403 for student", async () => {
    const res = await app.request("/api/sections", {
      method: "POST",
      headers: authHeader(studentToken),
      body: json({ code: "FAIL", name: "Fail" }),
    })
    expect(res.status).toBe(403)
  })

  it("GET /api/sections — lists sections", async () => {
    const res = await app.request("/api/sections", { headers: authHeader(adminToken) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data).toBeInstanceOf(Array)
  })

  it("POST /api/sections/generate — generates multiple sections", async () => {
    const res = await app.request("/api/sections/generate", {
      method: "POST",
      headers: authHeader(adminToken),
      body: json({ prefix: "GEN", start: 1, end: 3, courseId, separator: "-" }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data).toHaveLength(3)
    body.data.forEach((s: { code: string }) => sectionCodes.push(s.code))
  })

  it("POST /api/sections/generate — rejects >50 sections", async () => {
    const res = await app.request("/api/sections/generate", {
      method: "POST",
      headers: authHeader(adminToken),
      body: json({ prefix: "OVER", start: 1, end: 51, courseId, separator: "-" }),
    })
    expect(res.status).toBe(422)
  })

  it("PATCH /api/sections/:id — updates section", async () => {
    const code = `UPD-${uniqueId()}`
    sectionCodes.push(code)
    const createRes = await app.request("/api/sections", {
      method: "POST",
      headers: authHeader(adminToken),
      body: json({ code, name: "To Update", courseId }),
    })
    const createBody = await createRes.json()
    const id = createBody.data.id

    const res = await app.request(`/api/sections/${id}`, {
      method: "PATCH",
      headers: authHeader(adminToken),
      body: json({ code, name: "Updated Section" }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.name).toBe("Updated Section")
  })

  it("DELETE /api/sections/:id — deletes section", async () => {
    const code = `DEL-${uniqueId()}`
    const createRes = await app.request("/api/sections", {
      method: "POST",
      headers: authHeader(adminToken),
      body: json({ code, name: "To Delete", courseId }),
    })
    const createBody = await createRes.json()
    const delId = createBody.data.id

    const res = await app.request(`/api/sections/${delId}`, {
      method: "DELETE",
      headers: authHeader(adminToken),
    })
    expect(res.status).toBe(200)
  })
})
