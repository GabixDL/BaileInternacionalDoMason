import { cn } from '@/lib/utils';
import { SeatStatus } from '@/types/reservation';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TableSeatProps {
  seatLabel: string;
  status: SeatStatus;
  reservedBy?: string | null;
  price: number;
  position: 'top' | 'bottom';
  index: number;
  onClick: () => void;
  disabled?: boolean;
}

export function TableSeat({
  seatLabel,
  status,
  reservedBy,
  price,
  position,
  index,
  onClick,
  disabled,
}: TableSeatProps) {
  const isReserved = status === 'reservado' || status === 'confirmado';
  const isSelected = status === 'selected';
  const isConfirmed = status === 'confirmado';

  // Truncate name for display
  const displayName = reservedBy
    ? reservedBy.length > 8
      ? reservedBy.substring(0, 7) + '…'
      : reservedBy
    : null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onClick}
          disabled={disabled || isReserved}
          className={cn(
            'relative w-12 h-10 rounded-lg transition-all duration-200 ease-out',
            'flex flex-col items-center justify-center text-xs font-medium',
            'border-2 shadow-sm',
            // Position-based styling
            position === 'top' && '-mb-1',
            position === 'bottom' && '-mt-1',
            // Status-based styling
            status === 'libre' && [
              'bg-green-500/20 border-green-500 text-green-700',
              'hover:bg-green-500/40 hover:scale-105 hover:shadow-md',
              'cursor-pointer',
            ],
            status === 'selected' && [
              'bg-seat-selected border-seat-selected text-seat-selected-foreground',
              'animate-seat-select shadow-lg',
              'hover:scale-105',
              'cursor-pointer',
            ],
            status === 'reservado' && [
              'bg-yellow-500/30 border-yellow-500/50 text-yellow-700',
              'cursor-not-allowed opacity-80',
            ],
            status === 'confirmado' && [
              'bg-red-500/30 border-red-500/50 text-red-700',
              'cursor-not-allowed opacity-80',
            ],
            // Disabled state
            disabled && !isReserved && 'opacity-50 cursor-not-allowed',
            // Animation delay based on index
            'animate-fade-in'
          )}
          style={{
            animationDelay: `${index * 30}ms`,
          }}
        >
          <span className="text-[10px] font-semibold leading-none">{seatLabel}</span>
          {isReserved && displayName && (
            <span className="text-[8px] leading-none mt-0.5 truncate max-w-full px-1">
              {displayName}
            </span>
          )}
          {isSelected && (
            <div className="absolute inset-0 rounded-lg animate-seat-glow pointer-events-none" />
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent 
        side={position === 'top' ? 'top' : 'bottom'}
        className="bg-card border-border"
      >
        <div className="text-sm">
          <p className="font-semibold">{seatLabel}</p>
          {isReserved ? (
            <p className="text-muted-foreground">
              {isConfirmed ? 'Confirmado' : 'Reservado'}{reservedBy ? `: ${reservedBy}` : ''}
            </p>
          ) : (
            <p className="text-muted-foreground">R$ {price.toFixed(2)}</p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
