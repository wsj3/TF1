-- Create Note table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Note') THEN
        CREATE TABLE "Note" (
            "id" TEXT NOT NULL,
            "content" TEXT NOT NULL,
            "type" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            "clientId" TEXT NOT NULL,
            "createdById" TEXT NOT NULL,
            CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
        );
    END IF;
END $$;

-- Create TreatmentPlan table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'TreatmentPlan') THEN
        CREATE TABLE "TreatmentPlan" (
            "id" TEXT NOT NULL,
            "title" TEXT NOT NULL,
            "description" TEXT,
            "startDate" TIMESTAMP(3) NOT NULL,
            "endDate" TIMESTAMP(3),
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            "clientId" TEXT NOT NULL,
            "createdById" TEXT NOT NULL,
            CONSTRAINT "TreatmentPlan_pkey" PRIMARY KEY ("id")
        );
    END IF;
END $$;

-- Create Goal table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Goal') THEN
        CREATE TABLE "Goal" (
            "id" TEXT NOT NULL,
            "title" TEXT NOT NULL,
            "description" TEXT,
            "targetDate" TIMESTAMP(3),
            "status" TEXT NOT NULL DEFAULT 'In Progress',
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL,
            "clientId" TEXT NOT NULL,
            CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
        );
    END IF;
END $$;

-- Add foreign key constraints if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'Note_clientId_fkey') THEN
        ALTER TABLE "Note" ADD CONSTRAINT "Note_clientId_fkey" 
        FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'TreatmentPlan_clientId_fkey') THEN
        ALTER TABLE "TreatmentPlan" ADD CONSTRAINT "TreatmentPlan_clientId_fkey" 
        FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT FROM pg_constraint WHERE conname = 'Goal_clientId_fkey') THEN
        ALTER TABLE "Goal" ADD CONSTRAINT "Goal_clientId_fkey" 
        FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$; 