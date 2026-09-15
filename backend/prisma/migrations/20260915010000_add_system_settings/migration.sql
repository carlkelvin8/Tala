-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- Seed the default grade computation configuration
INSERT INTO "SystemSetting" ("key", "value", "updatedAt")
VALUES ('gradeConfig', '{"passingGrade": 75, "computationMode": "weighted"}', NOW())
ON CONFLICT ("key") DO NOTHING;