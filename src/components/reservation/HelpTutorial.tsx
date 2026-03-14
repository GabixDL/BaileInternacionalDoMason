import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  HelpCircle, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  MousePointerClick, 
  CreditCard, 
  CheckCircle, 
  MapPin 
} from 'lucide-react';

const STEPS = [
  {
    icon: MapPin,
    title: 'Passo 1 — Escolha a Mesa',
    description: 'Você verá o mapa com as mesas disponíveis. Cada mesa tem cadeiras ao redor. Observe as cores:',
    details: [
      { color: 'bg-seat-available', label: 'Verde', meaning: 'Lugar disponível — pode selecionar!' },
      { color: 'bg-seat-selected', label: 'Dourado', meaning: 'Lugar que você selecionou' },
      { color: 'bg-seat-reserved', label: 'Vermelho', meaning: 'Lugar já reservado por outra pessoa' },
    ],
  },
  {
    icon: MousePointerClick,
    title: 'Passo 2 — Selecione os Lugares',
    description: 'Toque ou clique nos lugares verdes (disponíveis) para selecioná-los. Eles ficarão dourados. Se mudar de ideia, desmarque na parte de reserva o assento que não deseja mais.',
    tip: 'Você pode selecionar vários lugares ao mesmo tempo!',
  },
  {
    icon: CreditCard,
    title: 'Passo 3 — Preencha seus Dados',
    description: 'Depois de escolher os lugares, clique em "Continuar" no resumo lateral. Preencha seu nome e escolha a forma de pagamento:',
    details: [
      { color: 'bg-primary', label: 'PIX', meaning: 'Pagamento instantâneo via PIX — copie a chave e envie o comprovante' },
      { color: 'bg-primary', label: 'Dinheiro', meaning: 'Pague em dinheiro no dia do evento' },
    ],
  },
  {
    icon: CheckCircle,
    title: 'Passo 4 — Confirmação',
    description: 'Após enviar, sua reserva ficará com status "Reservado". O administrador confirmará seu pagamento e seu lugar será garantido!',
    tip: 'Guarde o número de contato para dúvidas sobre sua reserva.',
  },
];

export function HelpTutorial() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const step = STEPS[currentStep];
  const Icon = step.icon;

  if (!isOpen) {
    return (
      <Button
        onClick={() => { setIsOpen(true); setCurrentStep(0); }}
        variant="outline"
        size="sm"
        className="gap-2 border-primary/40 text-primary hover:bg-primary/10"
      >
        <HelpCircle className="w-4 h-4" />
        <span className="hidden sm:inline">Como funciona?</span>
        <span className="sm:hidden">Ajuda</span>
      </Button>
    );
  }

  return (
    <>
      {/* 1. Backdrop con z-index alto */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[9998] animate-in fade-in duration-300" 
        onClick={() => setIsOpen(false)} 
      />

      {/* 2. Wrapper de Centrado Absoluto */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center min-h-screen min-w-screen pointer-events-none">
        
        {/* 3. El Modal con control de altura y ancho */}
        <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-lg max-h-[90dvh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-bottom-2 duration-300 pointer-events-auto">
          
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border shrink-0 bg-card">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Como Reservar</h2>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsOpen(false)} 
              className="text-muted-foreground hover:bg-secondary rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Progress Bar */}
          <div className="flex gap-1.5 px-5 pt-4 shrink-0 bg-card">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full flex-1 transition-all duration-500 ${
                  i === currentStep ? 'bg-primary' : i < currentStep ? 'bg-primary/40' : 'bg-border'
                }`}
              />
            ))}
          </div>

          {/* Content (Scrollable) */}
          <div className="p-5 space-y-4 overflow-y-auto">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground leading-tight">{step.title}</h3>
            </div>

            <p className="text-muted-foreground leading-relaxed">{step.description}</p>

            {step.details && (
              <div className="space-y-2 pt-2">
                {step.details.map((detail, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50">
                    <div className={`w-4 h-4 rounded-full ${detail.color} shrink-0 shadow-sm`} />
                    <p className="text-sm">
                      <span className="font-bold text-foreground">{detail.label}: </span>
                      <span className="text-muted-foreground">{detail.meaning}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}

            {step.tip && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 border-dashed">
                <p className="text-sm text-primary font-medium flex gap-2">
                  <span>💡</span> {step.tip}
                </p>
              </div>
            )}
          </div>

          {/* Navigation Footer */}
          <div className="flex items-center justify-between p-5 border-t border-border shrink-0 bg-muted/30">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentStep(prev => prev - 1)}
              disabled={currentStep === 0}
              className="gap-1 px-4"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </Button>

            <span className="text-xs font-bold text-muted-foreground tabular-nums">
              {currentStep + 1} / {STEPS.length}
            </span>

            {currentStep < STEPS.length - 1 ? (
              <Button
                variant="default"
                size="sm"
                onClick={() => setCurrentStep(prev => prev + 1)}
                className="gap-1 px-4"
              >
                Próximo
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="gap-1 px-6 bg-primary hover:bg-primary/90"
              >
                Entendi!
                <CheckCircle className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}