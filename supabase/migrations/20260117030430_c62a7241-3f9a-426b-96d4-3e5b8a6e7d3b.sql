-- Add time and menu fields to dinners
ALTER TABLE public.dinners ADD COLUMN event_time TIME DEFAULT '20:00';
ALTER TABLE public.dinners ADD COLUMN menu TEXT;

-- Add dinner_id to reservations to track which dinner the reservation is for
ALTER TABLE public.reservations ADD COLUMN dinner_id UUID REFERENCES public.dinners(id) ON DELETE SET NULL;