-- BudgetItem
CREATE TABLE "BudgetItem" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "label" TEXT,
    "target" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'DOP',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BudgetItem_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "BudgetItem_agencyId_year_month_category_key" ON "BudgetItem"("agencyId","year","month","category");
ALTER TABLE "BudgetItem" ADD CONSTRAINT "BudgetItem_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- WorkflowDef
CREATE TABLE "WorkflowDef" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "trigger" TEXT NOT NULL DEFAULT 'LEAD_CREATED',
    "nodes" TEXT NOT NULL DEFAULT '[]',
    "edges" TEXT NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkflowDef_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "WorkflowDef" ADD CONSTRAINT "WorkflowDef_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- SecurityLog
CREATE TABLE "SecurityLog" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT,
    "userId" TEXT,
    "event" TEXT NOT NULL,
    "email" TEXT,
    "ip" TEXT,
    "userAgent" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SecurityLog_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "SecurityLog" ADD CONSTRAINT "SecurityLog_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SecurityLog" ADD CONSTRAINT "SecurityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- LoginAttempt
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ip" TEXT,
    "success" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "LoginAttempt_email_createdAt_idx" ON "LoginAttempt"("email","createdAt");
