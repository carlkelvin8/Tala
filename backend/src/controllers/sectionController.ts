import { Context } from "hono"
import { ok, fail } from "../lib/response.js"
import { createSection, listSections, updateSection, deleteSection } from "../services/sectionService.js"

export async function create(c: Context) {
  try {
    const body = await c.req.json()
    const section = await createSection(body.code, body.name)
    return c.json(ok("Section created", section))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Create failed"), 400)
  }
}

export async function list(c: Context) {
  const sections = await listSections()
  return c.json(ok("Sections fetched", sections))
}


export async function update(c: Context) {
  try {
    const id = c.req.param("id")
    const body = await c.req.json()
    const section = await updateSection(id, body.code, body.name)
    return c.json(ok("Section updated", section))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Update failed"), 400)
  }
}

export async function remove(c: Context) {
  try {
    const id = c.req.param("id")
    await deleteSection(id)
    return c.json(ok("Section deleted"))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Delete failed"), 400)
  }
}
