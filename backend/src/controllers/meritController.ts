import { Context } from "hono"
import { ok, fail } from "../lib/response.js"
import { assignMerit, listMerits, updateMerit, deleteMerit } from "../services/meritService.js"
import { getAuthUser } from "../middlewares/auth.js"
import { getPagination } from "../lib/pagination.js"
import { MeritType, NstpType, RoleType } from "@prisma/client"
import { resolveScopeProgram } from "../services/programScope.js"
import { assertSectionProgram } from "../services/programGuard.js"
import { ProgramScopeError } from "../services/programGuard.js"

/* Merits are an ROTC-only concept. CWTS implementors are blocked at the
   controller level even though resolveScopeProgram would otherwise scope them
   to CWTS — the CWTS dashboard intentionally does not track merits. */
function assertRotcOnlyForImplementor(scopeProgram: NstpType | null | undefined) {
  if (scopeProgram === NstpType.CWTS) {
    throw new ProgramScopeError("Merits are only tracked for the ROTC program")
  }
}

export async function create(c: Context) {
  try {
    const authUser = getAuthUser(c)
    const body = await c.req.json()
    const scopeProgram = resolveScopeProgram(authUser)
    if (authUser.role === RoleType.IMPLEMENTOR) assertRotcOnlyForImplementor(scopeProgram)
    const merit = await assignMerit({ ...body, encodedById: authUser.id }, scopeProgram)
    return c.json(ok("Merit/Demerit assigned", merit))
  } catch (error) {
    if (error instanceof ProgramScopeError) {
      return c.json(fail(error.message), 403)
    }
    return c.json(fail(error instanceof Error ? error.message : "Assign failed"), 400)
  }
}

export async function update(c: Context) {
  try {
    const authUser = getAuthUser(c)
    const id = c.req.param("id")
    const body = await c.req.json()
    const scopeProgram = resolveScopeProgram(authUser)
    if (authUser.role === RoleType.IMPLEMENTOR) assertRotcOnlyForImplementor(scopeProgram)
    const merit = await updateMerit(id, body, authUser.id, scopeProgram)
    return c.json(ok("Merit/Demerit updated", merit))
  } catch (error) {
    if (error instanceof ProgramScopeError) {
      return c.json(fail(error.message), 403)
    }
    return c.json(fail(error instanceof Error ? error.message : "Update failed"), 400)
  }
}

export async function remove(c: Context) {
  try {
    const authUser = getAuthUser(c)
    const id = c.req.param("id")
    const scopeProgram = resolveScopeProgram(authUser)
    if (authUser.role === RoleType.IMPLEMENTOR) assertRotcOnlyForImplementor(scopeProgram)
    await deleteMerit(id, authUser.id, scopeProgram)
    return c.json(ok("Merit/Demerit deleted"))
  } catch (error) {
    if (error instanceof ProgramScopeError) {
      return c.json(fail(error.message), 403)
    }
    return c.json(fail(error instanceof Error ? error.message : "Delete failed"), 400)
  }
}

export async function list(c: Context) {
  const authUser = getAuthUser(c)
  const query = c.req.query()
  const { page, pageSize, skip, take } = getPagination(query)
  const scopeProgram = resolveScopeProgram(authUser)
  // Merits are ROTC-only. Fail closed for every non-admin account that is not
  // explicitly scoped to ROTC, including CWTS and legacy null-program students.
  if (authUser.role !== RoleType.ADMIN && scopeProgram !== NstpType.ROTC) {
    return c.json(fail("Merits are only tracked for the ROTC program"), 403)
  }
  const filters: { studentId?: string; type?: MeritType; sectionId?: string } = {
    studentId: query.studentId,
    type: query.type as MeritType | undefined
  }
  // Fail closed: a student only ever sees merits of their own section (or, when no
  // section resolves, only their own merit history) — never the whole database.
  if (authUser.role === RoleType.STUDENT) {
    filters.sectionId = authUser.sectionId
    if (!authUser.sectionId) filters.studentId = authUser.id
  } else {
    filters.sectionId = query.sectionId
    // Scoped staff may not query sections outside their program
    if (filters.sectionId) {
      try {
        await assertSectionProgram(filters.sectionId, scopeProgram)
      } catch (error) {
        return c.json(fail(error instanceof Error ? error.message : "Section out of scope"), 403)
      }
    }
    // Scoped staff may not query students outside their program — enforce by
    // scoping the query itself (listMerits merges program scope with AND).
  }
  const result = await listMerits(filters, skip, take, scopeProgram)
  return c.json(ok("Merit/Demerit fetched", result.items, { page, pageSize, total: result.total }))
}
