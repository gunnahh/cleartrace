-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('RESEARCHER', 'ADMIN');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('DRAFT', 'IN_PROGRESS', 'READY_TO_SUBMIT', 'SUBMITTED');

-- CreateEnum
CREATE TYPE "TargetType" AS ENUM ('COMPANY', 'DIRECTOR', 'SHAREHOLDER', 'PARENT_COMPANY', 'SUBSIDIARY');

-- CreateEnum
CREATE TYPE "CheckCategory" AS ENUM ('CIVIL', 'CRIMINAL', 'BANKRUPTCY', 'REHABILITATION', 'MEDIA');

-- CreateEnum
CREATE TYPE "CheckStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'MATCH_FOUND', 'NO_RESULT');

-- CreateEnum
CREATE TYPE "AttemptResult" AS ENUM ('MATCH_FOUND', 'NO_RESULT');

-- CreateEnum
CREATE TYPE "Sentiment" AS ENUM ('POSITIVE', 'NEUTRAL', 'NEGATIVE');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'RESEARCHER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" UUID NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'DRAFT',
    "researcherId" UUID NOT NULL,
    "dueDate" DATE NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyProfile" (
    "id" UUID NOT NULL,
    "assignmentId" UUID NOT NULL,
    "registeredNameTh" TEXT NOT NULL,
    "registeredNameEn" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "registrationDate" DATE NOT NULL,
    "businessType" TEXT NOT NULL,
    "registeredAddress" TEXT NOT NULL,
    "sourceReference" TEXT NOT NULL,

    CONSTRAINT "CompanyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchTarget" (
    "id" UUID NOT NULL,
    "assignmentId" UUID NOT NULL,
    "type" "TargetType" NOT NULL,
    "nameTh" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "identifier" TEXT,
    "notes" TEXT,

    CONSTRAINT "ResearchTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResearchCheck" (
    "id" UUID NOT NULL,
    "targetId" UUID NOT NULL,
    "category" "CheckCategory" NOT NULL,
    "status" "CheckStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "conclusion" TEXT,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ResearchCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SearchAttempt" (
    "id" UUID NOT NULL,
    "researchCheckId" UUID NOT NULL,
    "sourceName" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "queryText" TEXT NOT NULL,
    "searchedAt" TIMESTAMP(3) NOT NULL,
    "result" "AttemptResult" NOT NULL,

    CONSTRAINT "SearchAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenceFile" (
    "id" UUID NOT NULL,
    "searchAttemptId" UUID NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "caption" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvidenceFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalCase" (
    "id" UUID NOT NULL,
    "researchCheckId" UUID NOT NULL,
    "caseType" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "courtName" TEXT NOT NULL,
    "plaintiff" TEXT NOT NULL,
    "defendant" TEXT NOT NULL,
    "filingDate" DATE NOT NULL,
    "judgmentDate" DATE,
    "caseStatus" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,

    CONSTRAINT "LegalCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaFinding" (
    "id" UUID NOT NULL,
    "researchCheckId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "publisher" TEXT NOT NULL,
    "publishedAt" DATE NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sentiment" "Sentiment" NOT NULL,
    "summary" TEXT NOT NULL,

    CONSTRAINT "MediaFinding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" UUID NOT NULL,
    "assignmentId" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshotJson" JSONB NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL,
    "submittedById" UUID NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Assignment_referenceNumber_key" ON "Assignment"("referenceNumber");

-- CreateIndex
CREATE INDEX "Assignment_status_dueDate_idx" ON "Assignment"("status", "dueDate");

-- CreateIndex
CREATE INDEX "Assignment_researcherId_createdAt_idx" ON "Assignment"("researcherId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyProfile_assignmentId_key" ON "CompanyProfile"("assignmentId");

-- CreateIndex
CREATE INDEX "CompanyProfile_registrationNumber_idx" ON "CompanyProfile"("registrationNumber");

-- CreateIndex
CREATE INDEX "ResearchTarget_assignmentId_type_idx" ON "ResearchTarget"("assignmentId", "type");

-- CreateIndex
CREATE INDEX "ResearchTarget_identifier_idx" ON "ResearchTarget"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "ResearchCheck_targetId_category_key" ON "ResearchCheck"("targetId", "category");

-- CreateIndex
CREATE INDEX "SearchAttempt_researchCheckId_searchedAt_idx" ON "SearchAttempt"("researchCheckId", "searchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "EvidenceFile_storageKey_key" ON "EvidenceFile"("storageKey");

-- CreateIndex
CREATE INDEX "LegalCase_researchCheckId_caseNumber_idx" ON "LegalCase"("researchCheckId", "caseNumber");

-- CreateIndex
CREATE INDEX "MediaFinding_researchCheckId_sentiment_idx" ON "MediaFinding"("researchCheckId", "sentiment");

-- CreateIndex
CREATE INDEX "Report_submittedAt_idx" ON "Report"("submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Report_assignmentId_version_key" ON "Report"("assignmentId", "version");

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_researcherId_fkey" FOREIGN KEY ("researcherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyProfile" ADD CONSTRAINT "CompanyProfile_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchTarget" ADD CONSTRAINT "ResearchTarget_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResearchCheck" ADD CONSTRAINT "ResearchCheck_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "ResearchTarget"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SearchAttempt" ADD CONSTRAINT "SearchAttempt_researchCheckId_fkey" FOREIGN KEY ("researchCheckId") REFERENCES "ResearchCheck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenceFile" ADD CONSTRAINT "EvidenceFile_searchAttemptId_fkey" FOREIGN KEY ("searchAttemptId") REFERENCES "SearchAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalCase" ADD CONSTRAINT "LegalCase_researchCheckId_fkey" FOREIGN KEY ("researchCheckId") REFERENCES "ResearchCheck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaFinding" ADD CONSTRAINT "MediaFinding_researchCheckId_fkey" FOREIGN KEY ("researchCheckId") REFERENCES "ResearchCheck"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
