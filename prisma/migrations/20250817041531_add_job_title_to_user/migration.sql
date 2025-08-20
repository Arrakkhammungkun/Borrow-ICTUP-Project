/*
  Warnings:

  - You are about to drop the column `faculty` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `User` table. All the data in the column will be lost.
  - Added the required column `feature` to the `Equipment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ownerId` to the `Equipment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Equipment" ADD COLUMN     "feature" TEXT NOT NULL,
ADD COLUMN     "ownerId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "faculty",
DROP COLUMN "phone",
ADD COLUMN     "displayName" TEXT,
ADD COLUMN     "jobTitle" TEXT,
ADD COLUMN     "mobilePhone" TEXT,
ADD COLUMN     "officeLocation" TEXT,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AddForeignKey
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
