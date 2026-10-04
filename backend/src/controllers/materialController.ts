import { Context } from "hono"
import { ok, fail } from "../lib/response.js"
import { createMaterial, listMaterials, updateMaterial, deleteMaterial } from "../services/materialService.js"
import { getPagination } from "../lib/pagination.js"
import { getAuthUser } from "../middlewares/auth.js"
import { MaterialCategory, NstpType, RoleType } from "@prisma/client"
import { resolveScopeProgram } from "../services/programScope.js"

// Set of MIME types that are allowed for file uploads — rejects all other types
const ALLOWED_TYPES = new Set([
  "application/pdf",                                                                    // PDF documents
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",           // Modern Word documents (.docx)
  "image/jpeg",  // JPEG images
])

// Maximum file size: 10 MB
const MAX_FILE_SIZE = 10 * 1024 * 1024

// Content signature check: the declared MIME type must match the file's actual bytes,
// otherwise a spoofed header could smuggle executable content onto the static /uploads path.
function detectUploadType(buffer: Uint8Array): string | null {
  if (buffer.length >= 4 && buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return "application/pdf"
  }
  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg"
  }
  // DOCX (and other Office files) are ZIP archives starting with "PK"
  if (buffer.length >= 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && (buffer[2] === 0x03 || buffer[2] === 0x05 || buffer[2] === 0x07)) {
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  }
  return null
}

/* POST /api/materials/upload — validate an uploaded file and return it for storage */
export async function upload(c: Context) {
  try {
    // Parse the multipart form data from the request body
    const body = await c.req.parseBody()
    // Extract the uploaded file from the "file" field
    const file = body["file"]
    // Reject the request if no file was provided or if the value is a plain string
    if (!file || typeof file === "string") {
      return c.json(fail("No file provided"), 400)
    }
    // Reject the request if the file exceeds the maximum size
    if (file.size > MAX_FILE_SIZE) {
      return c.json(fail(`File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024} MB`), 400)
    }
    // Read the file contents into an ArrayBuffer
    const buffer = new Uint8Array(await file.arrayBuffer())
    // Reject the request if the declared MIME type is not in the allowed set
    if (!ALLOWED_TYPES.has(file.type)) {
      return c.json(fail("Unsupported file type. Allowed: PDF, DOCX, JPG"), 400)
    }
    // Verify the file content matches the declared type
    const detected = detectUploadType(buffer)
    if (detected !== file.type) {
      return c.json(fail("File content does not match its declared type"), 400)
    }
    // Serverless-safe storage: embed the validated file as a data URL in the
    // database instead of writing to disk (serverless filesystems are
    // read-only and ephemeral, so disk writes always fail in production)
    const base64 = Buffer.from(buffer).toString("base64")
    const fileUrl = `data:${file.type};base64,${base64}`
    // Return the data URL, original filename, and file size in the response
    return c.json(ok("File uploaded", { fileUrl, originalName: file.name, size: file.size }))
  } catch (error) {
    // Return 500 for unexpected server-side errors during file handling
    return c.json(fail(error instanceof Error ? error.message : "Upload failed"), 500)
  }
}

/* POST /api/materials/ — create a new learning material record */
export async function create(c: Context) {
  try {
    // Retrieve the authenticated user (the staff member creating the material)
    const authUser = getAuthUser(c)
    // Parse the JSON body containing the material metadata
    const body = await c.req.json()
    // Delegate to the material service, injecting the creator's ID for audit purposes
    const material = await createMaterial({ ...body, createdById: authUser.id, scopeProgram: resolveScopeProgram(authUser) })
    // Return the created material object
    return c.json(ok("Material created", material))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Create failed"), 400)
  }
}

function resolveSectionId(authUser: { role: RoleType; sectionId?: string }, querySectionId?: string): string | undefined {
  if (authUser.role === RoleType.STUDENT || authUser.role === RoleType.CADET_OFFICER) {
    return authUser.sectionId
  }
  return querySectionId
}

/* GET /api/materials/ — return a paginated list of learning materials */
export async function list(c: Context) {
  const authUser = getAuthUser(c)
  const query = c.req.query()
  const { page, pageSize, skip, take } = getPagination(query)
  const sectionId = resolveSectionId(authUser, query.sectionId)
  const result = await listMaterials(
    {
      category: query.category as MaterialCategory | undefined,
      program: query.program as NstpType | undefined,
      sectionId,
      flightId: query.flightId,
    },
    skip,
    take,
    resolveScopeProgram(authUser)
  )
  return c.json(ok("Materials fetched", result.items, { page, pageSize, total: result.total }))
}

/* PATCH /api/materials/:id — update an existing material's metadata */
export async function update(c: Context) {
  try {
    // Retrieve the authenticated user for audit logging
    const authUser = getAuthUser(c)
    // Extract the material ID from the URL path parameter
    const id = c.req.param("id")
    // Parse the JSON body containing the updated fields
    const body = await c.req.json()
    // Delegate to the material service to update the record and log the audit event
    const material = await updateMaterial(id, body, authUser.id, resolveScopeProgram(authUser))
    // Return the updated material object
    return c.json(ok("Material updated", material))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Update failed"), 400)
  }
}

/* DELETE /api/materials/:id — delete a learning material record */
export async function remove(c: Context) {
  try {
    // Retrieve the authenticated user for audit logging
    const authUser = getAuthUser(c)
    // Extract the material ID from the URL path parameter
    const id = c.req.param("id")
    // Delegate to the material service to delete the record and log the audit event
    await deleteMaterial(id, authUser.id, resolveScopeProgram(authUser))
    // Return a success message with no data payload
    return c.json(ok("Material deleted"))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Delete failed"), 400)
  }
}
