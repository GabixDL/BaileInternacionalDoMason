-- First, drop the existing check constraint on seats status
ALTER TABLE public.seats DROP CONSTRAINT IF EXISTS seats_status_check;

-- Update seat status values BEFORE adding new constraint
UPDATE public.seats SET status = 'libre' WHERE status = 'available';
UPDATE public.seats SET status = 'reservado' WHERE status = 'reserved';

-- Now add new check constraint with updated status values
ALTER TABLE public.seats ADD CONSTRAINT seats_status_check 
CHECK (status IN ('libre', 'reservado', 'confirmado'));

-- Drop the existing check constraint on reservations status if exists
ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS reservations_status_check;

-- Update reservation status values BEFORE adding new constraint
UPDATE public.reservations SET status = 'reservado' WHERE status = 'pending';
UPDATE public.reservations SET status = 'confirmado' WHERE status = 'approved';
UPDATE public.reservations SET status = 'rejeitado' WHERE status = 'rejected';

-- Now add new check constraint for reservations
ALTER TABLE public.reservations ADD CONSTRAINT reservations_status_check 
CHECK (status IN ('reservado', 'confirmado', 'rejeitado'));

-- Add DELETE policy for reservations (for admin)
DROP POLICY IF EXISTS "Anyone can delete reservations" ON public.reservations;
CREATE POLICY "Anyone can delete reservations"
ON public.reservations
FOR DELETE
USING (true);