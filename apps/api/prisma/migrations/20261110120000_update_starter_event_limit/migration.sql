UPDATE "subscription_plans"
SET "max_events_per_month" = 2,
    "updated_at" = CURRENT_TIMESTAMP
WHERE "code" = 'STARTER';