import { sectionRepository } from "../repositories/sectionRepository.js"
import { logAudit } from "./auditService.js"

export async function createSection(code: string, name: string) {
  const section = await sectionRepository.create({ code, name })
  await logAudit("CREATE", "Section", section.id)
  return section
}

export async function listSections() {
  return sectionRepository.list()
}

export async function updateSection(id: string, code: string, name: string) {
  const section = await sectionRepository.update(id, { code, name })
  await logAudit("UPDATE", "Section", id)
  return section
}

export async function deleteSection(id: string) {
  await sectionRepository.delete(id)
  await logAudit("DELETE", "Section", id)
}
