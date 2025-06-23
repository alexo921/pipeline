-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CANDIDATE', 'EMPLOYER', 'ADMIN');

-- CreateEnum
CREATE TYPE "OnboardingStep" AS ENUM ('INITIAL_DETAILS', 'LOCATION_DETAILS', 'AVAILABILITY_DETAILS');

-- CreateEnum
CREATE TYPE "HealthcareRole" AS ENUM ('CNA', 'LPN', 'RN', 'PCA', 'HHA', 'OTHER');

-- CreateEnum
CREATE TYPE "CertificationStatus" AS ENUM ('Certified', 'NotCertified', 'Pending', 'Inprogress');

-- CreateEnum
CREATE TYPE "WorkType" AS ENUM ('FullTime', 'PartTime', 'PerDiem', 'LiveIn');

-- CreateEnum
CREATE TYPE "ShiftType" AS ENUM ('Day', 'Night', 'Weekend', 'Overnight', 'Flexible');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('WorkingFullTime', 'WorkingFullTimeAvailable', 'WorkingPartTimeAvailable', 'NotWorkingAvailable', 'NotWorkingOpenOffers');

-- CreateEnum
CREATE TYPE "WorkSettingExperience" AS ENUM ('LTC', 'HomeCare', 'Hospital', 'Rehab', 'StartingOut');

-- CreateEnum
CREATE TYPE "PreferredSetting" AS ENUM ('LTC', 'HomeCare', 'Hospital', 'Rehab', 'Open');

-- CreateEnum
CREATE TYPE "ThrivingFactor" AS ENUM ('FriendlyTeam', 'ClearOnboarding', 'FlexibleSchedule', 'HigherPay', 'ManageableLoad', 'CareerGrowth');

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" VARCHAR NOT NULL,
    "description" VARCHAR,
    "status" VARCHAR NOT NULL DEFAULT 'active',
    "startDate" DATE,
    "endDate" DATE,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "projectId" TEXT,
    "assignedToId" TEXT,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'CANDIDATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "healthcareRole" "HealthcareRole" NOT NULL,
    "certificationStatus" "CertificationStatus" NOT NULL,
    "zipCode" TEXT,
    "address" TEXT,
    "maxTravelDistance" INTEGER,
    "workType" "WorkType"[],
    "shiftType" "ShiftType"[],
    "currentJobStatus" "JobStatus",
    "step" "OnboardingStep" NOT NULL,
    "isOnboarded" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "hourlyRate" INTEGER,
    "yearlySalary" INTEGER,
    "payLocationBased" BOOLEAN NOT NULL DEFAULT false,
    "workSettingExperience" "WorkSettingExperience"[],
    "preferredSetting" "PreferredSetting"[],
    "thrivingFactors" "ThrivingFactor"[],
    "jobFrustationNotes" TEXT,
    "referredBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "experiences" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "employer" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "experiences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_role_key" ON "users"("email", "role");

-- CreateIndex
CREATE UNIQUE INDEX "candidates_email_key" ON "candidates"("email");

-- CreateIndex
CREATE UNIQUE INDEX "candidates_userId_key" ON "candidates"("userId");

-- CreateIndex
CREATE INDEX "candidates_email_name_idx" ON "candidates"("email", "name");

-- CreateIndex
CREATE UNIQUE INDEX "candidates_email_userId_key" ON "candidates"("email", "userId");

-- CreateIndex
CREATE INDEX "experiences_candidateId_idx" ON "experiences"("candidateId");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "experiences" ADD CONSTRAINT "experiences_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
