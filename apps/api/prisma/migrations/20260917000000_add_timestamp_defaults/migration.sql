-- Add database-level defaults for timestamp columns
-- This makes raw SQL inserts work without specifying timestamps

-- Users
ALTER TABLE "users" ALTER COLUMN "created_at" SET DEFAULT NOW();
ALTER TABLE "users" ALTER COLUMN "updated_at" SET DEFAULT NOW();

-- Organizer profiles
ALTER TABLE "organizer_profiles" ALTER COLUMN "created_at" SET DEFAULT NOW();
ALTER TABLE "organizer_profiles" ALTER COLUMN "updated_at" SET DEFAULT NOW();

-- Subscription plans
ALTER TABLE "subscription_plans" ALTER COLUMN "created_at" SET DEFAULT NOW();
ALTER TABLE "subscription_plans" ALTER COLUMN "updated_at" SET DEFAULT NOW();

-- Subscriptions
ALTER TABLE "subscriptions" ALTER COLUMN "created_at" SET DEFAULT NOW();
ALTER TABLE "subscriptions" ALTER COLUMN "updated_at" SET DEFAULT NOW();

-- Payment methods
ALTER TABLE "payment_methods" ALTER COLUMN "created_at" SET DEFAULT NOW();
ALTER TABLE "payment_methods" ALTER COLUMN "updated_at" SET DEFAULT NOW();

-- Event categories
ALTER TABLE "event_categories" ALTER COLUMN "created_at" SET DEFAULT NOW();

-- Events
ALTER TABLE "events" ALTER COLUMN "created_at" SET DEFAULT NOW();
ALTER TABLE "events" ALTER COLUMN "updated_at" SET DEFAULT NOW();

-- Ticket tiers
ALTER TABLE "ticket_tiers" ALTER COLUMN "created_at" SET DEFAULT NOW();
ALTER TABLE "ticket_tiers" ALTER COLUMN "updated_at" SET DEFAULT NOW();

-- Bookings
ALTER TABLE "bookings" ALTER COLUMN "created_at" SET DEFAULT NOW();
ALTER TABLE "bookings" ALTER COLUMN "updated_at" SET DEFAULT NOW();

-- Payments
ALTER TABLE "payments" ALTER COLUMN "created_at" SET DEFAULT NOW();
ALTER TABLE "payments" ALTER COLUMN "updated_at" SET DEFAULT NOW();

-- E-tickets
ALTER TABLE "e_tickets" ALTER COLUMN "created_at" SET DEFAULT NOW();
ALTER TABLE "e_tickets" ALTER COLUMN "updated_at" SET DEFAULT NOW();

-- Notifications
ALTER TABLE "notifications" ALTER COLUMN "created_at" SET DEFAULT NOW();

-- Audit logs
ALTER TABLE "audit_logs" ALTER COLUMN "created_at" SET DEFAULT NOW();

-- Trigger function to auto-update updated_at on UPDATE
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach the trigger to each table that has updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "users"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizer_profiles_updated_at BEFORE UPDATE ON "organizer_profiles"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON "subscription_plans"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON "subscriptions"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON "payment_methods"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON "events"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ticket_tiers_updated_at BEFORE UPDATE ON "ticket_tiers"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON "bookings"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON "payments"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_e_tickets_updated_at BEFORE UPDATE ON "e_tickets"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
