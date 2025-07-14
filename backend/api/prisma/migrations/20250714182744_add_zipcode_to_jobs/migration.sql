-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "zipCode" TEXT;

-- CreateIndex
CREATE INDEX "jobs_zipCode_idx" ON "jobs"("zipCode");
