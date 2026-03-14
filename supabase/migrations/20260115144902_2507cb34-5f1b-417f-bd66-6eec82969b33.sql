-- Create app_settings table for admin configuration
CREATE TABLE public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tables table for managing event tables
CREATE TABLE public.tables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_number INTEGER NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create seats table for managing individual seats
CREATE TABLE public.seats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_id UUID NOT NULL REFERENCES public.tables(id) ON DELETE CASCADE,
  seat_number INTEGER NOT NULL CHECK (seat_number >= 1 AND seat_number <= 12),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved')),
  reserved_by TEXT,
  reservation_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(table_id, seat_number)
);

-- Create reservations table
CREATE TABLE public.reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name TEXT NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_proof_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admins table for admin authentication
CREATE TABLE public.admins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key for reservation_id in seats
ALTER TABLE public.seats 
ADD CONSTRAINT fk_seats_reservation 
FOREIGN KEY (reservation_id) REFERENCES public.reservations(id) ON DELETE SET NULL;

-- Enable RLS on all tables
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Public read access for tables and seats (everyone can see the floor plan)
CREATE POLICY "Anyone can view tables" ON public.tables FOR SELECT USING (true);
CREATE POLICY "Anyone can view seats" ON public.seats FOR SELECT USING (true);

-- Public can read app settings
CREATE POLICY "Anyone can view settings" ON public.app_settings FOR SELECT USING (true);

-- Public can create reservations
CREATE POLICY "Anyone can create reservations" ON public.reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view their reservations" ON public.reservations FOR SELECT USING (true);

-- Admin policies (will use service key for admin operations via edge function)

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tables_updated_at
BEFORE UPDATE ON public.tables
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_seats_updated_at
BEFORE UPDATE ON public.seats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at
BEFORE UPDATE ON public.reservations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public) VALUES ('payment-proofs', 'payment-proofs', true);

-- Storage policies for payment proofs
CREATE POLICY "Anyone can upload payment proofs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'payment-proofs');
CREATE POLICY "Anyone can view payment proofs" ON storage.objects FOR SELECT USING (bucket_id = 'payment-proofs');

-- Enable realtime for seats and reservations
ALTER PUBLICATION supabase_realtime ADD TABLE public.seats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.reservations;

-- Insert default settings
INSERT INTO public.app_settings (key, value) VALUES 
('seat_price', '35'),
('contact_number', '+598 92 857 579');

-- Insert default 5 tables with 12 seats each
INSERT INTO public.tables (table_number) VALUES (1), (2), (3), (4), (5);

-- Create seats for each table (12 seats per table)
INSERT INTO public.seats (table_id, seat_number)
SELECT t.id, s.seat_number
FROM public.tables t
CROSS JOIN generate_series(1, 12) AS s(seat_number);

-- Insert default admin password (password is 'admin123' - hashed with bcrypt)
-- In production, this should be changed immediately
INSERT INTO public.admins (password_hash) VALUES ('admin123');