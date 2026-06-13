-- CreateTable Agency
CREATE TABLE "Agency" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#E8610A',
    "secondaryColor" TEXT NOT NULL DEFAULT '#1A1A2E',
    "plan" TEXT NOT NULL DEFAULT 'STARTER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "billingName" TEXT,
    "billingRnc" TEXT,
    "billingAddress" TEXT,
    "billingEmail" TEXT,
    "billingPhone" TEXT,
    "exchangeRateDOP" DOUBLE PRECISION NOT NULL DEFAULT 62,
    "exchangeRateUSD" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "mayoristas" TEXT NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Agency_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Agency_slug_key" ON "Agency"("slug");

-- Seed default agency (all existing data will belong to this agency)
INSERT INTO "Agency" ("id","name","slug","primaryColor","secondaryColor","plan","isActive","exchangeRateDOP","exchangeRateUSD","mayoristas","createdAt","updatedAt")
VALUES ('agency_default','Mi Agencia','default','#E8610A','#1A1A2E','STARTER',true,62,1,'[]',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);

-- Add SUPERADMIN to Role enum
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'SUPERADMIN';

-- Add agencyId columns (nullable so existing rows don't break)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "agencyId" TEXT;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "agencyId" TEXT;
ALTER TABLE "Opportunity" ADD COLUMN IF NOT EXISTS "agencyId" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "agencyId" TEXT;
ALTER TABLE "SupplierOrder" ADD COLUMN IF NOT EXISTS "agencyId" TEXT;
ALTER TABLE "GroupBlock" ADD COLUMN IF NOT EXISTS "agencyId" TEXT;
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "agencyId" TEXT;
ALTER TABLE "PaymentLog" ADD COLUMN IF NOT EXISTS "agencyId" TEXT;
ALTER TABLE "PaymentMethodConfig" ADD COLUMN IF NOT EXISTS "agencyId" TEXT;
ALTER TABLE "PipelineStage" ADD COLUMN IF NOT EXISTS "agencyId" TEXT;
ALTER TABLE "Credit" ADD COLUMN IF NOT EXISTS "agencyId" TEXT;
ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "agencyId" TEXT;
ALTER TABLE "SocialAccount" ADD COLUMN IF NOT EXISTS "agencyId" TEXT;
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "agencyId" TEXT;
ALTER TABLE "SalesGoal" ADD COLUMN IF NOT EXISTS "agencyId" TEXT;
ALTER TABLE "AutomationRule" ADD COLUMN IF NOT EXISTS "agencyId" TEXT;
ALTER TABLE "MediaAsset" ADD COLUMN IF NOT EXISTS "agencyId" TEXT;
ALTER TABLE "AiConversation" ADD COLUMN IF NOT EXISTS "agencyId" TEXT;

-- AppConfig: drop old unique on key, add agencyId, add new unique
ALTER TABLE "AppConfig" ADD COLUMN IF NOT EXISTS "agencyId" TEXT;
DROP INDEX IF EXISTS "AppConfig_key_key";
CREATE UNIQUE INDEX "AppConfig_agencyId_key_key" ON "AppConfig"("agencyId","key");

-- SalesGoal: drop old unique, add new with agencyId
DROP INDEX IF EXISTS "SalesGoal_month_userId_key";
CREATE UNIQUE INDEX "SalesGoal_agencyId_month_userId_key" ON "SalesGoal"("agencyId","month","userId");

-- Populate all existing records with the default agency
UPDATE "User" SET "agencyId" = 'agency_default' WHERE "agencyId" IS NULL;
UPDATE "Contact" SET "agencyId" = 'agency_default' WHERE "agencyId" IS NULL;
UPDATE "Opportunity" SET "agencyId" = 'agency_default' WHERE "agencyId" IS NULL;
UPDATE "Invoice" SET "agencyId" = 'agency_default' WHERE "agencyId" IS NULL;
UPDATE "SupplierOrder" SET "agencyId" = 'agency_default' WHERE "agencyId" IS NULL;
UPDATE "GroupBlock" SET "agencyId" = 'agency_default' WHERE "agencyId" IS NULL;
UPDATE "Task" SET "agencyId" = 'agency_default' WHERE "agencyId" IS NULL;
UPDATE "PaymentLog" SET "agencyId" = 'agency_default' WHERE "agencyId" IS NULL;
UPDATE "PaymentMethodConfig" SET "agencyId" = 'agency_default' WHERE "agencyId" IS NULL;
UPDATE "PipelineStage" SET "agencyId" = 'agency_default' WHERE "agencyId" IS NULL;
UPDATE "Credit" SET "agencyId" = 'agency_default' WHERE "agencyId" IS NULL;
UPDATE "Expense" SET "agencyId" = 'agency_default' WHERE "agencyId" IS NULL;
UPDATE "SocialAccount" SET "agencyId" = 'agency_default' WHERE "agencyId" IS NULL;
UPDATE "Campaign" SET "agencyId" = 'agency_default' WHERE "agencyId" IS NULL;
UPDATE "SalesGoal" SET "agencyId" = 'agency_default' WHERE "agencyId" IS NULL;
UPDATE "AutomationRule" SET "agencyId" = 'agency_default' WHERE "agencyId" IS NULL;
UPDATE "MediaAsset" SET "agencyId" = 'agency_default' WHERE "agencyId" IS NULL;
UPDATE "AppConfig" SET "agencyId" = 'agency_default' WHERE "agencyId" IS NULL;
UPDATE "AiConversation" SET "agencyId" = 'agency_default' WHERE "agencyId" IS NULL;

-- Add foreign key constraints
ALTER TABLE "User" ADD CONSTRAINT "User_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SupplierOrder" ADD CONSTRAINT "SupplierOrder_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "GroupBlock" ADD CONSTRAINT "GroupBlock_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaymentLog" ADD CONSTRAINT "PaymentLog_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaymentMethodConfig" ADD CONSTRAINT "PaymentMethodConfig_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PipelineStage" ADD CONSTRAINT "PipelineStage_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Credit" ADD CONSTRAINT "Credit_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SocialAccount" ADD CONSTRAINT "SocialAccount_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SalesGoal" ADD CONSTRAINT "SalesGoal_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AutomationRule" ADD CONSTRAINT "AutomationRule_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AppConfig" ADD CONSTRAINT "AppConfig_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AiConversation" ADD CONSTRAINT "AiConversation_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
