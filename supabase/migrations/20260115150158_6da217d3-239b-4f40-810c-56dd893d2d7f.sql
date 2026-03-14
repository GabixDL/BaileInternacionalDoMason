-- Allow anyone to update seats (for reservations)
CREATE POLICY "Anyone can update seats for reservations" 
ON public.seats 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Allow admins to manage all tables (insert, update, delete)
CREATE POLICY "Anyone can insert tables" 
ON public.tables 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update tables" 
ON public.tables 
FOR UPDATE 
USING (true)
WITH CHECK (true);

CREATE POLICY "Anyone can delete tables" 
ON public.tables 
FOR DELETE 
USING (true);

-- Allow inserting seats (when creating new tables)
CREATE POLICY "Anyone can insert seats" 
ON public.seats 
FOR INSERT 
WITH CHECK (true);

-- Allow deleting seats (when deleting tables - cascade handled by DB but just in case)
CREATE POLICY "Anyone can delete seats" 
ON public.seats 
FOR DELETE 
USING (true);

-- Allow updating app_settings (for admin)
CREATE POLICY "Anyone can update settings" 
ON public.app_settings 
FOR UPDATE 
USING (true)
WITH CHECK (true);

-- Allow updating reservations (for admin approval/rejection)
CREATE POLICY "Anyone can update reservations" 
ON public.reservations 
FOR UPDATE 
USING (true)
WITH CHECK (true);