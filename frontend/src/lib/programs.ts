import { ProgramType } from "../types"
import { AuthUser } from "./auth"

export const programLabels: Record<ProgramType, string> = {
  CWTS: "CWTS",
  ROTC: "ROTC",
}

export const programFullLabels: Record<ProgramType, string> = {
  CWTS: "Civic Welfare Training Service",
  ROTC: "Reserved Officers' Training Corps",
}

export const programTextColors: Record<ProgramType, string> = {
  CWTS: "text-teal-600",
  ROTC: "text-amber-600",
}

export const programBgColors: Record<ProgramType, string> = {
  CWTS: "bg-teal-50",
  ROTC: "bg-amber-50",
}

export const programBadgeColors: Record<ProgramType, string> = {
  CWTS: "bg-teal-100 text-teal-700",
  ROTC: "bg-amber-100 text-amber-700",
}

/* Implementor accounts are locked to ROTC regardless of the stored program value. */
export function getEffectiveProgram(user?: AuthUser | null): ProgramType | null {
  if (!user) return null
  if (user.role === "IMPLEMENTOR") return "ROTC"
  if (user.role === "ADMIN") return null
  return user.program ?? null
}