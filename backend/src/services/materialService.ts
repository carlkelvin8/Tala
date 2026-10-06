// Import the MaterialCategory enum from Prisma for type-safe category values
import { notifyStudentsSafe } from "./notificationService.js"
import { MaterialCategory, NstpType } from "@prisma/client"
// Import the Prisma client for database access
import { prisma } from "../lib/prisma.js"
// Import the audit logging helper to record material management events
import { logAudit } from "./auditService.js"
// Import the program guard to enforce program scoping on implementor accounts
import { assertMaterialProgram } from "./programGuard.js"

// Reusable Prisma include shape for the createdBy relation on learning materials
// Selects only the fields needed for display — avoids exposing the password hash
const createdByInclude = {
  select: {
    id: true,    // Creator's user ID
    email: true, // Creator's email address
    role: true,  // Creator's assigned role
    studentProfile: { select: { firstName: true, lastName: true } },       // Student name (if applicable)
    implementorProfile: { select: { firstName: true, lastName: true } },   // Implementor name (if applicable)
    cadetOfficerProfile: { select: { firstName: true, lastName: true } },  // Cadet officer name (if applicable)
  },
} as const // Mark as const to preserve literal types for Prisma's type inference

/* Create a new learning material record */
export async function createMaterial(data: {
  title: string              // Material title
  description?: string       // Optional longer description
  category: MaterialCategory // Material category (MODULE, LECTURE, ANNOUNCEMENT, ACTIVITY)
  program?: NstpType | null  // Optional program scope (null = all programs)
  fileUrl?: string           // Optional URL or path to the uploaded file
  createdById: string        // UUID of the staff member creating the material
  sectionId?: string         // Optional UUID to scope the material to a section
  flightId?: string          // Optional UUID to scope the material to a flight
  scopeProgram?: NstpType | null // Program the caller is locked to (ROTC for implementors)
}) {
  // The caller's scope wins; otherwise honor the requested program scope
  const program = data.scopeProgram ?? data.program ?? null
  // Scoped staff may only author materials that belong to their own program
  await assertMaterialProgram(
    { program, sectionId: data.sectionId, flightId: data.flightId },
    data.scopeProgram
  )
  const { scopeProgram: _scopeProgram, ...createData } = data
  // Insert a new learning material record with the provided data
  const material = await prisma.learningMaterial.create({ data: { ...createData, program } })
  // Log the material creation event to the audit trail with the creator's ID
  await logAudit("CREATE", "LearningMaterial", material.id, data.createdById)
  // Announce new materials to the students who can see them (section-targeted ones go to that section only)
  await notifyStudentsSafe({ sectionId: data.sectionId, program }, "New Material", data.title)
  // Return the created material object
  return material
}

/* Return a paginated list of learning materials with optional filters */
export async function listMaterials(
  filters: { category?: MaterialCategory; program?: NstpType; sectionId?: string; flightId?: string }, // Optional filter criteria
  skip: number, // Number of records to skip (pagination offset)
  take: number,  // Maximum number of records to return (page size)
  scopeProgram?: NstpType | null // Program the caller is locked to
) {
  // Build the Prisma where clause dynamically based on provided filters
  const where: Record<string, unknown> = {}
  // Add category filter if provided
  if (filters.category) where.category = filters.category
  // Add program filter if provided (explicit audience targeting)
  if (filters.program) where.program = filters.program
  // Add section ID filter if provided
  if (filters.sectionId) where.sectionId = filters.sectionId
  // Add flight ID filter if provided
  if (filters.flightId) where.flightId = filters.flightId
  // Scoped staff only see materials of their own program: section-derived
  // matches plus explicitly program-targeted matches (fail closed on mismatch)
  if (scopeProgram) {
    where.AND = [
      {
        OR: [
          { section: { course: { nstpType: scopeProgram } } },
          { program: scopeProgram },
        ],
      },
    ]
  }

  // Run the count and data queries in parallel for performance
  const [items, total] = await Promise.all([
    // Fetch the paginated material records with the creator's info included
    prisma.learningMaterial.findMany({
      where,                              // Apply the dynamic filter
      skip,                               // Skip records for previous pages
      take,                               // Limit to the page size
      include: { createdBy: createdByInclude }, // Include the creator's basic info
      orderBy: { createdAt: "desc" },     // Most recently created materials first
    }),
    // Count the total number of matching materials for pagination metadata
    prisma.learningMaterial.count({ where }),
  ])
  // Return both the page of items and the total count
  return { items, total }
}

/* Update an existing learning material's metadata */
export async function updateMaterial(
  id: string, // UUID of the material to update
  data: {
    title?: string              // Optional new title
    description?: string        // Optional new description
    category?: MaterialCategory // Optional new category
    program?: NstpType | null   // Optional new program scope (null = all programs)
    fileUrl?: string            // Optional new file URL
  },
  userId: string, // UUID of the staff member making the update (for audit logging)
  scopeProgram?: NstpType | null // Program the caller is locked to
) {
  // Scoped staff may only modify materials that belong to their own program
  const existing = await prisma.learningMaterial.findUnique({
    where: { id },
    select: { program: true, sectionId: true, flightId: true },
  })
  if (!existing) throw new Error("Material not found")
  await assertMaterialProgram(existing, scopeProgram)
  // A scoped caller can never retarget a material to another program
  if (scopeProgram && data.program !== undefined && data.program !== null && data.program !== scopeProgram) {
    throw new Error("Material must stay within your program")
  }
  // Update the learning material record with the provided fields
  const material = await prisma.learningMaterial.update({
    where: { id }, // Target the specific material by ID
    data,          // Apply the partial update data
  })
  // Log the material update event to the audit trail
  await logAudit("UPDATE", "LearningMaterial", material.id, userId)
  // Return the updated material object
  return material
}

/* Permanently delete a learning material record */
export async function deleteMaterial(id: string, userId: string, scopeProgram?: NstpType | null) {
  // Scoped staff may only delete materials that belong to their own program
  const existing = await prisma.learningMaterial.findUnique({
    where: { id },
    select: { program: true, sectionId: true, flightId: true },
  })
  if (!existing) throw new Error("Material not found")
  await assertMaterialProgram(existing, scopeProgram)
  // Delete the learning material record from the database
  await prisma.learningMaterial.delete({ where: { id } })
  // Log the material deletion event to the audit trail
  await logAudit("DELETE", "LearningMaterial", id, userId)
}
