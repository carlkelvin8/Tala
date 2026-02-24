import { Context } from "hono"
import { ok, fail } from "../lib/response.js"
import { createUser, listUsers, updateUser, getUserById } from "../services/userService.js"
import { getPagination } from "../lib/pagination.js"

export async function create(c: Context) {
  try {
    const body = await c.req.json()
    const user = await createUser(body)
    return c.json(ok("User created", { id: user.id, email: user.email, role: user.role }))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Create user failed"), 400)
  }
}

export async function list(c: Context) {
  const query = c.req.query()
  const { page, pageSize, skip, take } = getPagination(query)
  const filters = {
    role: query.role as "ADMIN" | "IMPLEMENTOR" | "CADET_OFFICER" | "STUDENT" | undefined,
    search: query.search
  }
  const result = await listUsers(filters, skip, take)
  return c.json(ok("Users fetched", result.items, { page, pageSize, total: result.total }))
}

export async function update(c: Context) {
  try {
    const id = c.req.param("id")
    const body = await c.req.json()
    const user = await updateUser(id, body)
    return c.json(ok("User updated", { id: user.id, role: user.role, isActive: user.isActive }))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Update failed"), 400)
  }
}

export async function getById(c: Context) {
  try {
    const id = c.req.param("id")
    const user = await getUserById(id)
    if (!user) {
      return c.json(fail("User not found"), 404)
    }
    return c.json(ok("User fetched", user))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Fetch failed"), 400)
  }
}
