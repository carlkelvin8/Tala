// Import the section repository for database access to section records
import { sectionRepository } from "../repositories/sectionRepository.js"
// Import the audit logging helper to record section management events
import { logAudit } from "./auditService.js"

/* Create a new section record */
export async function createSection(code: string, name: string) {
  // Delegate to the repository to insert the new section record
  const section = await sectionRepository.create({ code, name })
  // Log the section creation event to the audit trail
  await logAudit("CREATE", "Section", section.id)
  // Return the created section object
  return section
}

/* Return all section records ordered alphabetically by name */
export async function listSections() {
  // Delegate to the repository to fetch all sections
  return sectionRepository.list()
}

/* Update an existing section's code and name */
export async function updateSection(id: string, code: string, name: string) {
  // Delegate to the repository to update the section record
  const section = await sectionRepository.update(id, { code, name })
  // Log the section update event to the audit trail
  await logAudit("UPDATE", "Section", id)
  // Return the updated section object
  return section
}

/* Permanently delete a section record */
export async function deleteSection(id: string) {
  // Delegate to the repository to delete the section record
  await sectionRepository.delete(id)
  // Log the section deletion event to the audit trail
  await logAudit("DELETE", "Section", id)
}
