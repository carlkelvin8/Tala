// Import the Zod validation library for schema definition and parsing
import { z } from "zod"

/* Schema for creating a new enrollment record */
export const enrollmentCreateSchema = z.object({
  userId: z.string().uuid(),              // UUID of the user being enrolled
  sectionId: z.string().uuid().optional(), // Optional UUID of the section to assign the student to
  flightId: z.string().uuid().optional()   // Optional UUID of the flight/group to assign the student to
})

/* Schema for updating the status of an existing enrollment */
export const enrollmentStatusSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]) // Must be one of the three valid enrollment statuses
})

/* Schema for query parameters when listing enrollment records */
export const enrollmentQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(), // Filter by enrollment status
  sectionId: z.string().uuid().optional(),                         // Filter by section UUID
  flightId: z.string().uuid().optional(),                          // Filter by flight/group UUID
  search: z.string().optional(),                                   // Free-text search (matches email or user ID)
  page: z.string().optional(),                                     // Page number for pagination
  pageSize: z.string().optional()                                  // Items per page for pagination
})
