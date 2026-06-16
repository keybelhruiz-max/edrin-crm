-- CreateEnum
CREATE TYPE "StudioMediaType" AS ENUM ('IMAGE', 'VIDEO');

-- StudioProfile
CREATE TABLE "StudioProfile" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Keybelh Ruiz',
    "role" TEXT NOT NULL DEFAULT 'Diseñador & Creador Digital',
    "tagline" TEXT,
    "bio" TEXT,
    "avatarUrl" TEXT,
    "heroImageUrl" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "instagram" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StudioProfile_pkey" PRIMARY KEY ("id")
);

-- PortfolioItem
CREATE TABLE "PortfolioItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'Branding',
    "mediaType" "StudioMediaType" NOT NULL DEFAULT 'IMAGE',
    "mediaUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PortfolioItem_pkey" PRIMARY KEY ("id")
);

-- StudioClient
CREATE TABLE "StudioClient" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StudioClient_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "StudioClient_slug_key" ON "StudioClient"("slug");

-- StudioGalleryItem
CREATE TABLE "StudioGalleryItem" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mediaType" "StudioMediaType" NOT NULL DEFAULT 'IMAGE',
    "size" INTEGER,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudioGalleryItem_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "StudioGalleryItem" ADD CONSTRAINT "StudioGalleryItem_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "StudioClient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- StudioLinkItem
CREATE TABLE "StudioLinkItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "icon" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "StudioLinkItem_pkey" PRIMARY KEY ("id")
);
