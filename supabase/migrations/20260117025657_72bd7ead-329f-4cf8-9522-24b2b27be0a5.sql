-- Create dinners table for events/cenas
CREATE TABLE public.dinners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  event_date DATE NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dinners ENABLE ROW LEVEL SECURITY;

-- RLS policies for dinners
CREATE POLICY "Anyone can view dinners"
ON public.dinners FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert dinners"
ON public.dinners FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update dinners"
ON public.dinners FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can delete dinners"
ON public.dinners FOR DELETE
USING (true);

-- Add dinner_id to tables to associate tables with dinners
ALTER TABLE public.tables ADD COLUMN dinner_id UUID REFERENCES public.dinners(id) ON DELETE CASCADE;

-- Add shape column to tables (rectangular or round)
ALTER TABLE public.tables ADD COLUMN shape TEXT NOT NULL DEFAULT 'rectangular';

-- Enable realtime for dinners
ALTER PUBLICATION supabase_realtime ADD TABLE public.dinners;

-- Insert privacy setting (hide_reserved_names)
INSERT INTO public.app_settings (key, value) 
VALUES ('hide_reserved_names', 'false')
ON CONFLICT DO NOTHING;