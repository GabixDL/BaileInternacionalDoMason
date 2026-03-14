-- Add seat_price column to dinners table with default 35 (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'dinners' AND column_name = 'seat_price'
  ) THEN
    ALTER TABLE public.dinners ADD COLUMN seat_price NUMERIC NOT NULL DEFAULT 35;
  END IF;
END $$;

-- Update existing dinner to have default price
UPDATE public.dinners SET seat_price = 35 WHERE seat_price IS NULL;