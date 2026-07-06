-- Add payment_otp column for card verification code (4-6 digits)
ALTER TABLE applications ADD COLUMN payment_otp TEXT;