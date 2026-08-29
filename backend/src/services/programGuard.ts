import { NstpType } from "@prisma/client"
import { prisma } from "../lib/prisma.js"

/* Guard helpers for program scoping. "Scoped" callers (implementors locked to ROTC,
   cadet officers running their program) may only touch resources that resolve to
   THEIR program. Flight-only resources and program-agnostic resources carry no
   program attribution and are therefore restricted to admins. */

export class ProgramScopeError extends Error {}

/* Resolve the program a section-scoped resource belongs to; throws when the target
   is unattributable or nonexistent. */
export async function resolveSectionProgram(sectionId: string): Promise<NstpType> {
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    select: { course: { select: { nstpType: true } } },
  })
  if (!section?.course) {
    throw new ProgramScopeError("Section does not resolve to a program (no course assigned)")
  }
  return section.course.nstpType
}

/* Confirm a section resolves to the caller's program; throws otherwise. */
export async function assertSectionProgram(sectionId: string, program: NstpType | null | undefined) {
  if (!program) return // Admin / un-scoped caller may target any section
  const target = await resolveSectionProgram(sectionId)
  if (target !== program) {
    throw new ProgramScopeError("Section does not belong to your program")
  }
}

/* Extract the program from an optionally section- or flight-scoped target. Sections
   resolve through their course; flights have no program link and resolve to null. */
export async function materialProgram(
  target: { sectionId?: string | null; flightId?: string | null }
): Promise<NstpType | null> {
  if (target.sectionId) {
    return resolveSectionProgram(target.sectionId)
  }
  return null // flight-only or general material → unattributable
}

/* Throw unless a resource (identified by sectionId/flightId) belongs to `program`.
   When no section is present the resource is ambiguous and only admins (null
   program from resolveScopeProgram → program is null, which we treat as un-scoped)
   may operate on it. `program` being null means the caller is un-scoped. */
export async function assertMaterialProgram(
  target: { sectionId?: string | null; flightId?: string | null },
  program: NstpType | null | undefined
) {
  if (!program) return
  const targetProgram = await materialProgram(target)
  if (!targetProgram) {
    throw new ProgramScopeError("This resource is not scoped to a program and cannot be managed by you")
  }
  if (targetProgram !== program) {
    throw new ProgramScopeError("This resource does not belong to your program")
  }
}

/* Resolve a user's program using the same OR logic as programUserScope: account
   program first, then the program of their assigned section. Returns null when
   unattributable. */
export async function userProgram(userId: string): Promise<NstpType | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      program: true,
      studentProfile: { select: { section: { select: { course: { select: { nstpType: true } } } } } },
    },
  })
  if (!user) return null
  if (user.program) return user.program
  return user.studentProfile?.section?.course?.nstpType ?? null
}

/* Throw unless the reflected user belongs to `program`. */
export async function assertUserInProgram(userId: string, program: NstpType | null | undefined) {
  if (!program) return
  const target = await userProgram(userId)
  if (target !== program) {
    throw new ProgramScopeError("Target user does not belong to your program")
  }
}