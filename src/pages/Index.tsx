import { useState, useRef, useEffect } from 'react';
import { Table, Seat, SelectedSeat, Dinner } from '@/types/reservation';
import { useTables, useSeats, useAppSettings, useDinners } from '@/hooks/useReservationData';
import { useRealtimeSeats, useRealtimeTables } from '@/hooks/useRealtimeSeats';
import { FloorPlan } from '@/components/reservation/FloorPlan';
import { ReservationSummary } from '@/components/reservation/ReservationSummary';
import { ReservationForm } from '@/components/reservation/ReservationForm';
import { ConfirmationModal } from '@/components/reservation/ConfirmationModal';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Settings, ArrowLeft, ChevronDown, Calendar, Clock, MapPin, Utensils } from 'lucide-react';
import { HelpTutorial } from '@/components/reservation/HelpTutorial';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Step = 'landing' | 'select' | 'form';

const Index = () => {
  const [selectedDinner, setSelectedDinner] = useState<Dinner | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([]);
  const [step, setStep] = useState<Step>('landing');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { toast } = useToast();
  const reservationRef = useRef<HTMLDivElement>(null);

  useRealtimeSeats();
  useRealtimeTables();

  const { data: dinners = [], isLoading: dinnersLoading } = useDinners();
  const { data: tables = [], isLoading: tablesLoading } = useTables(selectedDinner?.id);
  const { data: seats = [], isLoading: seatsLoading } = useSeats(selectedDinner?.id);
  const { data: settings } = useAppSettings();

  const enabledDinners = dinners.filter(d => d.enabled);
  const firstDinner = enabledDinners[0] || null;

  const price = selectedDinner?.seat_price || firstDinner?.seat_price || 35;
  const contactNumber = selectedDinner?.contact_number || settings?.contact_number || '+55 11 99999-9999';
  const pixKey = selectedDinner?.pix_key || settings?.pix_key || '123456789';
  const hideNames = selectedDinner?.hide_names || false;
  const totalAmount = selectedSeats.length * price;

  const scrollToReservation = () => {
    reservationRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleStartReservation = (dinner: Dinner) => {
    setSelectedDinner(dinner);
    setStep('select');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToLanding = async () => {
    for (const seat of selectedSeats) {
      await supabase.from('seats').update({ status: 'libre', reserved_by: null }).eq('id', seat.seatId);
    }
    setSelectedSeats([]);
    setSelectedDinner(null);
    setStep('landing');
  };

  const handleSeatClick = async (seat: Seat, table: Table) => {
    if (seat.status === 'reservado' || seat.status === 'confirmado') return;

    const seatLabel = `${table.table_number}-${seat.seat_number.toString().padStart(2, '0')}`;
    const existing = selectedSeats.find(s => s.seatId === seat.id);

    if (existing) {
      await supabase.from('seats').update({ status: 'libre', reserved_by: null }).eq('id', seat.id);
      setSelectedSeats(prev => prev.filter(s => s.seatId !== seat.id));
    } else {
      const { data, error } = await supabase
        .from('seats')
        .update({ status: 'reservado', reserved_by: 'Selecionando...' })
        .eq('id', seat.id)
        .eq('status', 'libre')
        .select();
      
      if (error) {
        toast({ title: 'Erro ao reservar lugar', variant: 'destructive' });
        return;
      }
      if (!data || data.length === 0) {
        toast({ title: 'Lugar já reservado por outra pessoa', variant: 'destructive' });
        return;
      }
      
      setSelectedSeats(prev => [...prev, { seatId: seat.id, tableNumber: table.table_number, seatNumber: seat.seat_number, seatLabel }]);
    }
  };

  const handleRemoveSeat = async (seatId: string) => {
    await supabase.from('seats').update({ status: 'libre', reserved_by: null }).eq('id', seatId);
    setSelectedSeats(prev => prev.filter(s => s.seatId !== seatId));
  };

  const handleSuccess = () => setShowConfirmation(true);

  const handleCloseConfirmation = () => {
    setShowConfirmation(false);
    setSelectedSeats([]);
    setStep('landing');
    setSelectedDinner(null);
  };

  // Scroll tracking for hero animation
  const [scrolled, setScrolled] = useState(false);
  const [ctaVisible, setCtaVisible] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!ctaRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setCtaVisible(entry.isIntersecting),
      { threshold: 0.2 }
    );
    observer.observe(ctaRef.current);
    return () => observer.disconnect();
  }, [step]);

  // Landing page view
  if (step === 'landing') {
    return (
      <div className="min-h-screen bg-background">
        {/* Admin link */}
        <div className="fixed top-4 right-4 z-50">
          <Link to="/admin">
            <Button variant="ghost" size="icon" className="text-foreground/40 hover:text-foreground/70">
              <Settings className="w-5 h-5" />
            </Button>
          </Link>
        </div>

        {/* Hero Section - Full viewport */}
        <section className="min-h-screen flex flex-col items-center justify-center relative hero-gradient overflow-hidden px-4">
          
          {/* Decorative masonic compass/square SVG background */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04]">
            <svg viewBox="0 0 400 400" className="w-[600px] h-[600px] md:w-[800px] md:h-[800px] compass-rotate">
              {/* Square */}
              <path d="M200 60 L340 200 L200 340 L60 200 Z" fill="none" stroke="hsl(43,85%,60%)" strokeWidth="1" />
              {/* Compass legs */}
              <line x1="200" y1="40" x2="120" y2="360" stroke="hsl(43,85%,60%)" strokeWidth="0.8" className="compass-line" />
              <line x1="200" y1="40" x2="280" y2="360" stroke="hsl(43,85%,60%)" strokeWidth="0.8" className="compass-line" />
              {/* Circle */}
              <circle cx="200" cy="200" r="160" fill="none" stroke="hsl(43,85%,60%)" strokeWidth="0.5" />
              <circle cx="200" cy="200" r="120" fill="none" stroke="hsl(43,85%,60%)" strokeWidth="0.3" />
            </svg>
          </div>

          {/* Small decorative elements */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[15%] left-[8%] w-1 h-1 bg-primary/30 rounded-full" />
            <div className="absolute top-[25%] right-[12%] w-1.5 h-1.5 bg-primary/20 rounded-full" />
            <div className="absolute bottom-[20%] left-[15%] w-1 h-1 bg-primary/25 rounded-full" />
            <div className="absolute bottom-[30%] right-[10%] w-2 h-2 bg-primary/15 rounded-full" />
          </div>

          {/* Logo - large, no circle border, blended with bg */}
          <div className={`hero-logo-wrapper relative ${scrolled ? 'scrolled' : ''}`}>
            <div className="logo-glow-ring" />
            <div className="logo-glow-ring-2" />
            <div className="logo-float relative">
              <img 
                src="/loja.png" 
                alt="Loja Maçônica Caridade Santanense Nº 2" 
                className="w-48 h-48 sm:w-60 sm:h-60 md:w-80 md:h-80 lg:w-96 lg:h-96 object-contain drop-shadow-[0_0_40px_hsl(43_85%_60%/0.2)]"
              />
            </div>
          </div>

          {/* Title - also animated on scroll */}
          <div className={`hero-content mt-6 md:mt-8 flex flex-col items-center ${scrolled ? 'scrolled' : ''}`}>
            <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-foreground gold-glow tracking-tight text-center mb-2 md:mb-3 px-2">
              Baile do Mason
            </h1>
            <p className="text-sm sm:text-lg md:text-2xl text-primary font-medium tracking-[0.25em] uppercase text-center mb-8 md:mb-12 px-4">
              Caridade Santanense Nº 2
            </p>

            {/* Decorative compass + square divider */}
            <div className="flex items-center gap-3 mb-6 opacity-60">
              <div className="h-px w-12 md:w-20 bg-gradient-to-r from-transparent to-primary" />
              <img src="/escuadra.png" alt="Escuadra y Compás" className="w-10 h-10 md:w-14 md:h-14 object-contain" />
              <div className="h-px w-12 md:w-20 bg-gradient-to-l from-transparent to-primary" />
            </div>
          </div>

          {/* Scroll indicator */}
          <button onClick={scrollToReservation} className="scroll-indicator mt-4 flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors cursor-pointer">
            <span className="text-xs md:text-sm tracking-wider uppercase">Fazer Reserva</span>
            <ChevronDown className="w-6 h-6" />
          </button>
        </section>

        {/* Dinner Info Section */}
        <section ref={(el) => { (reservationRef as any).current = el; (ctaRef as any).current = el; }} className="min-h-screen py-20 px-4">
          <div className={`max-w-3xl mx-auto cta-reveal ${ctaVisible ? 'visible' : ''}`}>
            <h2 className="text-3xl md:text-4xl font-bold text-center text-foreground mb-4">
              Fazer Reserva para a Janta
            </h2>
            <div className="w-24 h-1 bg-primary mx-auto rounded-full mb-12" />

            {dinnersLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : enabledDinners.length === 0 ? (
              <div className="text-center py-20">
                <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum jantar disponível</h3>
                <p className="text-muted-foreground">Volte em breve para conferir novos eventos!</p>
              </div>
            ) : (
              <div className="space-y-8">
                {enabledDinners.map((dinner) => (
                  <Card key={dinner.id} className="overflow-hidden border-primary/20 bg-card/80 backdrop-blur-sm">
                    {dinner.image_url && (
                      <div className="h-48 overflow-hidden">
                        <img src={dinner.image_url} alt={dinner.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <CardContent className="p-8">
                      <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-3">
                        <Utensils className="w-6 h-6 text-primary" />
                        {dinner.title}
                      </h3>

                      <div className="grid sm:grid-cols-2 gap-4 mb-8">
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <Calendar className="w-5 h-5 text-primary shrink-0" />
                          <span>{format(new Date(dinner.event_date), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
                        </div>
                        {dinner.event_time && (
                          <div className="flex items-center gap-3 text-muted-foreground">
                            <Clock className="w-5 h-5 text-primary shrink-0" />
                            <span>{dinner.event_time.slice(0, 5)}h</span>
                          </div>
                        )}
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <MapPin className="w-5 h-5 text-primary shrink-0" />
                          <span>Loja Caridade Santanense Nº 2</span>
                        </div>
                        <div className="flex items-center gap-3 text-foreground font-semibold">
                          <span className="w-5 h-5 flex items-center justify-center text-primary shrink-0 font-bold">R$</span>
                          <span>{dinner.seat_price || 35} por lugar</span>
                        </div>
                      </div>

                      {dinner.menu && (
                        <div className="mb-8 p-4 rounded-lg bg-secondary/50 border border-border">
                          <p className="text-sm font-semibold text-primary mb-2 uppercase tracking-wider">Cardápio</p>
                          <p className="text-muted-foreground whitespace-pre-line">{dinner.menu}</p>
                        </div>
                      )}

                      <Button 
                        size="lg" 
                        className="w-full text-lg py-6 font-bold tracking-wide"
                        onClick={() => handleStartReservation(dinner)}
                      >
                        Reservar Lugar
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    );
  }

  // Reservation flow (select seats / form)
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBackToLanding}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Reserva de Lugares</h1>
              {selectedDinner && (
                <p className="text-sm text-muted-foreground">{selectedDinner.title}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <HelpTutorial />
            <Link to="/admin">
              <Button variant="ghost" size="icon" className="text-foreground/40 hover:text-foreground/70">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {step === 'select' && (
          <div className="grid lg:grid-cols-[1fr,320px] gap-6">
            <FloorPlan
              tables={tables}
              seats={seats}
              selectedSeats={selectedSeats}
              onSeatClick={handleSeatClick}
              price={price}
              isLoading={tablesLoading || seatsLoading}
              hideNames={hideNames}
            />
            <aside>
              <ReservationSummary
                selectedSeats={selectedSeats}
                price={price}
                onRemoveSeat={handleRemoveSeat}
                onContinue={() => setStep('form')}
              />
            </aside>
          </div>
        )}

        {step === 'form' && (
          <ReservationForm
            selectedSeats={selectedSeats}
            totalAmount={totalAmount}
            contactNumber={contactNumber}
            pixKey={pixKey}
            dinnerId={selectedDinner?.id}
            onBack={() => setStep('select')}
            onSuccess={handleSuccess}
          />
        )}
      </main>

      <ConfirmationModal
        isOpen={showConfirmation}
        onClose={handleCloseConfirmation}
        selectedSeats={selectedSeats}
        totalAmount={totalAmount}
        contactNumber={contactNumber}
      />
    </div>
  );
};

export default Index;
