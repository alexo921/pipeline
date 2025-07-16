-- Add zipCode field to jobs table for better location matching
ALTER TABLE "jobs" ADD COLUMN "zipCode" TEXT;

-- Add index for faster ZIP code lookups
CREATE INDEX "jobs_zipCode_idx" ON "jobs"("zipCode"); 