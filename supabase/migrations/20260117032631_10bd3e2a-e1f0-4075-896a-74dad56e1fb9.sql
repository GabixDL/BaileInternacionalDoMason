-- Drop the unique constraint on table_number (it should be unique per dinner, not globally)
ALTER TABLE public.tables DROP CONSTRAINT IF EXISTS tables_table_number_key;

-- Add a unique constraint for table_number per dinner
ALTER TABLE public.tables ADD CONSTRAINT tables_dinner_table_number_unique UNIQUE (dinner_id, table_number);

-- Now create 4 tables with 12 seats each for the test dinner
DO $$
DECLARE
  dinner_uuid UUID;
  table_uuid UUID;
  i INTEGER;
  j INTEGER;
BEGIN
  SELECT id INTO dinner_uuid FROM public.dinners WHERE title = 'Cena de Prueba' LIMIT 1;
  
  -- Only create if no tables exist for this dinner
  IF NOT EXISTS (SELECT 1 FROM public.tables WHERE dinner_id = dinner_uuid) THEN
    FOR i IN 1..4 LOOP
      INSERT INTO public.tables (dinner_id, table_number, seat_count, shape, enabled)
      VALUES (dinner_uuid, i, 12, 'round', true)
      RETURNING id INTO table_uuid;
      
      FOR j IN 1..12 LOOP
        INSERT INTO public.seats (table_id, seat_number, status)
        VALUES (table_uuid, j, 'libre');
      END LOOP;
    END LOOP;
  END IF;
END $$;