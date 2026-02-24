import { Context } from "hono"
import { ok, fail } from "../lib/response.js"
import { createMaterial, listMaterials, updateMaterial, deleteMaterial } from "../services/materialService.js"
import { getPagination } from "../lib/pagination.js"
import { getAuthUser } from "../middlewares/auth.js"
import { MaterialCategory } from "@prisma/client"
import { writeFile, mkdir } from "node:fs/promises"
import { join, extname } from "node:path"
import { randomUUID } from "node:crypto"

const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/jpeg",
  "image/png",
  "image/gif",
  "video/mp4",
])

export async function upload(c: Context) {
  try {
    const body = await c.req.parseBody()
    const file = body["file"]
    if (!file || typeof file === "string") {
      return c.json(fail("No file provided"), 400)
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return c.json(fail("Unsupported file type. Allowed: PDF, Word, PowerPoint, images, MP4"), 400)
    }
    const ext = extname(file.name) || ".bin"
    const filename = `${Date.now()}-${randomUUID()}${ext}`
    const uploadsDir = join(process.cwd(), "uploads")
    await mkdir(uploadsDir, { recursive: true })
    const buffer = await file.arrayBuffer()
    await writeFile(join(uploadsDir, filename), Buffer.from(buffer))
    return c.json(ok("File uploaded", { fileUrl: `/uploads/${filename}`, originalName: file.name, size: file.size }))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Upload failed"), 500)
  }
}

export async function create(c: Context) {
  try {
    const authUser = getAuthUser(c)
    const body = await c.req.json()
    const material = await createMaterial({ ...body, createdById: authUser.id })
    return c.json(ok("Material created", material))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Create failed"), 400)
  }
}

export async function list(c: Context) {
  const query = c.req.query()
  const { page, pageSize, skip, take } = getPagination(query)
  const result = await listMaterials(
    {
      category: query.category as MaterialCategory | undefined,
      sectionId: query.sectionId,
      flightId: query.flightId,
    },
    skip,
    take
  )
  return c.json(ok("Materials fetched", result.items, { page, pageSize, total: result.total }))
}

export async function update(c: Context) {
  try {
    const authUser = getAuthUser(c)
    const id = c.req.param("id")
    const body = await c.req.json()
    const material = await updateMaterial(id, body, authUser.id)
    return c.json(ok("Material updated", material))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Update failed"), 400)
  }
}

export async function remove(c: Context) {
  try {
    const authUser = getAuthUser(c)
    const id = c.req.param("id")
    await deleteMaterial(id, authUser.id)
    return c.json(ok("Material deleted"))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Delete failed"), 400)
  }
}
