-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'SUBADMIN', 'USER');

-- CreateEnum
CREATE TYPE "UserType" AS ENUM ('RECEPTOR', 'EMISOR');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullname" TEXT NOT NULL,
    "address" TEXT,
    "dni" TEXT,
    "cuit" TEXT,
    "role" "Role" NOT NULL,
    "userType" "UserType",
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerificationToken" TEXT,
    "emailVerificationExpires" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
