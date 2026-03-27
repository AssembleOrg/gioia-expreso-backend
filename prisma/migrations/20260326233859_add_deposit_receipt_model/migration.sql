-- CreateTable
CREATE TABLE "DepositReceipt" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "cuit" TEXT,
    "dni" TEXT,
    "email" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "timeEstimated" TIMESTAMP(3) NOT NULL,
    "valueAprox" DECIMAL(65,30),
    "price" DECIMAL(65,30) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DepositReceipt_pkey" PRIMARY KEY ("id")
);
