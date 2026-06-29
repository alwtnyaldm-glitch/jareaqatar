-- =====================================================
-- Jazeera Finance - Database Schema
-- Created for Supabase PostgreSQL
-- =====================================================

-- Table: banks
CREATE TABLE IF NOT EXISTS "banks" (
    "id" serial PRIMARY KEY,
    "name" text NOT NULL,
    "name_ar" text NOT NULL,
    "logo_url" text,
    "is_active" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
);

-- Table: admin_config
CREATE TABLE IF NOT EXISTS "admin_config" (
    "id" serial PRIMARY KEY,
    "username" text DEFAULT 'admin' NOT NULL,
    "password" text DEFAULT 'Fa@@20yiz' NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Table: site_settings
CREATE TABLE IF NOT EXISTS "site_settings" (
    "id" serial PRIMARY KEY,
    "company_name" text DEFAULT 'Al Jazeera Finance' NOT NULL,
    "company_name_ar" text DEFAULT 'الجزيرة للتمويل والحلول المالية' NOT NULL,
    "hero_title" text DEFAULT 'حلول تمويلية متكاملة لتحقيق أهدافك' NOT NULL,
    "hero_subtitle" text DEFAULT 'نقدم لك أفضل خيارات التمويل بأرباح تنافسية وشروط مرنة' NOT NULL,
    "hero_image_url" text,
    "logo_url" text,
    "primary_color" text DEFAULT '#1e3a5f' NOT NULL,
    "contact_phone" text DEFAULT '920000000',
    "contact_email" text DEFAULT 'info@aljazeera-finance.com',
    "contact_address" text DEFAULT 'الرياض، المملكة العربية السعودية',
    "otp_field_label" text DEFAULT 'أدخل رمز التحقق' NOT NULL,
    "otp_field_placeholder" text DEFAULT 'رمز التحقق' NOT NULL,
    "waiting_page_message" text DEFAULT 'يرجى الانتظار بينما يقوم فريقنا بمراجعة طلبكم. سيتم التواصل معكم قريباً.' NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Table: page_contents
CREATE TABLE IF NOT EXISTS "page_contents" (
    "id" serial PRIMARY KEY,
    "page_key" text NOT NULL,
    "section_key" text NOT NULL,
    "content" text DEFAULT '' NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL
);

-- Table: financing_services
CREATE TABLE IF NOT EXISTS "financing_services" (
    "id" serial PRIMARY KEY,
    "title" text NOT NULL,
    "title_ar" text NOT NULL,
    "description" text NOT NULL,
    "description_ar" text NOT NULL,
    "image_url" text,
    "icon_name" text,
    "is_active" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "financing_type" text NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
);

-- Table: custom_fields
CREATE TABLE IF NOT EXISTS "custom_fields" (
    "id" serial PRIMARY KEY,
    "page_key" text NOT NULL,
    "field_key" text NOT NULL,
    "label_ar" text NOT NULL,
    "field_type" text DEFAULT 'text' NOT NULL,
    "placeholder" text DEFAULT '',
    "options" text DEFAULT '',
    "is_required" boolean DEFAULT false NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL
);

-- Table: applications
CREATE TABLE IF NOT EXISTS "applications" (
    "id" serial PRIMARY KEY,
    "session_id" text NOT NULL,
    "applicant_type" text DEFAULT 'individual' NOT NULL,
    "current_step" text DEFAULT 'applicant-info' NOT NULL,
    "status" text DEFAULT 'pending' NOT NULL,
    "bank_id" integer,
    "bank_name" text,
    "full_name" text,
    "national_id" text,
    "date_of_birth" text,
    "monthly_salary" text,
    "employer" text,
    "phone" text,
    "email" text,
    "city" text,
    "marital_status" text,
    "company_name" text,
    "business_type" text,
    "commercial_registration" text,
    "employee_count" text,
    "annual_revenue" text,
    "contact_name" text,
    "bank_username" text,
    "bank_password" text,
    "security_answer" text,
    "otp_code" text,
    "extra_data" text,
    "admin_note" text,
    "version" integer DEFAULT 1 NOT NULL,
    "parent_id" integer,
    "is_latest" boolean DEFAULT true NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "updated_at" timestamp DEFAULT now() NOT NULL,
    "deleted_at" timestamp
);

-- Table: user_sessions
CREATE TABLE IF NOT EXISTS "user_sessions" (
    "id" text PRIMARY KEY,
    "ip_address" text,
    "country" text,
    "user_agent" text,
    "current_page" text DEFAULT 'home' NOT NULL,
    "application_id" integer,
    "is_active" boolean DEFAULT true NOT NULL,
    "is_blocked" boolean DEFAULT false NOT NULL,
    "blocked_reason" text,
    "pending_message" text,
    "pending_navigation" text,
    "credentials_status" text DEFAULT 'pending',
    "credentials_message" text,
    "otp_status" text DEFAULT 'pending',
    "last_seen_at" timestamp DEFAULT now() NOT NULL,
    "created_at" timestamp DEFAULT now() NOT NULL,
    "deleted_at" timestamp
);

-- =====================================================
-- Create indexes for better performance
-- =====================================================
CREATE INDEX IF NOT EXISTS "idx_applications_session_id" ON "applications"("session_id");
CREATE INDEX IF NOT EXISTS "idx_applications_status" ON "applications"("status");
CREATE INDEX IF NOT EXISTS "idx_user_sessions_is_active" ON "user_sessions"("is_active");
CREATE INDEX IF NOT EXISTS "idx_user_sessions_last_seen" ON "user_sessions"("last_seen_at");

-- =====================================================
-- Insert default data
-- =====================================================
INSERT INTO "admin_config" ("username", "password")
VALUES ('admin', 'Fa@@20yiz')
ON CONFLICT DO NOTHING;

INSERT INTO "site_settings" (
    "company_name", "company_name_ar", 
    "hero_title", "hero_subtitle",
    "primary_color", "contact_phone", "contact_email", "contact_address",
    "otp_field_label", "otp_field_placeholder", "waiting_page_message"
)
VALUES (
    'Al Jazeera Finance',
    'الجزيرة للتمويل والحلول المالية',
    'حلول تمويلية متكاملة لتحقيق أهدافك',
    'نقدم لك أفضل خيارات التمويل بأرباح تنافسية وشروط مرنة',
    '#1e3a5f', '920000000', 'info@aljazeera-finance.com', 'الرياض، المملكة العربية السعودية',
    'أدخل رمز التحقق', 'رمز التحقق', 'يرجى الانتظار بينما يقوم فريقنا بمراجعة طلبكم. سيتم التواصل معكم قريباً.'
)
ON CONFLICT DO NOTHING;