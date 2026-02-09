-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isImportedProfile" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mergedIntoUserId" TEXT,
ALTER COLUMN "email" DROP NOT NULL,
ALTER COLUMN "password" DROP NOT NULL;
