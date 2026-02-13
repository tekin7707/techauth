/*
  Warnings:

  - Added the required column `email` to the `ProjectInvitation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProjectInvitation" ADD COLUMN     "email" TEXT NOT NULL;
