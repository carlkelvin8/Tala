// Import the Context type from Hono for request/response handling
import { Context } from "hono"
// Import the ok and fail response helpers for standardised API envelopes
import { ok, fail } from "../lib/response.js"
// Import the section service functions for business logic
import { createSection, listSections, updateSection, deleteSection } from "../services/sectionService.js"

/* POST /api/sections/ — create a new section record */
export async function create(c: Context) {
  try {
    // Parse the JSON body containing the section code and name
    const body = await c.req.json()
    // Delegate to the section service to create the record and log the audit event
    const section = await createSection(body.code, body.name)
    // Return the created section object
    return c.json(ok("Section created", section))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Create failed"), 400)
  }
}

/* GET /api/sections/ — return all section records */
export async function list(c: Context) {
  // Delegate to the section service to fetch all sections ordered alphabetically
  const sections = await listSections()
  // Return the list of sections
  return c.json(ok("Sections fetched", sections))
}

/* PATCH /api/sections/:id — update an existing section's code and name */
export async function update(c: Context) {
  try {
    // Extract the section ID from the URL path parameter
    const id = c.req.param("id")
    // Parse the JSON body containing the updated code and name
    const body = await c.req.json()
    // Delegate to the section service to update the record and log the audit event
    const section = await updateSection(id, body.code, body.name)
    // Return the updated section object
    return c.json(ok("Section updated", section))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Update failed"), 400)
  }
}

/* DELETE /api/sections/:id — permanently delete a section record */
export async function remove(c: Context) {
  try {
    // Extract the section ID from the URL path parameter
    const id = c.req.param("id")
    // Delegate to the section service to delete the record and log the audit event
    await deleteSection(id)
    // Return a success message with no data payload
    return c.json(ok("Section deleted"))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Delete failed"), 400)
  }
}
