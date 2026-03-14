import { useState } from 'react';
import { Dinner } from '@/types/reservation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ChevronRight, Clock, Users, Utensils, ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Predefined food images
const FOOD_IMAGES = [
  { id: 'italian', label: 'Italiana', url: 'https://images.unsplash.com/photo-1498579150354-977475b7ea0b?w=400&h=250&fit=crop' },
  { id: 'bbq', label: 'Churrasco', url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&h=250&fit=crop' },
  { id: 'seafood', label: 'Frutos do Mar', url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=250&fit=crop' },
  { id: 'elegant', label: 'Jantar Elegante', url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=250&fit=crop' },
  { id: 'gourmet', label: 'Gourmet', url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&h=250&fit=crop' },
  { id: 'wine', label: 'Jantar com Vinho', url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=250&fit=crop' },
];

interface DinnerSelectorProps {
  dinners: Dinner[];
  onSelect: (dinner: Dinner) => void;
  isLoading?: boolean;
}

export function DinnerSelector({ dinners, onSelect, isLoading }: DinnerSelectorProps) {
  const enabledDinners = dinners.filter(d => d.enabled);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (enabledDinners.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
        <div className="bg-muted/50 rounded-full p-6 mb-6">
          <Calendar className="w-16 h-16 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Nenhum jantar disponível</h2>
        <p className="text-muted-foreground max-w-md">
          Atualmente não há eventos programados. Volte em breve para conferir novos jantares!
        </p>
      </div>
    );
  }

  const getDefaultImage = (index: number) => {
    return FOOD_IMAGES[index % FOOD_IMAGES.length].url;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center bg-primary/10 rounded-full p-4 mb-4">
          <Utensils className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-3xl font-bold mb-3">Escolha um Jantar</h2>
        <p className="text-muted-foreground text-lg">Selecione o evento para fazer sua reserva</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {enabledDinners.map((dinner, index) => (
          <Card 
            key={dinner.id}
            className={cn(
              "cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-primary/50",
              "group overflow-hidden"
            )}
            onClick={() => onSelect(dinner)}
          >
            {/* Image section */}
            <div className="relative h-48 overflow-hidden bg-muted">
              <img 
                src={dinner.image_url || getDefaultImage(index)}
                alt={dinner.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <h3 className="text-xl font-bold text-white drop-shadow-lg">{dinner.title}</h3>
              </div>
              <div className="absolute top-4 right-4">
                <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                  R$ {dinner.seat_price || 35}
                </span>
              </div>
            </div>

            <CardContent className="p-5">
              <div className="flex items-center gap-4 text-muted-foreground mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">
                    {format(new Date(dinner.event_date), "EEEE, d 'de' MMMM", { locale: ptBR })}
                  </span>
                </div>
                {dinner.event_time && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{dinner.event_time.slice(0, 5)}h</span>
                  </div>
                )}
              </div>

              {dinner.menu && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{dinner.menu}</p>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  R$ {dinner.seat_price || 35} por lugar
                </span>
                <div className="flex items-center gap-2 text-primary font-semibold group-hover:gap-3 transition-all">
                  Reservar
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export { FOOD_IMAGES };
