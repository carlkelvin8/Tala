// Import the Context type from Hono for request/response handling
import { Context } from "hono"
// Import the ok and fail response helpers for standardised API envelopes
import { ok, fail } from "../lib/response.js"
// Import the user service functions for business logic
import { createUser, listUsers, updateUser, getUserById } from "../services/userService.js"
// Import the pagination helper to parse and bound page/pageSize query params
import { getPagination } from "../lib/pagination.js"

/* POST /api/users/ — create a new user account (admin only) */
export async function create(c: Context) {
  try {
    // Parse the JSON body containing the new user's details
    const body = await c.req.json()
    // Delegate to the user service to hash the password, create the user, and create the role profile
    const user = await createUser(body)
    // Return only the safe fields (no password hash) in the response
    return c.json(ok("User created", { id: user.id, email: user.email, role: user.role }))
  } catch (error) {
    // Return 400 with the error message if creation fails (e.g. duplicate email)
    return c.json(fail(error instanceof Error ? error.message : "Create user failed"), 400)
  }
}

/* GET /api/users/ — return a paginated list of users (admin only) */
export async function list(c: Context) {
  // Extract all query parameters from the URL
  const query = c.req.query()
  // Parse and bound the pagination parameters
  const { page, pageSize, skip, take } = getPagination(query)
  // Build the filters object from the query parameters
  const filters = {
    role: query.role as "ADMIN" | "IMPLEMENTOR" | "CADET_OFFICER" | "STUDENT" | undefined, // Optional role filter
    search: query.search // Optional free-text search (matches email)
  }
  // Delegate to the user service with filters and pagination
  const result = await listUsers(filters, skip, take)
  // Return the paginated list with metadata
  return c.json(ok("Users fetched", result.items, { page, pageSize, total: result.total }))
}

/* PATCH /api/users/:id — update a user's role and/or active status (admin only) */
export async function update(c: Context) {
  try {
    // Extract the user ID from the URL path parameter
    const id = c.req.param("id")
    // Parse the JSON body containing the updated role and/or isActive flag
    const body = await c.req.json()
    // Delegate to the user service to update the user record and log the audit event
    const user = await updateUser(id, body)
    // Return only the safe fields in the response
    return c.json(ok("User updated", { id: user.id, role: user.role, isActive: user.isActive }))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Update failed"), 400)
  }
}

/* GET /api/users/:id — return a single user's full profile (any authenticated user) */
export async function getById(c: Context) {
  try {
    // Extract the user ID from the URL path parameter
    const id = c.req.param("id")
    // Delegate to the user service to fetch the user with all role-specific profile relations
    const user = await getUserById(id)
    // Return 404 if the user does not exist
    if (!user) {
      return c.json(fail("User not found"), 404)
    }
    // Return the full user object including profile relations
    return c.json(ok("User fetched", user))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Fetch failed"), 400)
  }
}
