import { PrismaClient, RoleType, EnrollmentStatus, MaterialCategory } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

const password = "Password123!"

async function main() {
  const passwordHash = await bcrypt.hash(password, 10)

  const admin = await prisma.user.upsert({
    where: { email: "admin@nstp.local" },
    update: {},
    create: { email: "admin@nstp.local", passwordHash, role: RoleType.ADMIN }
  })

  const implementor = await prisma.user.upsert({
    where: { email: "implementor@nstp.local" },
    update: {},
    create: { email: "implementor@nstp.local", passwordHash, role: RoleType.IMPLEMENTOR }
  })

  const cadet = await prisma.user.upsert({
    where: { email: "cadet@nstp.local" },
    update: {},
    create: { email: "cadet@nstp.local", passwordHash, role: RoleType.CADET_OFFICER }
  })

  const student = await prisma.user.upsert({
    where: { email: "student@nstp.local" },
    update: {},
    create: { email: "student@nstp.local", passwordHash, role: RoleType.STUDENT }
  })

  await prisma.studentProfile.upsert({
    where: { userId: student.id },
    update: {},
    create: {
      userId: student.id,
      firstName: "Juan",
      lastName: "Dela Cruz"
    }
  })

  await prisma.implementorProfile.upsert({
    where: { userId: implementor.id },
    update: {},
    create: { userId: implementor.id, firstName: "Maria", lastName: "Santos" }
  })

  await prisma.cadetOfficerProfile.upsert({
    where: { userId: cadet.id },
    update: {},
    create: { userId: cadet.id, firstName: "Mark", lastName: "Reyes" }
  })

  const section = await prisma.section.upsert({
    where: { code: "CWTS-SEC-A" },
    update: {},
    create: { code: "CWTS-SEC-A", name: "CWTS Section A" }
  })

  const flight = await prisma.flight.upsert({
    where: { code: "ROTC-FLT-1" },
    update: {},
    create: { code: "ROTC-FLT-1", name: "ROTC Flight 1" }
  })

  await prisma.enrollment.create({
    data: { userId: student.id, sectionId: section.id, status: EnrollmentStatus.APPROVED }
  })

  await prisma.learningMaterial.create({
    data: {
      title: "NSTP Orientation",
      description: "Welcome module",
      category: MaterialCategory.MODULE,
      createdById: implementor.id,
      sectionId: section.id
    }
  })

  await prisma.auditLog.create({
    data: { actorId: admin.id, action: "SEED", entity: "System", entityId: admin.id }
  })
}

main()
  .catch(async (error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
