/*
  Warnings:

  - You are about to drop the column `destination` on the `Quote` table. All the data in the column will be lost.
  - You are about to drop the column `pdfUrl` on the `Quote` table. All the data in the column will be lost.
  - You are about to drop the column `priceChd` on the `Quote` table. All the data in the column will be lost.
  - You are about to drop the column `priceDbl` on the `Quote` table. All the data in the column will be lost.
  - You are about to drop the column `rawData` on the `Quote` table. All the data in the column will be lost.
  - You are about to drop the column `whatsappMsg` on the `Quote` table. All the data in the column will be lost.
  - Added the required column `costPrice` to the `Quote` table without a default value. This is not possible if the table is not empty.
  - Added the required column `salePrice` to the `Quote` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Opportunity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "contactId" TEXT NOT NULL,
    "stageId" TEXT NOT NULL,
    "agentId" TEXT,
    "destination" TEXT,
    "mayorista" TEXT,
    "travelStart" DATETIME,
    "travelEnd" DATETIME,
    "checkIn" DATETIME,
    "checkOut" DATETIME,
    "estimatedValue" REAL,
    "currency" TEXT NOT NULL DEFAULT 'DOP',
    "isInternational" BOOLEAN NOT NULL DEFAULT false,
    "intlChecklist" TEXT NOT NULL DEFAULT '{}',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Opportunity_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Opportunity_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "PipelineStage" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Opportunity_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Opportunity" ("agentId", "contactId", "createdAt", "currency", "destination", "estimatedValue", "id", "mayorista", "notes", "stageId", "travelEnd", "travelStart", "updatedAt") SELECT "agentId", "contactId", "createdAt", "currency", "destination", "estimatedValue", "id", "mayorista", "notes", "stageId", "travelEnd", "travelStart", "updatedAt" FROM "Opportunity";
DROP TABLE "Opportunity";
ALTER TABLE "new_Opportunity" RENAME TO "Opportunity";
CREATE TABLE "new_Quote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "opportunityId" TEXT,
    "label" TEXT NOT NULL DEFAULT 'Cotización 1',
    "tipo" TEXT NOT NULL DEFAULT 'PLATAFORMA',
    "mayorista" TEXT NOT NULL,
    "hotelName" TEXT NOT NULL,
    "description" TEXT,
    "checkIn" DATETIME,
    "checkOut" DATETIME,
    "nights" INTEGER,
    "adults" INTEGER NOT NULL DEFAULT 1,
    "children" INTEGER NOT NULL DEFAULT 0,
    "costPrice" REAL NOT NULL,
    "salePrice" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "exchangeRate" REAL NOT NULL DEFAULT 62,
    "isSelected" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Quote_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Quote" ("adults", "checkIn", "checkOut", "children", "createdAt", "currency", "exchangeRate", "hotelName", "id", "mayorista", "nights", "opportunityId", "updatedAt") SELECT "adults", "checkIn", "checkOut", "children", "createdAt", "currency", "exchangeRate", "hotelName", "id", "mayorista", "nights", "opportunityId", "updatedAt" FROM "Quote";
DROP TABLE "Quote";
ALTER TABLE "new_Quote" RENAME TO "Quote";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
