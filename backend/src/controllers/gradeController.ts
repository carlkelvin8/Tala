// Import the Context type from Hono for request/response handling
import { Context } from "hono"
// Import the ok and fail response helpers for standardised API envelopes
import { ok, fail } from "../lib/response.js"
// Import all grade service functions (with local aliases to avoid name collisions)
import { 
  createGradeCategory,                                    // Creates a new grade category
  createGradeItem,                                        // Creates a new grade item within a category
  encodeStudentGrade,                                     // Records a student's score for a grade item
  listGrades,                                             // Lists student grades with filters
  updateGrade as updateGradeRecord,                       // Updates a student grade score
  deleteGrade as deleteGradeRecord,                       // Deletes a student grade record
  updateGradeItem as updateGradeItemRecord,               // Updates a grade item
  deleteGradeItem as deleteGradeItemRecord,               // Deletes a grade item
  updateGradeCategory as updateGradeCategoryRecord,       // Updates a grade category
  deleteGradeCategory as deleteGradeCategoryRecord        // Deletes a grade category
} from "../services/gradeService.js"
// Import the pagination helper to parse and bound page/pageSize query params
import { getPagination } from "../lib/pagination.js"
// Import the helper to retrieve the authenticated user from context
import { getAuthUser } from "../middlewares/auth.js"
// Import the Prisma client for direct database queries
import { prisma } from "../lib/prisma.js"

/* POST /api/grades/categories — create a new grade category */
export async function createCategory(c: Context) {
  try {
    // Parse the JSON body containing the category name and optional weight
    const body = await c.req.json()
    // Delegate to the grade service to create the category and log the audit event
    const category = await createGradeCategory(body.name, body.weight)
    // Return the created category object
    return c.json(ok("Category created", category))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Create failed"), 400)
  }
}

/* POST /api/grades/items — create a new grade item within a category */
export async function createItem(c: Context) {
  try {
    // Parse the JSON body containing the item title, max score, and category ID
    const body = await c.req.json()
    // Delegate to the grade service to create the item and log the audit event
    const item = await createGradeItem(body.title, body.maxScore, body.categoryId)
    // Return the created grade item object
    return c.json(ok("Item created", item))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Create failed"), 400)
  }
}

/* POST /api/grades/ — encode a student's score for a grade item */
export async function encode(c: Context) {
  try {
    // Retrieve the authenticated user (the staff member encoding the grade)
    const authUser = getAuthUser(c)
    // Parse the JSON body containing studentId, gradeItemId, and score
    const body = await c.req.json()
    // Delegate to the grade service to create the student grade record
    const grade = await encodeStudentGrade(body.studentId, body.gradeItemId, body.score, authUser.id)
    // Return the created student grade object
    return c.json(ok("Grade encoded", grade))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Encode failed"), 400)
  }
}

/* GET /api/grades/ — return a paginated list of student grades */
export async function list(c: Context) {
  // Extract all query parameters from the URL
  const query = c.req.query()
  // Parse and bound the pagination parameters
  const { page, pageSize, skip, take } = getPagination(query)
  // Delegate to the grade service with optional studentId filter and pagination
  const result = await listGrades({ studentId: query.studentId }, skip, take)
  // Return the paginated list with metadata
  return c.json(ok("Grades fetched", result.items, { page, pageSize, total: result.total }))
}

/* GET /api/grades/categories — return all grade categories */
export async function listCategories(c: Context) {
  // Fetch all grade categories ordered by creation date descending
  const categories = await prisma.gradeCategory.findMany({
    orderBy: { createdAt: "desc" } // Most recently created categories first
  })
  // Return the list of categories
  return c.json(ok("Categories fetched", categories))
}

/* GET /api/grades/items — return all grade items with their categories */
export async function listItems(c: Context) {
  // Extract query parameters for optional filtering
  const query = c.req.query()
  // Build the where clause — start empty and add filters as needed
  const where: Record<string, unknown> = {}
  // If a categoryId filter is provided, add it to the where clause
  if (query.categoryId) where.categoryId = query.categoryId
  // Fetch grade items with their parent category included
  const items = await prisma.gradeItem.findMany({
    where,                          // Apply optional category filter
    include: { category: true },    // Include the parent category object in each item
    orderBy: { createdAt: "desc" }  // Most recently created items first
  })
  // Return the list of grade items
  return c.json(ok("Items fetched", items))
}

/* PATCH /api/grades/:id — update a student's grade score */
export async function updateGrade(c: Context) {
  try {
    // Retrieve the authenticated user (the staff member making the update)
    const authUser = getAuthUser(c)
    // Extract the grade record ID from the URL path parameter
    const id = c.req.param("id")
    // Parse the JSON body containing the new score
    const body = await c.req.json()
    // Delegate to the grade service to update the score and log the audit event
    const grade = await updateGradeRecord(id, body.score, authUser.id)
    // Return the updated grade object
    return c.json(ok("Grade updated", grade))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Update failed"), 400)
  }
}

/* DELETE /api/grades/:id — delete a student grade record */
export async function deleteGrade(c: Context) {
  try {
    // Retrieve the authenticated user for audit logging
    const authUser = getAuthUser(c)
    // Extract the grade record ID from the URL path parameter
    const id = c.req.param("id")
    // Delegate to the grade service to delete the record and log the audit event
    await deleteGradeRecord(id, authUser.id)
    // Return a success message with no data payload
    return c.json(ok("Grade deleted"))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Delete failed"), 400)
  }
}

/* PATCH /api/grades/items/:id — update a grade item's details */
export async function updateItem(c: Context) {
  try {
    // Retrieve the authenticated user for audit logging
    const authUser = getAuthUser(c)
    // Extract the grade item ID from the URL path parameter
    const id = c.req.param("id")
    // Parse the JSON body containing the updated fields
    const body = await c.req.json()
    // Delegate to the grade service to update the item and log the audit event
    const item = await updateGradeItemRecord(id, body, authUser.id)
    // Return the updated grade item object
    return c.json(ok("Item updated", item))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Update failed"), 400)
  }
}

/* DELETE /api/grades/items/:id — delete a grade item */
export async function deleteItem(c: Context) {
  try {
    // Retrieve the authenticated user for audit logging
    const authUser = getAuthUser(c)
    // Extract the grade item ID from the URL path parameter
    const id = c.req.param("id")
    // Delegate to the grade service to delete the item and log the audit event
    await deleteGradeItemRecord(id, authUser.id)
    // Return a success message with no data payload
    return c.json(ok("Item deleted"))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Delete failed"), 400)
  }
}

/* PATCH /api/grades/categories/:id — update a grade category's details */
export async function updateCategory(c: Context) {
  try {
    // Retrieve the authenticated user for audit logging
    const authUser = getAuthUser(c)
    // Extract the category ID from the URL path parameter
    const id = c.req.param("id")
    // Parse the JSON body containing the updated fields
    const body = await c.req.json()
    // Delegate to the grade service to update the category and log the audit event
    const category = await updateGradeCategoryRecord(id, body, authUser.id)
    // Return the updated category object
    return c.json(ok("Category updated", category))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Update failed"), 400)
  }
}

/* DELETE /api/grades/categories/:id — delete a grade category */
export async function deleteCategory(c: Context) {
  try {
    // Retrieve the authenticated user for audit logging
    const authUser = getAuthUser(c)
    // Extract the category ID from the URL path parameter
    const id = c.req.param("id")
    // Delegate to the grade service to delete the category and log the audit event
    await deleteGradeCategoryRecord(id, authUser.id)
    // Return a success message with no data payload
    return c.json(ok("Category deleted"))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Delete failed"), 400)
  }
}
