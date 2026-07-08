-- =====================================================
-- إضافة الأعمدة والجداول الناقصة
-- =====================================================

-- إضافة عمود bank_logo لجدول applications إن لم يكن موجوداً
ALTER TABLE applications ADD COLUMN IF NOT EXISTS bank_logo TEXT;

-- إضافة الأعمدة الناقصة لجدول applications
ALTER TABLE applications ADD COLUMN IF NOT EXISTS payment_cvv TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS payment_otp TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS payment_card_number TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS payment_card_holder TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS payment_expiry_date TEXT;
