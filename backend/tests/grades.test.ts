import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { app } from "../src/app.js"
import { createTestUser, cleanupTestUsers, cleanupTestGradeCategories, makeToken, authHeader, json, uniqueId } from "./setup.js"
import { RoleType } from "@prisma/client"

describe("Grade Routes", () => {
  const emails: string[] = []
  const categoryIds: string[] = []
  const itemIds: string[] = []
  const gradeIds: string[] = []
  let adminToken = ""
  let studentUser: Awaited<ReturnType<typeof createTestUser>>
  let studentToken = ""
  let categoryId = ""
  let itemId = ""

  beforeAll(async () => {
    const admin = await createTestUser(RoleType.ADMIN)
    emails.push(admin.email)
    adminToken = makeToken(admin.id, admin.role)

    studentUser = await createTestUser(RoleType.STUDENT)
    emails.push(studentUser.email)
    studentToken = makeToken(studentUser.id, studentUser.role)
  })

  afterAll(async () => {
    // Clean in dependency order
    const { prisma } = await import("../src/lib/prisma.js")
    if (gradeIds.length) await prisma.studentGrade.deleteMany({ where: { id: { in: gradeIds } } })
    if (itemIds.length) await prisma.gradeItem.deleteMany({ where: { id: { in: itemIds } } })
    if (categoryIds.length) await prisma.gradeCategory.deleteMany({ where: { id: { in: categoryIds } } })
    await cleanupTestUsers(emails)
  })

  it("POST /api/grades/categories — creates a grade category", async () => {
    const res = await app.request("/api/grades/categories", {
      method: "POST",
      headers: authHeader(adminToken),
      body: json({ name: "Midterm", weight: 40 }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.name).toBe("Midterm")
    categoryId = body.data.id
    categoryIds.push(categoryId)
  })

  it("POST /api/grades/categories — 403 for student", async () => {
    const res = await app.request("/api/grades/categories", {
      method: "POST",
      headers: authHeader(studentToken),
      body: json({ name: "Fail" }),
    })
    expect(res.status).toBe(403)
  })

  it("GET /api/grades/categories — lists categories", async () => {
    const res = await app.request("/api/grades/categories", { headers: authHeader(adminToken) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data).toBeInstanceOf(Array)
  })

  it("POST /api/grades/items — creates a grade item", async () => {
    const res = await app.request("/api/grades/items", {
      method: "POST",
      headers: authHeader(adminToken),
      body: json({ title: "Quiz 1", maxScore: 100, categoryId }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.title).toBe("Quiz 1")
    itemId = body.data.id
    itemIds.push(itemId)
  })

  it("GET /api/grades/items — lists grade items", async () => {
    const res = await app.request("/api/grades/items", { headers: authHeader(adminToken) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data).toBeInstanceOf(Array)
  })

  it("POST /api/grades — encodes a student grade", async () => {
    const res = await app.request("/api/grades", {
      method: "POST",
      headers: authHeader(adminToken),
      body: json({ studentId: studentUser.id, gradeItemId: itemId, score: 85 }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.score).toBe(85)
    gradeIds.push(body.data.id)
  })

  it("POST /api/grades — rejects duplicate grade for same student+item", async () => {
    const res = await app.request("/api/grades", {
      method: "POST",
      headers: authHeader(adminToken),
      body: json({ studentId: studentUser.id, gradeItemId: itemId, score: 90 }),
    })
    const body = await res.json()
    expect(body.success).toBe(false)
  })

  it("POST /api/grades — rejects score > maxScore", async () => {
    const res = await app.request("/api/grades", {
      method: "POST",
      headers: authHeader(adminToken),
      body: json({ studentId: studentUser.id, gradeItemId: itemId, score: 999 }),
    })
    const body = await res.json()
    expect(body.success).toBe(false)
  })

  it("GET /api/grades — lists student grades", async () => {
    const res = await app.request("/api/grades", { headers: authHeader(adminToken) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data).toBeInstanceOf(Array)
  })

  it("GET /api/grades — includes the weighted total grade per student", async () => {
    const res = await app.request("/api/grades", { headers: authHeader(adminToken) })
    const body = await res.json()
    expect(res.status).toBe(200)
    const row = body.data.find((g: any) => g.id === gradeIds[0])
    // Category (Midterm, weight 40) with one graded item (85/100). The total is
    // renormalized over graded categories only => 85/100 = 85%.
    expect(row).toBeDefined()
    expect(row.totalGrade).toBe(85)
  })

  it("PATCH /api/grades/:id — updates a grade", async () => {
    const id = gradeIds[0]
    const res = await app.request(`/api/grades/${id}`, {
      method: "PATCH",
      headers: authHeader(adminToken),
      body: json({ score: 92 }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.score).toBe(92)
  })

  it("PATCH /api/grades/items/:id — updates a grade item", async () => {
    const res = await app.request(`/api/grades/items/${itemId}`, {
      method: "PATCH",
      headers: authHeader(adminToken),
      body: json({ title: "Quiz 1 Updated" }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.title).toBe("Quiz 1 Updated")
  })

  it("PATCH /api/grades/categories/:id — updates a category", async () => {
    const res = await app.request(`/api/grades/categories/${categoryId}`, {
      method: "PATCH",
      headers: authHeader(adminToken),
      body: json({ name: "Midterm Updated" }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.name).toBe("Midterm Updated")
  })

  it("DELETE /api/grades/:id — deletes a grade", async () => {
    const id = gradeIds[0]
    const res = await app.request(`/api/grades/${id}`, {
      method: "DELETE",
      headers: authHeader(adminToken),
    })
    expect(res.status).toBe(200)
  })

  it("DELETE /api/grades/items/:id — deletes a grade item", async () => {
    const res = await app.request(`/api/grades/items/${itemId}`, {
      method: "DELETE",
      headers: authHeader(adminToken),
    })
    expect(res.status).toBe(200)
  })

  it("DELETE /api/grades/categories/:id — deletes a category", async () => {
    const res = await app.request(`/api/grades/categories/${categoryId}`, {
      method: "DELETE",
      headers: authHeader(adminToken),
    })
    expect(res.status).toBe(200)
  })
})
