import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { app } from "../src/app.js"
import { createTestUser, cleanupTestUsers, cleanupTestCourses, makeToken, authHeader, json, uniqueId } from "./setup.js"
import { RoleType } from "@prisma/client"

describe("Course Routes", () => {
  const emails: string[] = []
  const courseCodes: string[] = []
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
  })

  afterAll(async () => {
    await cleanupTestCourses(courseCodes)
    await cleanupTestUsers(emails)
  })

  it("POST /api/courses — creates a course (admin)", async () => {
    const code = `CRS-${uniqueId()}`
    courseCodes.push(code)
    const res = await app.request("/api/courses", {
      method: "POST",
      headers: authHeader(adminToken),
      body: json({ code, name: "NSTP Course 101" }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.code).toBe(code)
    courseId = body.data.id
  })

  it("POST /api/courses — 403 for student", async () => {
    const res = await app.request("/api/courses", {
      method: "POST",
      headers: authHeader(studentToken),
      body: json({ code: "FAIL", name: "Should Fail" }),
    })
    expect(res.status).toBe(403)
  })

  it("GET /api/courses — lists courses", async () => {
    const res = await app.request("/api/courses", { headers: authHeader(adminToken) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.length).toBeGreaterThan(0)
  })

  it("GET /api/courses/:id — gets course by id", async () => {
    const res = await app.request(`/api/courses/${courseId}`, { headers: authHeader(adminToken) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.id).toBe(courseId)
  })

  it("PATCH /api/courses/:id — updates course", async () => {
    const res = await app.request(`/api/courses/${courseId}`, {
      method: "PATCH",
      headers: authHeader(adminToken),
      body: json({ code: courseCodes[0], name: "Updated Course Name" }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.name).toBe("Updated Course Name")
  })

  it("DELETE /api/courses/:id — deletes course", async () => {
    const code = `DEL-${uniqueId()}`
    const createRes = await app.request("/api/courses", {
      method: "POST",
      headers: authHeader(adminToken),
      body: json({ code, name: "To Delete" }),
    })
    const createBody = await createRes.json()
    const delId = createBody.data.id

    const res = await app.request(`/api/courses/${delId}`, {
      method: "DELETE",
      headers: authHeader(adminToken),
    })
    expect(res.status).toBe(200)

    const getRes = await app.request(`/api/courses/${delId}`, { headers: authHeader(adminToken) })
    expect(getRes.status).toBe(404)
  })

  it("POST /api/courses — validation error for short code", async () => {
    const res = await app.request("/api/courses", {
      method: "POST",
      headers: authHeader(adminToken),
      body: json({ code: "A", name: "Bad" }),
    })
    expect(res.status).toBe(422)
  })
})
