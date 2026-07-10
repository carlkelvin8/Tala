import { prisma } from "../lib/prisma.js"
import { logAudit } from "./auditService.js"

export async function addRemark(userId: string, remark: string, createdBy: string) {
  const record = await prisma.instructorRemark.create({
    data: { userId, remark, createdBy }
  })
  await logAudit("CREATE", "InstructorRemark", record.id, createdBy)
  return record
}

export async function getRemarksForStudent(userId: string, skip: number, take: number) {
  const [items, total] = await Promise.all([
    prisma.instructorRemark.findMany({
      where: { userId },
      skip, take,
      include: {
        author: {
          select: { id: true, email: true, implementorProfile: { select: { firstName: true, lastName: true } } }
        }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.instructorRemark.count({ where: { userId } })
  ])
  return { items, total }
}

export async function addRecordRemark(recordId: string, remarks: string) {
  const record = await prisma.attendanceRecord.update({
    where: { id: recordId },
    data: { remarks }
  })
  await logAudit("UPDATE", "AttendanceRecord", recordId)
  return record
}
