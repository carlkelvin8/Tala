import { Badge } from "./badge"

type Status = "PENDING" | "APPROVED" | "REJECTED" | "PRESENT" | "LATE" | "ABSENT" | "MERIT" | "DEMERIT" | "ACTIVE" | "INACTIVE"

export function StatusBadge({ status }: { status: Status | string }) {
  const value = status.toString()
  if (value === "APPROVED" || value === "PRESENT" || value === "MERIT" || value === "ACTIVE") {
    return <Badge variant="success">{value}</Badge>
  }
  if (value === "PENDING" || value === "LATE") {
    return <Badge variant="warning">{value}</Badge>
  }
  if (value === "REJECTED" || value === "DEMERIT" || value === "INACTIVE") {
    return <Badge variant="danger">{value}</Badge>
  }
  return <Badge variant="default">{value}</Badge>
}
