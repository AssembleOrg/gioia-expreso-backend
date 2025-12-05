-- CreateEnum
CREATE TYPE "PackageTypeEnum" AS ENUM ('BULTO', 'BAG_20X32', 'BAG_30X41', 'BAG_42X54', 'BAG_70X80');

-- CreateEnum
CREATE TYPE "PreorderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "fullname" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "cuit" TEXT,
    "address" TEXT NOT NULL,
    "quantityVouchers" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PackageTypeEnum" NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "depth" DOUBLE PRECISION NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "imageUrl" TEXT,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "package_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preorders" (
    "id" TEXT NOT NULL,
    "voucherNumber" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "originPostal" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "destinationPostal" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "status" "PreorderStatus" NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "pdfUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "preorders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "preorder_packages" (
    "id" TEXT NOT NULL,
    "preorderId" TEXT NOT NULL,
    "packageTypeId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION,
    "width" DOUBLE PRECISION,
    "depth" DOUBLE PRECISION,
    "declaredValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "preorder_packages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clients_email_key" ON "clients"("email");

-- CreateIndex
CREATE UNIQUE INDEX "package_types_name_key" ON "package_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "package_types_type_key" ON "package_types"("type");

-- CreateIndex
CREATE UNIQUE INDEX "preorders_voucherNumber_key" ON "preorders"("voucherNumber");

-- AddForeignKey
ALTER TABLE "preorders" ADD CONSTRAINT "preorders_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preorder_packages" ADD CONSTRAINT "preorder_packages_preorderId_fkey" FOREIGN KEY ("preorderId") REFERENCES "preorders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "preorder_packages" ADD CONSTRAINT "preorder_packages_packageTypeId_fkey" FOREIGN KEY ("packageTypeId") REFERENCES "package_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
