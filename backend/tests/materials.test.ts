import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { app } from "../src/app.js"
import { createTestUser, cleanupTestUsers, cleanupTestMaterials, makeToken, authHeader, json, uniqueId } from "./setup.js"
import { RoleType } from "@prisma/client"

describe("Material Routes", () => {
  const emails: string[] = []
  const materialIds: string[] = []
  let adminToken = ""
  let studentToken = ""
  let materialId = ""

  beforeAll(async () => {
    const admin = await createTestUser(RoleType.ADMIN)
    emails.push(admin.email)
    adminToken = makeToken(admin.id, admin.role)

    const stud = await createTestUser(RoleType.STUDENT)
    emails.push(stud.email)
    studentToken = makeToken(stud.id, stud.role)
  })

  afterAll(async () => {
    await cleanupTestMaterials(materialIds)
    await cleanupTestUsers(emails)
  })

  it("POST /api/materials — creates a material (admin)", async () => {
    const res = await app.request("/api/materials", {
      method: "POST",
      headers: authHeader(adminToken),
      body: json({ title: "Module 1", description: "Intro module", category: "MODULE" }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.data.title).toBe("Module 1")
    materialId = body.data.id
    materialIds.push(materialId)
  })

  it("POST /api/materials — 403 for student", async () => {
    const res = await app.request("/api/materials", {
      method: "POST",
      headers: authHeader(studentToken),
      body: json({ title: "Fail", category: "LECTURE" }),
    })
    expect(res.status).toBe(403)
  })

  it("POST /api/materials — persists a program scope and filters by it", async () => {
    const res = await app.request("/api/materials", {
      method: "POST",
      headers: authHeader(adminToken),
      body: json({ title: "ROTC Field Manual", category: "MODULE", program: "ROTC" }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.program).toBe("ROTC")
    materialIds.push(body.data.id)

    const filtered = await app.request("/api/materials?program=ROTC", { headers: authHeader(adminToken) })
    const filteredBody = await filtered.json()
    expect(filtered.status).toBe(200)
    expect(filteredBody.data.map((m: any) => m.id)).toContain(body.data.id)

    const patched = await app.request(`/api/materials/${body.data.id}`, {
      method: "PATCH",
      headers: authHeader(adminToken),
      body: json({ program: "CWTS" }),
    })
    const patchedBody = await patched.json()
    expect(patched.status).toBe(200)
    expect(patchedBody.data.program).toBe("CWTS")
  })

  it("GET /api/materials — lists materials", async () => {
    const res = await app.request("/api/materials", { headers: authHeader(adminToken) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data).toBeInstanceOf(Array)
  })

  it("GET /api/materials — filters by category", async () => {
    const res = await app.request("/api/materials?category=MODULE", { headers: authHeader(adminToken) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data).toBeInstanceOf(Array)
  })

  it("PATCH /api/materials/:id — updates material", async () => {
    const res = await app.request(`/api/materials/${materialId}`, {
      method: "PATCH",
      headers: authHeader(adminToken),
      body: json({ title: "Updated Module" }),
    })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.title).toBe("Updated Module")
  })

  it("DELETE /api/materials/:id — deletes material", async () => {
    const createRes = await app.request("/api/materials", {
      method: "POST",
      headers: authHeader(adminToken),
      body: json({ title: "To Delete", category: "ANNOUNCEMENT" }),
    })
    const createBody = await createRes.json()
    const delId = createBody.data.id

    const res = await app.request(`/api/materials/${delId}`, {
      method: "DELETE",
      headers: authHeader(adminToken),
    })
    expect(res.status).toBe(200)
  })

  it("POST /api/materials — validation error for missing title", async () => {
    const res = await app.request("/api/materials", {
      method: "POST",
      headers: authHeader(adminToken),
      body: json({ category: "MODULE" }),
    })
    expect(res.status).toBe(422)
  })
})
