/*
  Warnings:

  - You are about to drop the column `insuranceInfo` on the `Billing` table. All the data in the column will be lost.
  - You are about to drop the column `paidDate` on the `Billing` table. All the data in the column will be lost.
  - You are about to drop the column `therapistId` on the `Billing` table. All the data in the column will be lost.
  - The `status` column on the `Billing` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `address` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `dateOfBirth` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `emergencyContact` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `firstName` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `lastName` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `phoneNumber` on the `Client` table. All the data in the column will be lost.
  - The `status` column on the `Client` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `therapistId` on the `Session` table. All the data in the column will be lost.
  - The `status` column on the `Session` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `completedDate` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `goalId` on the `Task` table. All the data in the column will be lost.
  - The `status` column on the `Task` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Diagnosis` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Goal` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Note` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Profile` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TreatmentPlan` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `dueDate` on table `Task` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Billing" DROP CONSTRAINT "Billing_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Billing" DROP CONSTRAINT "Billing_therapistId_fkey";

-- DropForeignKey
ALTER TABLE "Client" DROP CONSTRAINT "Client_therapistId_fkey";

-- DropForeignKey
ALTER TABLE "Diagnosis" DROP CONSTRAINT "Diagnosis_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Diagnosis" DROP CONSTRAINT "Diagnosis_therapistId_fkey";

-- DropForeignKey
ALTER TABLE "Goal" DROP CONSTRAINT "Goal_treatmentPlanId_fkey";

-- DropForeignKey
ALTER TABLE "Note" DROP CONSTRAINT "Note_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Note" DROP CONSTRAINT "Note_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "Note" DROP CONSTRAINT "Note_therapistId_fkey";

-- DropForeignKey
ALTER TABLE "Profile" DROP CONSTRAINT "Profile_userId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_therapistId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_clientId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_goalId_fkey";

-- DropForeignKey
ALTER TABLE "TreatmentPlan" DROP CONSTRAINT "TreatmentPlan_clientId_fkey";

-- DropForeignKey
ALTER TABLE "TreatmentPlan" DROP CONSTRAINT "TreatmentPlan_therapistId_fkey";

-- AlterTable
ALTER TABLE "Billing" DROP COLUMN "insuranceInfo",
DROP COLUMN "paidDate",
DROP COLUMN "therapistId",
ADD COLUMN     "invoiceNumber" TEXT,
ALTER COLUMN "date" DROP DEFAULT,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Pending';

-- AlterTable
ALTER TABLE "Client" DROP COLUMN "address",
DROP COLUMN "dateOfBirth",
DROP COLUMN "email",
DROP COLUMN "emergencyContact",
DROP COLUMN "firstName",
DROP COLUMN "lastName",
DROP COLUMN "phoneNumber",
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'ACTIVE',
ALTER COLUMN "therapistId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "therapistId",
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "type" TEXT,
ALTER COLUMN "endTime" DROP NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Scheduled';

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "completedDate",
DROP COLUMN "goalId",
ADD COLUMN     "assignedTo" TEXT,
ADD COLUMN     "priority" TEXT NOT NULL DEFAULT 'Medium',
ALTER COLUMN "dueDate" SET NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'Pending',
ALTER COLUMN "clientId" DROP NOT NULL;

-- DropTable
DROP TABLE "Diagnosis";

-- DropTable
DROP TABLE "Goal";

-- DropTable
DROP TABLE "Note";

-- DropTable
DROP TABLE "Profile";

-- DropTable
DROP TABLE "TreatmentPlan";

-- DropTable
DROP TABLE "User";

-- DropEnum
DROP TYPE "BillingStatus";

-- DropEnum
DROP TYPE "ClientStatus";

-- DropEnum
DROP TYPE "DiagnosisStatus";

-- DropEnum
DROP TYPE "GoalStatus";

-- DropEnum
DROP TYPE "NoteType";

-- DropEnum
DROP TYPE "PlanStatus";

-- DropEnum
DROP TYPE "Role";

-- DropEnum
DROP TYPE "SessionStatus";

-- DropEnum
DROP TYPE "TaskStatus";

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "notes" TEXT,
    "type" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Scheduled',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Billing" ADD CONSTRAINT "Billing_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
