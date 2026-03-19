// Import the Zod validation library for schema definition and parsing
import { z } from "zod"

/* Schema for query parameters when generating enrollment reports */
export const reportQuerySchema = z.object({
  from: z.string().optional(),                  // Optional start date for the report range (ISO date string)
  to: z.string().optional(),                    // Optional end date for the report range (ISO date string)
  sectionId: z.string().uuid().optional(),      // Optional UUID to filter the report by section
  flightId: z.string().uuid().optional()        // Optional UUID to filter the report by flight/group
})
