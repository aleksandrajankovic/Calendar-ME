-- Usklađivanje ME baze sa RS šemom (ručno pisano — samo dodavanje, ništa se ne briše).
-- IF NOT EXISTS: bezbedno i ako je neka kolona/vrednost već dodata ručno.
-- Stara tabela "WeeklyPromotion" ostaje u bazi (prazna), samo je više nema u šemi.

-- Nove kategorije (Zlatna lopta + knockout faze)
ALTER TYPE "PromoCategory" ADD VALUE IF NOT EXISTS 'GOLD';
ALTER TYPE "PromoCategory" ADD VALUE IF NOT EXISTS 'QUARTER_FINAL';
ALTER TYPE "PromoCategory" ADD VALUE IF NOT EXISTS 'SEMI_FINAL';
ALTER TYPE "PromoCategory" ADD VALUE IF NOT EXISTS 'FINAL';

-- Podešavanja kalendara
ALTER TABLE "CalendarSettings" ADD COLUMN IF NOT EXISTS "bgImageUrlMobile" TEXT;
ALTER TABLE "CalendarSettings" ADD COLUMN IF NOT EXISTS "monthBackgrounds" JSONB;
ALTER TABLE "CalendarSettings" ADD COLUMN IF NOT EXISTS "calendarPosition" TEXT;
ALTER TABLE "CalendarSettings" ADD COLUMN IF NOT EXISTS "calendarTitle" JSONB;
ALTER TABLE "CalendarSettings" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
ALTER TABLE "CalendarSettings" ADD COLUMN IF NOT EXISTS "showLogo" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CalendarSettings" ADD COLUMN IF NOT EXISTS "confetti" JSONB;
ALTER TABLE "CalendarSettings" ADD COLUMN IF NOT EXISTS "closed" JSONB;
ALTER TABLE "CalendarSettings" ADD COLUMN IF NOT EXISTS "theme" TEXT;
ALTER TABLE "CalendarSettings" ADD COLUMN IF NOT EXISTS "seoMeta" JSONB;
ALTER TABLE "CalendarSettings" ADD COLUMN IF NOT EXISTS "countdownTargetIso" TEXT;
ALTER TABLE "CalendarSettings" ADD COLUMN IF NOT EXISTS "countdownLabel" TEXT;
ALTER TABLE "CalendarSettings" ADD COLUMN IF NOT EXISTS "leaderboard" JSONB;

-- Specijalne promocije: knockout faza, slot mašina, flip kartica
ALTER TABLE "SpecialPromotion" ADD COLUMN IF NOT EXISTS "scratch" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SpecialPromotion" ADD COLUMN IF NOT EXISTS "knockoutPhase" TEXT;
ALTER TABLE "SpecialPromotion" ADD COLUMN IF NOT EXISTS "slot" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "SpecialPromotion" ADD COLUMN IF NOT EXISTS "flipCard" BOOLEAN NOT NULL DEFAULT false;

-- Nedeljni plan: slot mašina, flip kartica
ALTER TABLE "WeeklyPlan" ADD COLUMN IF NOT EXISTS "scratch" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "WeeklyPlan" ADD COLUMN IF NOT EXISTS "slot" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "WeeklyPlan" ADD COLUMN IF NOT EXISTS "flipCard" BOOLEAN NOT NULL DEFAULT false;

-- Analitika kalendara
CREATE TABLE IF NOT EXISTS "CalendarEvent" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "year" INTEGER,
    "month" INTEGER,
    "day" INTEGER,
    "promoType" TEXT,
    "title" TEXT,
    "device" TEXT,
    "embedded" BOOLEAN NOT NULL DEFAULT false,
    "visitor" TEXT,
    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "CalendarEvent_createdAt_idx" ON "CalendarEvent"("createdAt");
CREATE INDEX IF NOT EXISTS "CalendarEvent_year_month_day_idx" ON "CalendarEvent"("year", "month", "day");
