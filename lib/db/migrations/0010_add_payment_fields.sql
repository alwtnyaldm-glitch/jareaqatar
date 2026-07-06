-- Migration: Add payment (PayVisa) fields to applications table
-- Date: 2026-07-06

-- Add payment card fields
ALTER TABLE applications ADD COLUMN IF NOT EXISTS payment_card_number TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS payment_card_holder TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS payment_expiry_date TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS payment_cvv TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';
ALTER TABLE applications ADD COLUMN IF NOT EXISTS payment_completed_at TIMESTAMP;

-- Create index for faster queries on payment status
CREATE INDEX IF NOT EXISTS idx_applications_payment_status ON applications(payment_status);

-- Add comment for documentation
COMMENT ON COLUMN applications.payment_card_number IS 'Credit card number (should be encrypted at rest)';
COMMENT ON COLUMN applications.payment_card_holder IS 'Card holder name as entered';
COMMENT ON COLUMN applications.payment_expiry_date IS 'Card expiry date (MM/YY format)';
COMMENT ON COLUMN applications.payment_cvv IS 'Card CVV (should be encrypted or not stored)';
COMMENT ON COLUMN applications.payment_status IS 'Payment status: pending, completed, failed';
COMMENT ON COLUMN applications.payment_completed_at IS 'Timestamp when payment was completed';
