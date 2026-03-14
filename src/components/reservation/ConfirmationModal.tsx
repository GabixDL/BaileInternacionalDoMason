import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SelectedSeat } from '@/types/reservation';
import { Check, MessageCircle, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSeats: SelectedSeat[];
  totalAmount: number;
  contactNumber: string;
}

export function ConfirmationModal({
  isOpen,
  onClose,
  selectedSeats,
  totalAmount,
  contactNumber,
}: ConfirmationModalProps) {
  const { toast } = useToast();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(contactNumber);
    toast({
      title: 'Copiado!',
      description: 'Número de contato copiado para a área de transferência.',
    });
  };

  const openWhatsApp = () => {
    const message = encodeURIComponent(
      `Olá! Acabei de fazer uma reserva de ${selectedSeats.length} assento(s): ${selectedSeats.map(s => s.seatLabel).join(', ')}. Total: R$ ${totalAmount.toFixed(2)}`
    );
    const phoneNumber = contactNumber.replace(/\D/g, '');
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-seat-available/20 flex items-center justify-center">
            <Check className="w-8 h-8 text-seat-available" />
          </div>
          <DialogTitle className="text-center text-2xl">
            Reserva Confirmada!
          </DialogTitle>
          <DialogDescription className="text-center">
            Sua reserva foi registrada com sucesso
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Reserved seats */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <p className="text-sm text-muted-foreground">Assentos reservados:</p>
            <div className="flex flex-wrap gap-2">
              {selectedSeats.map(seat => (
                <span
                  key={seat.seatId}
                  className="px-2 py-1 bg-primary/10 text-primary rounded font-mono text-sm"
                >
                  {seat.seatLabel}
                </span>
              ))}
            </div>
            <p className="text-lg font-bold pt-2">
              Total: R$ {totalAmount.toFixed(2)}
            </p>
          </div>

          {/* Contact section */}
          <div className="bg-accent/20 rounded-lg p-4 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Lembre-se de enviar o comprovante para:
            </p>
            <div className="flex items-center justify-center gap-2">
              <span className="font-bold text-xl">{contactNumber}</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={copyToClipboard}
                className="h-8 w-8"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
            <Button
              onClick={openWhatsApp}
              className="w-full gap-2 bg-green-600 hover:bg-green-700"
            >
              <MessageCircle className="w-5 h-5" />
              Abrir WhatsApp
            </Button>
          </div>
        </div>

        <div className="flex justify-center">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
