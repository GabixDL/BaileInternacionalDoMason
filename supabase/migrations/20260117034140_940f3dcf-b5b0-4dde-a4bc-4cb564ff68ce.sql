-- Add pix_key and contact_number columns to dinners table
ALTER TABLE public.dinners 
ADD COLUMN IF NOT EXISTS pix_key TEXT,
ADD COLUMN IF NOT EXISTS contact_number TEXT;