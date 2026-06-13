-- CreateTable
CREATE TABLE "CommissionRate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "rate" REAL NOT NULL DEFAULT 5,
    "type" TEXT NOT NULL DEFAULT 'AGENTE',
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CommissionRate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CommissionRate_userId_key" ON "CommissionRate"("userId");
