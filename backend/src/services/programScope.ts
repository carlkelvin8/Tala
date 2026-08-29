import { NstpType, RoleType } from "@prisma/client"

/* Resolve the program a staff member is allowed to operate on.
   - Implementors are locked to ROTC.
   - Admins may target a program via ?program= (falls back to scoping nothing).
   - Everyone else is scoped to their account-level program.
   Returns null when the caller may see all programs (e.g. an admin without ?program=). */
export function resolveScopeProgram(
  authUser: { role: RoleType; program?: NstpType | null },
  rawProgram?: string
): NstpType | null {
  if (authUser.role === RoleType.IMPLEMENTOR) return NstpType.ROTC
  if (authUser.role === RoleType.ADMIN) {
    const program = rawProgram?.toUpperCase()
    return program === "ROTC" || program === "CWTS" ? (program as NstpType) : null
  }
  return authUser.program ?? null
}

/* Prisma `where.user` fragment matching users of a program: they either carry the
   program on their account, or belong to a section of that program (covers legacy
   students whose account program was never set). */
export function programUserScope(program: NstpType | null | undefined) {
  if (!program) return undefined
  return {
    OR: [
      { program },
      { studentProfile: { section: { course: { nstpType: program } } } },
    ],
  }
}

/* Merge a program user-scope into an existing `where.user` fragment and return the
   merged value, or undefined when nothing changed. */
export function withProgramUserScope(
  existsUserIdWhere: Record<string, unknown> | undefined,
  program: NstpType | null | undefined
): Record<string, unknown> | undefined {
  const scope = programUserScope(program)
  if (!scope) return existsUserIdWhere
  const userWhere = existsUserIdWhere ?? {}
  const existingOr = Array.isArray(userWhere.OR) ? userWhere.OR : []
  userWhere.OR = [...existingOr, ...(scope.OR as Record<string, unknown>[])]
  return userWhere as Record<string, unknown>
}

/* Prisma `where` fragment scoping attendance sessions / exam sessions to a program.
   Program is derived from the linked section's course. Sessions without a section
   (flight-only or general) cannot be attributed to a program and are treated as
   out-of-scope for the caller. */
export function programSessionScope(program: NstpType | null | undefined) {
  if (!program) return undefined
  return { section: { course: { nstpType: program } } }
}