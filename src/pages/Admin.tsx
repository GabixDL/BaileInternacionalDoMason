import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useDinners } from '@/hooks/useReservationData';
import { useRealtimeSeats, useRealtimeTables } from '@/hooks/useRealtimeSeats';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, LogOut, Plus, Trash2, Calendar, Edit, Clock, ImageIcon, Check, Upload } from 'lucide-react';
import { Dinner } from '@/types/reservation';
import { cn } from '@/lib/utils';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DinnerAdmin } from '@/components/admin/DinnerAdmin';
import { FOOD_IMAGES } from '@/components/reservation/DinnerSelector';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDinner, setSelectedDinner] = useState<Dinner | null>(null);
  
  // Dinner form state
  const [editingDinner, setEditingDinner] = useState<Dinner | null>(null);
  const [dinnerFormOpen, setDinnerFormOpen] = useState(false);
  const [dinnerTitle, setDinnerTitle] = useState('');
  const [dinnerDate, setDinnerDate] = useState<Date | undefined>();
  const [dinnerTime, setDinnerTime] = useState('20:00');
  const [dinnerMenu, setDinnerMenu] = useState('');
  const [dinnerSeatPrice, setDinnerSeatPrice] = useState('35');
  const [dinnerPixKey, setDinnerPixKey] = useState('');
  const [dinnerContactNumber, setDinnerContactNumber] = useState('');
  const [dinnerImageUrl, setDinnerImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: dinners = [], isLoading: dinnersLoading } = useDinners();

  // Enable realtime updates
  useRealtimeSeats();
  useRealtimeTables();

  const handleLogin = () => {
    setIsLoading(true);
    if (password === 'admin123') {
      setIsAuthenticated(true);
      toast({ title: 'Login realizado!' });
    } else {
      toast({ title: 'Senha incorreta', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  // Upload image to storage
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Arquivo deve ser uma imagem', variant: 'destructive' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Imagem deve ter no máximo 5MB', variant: 'destructive' });
      return;
    }

    setIsUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `dinners/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('dinner-images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('dinner-images')
        .getPublicUrl(filePath);

      setDinnerImageUrl(urlData.publicUrl);
      toast({ title: 'Imagem enviada com sucesso!' });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({ title: 'Erro ao enviar imagem', variant: 'destructive' });
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Open form for new dinner
  const openNewDinnerForm = () => {
    setEditingDinner(null);
    setDinnerTitle('');
    setDinnerDate(undefined);
    setDinnerTime('20:00');
    setDinnerMenu('');
    setDinnerSeatPrice('35');
    setDinnerPixKey('');
    setDinnerContactNumber('');
    setDinnerImageUrl('');
    setDinnerFormOpen(true);
  };

  // Open form to edit existing dinner
  const openEditDinnerForm = (dinner: Dinner) => {
    setEditingDinner(dinner);
    setDinnerTitle(dinner.title);
    setDinnerDate(new Date(dinner.event_date));
    setDinnerTime(dinner.event_time?.slice(0, 5) || '20:00');
    setDinnerMenu(dinner.menu || '');
    setDinnerSeatPrice(String(dinner.seat_price || 35));
    setDinnerPixKey(dinner.pix_key || '');
    setDinnerContactNumber(dinner.contact_number || '');
    setDinnerImageUrl(dinner.image_url || '');
    setDinnerFormOpen(true);
  };

  // Save dinner (create or update)
  const saveDinner = async () => {
    if (!dinnerTitle || !dinnerDate) {
      toast({ title: 'Complete o título e a data', variant: 'destructive' });
      return;
    }
    
    const dinnerData = {
      title: dinnerTitle,
      event_date: format(dinnerDate, 'yyyy-MM-dd'),
      event_time: dinnerTime,
      menu: dinnerMenu || null,
      seat_price: parseFloat(dinnerSeatPrice) || 35,
      pix_key: dinnerPixKey || null,
      contact_number: dinnerContactNumber || null,
      image_url: dinnerImageUrl || null,
    };
    
    if (editingDinner) {
      const { error } = await supabase.from('dinners').update(dinnerData).eq('id', editingDinner.id);
      if (error) {
        toast({ title: 'Erro ao atualizar', variant: 'destructive' });
        return;
      }
      toast({ title: 'Jantar atualizado!' });
    } else {
      // Create dinner
      const { data: newDinner, error } = await supabase.from('dinners').insert(dinnerData).select().single();
      if (error || !newDinner) {
        toast({ title: 'Erro ao criar', variant: 'destructive' });
        return;
      }
      
      // Create 4 default tables: 2 rectangular + 2 round, 12 seats each
      const defaultTables = [
        { tableNum: 1, shape: 'rectangular' },
        { tableNum: 2, shape: 'rectangular' },
        { tableNum: 3, shape: 'round' },
        { tableNum: 4, shape: 'round' },
      ];
      
      for (const tableConfig of defaultTables) {
        const { data: newTable, error: tableError } = await supabase
          .from('tables')
          .insert({ 
            dinner_id: newDinner.id, 
            table_number: tableConfig.tableNum, 
            seat_count: 12, 
            shape: tableConfig.shape, 
            enabled: true 
          })
          .select()
          .single();
        
        if (!tableError && newTable) {
          const seatInserts = Array.from({ length: 12 }, (_, i) => ({
            table_id: newTable.id,
            seat_number: i + 1,
            status: 'libre'
          }));
          await supabase.from('seats').insert(seatInserts);
        }
      }
      
      toast({ title: 'Jantar criado com 4 mesas!' });
    }
    
    setDinnerFormOpen(false);
    queryClient.invalidateQueries({ queryKey: ['dinners'] });
    queryClient.invalidateQueries({ queryKey: ['all-tables'] });
    queryClient.invalidateQueries({ queryKey: ['tables'] });
    queryClient.invalidateQueries({ queryKey: ['seats'] });
  };

  const toggleDinner = async (dinnerId: string, enabled: boolean) => {
    await supabase.from('dinners').update({ enabled }).eq('id', dinnerId);
    queryClient.invalidateQueries({ queryKey: ['dinners'] });
  };

  const deleteDinner = async (dinnerId: string) => {
    if (!confirm('Excluir este jantar e todas as suas mesas?')) return;
    await supabase.from('dinners').delete().eq('id', dinnerId);
    queryClient.invalidateQueries({ queryKey: ['dinners'] });
    queryClient.invalidateQueries({ queryKey: ['all-tables'] });
    queryClient.invalidateQueries({ queryKey: ['seats'] });
    toast({ title: 'Jantar excluído!' });
  };


  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Login Admin</CardTitle>
            <CardDescription>Digite a senha para acessar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input 
              type="password" 
              placeholder="Senha" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              onKeyDown={e => e.key === 'Enter' && handleLogin()} 
            />
            <Button className="w-full" onClick={handleLogin} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Entrar'}
            </Button>
            <Button variant="ghost" className="w-full" onClick={() => navigate('/')}>Voltar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If a dinner is selected, show its admin panel
  if (selectedDinner) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold">Painel Admin</h1>
            <Button variant="ghost" onClick={() => setIsAuthenticated(false)}>
              <LogOut className="w-4 h-4 mr-2" />Sair
            </Button>
          </div>
        </header>
        <main className="container mx-auto px-4 py-6">
          <DinnerAdmin 
            dinner={selectedDinner} 
            onBack={() => setSelectedDinner(null)} 
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Painel Admin</h1>
          <Button variant="ghost" onClick={() => setIsAuthenticated(false)}>
            <LogOut className="w-4 h-4 mr-2" />Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Dinners Management */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />Gestão de Jantares
              </CardTitle>
              <CardDescription>Crie e administre os eventos. Clique em um jantar para gerenciar suas mesas e reservas.</CardDescription>
            </div>
            <Button onClick={openNewDinnerForm}>
              <Plus className="w-4 h-4 mr-2" />Novo Jantar
            </Button>
          </CardHeader>
          <CardContent>
            {dinnersLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : dinners.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum jantar criado</p>
                <p className="text-sm">Crie seu primeiro jantar para começar</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dinners.map((dinner, index) => (
                  <Card 
                    key={dinner.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 group overflow-hidden",
                      !dinner.enabled && "opacity-60"
                    )}
                    onClick={() => setSelectedDinner(dinner)}
                  >
                    {/* Image */}
                    <div className="relative h-32 overflow-hidden bg-muted">
                      <img 
                        src={dinner.image_url || FOOD_IMAGES[index % FOOD_IMAGES.length].url}
                        alt={dinner.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute bottom-2 left-3">
                        <h3 className="font-semibold text-white drop-shadow-lg">
                          {dinner.title}
                        </h3>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(dinner.event_date), "EEE, d MMM yyyy", { locale: ptBR })}
                          {dinner.event_time && (
                            <>
                              <Clock className="w-4 h-4 ml-2" />
                              {dinner.event_time.slice(0, 5)}h
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => openEditDinnerForm(dinner)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Switch 
                            checked={dinner.enabled} 
                            onCheckedChange={v => toggleDinner(dinner.id, v)}
                          />
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8"
                            onClick={() => deleteDinner(dinner.id)}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">R$ {dinner.seat_price || 35}/lugar</Badge>
                      </div>
                      {dinner.menu && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {dinner.menu}
                        </p>
                      )}
                      {!dinner.enabled && <Badge variant="outline" className="mt-2">Desativado</Badge>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </main>

      {/* Dinner Form Dialog */}
      <Dialog open={dinnerFormOpen} onOpenChange={setDinnerFormOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingDinner ? 'Editar Jantar' : 'Novo Jantar'}</DialogTitle>
            <DialogDescription>
              {editingDinner ? 'Modifique os dados do evento' : 'Preencha os dados do novo evento'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Título</label>
              <Input 
                placeholder="Ex: Jantar de Natal 2024" 
                value={dinnerTitle} 
                onChange={e => setDinnerTitle(e.target.value)} 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Data</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar className="w-4 h-4 mr-2" />
                      {dinnerDate ? format(dinnerDate, 'dd/MM/yyyy') : 'Selecionar'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={dinnerDate}
                      onSelect={setDinnerDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-sm font-medium">Horário</label>
                <Input 
                  type="time" 
                  value={dinnerTime} 
                  onChange={e => setDinnerTime(e.target.value)} 
                />
              </div>
            </div>

            {/* Image Selection */}
            <div>
              <label className="text-sm font-medium flex items-center gap-2 mb-2">
                <ImageIcon className="w-4 h-4" />
                Imagem do Jantar
              </label>
              
              {/* Current image preview */}
              {dinnerImageUrl && (
                <div className="relative mb-3 rounded-lg overflow-hidden border-2 border-primary aspect-video max-w-xs">
                  <img src={dinnerImageUrl} alt="Preview" className="w-full h-full object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => setDinnerImageUrl('')}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              )}

              {/* Upload button */}
              <div className="flex gap-2 mb-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="flex-1"
                >
                  {isUploadingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Enviar foto própria
                    </>
                  )}
                </Button>
              </div>

              {/* Predefined images */}
              <p className="text-xs text-muted-foreground mb-2">Ou escolha uma imagem predefinida:</p>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-2">
                {FOOD_IMAGES.map((img) => (
                  <button
                    key={img.id}
                    type="button"
                    className={cn(
                      "relative aspect-video rounded-lg overflow-hidden border-2 transition-all",
                      dinnerImageUrl === img.url ? "border-primary ring-2 ring-primary" : "border-border hover:border-primary/50"
                    )}
                    onClick={() => setDinnerImageUrl(img.url)}
                  >
                    <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                    {dinnerImageUrl === img.url && (
                      <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-white drop-shadow-lg" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              
              {/* URL input */}
              <p className="text-xs text-muted-foreground mb-1">Ou cole uma URL:</p>
              <Input 
                value={dinnerImageUrl}
                onChange={e => setDinnerImageUrl(e.target.value)}
                placeholder="https://exemplo.com/imagem.jpg"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Preço por lugar (R$)</label>
              <Input 
                type="number" 
                placeholder="35" 
                value={dinnerSeatPrice} 
                onChange={e => setDinnerSeatPrice(e.target.value)} 
              />
            </div>
            <div>
              <label className="text-sm font-medium">Chave PIX</label>
              <Input 
                placeholder="Digite a chave PIX para este jantar" 
                value={dinnerPixKey} 
                onChange={e => setDinnerPixKey(e.target.value)} 
              />
            </div>
            <div>
              <label className="text-sm font-medium">Número de contato</label>
              <Input 
                placeholder="+55 11 99999-9999" 
                value={dinnerContactNumber} 
                onChange={e => setDinnerContactNumber(e.target.value)} 
              />
            </div>
            <div>
              <label className="text-sm font-medium">Cardápio do Jantar</label>
              <Textarea 
                placeholder="Descreva o cardápio do evento...&#10;&#10;Entrada: ...&#10;Prato principal: ...&#10;Sobremesa: ..."
                value={dinnerMenu}
                onChange={e => setDinnerMenu(e.target.value)}
                rows={6}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDinnerFormOpen(false)}>Cancelar</Button>
            <Button onClick={saveDinner}>{editingDinner ? 'Salvar Alterações' : 'Criar Jantar'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
