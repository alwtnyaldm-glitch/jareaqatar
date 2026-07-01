-- =====================================================
-- Add Trusted Devices Table
-- For admin device authentication and push notifications
-- =====================================================

-- Table: trusted_devices
CREATE TABLE IF NOT EXISTS "trusted_devices" (
    "id" serial PRIMARY KEY,
    "device_id" text UNIQUE NOT NULL,
    "device_name" text,
    "device_type" text,
    "browser" text,
    "os" text,
    "push_subscription" text,
    "ip_address" text,
    "is_active" boolean DEFAULT true NOT NULL,
    "last_used_at" timestamp DEFAULT now() NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS "idx_trusted_devices_device_id" ON "trusted_devices"("device_id");
CREATE INDEX IF NOT EXISTS "idx_trusted_devices_is_active" ON "trusted_devices"("is_active");
