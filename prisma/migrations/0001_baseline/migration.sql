Loaded Prisma config from prisma.config.ts.

-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "shareToken" TEXT,
    "shareTokenExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerNote" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,

    CONSTRAINT "PartnerNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_email_key" ON "Account"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_shareToken_key" ON "Partner"("shareToken");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_ownerId_name_key" ON "Partner"("ownerId", "name");

-- CreateIndex
CREATE INDEX "Transaction_ownerId_idx" ON "Transaction"("ownerId");

-- CreateIndex
CREATE INDEX "Transaction_partnerId_idx" ON "Transaction"("partnerId");

-- CreateIndex
CREATE INDEX "Transaction_date_idx" ON "Transaction"("date");

-- CreateIndex
CREATE INDEX "PartnerNote_partnerId_idx" ON "PartnerNote"("partnerId");

-- CreateIndex
CREATE INDEX "PartnerNote_ownerId_idx" ON "PartnerNote"("ownerId");

-- AddForeignKey
ALTER TABLE "Partner" ADD CONSTRAINT "Partner_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerNote" ADD CONSTRAINT "PartnerNote_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerNote" ADD CONSTRAINT "PartnerNote_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE CASCADE ON UPDATE CASCADE;

