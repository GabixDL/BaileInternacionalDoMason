import { Table, Seat, SelectedSeat, SeatStatus } from '@/types/reservation';
import { TableSeat } from './TableSeat';
import { cn } from '@/lib/utils';

interface RectangularTableProps {
  table: Table;
  seats: Seat[];
  selectedSeats: SelectedSeat[];
  onSeatClick: (seat: Seat, table: Table) => void;
  price: number;
  animationDelay?: number;
  hideNames?: boolean;
}

export function RectangularTable({
  table,
  seats,
  selectedSeats,
  onSeatClick,
  price,
  animationDelay = 0,
  hideNames = false,
}: RectangularTableProps) {
  // Sort seats by seat number
  const sortedSeats = [...seats].sort((a, b) => a.seat_number - b.seat_number);
  
  // Split seats dynamically based on seat count
  const seatCount = table.seat_count || 12;
  const halfSeats = Math.ceil(seatCount / 2);
  const topSeats = sortedSeats.slice(0, halfSeats);
  const bottomSeats = sortedSeats.slice(halfSeats, seatCount);

  const getSeatStatus = (seat: Seat): SeatStatus => {
    if (seat.status === 'confirmado') return 'confirmado';
    if (seat.status === 'reservado') return 'reservado';
    if (selectedSeats.some(s => s.seatId === seat.id)) return 'selected';
    return 'libre';
  };

  const getSeatLabel = (seatNumber: number) => {
    return `${table.table_number}-${seatNumber.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className="flex flex-col items-center gap-1 animate-fade-in"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* Table number label */}
      <div className="text-sm font-semibold text-muted-foreground mb-1">
        Mesa {table.table_number}
      </div>

      {/* Top row of seats */}
      <div className="flex gap-1.5">
        {topSeats.map((seat, index) => (
          <TableSeat
            key={seat.id}
            seatLabel={getSeatLabel(seat.seat_number)}
            status={getSeatStatus(seat)}
            reservedBy={hideNames ? null : seat.reserved_by}
            price={price}
            position="top"
            index={index}
            onClick={() => onSeatClick(seat, table)}
            disabled={seat.status === 'reservado' || seat.status === 'confirmado'}
          />
        ))}
      </div>

      {/* Table surface */}
      <div 
        className={cn(
          'h-16 rounded-xl',
          'bg-gradient-to-br from-amber-800 to-amber-950',
          'border-4 border-amber-700',
          'shadow-xl',
          'flex items-center justify-center',
          'px-4'
        )}
        style={{ minWidth: `${Math.max(halfSeats * 55, 180)}px` }}
      >
        <span className="text-amber-200/80 text-lg font-bold">
          {table.table_number}
        </span>
      </div>

      {/* Bottom row of seats */}
      <div className="flex gap-1.5">
        {bottomSeats.map((seat, index) => (
          <TableSeat
            key={seat.id}
            seatLabel={getSeatLabel(seat.seat_number)}
            status={getSeatStatus(seat)}
            reservedBy={hideNames ? null : seat.reserved_by}
            price={price}
            position="bottom"
            index={index + halfSeats}
            onClick={() => onSeatClick(seat, table)}
            disabled={seat.status === 'reservado' || seat.status === 'confirmado'}
          />
        ))}
      </div>
    </div>
  );
}
