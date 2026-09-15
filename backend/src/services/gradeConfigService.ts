import { prisma } from "../lib/prisma.js"
import { logAudit } from "./auditService.js"

export type ComputationMode = "weighted" | "average"

export type GradeConfig = {
  passingGrade: number
  computationMode: ComputationMode
}

const DEFAULT_CONFIG: GradeConfig = { passingGrade: 75, computationMode: "weighted" }

/* Read the current grade computation configuration. Falls back to sensible
   defaults when no row exists (fresh installs) or when the settings table has
   not been migrated yet, so grade endpoints never crash before `db push`. */
export async function getGradeConfig(): Promise<GradeConfig> {
  let row
  try {
    row = await prisma.systemSetting.findUnique({ where: { key: "gradeConfig" } })
  } catch {
    return DEFAULT_CONFIG
  }
  if (!row) return DEFAULT_CONFIG
  const value = row.value as Record<string, unknown>
  const passingGrade = typeof value.passingGrade === "number" && value.passingGrade > 0 ? value.passingGrade : DEFAULT_CONFIG.passingGrade
  const computationMode =
    value.computationMode === "average" || value.computationMode === "weighted"
      ? value.computationMode
      : DEFAULT_CONFIG.computationMode
  return { passingGrade, computationMode }
}

/* Persist an updated grade computation configuration. Only staff may call this. */
export async function updateGradeConfig(data: { passingGrade?: number; computationMode?: ComputationMode }, userId: string): Promise<GradeConfig> {
  const current = await getGradeConfig()
  const next: GradeConfig = {
    passingGrade:
      typeof data.passingGrade === "number" && data.passingGrade > 0 && data.passingGrade <= 100
        ? data.passingGrade
        : current.passingGrade,
    computationMode:
      data.computationMode === "average" || data.computationMode === "weighted"
        ? data.computationMode
        : current.computationMode,
  }
  await prisma.systemSetting.upsert({
    where: { key: "gradeConfig" },
    create: { key: "gradeConfig", value: next },
    update: { value: next },
  })
  await logAudit("UPDATE", "SystemSetting", "gradeConfig", userId)
  return next
}