-- Add seat_count column to tables with default of 12
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS seat_count INTEGER NOT NULL DEFAULT 12;