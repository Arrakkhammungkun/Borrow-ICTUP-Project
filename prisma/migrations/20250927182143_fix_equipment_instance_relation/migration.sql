/*
  Warnings:

  - You are about to drop the column `state` on the `Equipment` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."BorrowingStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'BORROWED', 'RETURNED', 'OVERDUE');

-- CreateEnum
CREATE TYPE "public"."ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."EquipmentStatus" ADD VALUE 'IN_USE';
ALTER TYPE "public"."EquipmentStatus" ADD VALUE 'BROKEN';
ALTER TYPE "public"."EquipmentStatus" ADD VALUE 'LOST';

-- AlterTable
ALTER TABLE "public"."Equipment" DROP COLUMN "state",
ADD COLUMN     "availableQuantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "brokenQuantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "inUseQuantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isIndividual" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lostQuantity" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "serialNumber" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."Borrowing" (
    "id" SERIAL NOT NULL,
    "borrowerId" INTEGER NOT NULL,
    "borrowedDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "returnedDate" TIMESTAMP(3),
    "status" "public"."BorrowingStatus" NOT NULL DEFAULT 'PENDING',
    "requestedStartDate" TIMESTAMP(3),
    "location" TEXT,
    "reason" TEXT,
    "borrower_title" TEXT,
    "borrower_firstname" TEXT,
    "borrower_lastname" TEXT,
    "borrower_position" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "returnStatusColor" TEXT,

    CONSTRAINT "Borrowing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."BorrowingDetail" (
    "id" SERIAL NOT NULL,
    "borrowingId" INTEGER NOT NULL,
    "equipmentId" INTEGER NOT NULL,
    "equipmentInstanceId" INTEGER,
    "quantityBorrowed" INTEGER NOT NULL DEFAULT 1,
    "quantityReturned" INTEGER NOT NULL DEFAULT 0,
    "quantityLost" INTEGER NOT NULL DEFAULT 0,
    "conditionAfterReturn" TEXT,
    "note" TEXT,
    "department" TEXT,
    "approvalStatus" "public"."ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "approvedAt" TIMESTAMP(3),
    "approvedById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BorrowingDetail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ReturnHistory" (
    "id" SERIAL NOT NULL,
    "borrowingDetailId" INTEGER NOT NULL,
    "complete" INTEGER NOT NULL,
    "incomplete" INTEGER NOT NULL,
    "lost" INTEGER NOT NULL,
    "note" TEXT,
    "returnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReturnHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."EquipmentInstance" (
    "id" SERIAL NOT NULL,
    "equipmentId" INTEGER NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "status" "public"."EquipmentStatus" NOT NULL DEFAULT 'AVAILABLE',
    "location" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EquipmentInstance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EquipmentInstance_serialNumber_key" ON "public"."EquipmentInstance"("serialNumber");

-- AddForeignKey
ALTER TABLE "public"."Borrowing" ADD CONSTRAINT "Borrowing_borrowerId_fkey" FOREIGN KEY ("borrowerId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BorrowingDetail" ADD CONSTRAINT "BorrowingDetail_borrowingId_fkey" FOREIGN KEY ("borrowingId") REFERENCES "public"."Borrowing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BorrowingDetail" ADD CONSTRAINT "BorrowingDetail_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "public"."Equipment"("equipment_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BorrowingDetail" ADD CONSTRAINT "BorrowingDetail_equipmentInstanceId_fkey" FOREIGN KEY ("equipmentInstanceId") REFERENCES "public"."EquipmentInstance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."BorrowingDetail" ADD CONSTRAINT "BorrowingDetail_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ReturnHistory" ADD CONSTRAINT "ReturnHistory_borrowingDetailId_fkey" FOREIGN KEY ("borrowingDetailId") REFERENCES "public"."BorrowingDetail"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."EquipmentInstance" ADD CONSTRAINT "EquipmentInstance_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "public"."Equipment"("equipment_id") ON DELETE CASCADE ON UPDATE CASCADE;
