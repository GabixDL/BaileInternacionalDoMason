import { Table, Seat, SelectedSeat, SeatStatus } from '@/types/reservation';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface RoundTableProps {
  table: Table;
  seats: Seat[];
  selectedSeats: SelectedSeat[];
  onSeatClick: (seat: Seat, table: Table) => void;
  price: number;
  animationDelay?: number;
  hideNames?: boolean;
}

export function RoundTable({
  table,
  seats,
  selectedSeats,
  onSeatClick,
  price,
  animationDelay = 0,
  hideNames = false,
}: RoundTableProps) {
  const sortedSeats = [...seats].sort((a, b) => a.seat_number - b.seat_number);
  const seatCount = sortedSeats.length;
  
  const getSeatStatus = (seat: Seat): SeatStatus => {
    if (seat.status === 'confirmado') return 'confirmado';
    if (seat.status === 'reservado') return 'reservado';
    if (selectedSeats.some(s => s.seatId === seat.id)) return 'selected';
    return 'libre';
  };

  const getSeatLabel = (seatNumber: number) => {
    return `${table.table_number}-${seatNumber.toString().padStart(2, '0')}`;
  };

  // Dynamic sizing based on seat count
  const baseRadius = Math.max(80, seatCount * 8);
  const seatSize = 36;
  const containerSize = (baseRadius * 2) + seatSize + 40;
  const tableRadius = baseRadius - 20;

  // Calculate position around the circle
  const getPosition = (index: number, total: number) => {
    const angle = (index / total) * 2 * Math.PI - Math.PI / 2;
    return {
      x: Math.cos(angle) * baseRadius,
      y: Math.sin(angle) * baseRadius,
    };
  };

  return (
    <div 
      className="flex flex-col items-center gap-3 animate-fade-in"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div 
        className="relative"
        style={{ 
          width: `${containerSize}px`, 
          height: `${containerSize}px` 
        }}
      >
        {/* Table surface */}
        <div 
          className={cn(
            'absolute rounded-full',
            'bg-gradient-to-br from-amber-800 to-amber-950',
            'border-4 border-amber-700',
            'shadow-xl',
            'flex items-center justify-center'
          )}
          style={{ 
            width: `${tableRadius * 2}px`, 
            height: `${tableRadius * 2}px`,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
          <span className="text-amber-200/80 text-xl font-bold">
            {table.table_number}
          </span>
        </div>

        {/* Seats */}
        {sortedSeats.map((seat, index) => {
          const pos = getPosition(index, seatCount);
          const status = getSeatStatus(seat);
          const isReserved = status === 'reservado' || status === 'confirmado';
          const isConfirmed = status === 'confirmado';
          const displayName = !hideNames && seat.reserved_by
            ? seat.reserved_by.length > 6 ? seat.reserved_by.substring(0, 5) + '…' : seat.reserved_by
            : null;
          
          return (
            <Tooltip key={seat.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onSeatClick(seat, table)}
                  disabled={isReserved}
                  className={cn(
                    'absolute flex flex-col items-center justify-center',
                    'rounded-lg transition-all duration-200 ease-out',
                    'text-[10px] font-semibold border-2 shadow-sm',
                    status === 'libre' && [
                      'bg-green-500/20 border-green-500 text-green-700',
                      'hover:bg-green-500/40 hover:scale-110 hover:shadow-md cursor-pointer'
                    ],
                    status === 'selected' && [
                      'bg-seat-selected border-seat-selected text-seat-selected-foreground',
                      'animate-seat-select shadow-lg',
                      'hover:scale-110 cursor-pointer'
                    ],
                    status === 'reservado' && [
                      'bg-yellow-500/30 border-yellow-500/50 text-yellow-700',
                      'cursor-not-allowed opacity-80'
                    ],
                    status === 'confirmado' && [
                      'bg-red-500/30 border-red-500/50 text-red-700',
                      'cursor-not-allowed opacity-80'
                    ]
                  )}
                  style={{
                    width: `${seatSize}px`,
                    height: `${seatSize}px`,
                    left: `calc(50% + ${pos.x}px)`,
                    top: `calc(50% + ${pos.y}px)`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <span>{seat.seat_number}</span>
                  {isReserved && displayName && <span className="text-[7px] truncate max-w-full">{displayName}</span>}
                </button>
              </TooltipTrigger>
              <TooltipContent className="bg-card border-border">
                <div className="text-sm">
                  <p className="font-semibold">{getSeatLabel(seat.seat_number)}</p>
                  {isReserved ? (
                    <p className="text-muted-foreground">
                      {isConfirmed ? 'Confirmado' : 'Reservado'}{displayName ? `: ${displayName}` : ''}
                    </p>
                  ) : (
                    <p className="text-muted-foreground">R$ {price.toFixed(2)}</p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
      
      <div className="text-sm font-semibold text-muted-foreground">
        Mesa {table.table_number}
      </div>
    </div>
  );
}
