import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAllTables, useSeats } from '@/hooks/useReservationData';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Trash2, Check, X, Eye, Users, Circle, Square, Settings, Save, DollarSign, QrCode, Phone, EyeOff, LayoutGrid, ClipboardList, Utensils, ImageIcon } from 'lucide-react';
import { Reservation, Seat, Table as TableType, Dinner } from '@/types/reservation';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FOOD_IMAGES } from '@/components/reservation/DinnerSelector';

interface DinnerAdminProps {
  dinner: Dinner;
  onBack: () => void;
}

export function DinnerAdmin({ dinner: initialDinner, onBack }: DinnerAdminProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Editable dinner state
  const [dinner, setDinner] = useState(initialDinner);
  const [seatPrice, setSeatPrice] = useState(String(initialDinner.seat_price || 35));
  const [pixKey, setPixKey] = useState(initialDinner.pix_key || '');
  const [contactNumber, setContactNumber] = useState(initialDinner.contact_number || '');
  const [menu, setMenu] = useState(initialDinner.menu || '');
  const [hideNames, setHideNames] = useState(initialDinner.hide_names || false);
  const [imageUrl, setImageUrl] = useState(initialDinner.image_url || '');
  const [isSaving, setIsSaving] = useState(false);

  const { data: tables = [] } = useAllTables(dinner.id);
  const { data: seats = [] } = useSeats(dinner.id);

  const { data: reservations = [] } = useQuery({
    queryKey: ['reservations', dinner.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('dinner_id', dinner.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Reservation[];
    },
  });

  // Save dinner settings
  const saveSettings = async () => {
    setIsSaving(true);
    const { error } = await supabase.from('dinners').update({
      seat_price: parseFloat(seatPrice) || 35,
      pix_key: pixKey || null,
      contact_number: contactNumber || null,
      menu: menu || null,
      hide_names: hideNames,
      image_url: imageUrl || null,
    }).eq('id', dinner.id);
    
    if (error) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    } else {
      setDinner(prev => ({
        ...prev,
        seat_price: parseFloat(seatPrice) || 35,
        pix_key: pixKey || null,
        contact_number: contactNumber || null,
        menu: menu || null,
        hide_names: hideNames,
        image_url: imageUrl || null,
      }));
      toast({ title: 'Configuração salva!' });
      queryClient.invalidateQueries({ queryKey: ['dinners'] });
    }
    setIsSaving(false);
  };

  const addTable = async (seatCount: number = 12, shape: 'rectangular' | 'round' = 'rectangular') => {
    const dinnerTables = tables.filter(t => t.dinner_id === dinner.id);
    const nextNumber = dinnerTables.length > 0 ? Math.max(...dinnerTables.map(t => t.table_number)) + 1 : 1;
    const { data: newTable, error } = await supabase.from('tables').insert({ 
      table_number: nextNumber, 
      seat_count: seatCount,
      dinner_id: dinner.id,
      shape
    }).select().single();
    if (error) { toast({ title: 'Erro ao criar mesa', variant: 'destructive' }); return; }
    
    const seatInserts = Array.from({ length: seatCount }, (_, i) => ({ 
      table_id: newTable.id, 
      seat_number: i + 1,
      status: 'libre'
    }));
    await supabase.from('seats').insert(seatInserts);
    
    queryClient.invalidateQueries({ queryKey: ['all-tables'] });
    queryClient.invalidateQueries({ queryKey: ['tables'] });
    queryClient.invalidateQueries({ queryKey: ['seats'] });
    toast({ title: `Mesa ${nextNumber} (${shape === 'round' ? 'redonda' : 'retangular'}) criada!` });
  };

  const updateTableShape = async (tableId: string, shape: 'rectangular' | 'round') => {
    await supabase.from('tables').update({ shape }).eq('id', tableId);
    queryClient.invalidateQueries({ queryKey: ['all-tables'] });
    queryClient.invalidateQueries({ queryKey: ['tables'] });
  };

  const updateSeatCount = async (tableId: string, newSeatCount: number) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    
    const currentSeats = seats.filter(s => s.table_id === tableId);
    const currentCount = currentSeats.length;
    const occupiedSeats = currentSeats.filter(s => s.status === 'reservado' || s.status === 'confirmado');
    
    if (newSeatCount < occupiedSeats.length) {
      toast({ title: 'Não é possível reduzir abaixo dos lugares ocupados', variant: 'destructive' });
      return;
    }
    
    await supabase.from('tables').update({ seat_count: newSeatCount }).eq('id', tableId);
    
    if (newSeatCount > currentCount) {
      const newSeats = Array.from({ length: newSeatCount - currentCount }, (_, i) => ({
        table_id: tableId,
        seat_number: currentCount + i + 1,
        status: 'libre'
      }));
      await supabase.from('seats').insert(newSeats);
    } else if (newSeatCount < currentCount) {
      const seatsToRemove = currentSeats
        .filter(s => s.status === 'libre')
        .sort((a, b) => b.seat_number - a.seat_number)
        .slice(0, currentCount - newSeatCount);
      
      for (const seat of seatsToRemove) {
        await supabase.from('seats').delete().eq('id', seat.id);
      }
    }
    
    queryClient.invalidateQueries({ queryKey: ['all-tables'] });
    queryClient.invalidateQueries({ queryKey: ['seats'] });
    toast({ title: `Mesa atualizada!` });
  };

  const toggleTable = async (tableId: string, enabled: boolean) => {
    await supabase.from('tables').update({ enabled }).eq('id', tableId);
    queryClient.invalidateQueries({ queryKey: ['all-tables'] });
    queryClient.invalidateQueries({ queryKey: ['tables'] });
  };

  const deleteTable = async (tableId: string) => {
    await supabase.from('tables').delete().eq('id', tableId);
    queryClient.invalidateQueries({ queryKey: ['all-tables'] });
    queryClient.invalidateQueries({ queryKey: ['seats'] });
    toast({ title: 'Mesa excluída!' });
  };

  const updateReservation = async (id: string, status: 'confirmado' | 'rejeitado') => {
    await supabase.from('reservations').update({ status }).eq('id', id);
    
    if (status === 'confirmado') {
      await supabase.from('seats').update({ status: 'confirmado' }).eq('reservation_id', id);
    } else {
      await supabase.from('seats').update({ status: 'libre', reserved_by: null, reservation_id: null }).eq('reservation_id', id);
    }
    
    queryClient.invalidateQueries({ queryKey: ['reservations'] });
    queryClient.invalidateQueries({ queryKey: ['seats'] });
    toast({ title: status === 'confirmado' ? 'Reserva confirmada!' : 'Reserva rejeitada!' });
  };

  const deleteReservation = async (id: string) => {
    await supabase.from('seats').update({ status: 'libre', reserved_by: null, reservation_id: null }).eq('reservation_id', id);
    await supabase.from('reservations').delete().eq('id', id);
    queryClient.invalidateQueries({ queryKey: ['reservations'] });
    queryClient.invalidateQueries({ queryKey: ['seats'] });
    toast({ title: 'Reserva excluída!' });
  };

  const deleteSeatFromReservation = async (seat: Seat) => {
    const currentSeatPrice = parseFloat(seatPrice) || 35;
    await supabase.from('seats').update({ status: 'libre', reserved_by: null, reservation_id: null }).eq('id', seat.id);
    
    if (seat.reservation_id) {
      const { data: remainingSeats } = await supabase
        .from('seats')
        .select('id')
        .eq('reservation_id', seat.reservation_id);
      
      if (!remainingSeats || remainingSeats.length === 0) {
        await supabase.from('reservations').delete().eq('id', seat.reservation_id);
      } else {
        const newTotal = remainingSeats.length * currentSeatPrice;
        await supabase.from('reservations').update({ total_amount: newTotal }).eq('id', seat.reservation_id);
      }
    }
    
    queryClient.invalidateQueries({ queryKey: ['reservations'] });
    queryClient.invalidateQueries({ queryKey: ['seats'] });
    toast({ title: 'Lugar liberado!' });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmado':
        return <Badge className="bg-red-500 text-white">Confirmado</Badge>;
      case 'rejeitado':
        return <Badge variant="destructive">Rejeitado</Badge>;
      default:
        return <Badge className="bg-yellow-500 text-white">Reservado</Badge>;
    }
  };

  const libreSeats = seats.filter(s => s.status === 'libre').length;
  const reservadoSeats = seats.filter(s => s.status === 'reservado').length;
  const confirmadoSeats = seats.filter(s => s.status === 'confirmado').length;
  const currentSeatPrice = parseFloat(seatPrice) || 35;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{dinner.title}</h2>
            <p className="text-muted-foreground">
              {format(new Date(dinner.event_date), "EEEE, d 'de' MMMM", { locale: ptBR })}
              {dinner.event_time && ` - ${dinner.event_time.slice(0, 5)}h`}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Summary - Clear labels */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="bg-card">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{tables.length}</p>
            <p className="text-xs text-muted-foreground font-medium">Mesas</p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{libreSeats}</p>
            <p className="text-xs text-muted-foreground font-medium">Lugares Livres</p>
          </CardContent>
        </Card>
        <Card className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950/30 dark:border-yellow-900">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{reservadoSeats}</p>
            <p className="text-xs text-muted-foreground font-medium">Lugares Reservados</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{confirmadoSeats}</p>
            <p className="text-xs text-muted-foreground font-medium">Lugares Confirmados</p>
          </CardContent>
        </Card>
        <Card className="bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-900">
          <CardContent className="p-4 text-center">
            <p className="text-xl font-bold text-orange-600">R$ {((reservadoSeats) * currentSeatPrice).toFixed(0)}</p>
            <p className="text-xs text-muted-foreground font-medium">Receita Esperada</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900">
          <CardContent className="p-4 text-center">
            <p className="text-xl font-bold text-blue-600">R$ {(confirmadoSeats * currentSeatPrice).toFixed(0)}</p>
            <p className="text-xs text-muted-foreground font-medium">Receita Garantida</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for organization */}
      <Tabs defaultValue="tables" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tables" className="gap-2">
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Mesas</span>
          </TabsTrigger>
          <TabsTrigger value="reservations" className="gap-2">
            <ClipboardList className="w-4 h-4" />
            <span className="hidden sm:inline">Reservas</span>
            {reservations.length > 0 && (
              <Badge variant="secondary" className="ml-1">{reservations.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="menu" className="gap-2">
            <Utensils className="w-4 h-4" />
            <span className="hidden sm:inline">Cardápio</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Config</span>
          </TabsTrigger>
        </TabsList>

        {/* Tables Tab */}
        <TabsContent value="tables" className="space-y-6 mt-6">
          {/* Visual Table Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5" />Visualização das Mesas
              </CardTitle>
              <CardDescription>Clique em um lugar ocupado para liberá-lo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {tables.map(table => {
                  const tableSeats = seats.filter(s => s.table_id === table.id);
                  const libre = tableSeats.filter(s => s.status === 'libre').length;
                  const reservado = tableSeats.filter(s => s.status === 'reservado').length;
                  const confirmado = tableSeats.filter(s => s.status === 'confirmado').length;
                  
                  const getTableColor = () => {
                    if (confirmado === tableSeats.length && tableSeats.length > 0) return 'border-red-500 bg-red-50 dark:bg-red-950/30';
                    if (reservado + confirmado === tableSeats.length && tableSeats.length > 0) return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30';
                    if (reservado > 0 || confirmado > 0) return 'border-orange-300 bg-orange-50 dark:bg-orange-950/30';
                    return 'border-green-200 bg-green-50 dark:bg-green-950/30';
                  };
                  
                  return (
                    <div key={table.id} className={cn("rounded-lg border-2 p-4", getTableColor(), !table.enabled && "opacity-50")}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {table.shape === 'round' ? <Circle className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                          <h3 className="font-bold">Mesa {table.table_number}</h3>
                        </div>
                        {!table.enabled && <Badge variant="outline">Off</Badge>}
                      </div>
                      <div className="grid grid-cols-6 gap-1 mb-3">
                        {tableSeats.map(seat => (
                          <div
                            key={seat.id}
                            className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium cursor-pointer hover:scale-110 transition-all",
                              seat.status === 'libre' && "bg-green-500 text-white",
                              seat.status === 'reservado' && "bg-yellow-400 text-yellow-900",
                              seat.status === 'confirmado' && "bg-red-500 text-white"
                            )}
                            title={`${seat.seat_number}: ${seat.status === 'libre' ? 'Livre' : seat.status === 'reservado' ? 'Reservado' : 'Confirmado'}${seat.reserved_by ? ` - ${seat.reserved_by}` : ''}`}
                            onClick={() => {
                              if (seat.status !== 'libre' && confirm(`Liberar lugar ${table.table_number}-${seat.seat_number}?`)) {
                                deleteSeatFromReservation(seat);
                              }
                            }}
                          >
                            {seat.seat_number}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-3 text-xs">
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500" /> {libre} livres</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-400" /> {reservado} res.</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500" /> {confirmado} conf.</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Tables Management */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">Gestão de Mesas</CardTitle>
                <CardDescription>Adicione, modifique ou exclua mesas</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => addTable(12, 'rectangular')} size="sm">
                  <Square className="w-4 h-4 mr-1" />Retangular
                </Button>
                <Button onClick={() => addTable(8, 'round')} size="sm" variant="outline">
                  <Circle className="w-4 h-4 mr-1" />Redonda
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {tables.map(table => {
                  const tableSeats = seats.filter(s => s.table_id === table.id);
                  const occupied = tableSeats.filter(s => s.status === 'reservado' || s.status === 'confirmado').length;
                  return (
                    <div key={table.id} className={cn("border rounded-lg p-4 space-y-3", !table.enabled && "opacity-50 bg-muted/50")}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {table.shape === 'round' ? <Circle className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                          <span className="font-semibold">Mesa {table.table_number}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch checked={table.enabled} onCheckedChange={v => toggleTable(table.id, v)} />
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteTable(table.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm gap-2">
                        <Select value={table.shape} onValueChange={(v) => updateTableShape(table.id, v as any)}>
                          <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="rectangular">Retangular</SelectItem>
                            <SelectItem value="round">Redonda</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={String(table.seat_count || 12)} onValueChange={(v) => updateSeatCount(table.id, parseInt(v))}>
                          <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 17 }, (_, i) => i + 2).map(num => (
                              <SelectItem key={num} value={String(num)} disabled={num < occupied}>{num} lugares</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <span className="text-xs text-muted-foreground">{occupied}/{table.seat_count || 12} ocupados</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reservations Tab */}
        <TabsContent value="reservations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reservas</CardTitle>
              <CardDescription>Confirme ou rejeite as reservas pendentes</CardDescription>
            </CardHeader>
            <CardContent>
              {reservations.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma reserva para este jantar</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Lugares</TableHead>
                        <TableHead>Detalhe</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Pagamento</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Comprovante</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reservations.map(res => {
                        const resSeats = seats.filter(s => s.reservation_id === res.id);
                        const seatLabels = resSeats.map(seat => {
                          const table = tables.find(t => t.id === seat.table_id);
                          return `${table?.table_number || '?'}-${seat.seat_number.toString().padStart(2, '0')}`;
                        }).sort();
                        return (
                          <TableRow key={res.id}>
                            <TableCell className="font-medium">{res.user_name}</TableCell>
                            <TableCell>{resSeats.length}</TableCell>
                            <TableCell className="text-xs max-w-32 truncate">{seatLabels.join(', ')}</TableCell>
                            <TableCell>R$ {res.total_amount.toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {res.payment_method === 'pix' ? 'PIX' : 'Dinheiro'}
                              </Badge>
                            </TableCell>
                            <TableCell>{getStatusBadge(res.status)}</TableCell>
                            <TableCell>
                              {res.payment_proof_url ? (
                                <a href={res.payment_proof_url} target="_blank" rel="noopener noreferrer">
                                  <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                                </a>
                              ) : (
                                <span className="text-xs text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {res.status === 'reservado' && (
                                  <>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => updateReservation(res.id, 'confirmado')}>
                                      <Check className="w-4 h-4" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600" onClick={() => updateReservation(res.id, 'rejeitado')}>
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => deleteReservation(res.id)}>
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Menu Tab */}
        <TabsContent value="menu" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Utensils className="w-5 h-5" />
                Cardápio do Jantar
              </CardTitle>
              <CardDescription>Descreva o cardápio que será servido neste evento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea 
                placeholder="Entrada: Salada Caesar&#10;Prato principal: Risoto de funghi&#10;Sobremesa: Tiramisù&#10;Bebidas: Vinho tinto, água, refrigerantes"
                value={menu}
                onChange={e => setMenu(e.target.value)}
                rows={10}
                className="font-mono"
              />
              <Button onClick={saveSettings} disabled={isSaving} className="w-full sm:w-auto">
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Salvando...' : 'Salvar Cardápio'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="w-5 h-5" />
                Configuração do Jantar
              </CardTitle>
              <CardDescription>Preço, pagamento e opções de visualização</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Image Selection */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <ImageIcon className="w-4 h-4" />
                  Imagem do Jantar
                </label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {FOOD_IMAGES.map((img) => (
                    <button
                      key={img.id}
                      type="button"
                      className={cn(
                        "relative aspect-video rounded-lg overflow-hidden border-2 transition-all",
                        imageUrl === img.url ? "border-primary ring-2 ring-primary" : "border-border hover:border-primary/50"
                      )}
                      onClick={() => setImageUrl(img.url)}
                    >
                      <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                      {imageUrl === img.url && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <Check className="w-6 h-6 text-white drop-shadow-lg" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                <Input 
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="Ou cole uma URL de imagem personalizada"
                  className="max-w-md"
                />
              </div>

              {/* Pricing */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <DollarSign className="w-4 h-4" />
                  Preço por lugar (R$)
                </label>
                <Input 
                  type="number" 
                  value={seatPrice}
                  onChange={e => setSeatPrice(e.target.value)}
                  placeholder="35"
                  className="max-w-xs"
                />
              </div>

              {/* PIX Key */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <QrCode className="w-4 h-4" />
                  Chave PIX
                </label>
                <Input 
                  value={pixKey}
                  onChange={e => setPixKey(e.target.value)}
                  placeholder="Digite a chave PIX para pagamentos"
                  className="max-w-md"
                />
              </div>

              {/* Contact Number */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Phone className="w-4 h-4" />
                  Número de contato
                </label>
                <Input 
                  value={contactNumber}
                  onChange={e => setContactNumber(e.target.value)}
                  placeholder="+55 11 99999-9999"
                  className="max-w-md"
                />
              </div>

              {/* Hide Names Toggle */}
              <div className="flex items-center justify-between border rounded-lg p-4 max-w-md">
                <div className="flex items-center gap-3">
                  {hideNames ? <EyeOff className="w-5 h-5 text-muted-foreground" /> : <Eye className="w-5 h-5 text-muted-foreground" />}
                  <div>
                    <p className="font-medium">Ocultar nomes</p>
                    <p className="text-sm text-muted-foreground">Mostrar apenas status dos lugares</p>
                  </div>
                </div>
                <Switch checked={hideNames} onCheckedChange={setHideNames} />
              </div>

              <Button onClick={saveSettings} disabled={isSaving} className="w-full sm:w-auto">
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Salvando...' : 'Salvar Configuração'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
