/* Parse pagination parameters from a query string object and return safe, bounded values */
export function getPagination(query: Record<string, string | undefined>) {
  // Parse the 'page' query param as a number; default to 1 if missing; clamp to minimum of 1
  const page = Math.max(1, Number(query.page ?? 1))
  // Parse 'pageSize'; default to 20; clamp between 1 and 100 to prevent abuse
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize ?? 20)))
  // Calculate the number of records to skip for the current page (0-based offset)
  const skip = (page - 1) * pageSize
  // Return all four values: current page, page size, skip offset, and take count
  return { page, pageSize, skip, take: pageSize }
}
