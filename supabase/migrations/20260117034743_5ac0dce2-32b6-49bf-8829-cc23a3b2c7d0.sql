-- Add hide_names column to dinners table for per-dinner name visibility
ALTER TABLE public.dinners 
ADD COLUMN IF NOT EXISTS hide_names BOOLEAN NOT NULL DEFAULT false;