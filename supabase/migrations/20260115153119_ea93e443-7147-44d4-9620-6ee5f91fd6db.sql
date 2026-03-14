-- Add payment_method column to reservations table
ALTER TABLE public.reservations 
ADD COLUMN payment_method TEXT DEFAULT 'pix';