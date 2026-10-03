ALTER TABLE "Announcement" ADD COLUMN     "eventDate" TIMESTAMP(3);
ALTER TABLE "LearningMaterial" ADD COLUMN     "program" "NstpType";
CREATE INDEX "Announcement_eventDate_idx" ON "Announcement"("eventDate");
CREATE INDEX "LearningMaterial_program_idx" ON "LearningMaterial"("program");
