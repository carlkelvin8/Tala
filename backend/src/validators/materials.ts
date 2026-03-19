// Import the Zod validation library for schema definition and parsing
import { z } from "zod"

/* Schema for creating a new learning material record */
export const materialCreateSchema = z.object({
  title: z.string().min(1),                                                          // Material title must not be empty
  description: z.string().optional(),                                                // Optional longer description
  category: z.enum(["MODULE", "LECTURE", "ANNOUNCEMENT", "ACTIVITY"]),              // Must be one of the four valid categories
  fileUrl: z.string().min(1).optional(),                                             // Optional URL or path to the uploaded file
  sectionId: z.string().uuid().optional(),                                           // Optional UUID to scope the material to a section
  flightId: z.string().uuid().optional()                                             // Optional UUID to scope the material to a flight
})

/* Schema for query parameters when listing learning materials */
export const materialQuerySchema = z.object({
  category: z.enum(["MODULE", "LECTURE", "ANNOUNCEMENT", "ACTIVITY"]).optional(),   // Filter by material category
  sectionId: z.string().uuid().optional(),                                           // Filter by section UUID
  flightId: z.string().uuid().optional(),                                            // Filter by flight UUID
  page: z.string().optional(),                                                       // Page number for pagination
  pageSize: z.string().optional()                                                    // Items per page for pagination
})
