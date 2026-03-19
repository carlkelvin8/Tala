// Import the Context type from Hono for request/response handling
import { Context } from "hono"
// Import the ok and fail response helpers for standardised API envelopes
import { ok, fail } from "../lib/response.js"
// Import the merit service functions for business logic
import { assignMerit, listMerits } from "../services/meritService.js"
// Import the helper to retrieve the authenticated user from context
import { getAuthUser } from "../middlewares/auth.js"
// Import the pagination helper to parse and bound page/pageSize query params
import { getPagination } from "../lib/pagination.js"
// Import the MeritType enum from Prisma for type-safe type casting
import { MeritType } from "@prisma/client"

/* POST /api/merits/ — assign a merit or demerit to a student */
export async function create(c: Context) {
  try {
    // Retrieve the authenticated user (the staff member assigning the merit/demerit)
    const authUser = getAuthUser(c)
    // Parse the JSON body containing studentId, type, points, and reason
    const body = await c.req.json()
    // Delegate to the merit service, injecting the encoder's ID for audit purposes
    const merit = await assignMerit({ ...body, encodedById: authUser.id })
    // Return the created merit/demerit record
    return c.json(ok("Merit/Demerit assigned", merit))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Assign failed"), 400)
  }
}

/* GET /api/merits/ — return a paginated list of merit/demerit records */
export async function list(c: Context) {
  // Extract all query parameters from the URL
  const query = c.req.query()
  // Parse and bound the pagination parameters
  const { page, pageSize, skip, take } = getPagination(query)
  // Delegate to the merit service with optional filters and pagination
  const result = await listMerits(
    {
      studentId: query.studentId,                    // Optional student ID filter
      type: query.type as MeritType | undefined      // Optional type filter (cast to enum)
    },
    skip, // Number of records to skip
    take  // Maximum number of records to return
  )
  // Return the paginated list with metadata
  return c.json(ok("Merit/Demerit fetched", result.items, { page, pageSize, total: result.total }))
}
