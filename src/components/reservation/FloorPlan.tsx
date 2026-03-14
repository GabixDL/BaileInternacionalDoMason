import { Table, Seat, SelectedSeat } from '@/types/reservation';
import { RectangularTable } from './RectangularTable';
import { RoundTable } from './RoundTable';
import { useRealtimeSeats, useRealtimeTables } from '@/hooks/useRealtimeSeats';
import { Loader2 } from 'lucide-react';

interface FloorPlanProps {
  tables: Table[];
  seats: Seat[];
  selectedSeats: SelectedSeat[];
  onSeatClick: (seat: Seat, table: Table) => void;
  price: number;
  isLoading?: boolean;
  hideNames?: boolean;
}

export function FloorPlan({
  tables,
  seats,
  selectedSeats,
  onSeatClick,
  price,
  isLoading,
  hideNames = false,
}: FloorPlanProps) {
  // Subscribe to realtime updates
  useRealtimeSeats();
  useRealtimeTables();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (tables.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-muted-foreground">
        <p>Nenhuma mesa disponível no momento.</p>
      </div>
    );
  }

  // Get seats for each table
  const getTableSeats = (tableId: string) => {
    return seats.filter(seat => seat.table_id === tableId);
  };

  return (
    <div className="relative w-full overflow-auto">
      {/* Floor pattern background */}
      <div className="floor-pattern bg-floor rounded-2xl p-4 sm:p-6 md:p-10 lg:p-12 min-h-[500px]">
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-8 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500/20 border-2 border-green-500" />
            <span className="text-sm text-muted-foreground">Livre</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-seat-selected border-2 border-seat-selected" />
            <span className="text-sm text-muted-foreground">Selecionado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500/30 border-2 border-yellow-500/50" />
            <span className="text-sm text-muted-foreground">Reservado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500/30 border-2 border-red-500/50" />
            <span className="text-sm text-muted-foreground">Confirmado</span>
          </div>
        </div>

        {/* Tables grid */}
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-8 md:gap-12 lg:gap-16 justify-items-center max-w-7xl mx-auto">
          {tables.map((table, index) => (
            table.shape === 'round' ? (
              <RoundTable
                key={table.id}
                table={table}
                seats={getTableSeats(table.id)}
                selectedSeats={selectedSeats}
                onSeatClick={onSeatClick}
                price={price}
                animationDelay={index * 100}
                hideNames={hideNames}
              />
            ) : (
              <RectangularTable
                key={table.id}
                table={table}
                seats={getTableSeats(table.id)}
                selectedSeats={selectedSeats}
                onSeatClick={onSeatClick}
                price={price}
                animationDelay={index * 100}
                hideNames={hideNames}
              />
            )
          ))}
        </div>
      </div>
    </div>
  );
}
