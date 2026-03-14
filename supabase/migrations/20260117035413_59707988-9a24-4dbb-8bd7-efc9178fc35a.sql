-- Add image_url column to dinners table for menu photos
ALTER TABLE public.dinners ADD COLUMN IF NOT EXISTS image_url TEXT;