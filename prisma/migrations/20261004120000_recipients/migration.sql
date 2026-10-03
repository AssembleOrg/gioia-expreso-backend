-- CreateTable
CREATE TABLE "recipients" (
    "id" TEXT NOT NULL,
    "fullname" TEXT NOT NULL,
    "dni" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT NOT NULL,
    "city" TEXT,
    "province" TEXT,
    "postalCode" TEXT,
    "notes" TEXT,
    "clientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "recipients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recipients_fullname_idx" ON "recipients"("fullname");

-- CreateIndex
CREATE INDEX "recipients_dni_idx" ON "recipients"("dni");

-- AddForeignKey
ALTER TABLE "recipients" ADD CONSTRAINT "recipients_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

