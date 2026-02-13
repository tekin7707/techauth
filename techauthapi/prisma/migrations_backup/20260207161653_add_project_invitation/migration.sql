-- DropIndex
DROP INDEX "LoginHistory_userId_idx";

-- CreateTable
CREATE TABLE "ProjectInvitation" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "usedByProjectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectInvitation_key_key" ON "ProjectInvitation"("key");

-- CreateIndex
CREATE INDEX "ProjectInvitation_key_idx" ON "ProjectInvitation"("key");

-- CreateIndex
CREATE INDEX "ProjectInvitation_createdById_idx" ON "ProjectInvitation"("createdById");

-- AddForeignKey
ALTER TABLE "ProjectInvitation" ADD CONSTRAINT "ProjectInvitation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectInvitation" ADD CONSTRAINT "ProjectInvitation_usedByProjectId_fkey" FOREIGN KEY ("usedByProjectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;
