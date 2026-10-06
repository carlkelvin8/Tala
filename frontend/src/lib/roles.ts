export const roleLabels = {
  ADMIN: "Administrator",
  IMPLEMENTOR: "Implementer",
  CADET_OFFICER: "Cadet Officer",
  STUDENT: "Student"
} as const

/* Display name for a role. The same IMPLEMENTOR role is called an Instructor in the ROTC program
   and an Implementer in the CWTS program (an account without a program counts as CWTS). */
export function getRoleLabel(role?: string | null, program?: string | null): string {
  if (!role) return "Guest"
  if (role === "IMPLEMENTOR") return program === "ROTC" ? "Instructor" : "Implementer"
  return (roleLabels as Record<string, string>)[role] ?? role
}

export const roleTextColors = {
  ADMIN: "text-violet-600",
  IMPLEMENTOR: "text-royal",
  CADET_OFFICER: "text-amber-600",
  STUDENT: "text-emerald-600"
} as const

export const roleBgColors = {
  ADMIN: "bg-violet-50",
  IMPLEMENTOR: "bg-sky-50",
  CADET_OFFICER: "bg-amber-50",
  STUDENT: "bg-emerald-50"
} as const

export const roleBadgeColors = {
  ADMIN: "bg-violet-100 text-violet-700",
  IMPLEMENTOR: "bg-royal/10 text-sky-700",
  CADET_OFFICER: "bg-amber-100 text-amber-700",
  STUDENT: "bg-emerald-100 text-emerald-700"
} as const
