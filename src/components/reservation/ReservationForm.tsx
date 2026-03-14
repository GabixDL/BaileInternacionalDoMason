import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { SelectedSeat } from '@/types/reservation';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Check, ArrowLeft, FileText, Image, Copy, Banknote, QrCode } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  userName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
});

type FormData = z.infer<typeof formSchema>;
type PaymentMethod = 'pix' | 'money';

interface ReservationFormProps {
  selectedSeats: SelectedSeat[];
  totalAmount: number;
  contactNumber: string;
  pixKey: string;
  dinnerId?: string | null;
  onBack: () => void;
  onSuccess: () => void;
}

export function ReservationForm({
  selectedSeats,
  totalAmount,
  contactNumber,
  pixKey,
  dinnerId,
  onBack,
  onSuccess,
}: ReservationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const copyPixKey = async () => {
    await navigator.clipboard.writeText(pixKey);
    toast({ title: 'Chave PIX copiada!' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: 'Arquivo inválido',
          description: 'Por favor, envie uma imagem (JPG, PNG, WebP) ou PDF.',
          variant: 'destructive',
        });
        return;
      }
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: 'O arquivo deve ter no máximo 5MB.',
          variant: 'destructive',
        });
        return;
      }
      setPaymentProof(file);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      // Check if seats are still reserved (they were reserved on click)
      const seatIds = selectedSeats.map(s => s.seatId);
      const { data: currentSeats, error: checkError } = await supabase
        .from('seats')
        .select('id, status')
        .in('id', seatIds);
      
      if (checkError) throw checkError;
      
      // Check if any seat was taken by someone else (status changed from reservado)
      const unavailableSeats = currentSeats?.filter(s => s.status === 'confirmado') || [];
      if (unavailableSeats.length > 0) {
        toast({
          title: 'Alguns assentos já foram confirmados',
          description: 'Por favor, selecione outros assentos.',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      let paymentProofUrl: string | null = null;

      // Upload payment proof only if provided (PIX)
      if (paymentProof) {
        const fileExt = paymentProof.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('payment-proofs')
          .upload(fileName, paymentProof);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('payment-proofs')
          .getPublicUrl(fileName);

        paymentProofUrl = urlData.publicUrl;
      }

      // Create reservation with status 'reservado'
      const { data: reservation, error: reservationError } = await supabase
        .from('reservations')
        .insert({
          user_name: data.userName,
          total_amount: totalAmount,
          payment_proof_url: paymentProofUrl,
          payment_method: paymentMethod,
          status: 'reservado',
          dinner_id: dinnerId || null,
        })
        .select()
        .single();

      if (reservationError) throw reservationError;

      // Update seats with reservation info - keep status 'reservado', add name and reservation_id
      const { error: seatsError } = await supabase
        .from('seats')
        .update({
          reserved_by: data.userName,
          reservation_id: reservation.id,
        })
        .in('id', seatIds);

      if (seatsError) throw seatsError;

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['seats'] });

      onSuccess();
    } catch (error) {
      console.error('Reservation error:', error);
      toast({
        title: 'Erro ao fazer reserva',
        description: 'Ocorreu um erro. Por favor, tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto animate-fade-in">
      <CardHeader>
        <CardTitle>Finalizar Reserva</CardTitle>
        <CardDescription>
          Enviar pagamento a esse PIX ou escolher opção de pagamento via dinheiro
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {/* Summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Assentos</span>
              <span className="font-medium">
                {selectedSeats.map(s => s.seatLabel).join(', ')}
              </span>
            </div>
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span className="text-primary">R$ {totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Name input - more prominent */}
          <div className="space-y-2">
            <Label htmlFor="userName" className="text-base font-semibold">Nome completo</Label>
            <Input
              id="userName"
              placeholder="Digite seu nome completo"
              {...register('userName')}
              className={cn(
                'h-12 text-lg font-medium',
                errors.userName && 'border-destructive'
              )}
            />
            {errors.userName && (
              <p className="text-sm text-destructive">{errors.userName.message}</p>
            )}
          </div>

          {/* Payment method selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Forma de pagamento</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className={cn(
                  'flex items-center justify-center gap-2 border-2 rounded-lg p-4 transition-all',
                  paymentMethod === 'pix'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
                onClick={() => setPaymentMethod('pix')}
              >
                <QrCode className="w-5 h-5" />
                PIX
              </button>
              <button
                type="button"
                className={cn(
                  'flex items-center justify-center gap-2 border-2 rounded-lg p-4 transition-all',
                  paymentMethod === 'money'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
                onClick={() => setPaymentMethod('money')}
              >
                <Banknote className="w-5 h-5" />
                Dinheiro
              </button>
            </div>
          </div>

          {/* PIX Key - only show if PIX selected */}
          {paymentMethod === 'pix' && (
            <div className="bg-primary/10 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium text-center">Chave PIX para pagamento:</p>
              <div className="flex items-center gap-2">
                <Input
                  value={pixKey || 'Chave PIX não configurada'}
                  readOnly
                  className="text-center font-mono text-lg bg-background"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={copyPixKey}
                  className="shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Payment proof upload - optional for PIX */}
          {paymentMethod === 'pix' && (
            <div className="space-y-2">
              <Label>Comprovante de pagamento <span className="text-muted-foreground">(opcional)</span></Label>
              <div
                className={cn(
                  'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors',
                  'hover:border-primary/50 hover:bg-muted/50',
                  paymentProof ? 'border-primary bg-primary/5' : 'border-border'
                )}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {paymentProof ? (
                  <div className="flex items-center justify-center gap-2 text-primary">
                    {paymentProof.type === 'application/pdf' ? (
                      <FileText className="w-8 h-8" />
                    ) : (
                      <Image className="w-8 h-8" />
                    )}
                    <div className="text-left">
                      <p className="font-medium">{paymentProof.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(paymentProof.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <Check className="w-5 h-5 ml-2" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Clique para enviar imagem ou PDF
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Máximo 5MB
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Money payment info */}
          {paymentMethod === 'money' && (
            <div className="bg-accent/20 rounded-lg p-4 text-center space-y-2">
              <Banknote className="w-8 h-8 mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">
                O pagamento em dinheiro será feito no local do evento.
              </p>
              <p className="font-medium">
                Entre em contato para confirmar:
              </p>
              <p className="font-bold text-lg">{contactNumber}</p>
            </div>
          )}

          {/* Contact info - only show for PIX */}
          {paymentMethod === 'pix' && (
            <div className="bg-accent/20 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">
                Envie também o comprovante para:
              </p>
              <p className="font-bold text-lg">{contactNumber}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isSubmitting}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Confirmar Reserva
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
