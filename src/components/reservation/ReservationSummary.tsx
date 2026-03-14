import { SelectedSeat } from '@/types/reservation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, ShoppingCart, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReservationSummaryProps {
  selectedSeats: SelectedSeat[];
  price: number;
  onRemoveSeat: (seatId: string) => void;
  onContinue: () => void;
}

export function ReservationSummary({
  selectedSeats,
  price,
  onRemoveSeat,
  onContinue,
}: ReservationSummaryProps) {
  const totalAmount = selectedSeats.length * price;

  return (
    <Card className="sticky top-4 animate-slide-in-right shadow-lg border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ShoppingCart className="w-5 h-5 text-primary" />
          Sua Reserva
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected seats */}
        {selectedSeats.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">
            Selecione os assentos desejados no mapa
          </p>
        ) : (
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {selectedSeats.map((seat, index) => (
              <div
                key={seat.seatId}
                className={cn(
                  'flex items-center justify-between p-2 rounded-lg bg-muted/50',
                  'animate-fade-in'
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="font-mono">
                    {seat.seatLabel}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Mesa {seat.tableNumber}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-destructive"
                  onClick={() => onRemoveSeat(seat.seatId)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Price summary */}
        <div className="border-t border-border pt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Assentos selecionados</span>
            <span className="font-medium">{selectedSeats.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Preço por assento</span>
            <span className="font-medium">R$ {price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
            <span>Total</span>
            <span className="text-primary">R$ {totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          className="w-full gap-2"
          size="lg"
          disabled={selectedSeats.length === 0}
          onClick={onContinue}
        >
          Continuar
          <ArrowRight className="w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
