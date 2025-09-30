/*
  Warnings:

  - You are about to drop the column `complete` on the `ReturnHistory` table. All the data in the column will be lost.
  - You are about to drop the column `incomplete` on the `ReturnHistory` table. All the data in the column will be lost.
  - You are about to drop the column `lost` on the `ReturnHistory` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Borrowing" ADD COLUMN     "returnNote" TEXT;

-- AlterTable
ALTER TABLE "public"."ReturnHistory" DROP COLUMN "complete",
DROP COLUMN "incomplete",
DROP COLUMN "lost",
ADD COLUMN     "condition" TEXT,
ADD COLUMN     "equipmentInstanceId" INTEGER;

-- AddForeignKey
ALTER TABLE "public"."ReturnHistory" ADD CONSTRAINT "ReturnHistory_equipmentInstanceId_fkey" FOREIGN KEY ("equipmentInstanceId") REFERENCES "public"."EquipmentInstance"("id") ON DELETE SET NULL ON UPDATE CASCADE;
