/*
  Warnings:

  - You are about to alter the column `ip_address` on the `audit_logs` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(45)`.

*/
-- CreateEnum
CREATE TYPE "GroupPricingMode" AS ENUM ('PER_OCCUPANT', 'BUNDLE_FIXED');

-- DropIndex
DROP INDEX "e_tickets_booking_id_key";

-- AlterTable
ALTER TABLE "audit_logs" ALTER COLUMN "ip_address" SET DATA TYPE VARCHAR(45);

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "occupants_count" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "e_tickets" ADD COLUMN     "guest_name" VARCHAR(200),
ADD COLUMN     "guest_phone" VARCHAR(20),
ADD COLUMN     "ticket_index" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "allow_group_bookings" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "directions_url" TEXT,
ADD COLUMN     "location_accuracy_meters" INTEGER,
ADD COLUMN     "total_tickets_available" INTEGER;

-- AlterTable
ALTER TABLE "ticket_tiers" ADD COLUMN     "group_category" VARCHAR(50),
ADD COLUMN     "is_group_subgroup" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "occupants_per_unit" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "pricing_mode" "GroupPricingMode" NOT NULL DEFAULT 'PER_OCCUPANT';

-- CreateIndex
CREATE INDEX "bookings_attendee_id_created_at_idx" ON "bookings"("attendee_id", "created_at");

-- CreateIndex
CREATE INDEX "bookings_attendee_id_event_id_idx" ON "bookings"("attendee_id", "event_id");

-- CreateIndex
CREATE INDEX "bookings_attendee_id_event_id_status_idx" ON "bookings"("attendee_id", "event_id", "status");

-- CreateIndex
CREATE INDEX "bookings_status_expires_at_idx" ON "bookings"("status", "expires_at");

-- CreateIndex
CREATE INDEX "bookings_expires_at_idx" ON "bookings"("expires_at");

-- CreateIndex
CREATE INDEX "e_tickets_booking_id_idx" ON "e_tickets"("booking_id");

-- CreateIndex
CREATE INDEX "events_status_starts_at_idx" ON "events"("status", "starts_at");

-- CreateIndex
CREATE INDEX "events_status_is_featured_starts_at_idx" ON "events"("status", "is_featured", "starts_at");

-- CreateIndex
CREATE INDEX "events_latitude_longitude_idx" ON "events"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");

-- CreateIndex
CREATE INDEX "payment_methods_organizer_id_is_active_is_default_idx" ON "payment_methods"("organizer_id", "is_active", "is_default");

-- CreateIndex
CREATE INDEX "payments_bill_reference_idx" ON "payments"("bill_reference");

-- CreateIndex
CREATE INDEX "subscriptions_organizer_id_status_idx" ON "subscriptions"("organizer_id", "status");

-- CreateIndex
CREATE INDEX "ticket_tiers_event_id_is_active_sort_order_idx" ON "ticket_tiers"("event_id", "is_active", "sort_order");

-- CreateIndex
CREATE INDEX "ticket_tiers_event_id_is_group_subgroup_idx" ON "ticket_tiers"("event_id", "is_group_subgroup");
