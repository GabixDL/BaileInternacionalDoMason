export interface Dinner {
  id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  menu: string | null;
  seat_price: number;
  pix_key: string | null;
  contact_number: string | null;
  hide_names: boolean;
  image_url: string | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Table {
  id: string;
  table_number: number;
  enabled: boolean;
  seat_count: number;
  dinner_id: string | null;
  shape: 'rectangular' | 'round';
  created_at: string;
  updated_at: string;
}

export interface Seat {
  id: string;
  table_id: string;
  seat_number: number;
  status: 'libre' | 'reservado' | 'confirmado';
  reserved_by: string | null;
  reservation_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Reservation {
  id: string;
  user_name: string;
  total_amount: number;
  payment_proof_url: string | null;
  payment_method: 'pix' | 'money';
  status: 'reservado' | 'confirmado' | 'rejeitado';
  dinner_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppSettings {
  id: string;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export interface SeatWithTable extends Seat {
  table: Table;
}

export type SeatStatus = 'libre' | 'selected' | 'reservado' | 'confirmado';

export interface SelectedSeat {
  seatId: string;
  tableNumber: number;
  seatNumber: number;
  seatLabel: string;
}
