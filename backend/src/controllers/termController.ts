import { Context } from "hono"
import { ok, fail } from "../lib/response.js"
import { createTerm, listTerms, getActiveTerm, updateTerm, deleteTerm } from "../services/termService.js"

export async function create(c: Context) {
  try {
    const body = await c.req.json()
    const term = await createTerm(body)
    return c.json(ok("Term created", term))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Create failed"), 400)
  }
}

export async function list(c: Context) {
  const terms = await listTerms()
  return c.json(ok("Terms fetched", terms))
}

export async function getActive(c: Context) {
  const term = await getActiveTerm()
  return c.json(ok("Active term fetched", term))
}

export async function update(c: Context) {
  try {
    const id = c.req.param("id")
    const body = await c.req.json()
    const term = await updateTerm(id, body)
    return c.json(ok("Term updated", term))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Update failed"), 400)
  }
}

export async function remove(c: Context) {
  try {
    const id = c.req.param("id")
    await deleteTerm(id)
    return c.json(ok("Term deleted"))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Delete failed"), 400)
  }
}
