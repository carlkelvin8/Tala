import { Context } from "hono"
import { ok, fail } from "../lib/response.js"
import { 
  createGradeCategory, 
  createGradeItem, 
  encodeStudentGrade, 
  listGrades,
  updateGrade as updateGradeRecord,
  deleteGrade as deleteGradeRecord,
  updateGradeItem as updateGradeItemRecord,
  deleteGradeItem as deleteGradeItemRecord,
  updateGradeCategory as updateGradeCategoryRecord,
  deleteGradeCategory as deleteGradeCategoryRecord
} from "../services/gradeService.js"
import { getPagination } from "../lib/pagination.js"
import { getAuthUser } from "../middlewares/auth.js"
import { prisma } from "../lib/prisma.js"

export async function createCategory(c: Context) {
  try {
    const body = await c.req.json()
    const category = await createGradeCategory(body.name, body.weight)
    return c.json(ok("Category created", category))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Create failed"), 400)
  }
}

export async function createItem(c: Context) {
  try {
    const body = await c.req.json()
    const item = await createGradeItem(body.title, body.maxScore, body.categoryId)
    return c.json(ok("Item created", item))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Create failed"), 400)
  }
}

export async function encode(c: Context) {
  try {
    const authUser = getAuthUser(c)
    const body = await c.req.json()
    const grade = await encodeStudentGrade(body.studentId, body.gradeItemId, body.score, authUser.id)
    return c.json(ok("Grade encoded", grade))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Encode failed"), 400)
  }
}

export async function list(c: Context) {
  const query = c.req.query()
  const { page, pageSize, skip, take } = getPagination(query)
  const result = await listGrades({ studentId: query.studentId }, skip, take)
  return c.json(ok("Grades fetched", result.items, { page, pageSize, total: result.total }))
}

export async function listCategories(c: Context) {
  const categories = await prisma.gradeCategory.findMany({
    orderBy: { createdAt: "desc" }
  })
  return c.json(ok("Categories fetched", categories))
}

export async function listItems(c: Context) {
  const query = c.req.query()
  const where: Record<string, unknown> = {}
  if (query.categoryId) where.categoryId = query.categoryId
  const items = await prisma.gradeItem.findMany({
    where,
    include: { category: true },
    orderBy: { createdAt: "desc" }
  })
  return c.json(ok("Items fetched", items))
}


export async function updateGrade(c: Context) {
  try {
    const authUser = getAuthUser(c)
    const id = c.req.param("id")
    const body = await c.req.json()
    const grade = await updateGradeRecord(id, body.score, authUser.id)
    return c.json(ok("Grade updated", grade))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Update failed"), 400)
  }
}

export async function deleteGrade(c: Context) {
  try {
    const authUser = getAuthUser(c)
    const id = c.req.param("id")
    await deleteGradeRecord(id, authUser.id)
    return c.json(ok("Grade deleted"))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Delete failed"), 400)
  }
}

export async function updateItem(c: Context) {
  try {
    const authUser = getAuthUser(c)
    const id = c.req.param("id")
    const body = await c.req.json()
    const item = await updateGradeItemRecord(id, body, authUser.id)
    return c.json(ok("Item updated", item))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Update failed"), 400)
  }
}

export async function deleteItem(c: Context) {
  try {
    const authUser = getAuthUser(c)
    const id = c.req.param("id")
    await deleteGradeItemRecord(id, authUser.id)
    return c.json(ok("Item deleted"))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Delete failed"), 400)
  }
}

export async function updateCategory(c: Context) {
  try {
    const authUser = getAuthUser(c)
    const id = c.req.param("id")
    const body = await c.req.json()
    const category = await updateGradeCategoryRecord(id, body, authUser.id)
    return c.json(ok("Category updated", category))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Update failed"), 400)
  }
}

export async function deleteCategory(c: Context) {
  try {
    const authUser = getAuthUser(c)
    const id = c.req.param("id")
    await deleteGradeCategoryRecord(id, authUser.id)
    return c.json(ok("Category deleted"))
  } catch (error) {
    return c.json(fail(error instanceof Error ? error.message : "Delete failed"), 400)
  }
}
