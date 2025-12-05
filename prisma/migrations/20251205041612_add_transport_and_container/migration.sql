-- CreateEnum
CREATE TYPE "ContainerStatus" AS ENUM ('ON_LOAD', 'TRAVELLING', 'ARRIVED');

-- CreateTable
CREATE TABLE "transports" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "licensePlate" TEXT NOT NULL,
    "available" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "transports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "containers" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "transportId" TEXT,
    "status" "ContainerStatus" NOT NULL DEFAULT 'ON_LOAD',
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "containers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "container_preorders" (
    "id" TEXT NOT NULL,
    "containerId" TEXT NOT NULL,
    "preorderId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "container_preorders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "transports_licensePlate_key" ON "transports"("licensePlate");

-- CreateIndex
CREATE UNIQUE INDEX "containers_code_key" ON "containers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "container_preorders_containerId_preorderId_key" ON "container_preorders"("containerId", "preorderId");

-- AddForeignKey
ALTER TABLE "containers" ADD CONSTRAINT "containers_transportId_fkey" FOREIGN KEY ("transportId") REFERENCES "transports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "container_preorders" ADD CONSTRAINT "container_preorders_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "containers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "container_preorders" ADD CONSTRAINT "container_preorders_preorderId_fkey" FOREIGN KEY ("preorderId") REFERENCES "preorders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
