-- AlterTable
ALTER TABLE "events" ADD COLUMN     "event_features" JSONB NOT NULL DEFAULT '[]';
