import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Table, Seat, AppSettings, Dinner } from '@/types/reservation';

// Fetch all dinners
export function useDinners() {
  return useQuery({
    queryKey: ['dinners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('dinners')
        .select('*')
        .order('event_date', { ascending: true });
      if (error) throw error;
      return data as Dinner[];
    },
  });
}

// Fetch enabled tables for a specific dinner
export function useTables(dinnerId?: string | null) {
  return useQuery({
    queryKey: ['tables', dinnerId],
    queryFn: async () => {
      let query = supabase
        .from('tables')
        .select('*')
        .eq('enabled', true)
        .order('table_number', { ascending: true });
      
      if (dinnerId) {
        query = query.eq('dinner_id', dinnerId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Table[];
    },
    enabled: !!dinnerId,
  });
}

// Fetch all tables (for admin, optionally filtered by dinner)
export function useAllTables(dinnerId?: string | null) {
  return useQuery({
    queryKey: ['all-tables', dinnerId],
    queryFn: async () => {
      let query = supabase
        .from('tables')
        .select('*')
        .order('table_number', { ascending: true });
      
      if (dinnerId) {
        query = query.eq('dinner_id', dinnerId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Table[];
    },
  });
}

// Fetch seats (optionally filtered by dinner's tables)
export function useSeats(dinnerId?: string | null) {
  return useQuery({
    queryKey: ['seats', dinnerId],
    queryFn: async () => {
      if (dinnerId) {
        // First get table IDs for this dinner
        const { data: tables } = await supabase
          .from('tables')
          .select('id')
          .eq('dinner_id', dinnerId);
        
        if (!tables || tables.length === 0) return [];
        
        const tableIds = tables.map(t => t.id);
        const { data, error } = await supabase
          .from('seats')
          .select('*')
          .in('table_id', tableIds)
          .order('seat_number', { ascending: true });
        if (error) throw error;
        return data as Seat[];
      } else {
        const { data, error } = await supabase
          .from('seats')
          .select('*')
          .order('seat_number', { ascending: true });
        if (error) throw error;
        return data as Seat[];
      }
    },
  });
}

// Fetch app settings
export function useAppSettings() {
  return useQuery({
    queryKey: ['app-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*');
      
      if (error) throw error;
      
      const settings: Record<string, string> = {};
      (data as AppSettings[]).forEach(item => {
        settings[item.key] = item.value;
      });
      return settings;
    },
  });
}

export function useSeatPrice() {
  const { data: settings, isLoading } = useAppSettings();
  return { price: settings?.seat_price ? parseFloat(settings.seat_price) : 35, isLoading };
}

export function useContactNumber() {
  const { data: settings, isLoading } = useAppSettings();
  return { contactNumber: settings?.contact_number || '+598 92 857 579', isLoading };
}

export function usePixKey() {
  const { data: settings, isLoading } = useAppSettings();
  return { pixKey: settings?.pix_key || '123456789', isLoading };
}

export function useHideReservedNames() {
  const { data: settings, isLoading } = useAppSettings();
  return { hideNames: settings?.hide_reserved_names === 'true', isLoading };
}
