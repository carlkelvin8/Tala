-- AlterTable
ALTER TABLE "Announcement" ADD COLUMN "program" "NstpType";
ALTER TABLE "Announcement" ADD COLUMN "createdById" TEXT;

-- CreateIndex
CREATE INDEX "Announcement_program_idx" ON "Announcement"("program");
CREATE INDEX "Announcement_createdAt_idx" ON "Announcement"("createdAt");

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;