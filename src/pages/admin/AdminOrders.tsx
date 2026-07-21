import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Filter, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  Package, 
  Truck,
  ArrowRight,
  MoreVertical,
  Loader2,
  Bell,
  AlertTriangle,
  Printer
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { printOrderReceipt } from '../../lib/printReceipt';

const STATUS_CONFIG: any = {
  pendente: { label: 'Pendente', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', next: 'preparando' },
  preparando: { label: 'Preparando', icon: Package, color: 'text-primary', bg: 'bg-primary/10', next: 'entrega' },
  entrega: { label: 'Em Entrega', icon: Truck, color: 'text-secondary', bg: 'bg-secondary/10', next: 'concluido' },
  concluido: { label: 'Concluído', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', next: null },
  cancelado: { label: 'Cancelado', icon: Clock, color: 'text-red-500', bg: 'bg-red-500/10', next: null },
};

const TAB_LABELS: Record<string, string> = {
  aberto: 'Em Aberto',
  todos: 'Todos',
  pendente: 'Pendente',
  preparando: 'Preparando',
  entrega: 'Em Entrega',
  concluido: 'Concluído'
};

const startPhoneRinger = (existingCtx?: AudioContext | null) => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return null;
    const ctx = existingCtx || new AudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(console.error);
    }
    
    let isPlaying = true;
    
    const playRing = () => {
      if (!isPlaying) return;
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(440, ctx.currentTime);
      
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(480, ctx.currentTime);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      // Ring-ring modulation: rise fast, vibrate, fall fast
      gain.gain.linearRampToValueAtTime(0.95, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.95, ctx.currentTime + 0.35);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
      
      // Second ring in the double-ring pattern
      gain.gain.linearRampToValueAtTime(0.95, ctx.currentTime + 0.45);
      gain.gain.setValueAtTime(0.95, ctx.currentTime + 0.75);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.8);
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      
      osc1.start();
      osc2.start();
      
      osc1.stop(ctx.currentTime + 1.0);
      osc2.stop(ctx.currentTime + 1.0);
    };

    // Play immediately
    playRing();
    
    // Repeat every 3 seconds
    const intervalId = setInterval(playRing, 3000);
    
    return {
      stop: () => {
        isPlaying = false;
        clearInterval(intervalId);
        if (!existingCtx) {
          ctx.close().catch(console.error);
        }
      }
    };
  } catch (e) {
    console.error("Audio synthesis failed:", e);
    return null;
  }
};

const PAYMENT_METHODS_LABELS: Record<string, string> = {
  pix: 'PIX',
  card: 'Cartão de Crédito',
  money: 'Dinheiro',
  wallet: 'Carteira (Saldo)'
};

const getOrderClientDetails = (order: any) => {
  if (!order) return { name: 'Cliente', address: 'Não informado', phone: 'Não informado' };
  
  let name = order.user_profiles?.full_name || 'Cliente';
  let address = order.address_summary || (order.user_profiles 
    ? `${order.user_profiles.address}, ${order.user_profiles.number} ${order.user_profiles.complement || ''} - ${order.user_profiles.neighborhood}` 
    : 'Não informado');
  let phone = order.user_profiles?.phone || 'Não informado';

  if (order.address_summary && order.address_summary.startsWith("Nome: ")) {
    const parts = order.address_summary.split(" | ");
    if (parts.length >= 3) {
      name = parts[0].replace("Nome: ", "") + " (Visitante)";
      phone = parts[1].replace("Tel: ", "");
      address = parts.slice(2).join(" | ");
    }
  }

  return { name, address, phone };
};

export default function AdminOrders() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('aberto');
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [newOrderAlert, setNewOrderAlert] = useState<any | null>(null);
  const [orderToReject, setOrderToReject] = useState<any | null>(null);
  const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
  const ringerRef = useRef<{ stop: () => void } | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [activeMenuOrderId, setActiveMenuOrderId] = useState<number | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any | null>(null);

  const [selectedOrderItems, setSelectedOrderItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [storeOpen, setStoreOpen] = useState<boolean>(true);
  const [togglingStore, setTogglingStore] = useState(false);

  useEffect(() => {
    if (selectedOrderDetails) {
      const fetchOrderItems = async () => {
        try {
          setLoadingItems(true);
          const savedItems = localStorage.getItem(`order_items_${selectedOrderDetails.id}`);
          if (savedItems) {
            setSelectedOrderItems(JSON.parse(savedItems));
            setLoadingItems(false);
            return;
          }

          const { data, error } = await supabase
            .from('order_items')
            .select(`
              *,
              products (name)
            `)
            .eq('order_id', selectedOrderDetails.id);
          if (!error && data) {
            setSelectedOrderItems(data);
          } else {
            setSelectedOrderItems([]);
          }
        } catch (err) {
          console.error('Erro ao carregar itens do pedido:', err);
          setSelectedOrderItems([]);
        } finally {
          setLoadingItems(false);
        }
      };
      fetchOrderItems();
    } else {
      setSelectedOrderItems([]);
    }
  }, [selectedOrderDetails]);

  const getStatusSelectClass = (status: string) => {
    switch (status) {
      case 'pendente': return 'border-amber-500/30 text-amber-500 bg-amber-500/5 focus:border-amber-500';
      case 'preparando': return 'border-primary/30 text-primary bg-primary/5 focus:border-primary';
      case 'entrega': return 'border-secondary/30 text-secondary bg-secondary/5 focus:border-secondary';
      case 'concluido': return 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5 focus:border-emerald-500';
      case 'cancelado': return 'border-red-500/30 text-red-500 bg-red-500/5 focus:border-red-500';
      default: return 'border-surface-border text-text-main bg-surface/50';
    }
  };

  const toggleStoreStatus = async () => {
    try {
      setTogglingStore(true);
      const nextState = !storeOpen;
      const updates = [
        { key: 'store_open', value: nextState ? 'true' : 'false' },
        { key: 'operating_mode', value: nextState ? 'manual_open' : 'manual_closed' }
      ];
      
      const { error } = await supabase.from('system_settings').upsert(updates, { onConflict: 'key' });
      if (error) throw error;
      
      setStoreOpen(nextState);
      toast.success(nextState ? 'Loja ABERTA com sucesso! 🟢' : 'Loja FECHADA com sucesso! 🔴');
    } catch (err: any) {
      toast.error('Erro ao alterar status da loja: ' + err.message);
    } finally {
      setTogglingStore(false);
    }
  };

  useEffect(() => {
    const fetchUserRoleAndStoreStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        let userId = session?.user?.id || null;
        if (!userId) {
          const mockSessionStr = localStorage.getItem('supabase.auth.mock-session');
          if (mockSessionStr) {
            try {
              const mockSession = JSON.parse(mockSessionStr);
              userId = mockSession.user?.id || null;
            } catch {}
          }
        }
        if (userId) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('role')
            .eq('mocha_user_id', userId)
            .single();
          if (profile?.role) setUserRole(profile.role);
        } else if (localStorage.getItem('admin_auth') === 'true') {
          setUserRole('admin');
        }

        const { data: settings } = await supabase
          .from('system_settings')
          .select('key, value');
        if (settings) {
          const openSetting = settings.find(s => s.key === 'store_open');
          if (openSetting) {
            setStoreOpen(openSetting.value === 'true');
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchUserRoleAndStoreStatus();
  }, []);

  useEffect(() => {
    fetchOrders();

    const unlockAudio = () => {
      try {
        const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtxClass && !audioCtxRef.current) {
          audioCtxRef.current = new AudioCtxClass();
        }
        if (audioCtxRef.current) {
          if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume().then(() => {
              setIsAudioUnlocked(true);
            }).catch(() => {});
          } else {
            setIsAudioUnlocked(true);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };

    unlockAudio();

    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', unlockAudio);
    window.addEventListener('mousemove', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);
    window.addEventListener('storage', fetchOrders);

    // Auto-polling a cada 3s para sincronização em tempo real sem atualizar a página
    const pollInterval = setInterval(fetchOrders, 3000);

    // Inscrição em tempo real para novos pedidos no Supabase
    const channel = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        fetchOrders();
        if (payload.eventType === 'INSERT') {
          setNewOrderAlert(payload.new);
          toast.success('Novo pedido recebido!', {
            duration: 6000,
            icon: '🔔'
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
      window.removeEventListener('storage', fetchOrders);
      if (ringerRef.current) {
        ringerRef.current.stop();
        ringerRef.current = null;
      }
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('mousemove', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
    };
  }, []);

  const checkAndManageRinger = (allOrders: any[]) => {
    const pendingOrders = allOrders.filter((o: any) => o.status === 'pendente');
    if (pendingOrders.length > 0) {
      // Definir o pedido pendente mais recente para o balão flutuante de ação rápida
      const newestPending = pendingOrders[0];
      setNewOrderAlert(newestPending);
      
      if (!ringerRef.current) {
        ringerRef.current = startPhoneRinger(audioCtxRef.current);
      }
    } else {
      setNewOrderAlert(null);
      if (ringerRef.current) {
        ringerRef.current.stop();
        ringerRef.current = null;
      }
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      let list: any[] = [];
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            user_profiles (full_name, address, number, complement, neighborhood, city)
          `)
          .order('created_at', { ascending: false });
        if (!error && data) list = data;
      } catch {}

      const mockOrders = JSON.parse(localStorage.getItem('supabase.mock-orders') || '[]');
      const mergedMap = new Map();
      [...list, ...mockOrders].forEach(item => {
        if (item && item.id) mergedMap.set(item.id, item);
      });
      const finalOrders = Array.from(mergedMap.values()).sort((a: any, b: any) => 
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
      setOrders(finalOrders);
      checkAndManageRinger(finalOrders);

      // Fetch store_open setting to keep toggle updated
      try {
        const { data: settings } = await supabase
          .from('system_settings')
          .select('key, value');
        if (settings) {
          const openSetting = settings.find(s => s.key === 'store_open');
          if (openSetting) {
            setStoreOpen(openSetting.value === 'true');
          }
        }
      } catch {}
    } catch (error: any) {
      const mockOrders = JSON.parse(localStorage.getItem('supabase.mock-orders') || '[]');
      setOrders(mockOrders);
      checkAndManageRinger(mockOrders);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: number, nextStatus: string) => {
    if (nextStatus === 'cancelado') {
      const target = orders.find(o => o.id === orderId);
      if (target) {
        setOrderToReject(target);
        return;
      }
    }
    await executeStatusUpdate(orderId, nextStatus);
  };

  const executeStatusUpdate = async (orderId: number, nextStatus: string) => {
    try {
      setUpdatingId(orderId);
      try {
        await supabase
          .from('orders')
          .update({ status: nextStatus, updated_at: new Date().toISOString() })
          .eq('id', orderId);
      } catch (e) {
        console.warn('Erro ao atualizar status no banco (usando fallback):', e);
      }

      // Atualizar no cache de mock-orders
      const mockOrders = JSON.parse(localStorage.getItem('supabase.mock-orders') || '[]');
      const updatedMock = mockOrders.map((o: any) => o.id === orderId ? { ...o, status: nextStatus, updated_at: new Date().toISOString() } : o);
      localStorage.setItem('supabase.mock-orders', JSON.stringify(updatedMock));

      toast.success(`Pedido #${orderId} atualizado para ${STATUS_CONFIG[nextStatus]?.label || nextStatus}`);
      fetchOrders();
    } catch (error: any) {
      toast.error('Erro ao atualizar status: ' + error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (!window.confirm(`Tem certeza de que deseja excluir o pedido #${orderId}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      setUpdatingId(orderId);
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;
      toast.success(`Pedido #${orderId} excluído com sucesso!`);
      fetchOrders();
    } catch (error: any) {
      toast.error('Erro ao excluir pedido: ' + error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAcceptOrder = async (orderId: number) => {
    setNewOrderAlert(null);
    await executeStatusUpdate(orderId, 'preparando');
  };

  const handleRejectClick = (order: any) => {
    setOrderToReject(order);
  };

  const handleConfirmRejectOrder = async (orderId: number) => {
    setOrderToReject(null);
    setNewOrderAlert(null);
    await executeStatusUpdate(orderId, 'cancelado');
  };

  const filteredOrders = orders.filter(order => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      order.id.toString().includes(searchTerm) || 
      order.user_profiles?.full_name?.toLowerCase().includes(searchLower) ||
      order.address_summary?.toLowerCase().includes(searchLower);
    
    let matchesTab = false;
    if (activeTab === 'todos') {
      matchesTab = true;
    } else if (activeTab === 'aberto') {
      matchesTab = order.status !== 'concluido' && order.status !== 'cancelado';
    } else {
      matchesTab = order.status === activeTab;
    }
    return matchesSearch && matchesTab;
  });

  if (loading && orders.length === 0) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-text-muted font-black uppercase tracking-widest text-xs">Sincronizando Pedidos...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-black mb-1">Pedidos 🍕</h1>
                <button
                  onClick={() => {
                    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
                    if (!audioCtxRef.current) audioCtxRef.current = new AudioCtxClass();
                    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
                    setIsAudioUnlocked(true);
                    try {
                      const osc = audioCtxRef.current.createOscillator();
                      const gain = audioCtxRef.current.createGain();
                      osc.type = 'sine';
                      osc.frequency.setValueAtTime(523.25, audioCtxRef.current.currentTime);
                      gain.gain.setValueAtTime(0.3, audioCtxRef.current.currentTime);
                      gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.3);
                      osc.connect(gain);
                      gain.connect(audioCtxRef.current.destination);
                      osc.start();
                      osc.stop(audioCtxRef.current.currentTime + 0.3);
                    } catch {}
                    toast.success('Som de chamada ativado com sucesso!', { icon: '🔊' });
                  }}
                  className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-[10px] font-black uppercase text-amber-500 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Bell size={12} className="animate-pulse" /> Testar Som 🔊
                </button>

                {(userRole === 'caixa' || userRole === 'admin') && (
                  <button
                    onClick={toggleStoreStatus}
                    disabled={togglingStore}
                    className={`px-3 py-1.5 border text-[10px] font-black uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                      storeOpen
                        ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-400 animate-pulse'
                        : 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-400'
                    }`}
                    title={storeOpen ? 'Clique para fechar a loja' : 'Clique para abrir a loja'}
                  >
                    {togglingStore ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <span className={`w-2 h-2 rounded-full ${storeOpen ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    )}
                    {storeOpen ? 'Loja Aberta' : 'Loja Fechada'}
                  </button>
                )}
              </div>
              <p className="text-text-muted text-sm">Gerencie o fluxo de pedidos do <span className="text-primary font-bold">Pizza Senna</span>.</p>
           </div>
           <div className="flex bg-surface rounded-2xl p-1 border border-surface-border overflow-x-auto hide-scrollbar">
              {['aberto', 'todos', 'pendente', 'preparando', 'entrega', 'concluido'].map((tab) => (
                 <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    activeTab === tab ? 'bg-primary text-background shadow-lg' : 'text-text-muted hover:text-white'
                  }`}
                 >
                   {TAB_LABELS[tab] || tab}
                 </button>
              ))}
           </div>
        </div>

        {/* Filters and Search */}
        <div className="flex gap-4">
           <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por ID ou cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-surface/50 border border-surface-border rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:border-primary/50 text-sm"
              />
           </div>
           <button className="p-3.5 bg-surface border border-surface-border rounded-2xl text-text-muted hover:text-white transition-all">
              <Filter size={20} />
           </button>
        </div>

        {/* Orders List */}
        <div className="glass-card overflow-hidden border-white/5">
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="border-b border-surface-border bg-surface/30">
                       <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Pedido</th>
                       <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Cliente / Endereço</th>
                       <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Valor Total</th>
                       <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Status</th>
                       <th className="px-8 py-4"></th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-surface-border">
                    {filteredOrders.map((order) => {
                       const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.pendente;
                       const dateObj = new Date(order.created_at);
                       const dateFormatted = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                       const time = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                       const { name: clientName, address: clientAddress } = getOrderClientDetails(order);
                       
                       return (
                          <motion.tr 
                            key={order.id}
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="group hover:bg-white/5 transition-colors"
                          >
                             <td className="px-8 py-5">
                                <span className="text-sm font-black text-primary">#{order.id}</span>
                                <p className="text-[10px] text-text-muted font-bold mt-1">{dateFormatted} - {time}</p>
                             </td>
                             <td className="px-8 py-5">
                                <p className="text-sm font-black">{clientName}</p>
                                <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest truncate max-w-[250px] mb-1">
                                   {clientAddress}
                                </p>
                                {clientAddress.includes('(Obs:') && (
                                   <span className="inline-block bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-amber-500/20">
                                      Obs: {clientAddress.substring(clientAddress.indexOf('(Obs:') + 5).replace(/\)$/, '').trim()}
                                   </span>
                                )}
                             </td>
                             <td className="px-8 py-5">
                                <span className="text-sm font-black text-secondary">R$ {Number(order.total_amount).toFixed(2)}</span>
                             </td>
                             <td className="px-8 py-5">
                               <div className="relative">
                                 {updatingId === order.id ? (
                                   <div className="flex items-center gap-2 text-text-muted">
                                     <Loader2 size={14} className="animate-spin" />
                                     <span className="text-[10px] font-black uppercase tracking-widest">Atualizando...</span>
                                   </div>
                                 ) : (
                                   <select
                                     value={order.status}
                                     onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                     disabled={updatingId === order.id}
                                     className={`text-[10px] uppercase tracking-widest font-black px-3.5 py-1.5 rounded-full outline-none border cursor-pointer transition-all ${getStatusSelectClass(order.status)}`}
                                   >
                                     <option value="pendente" className="bg-[#121214] text-amber-500 font-black uppercase">Pendente</option>
                                     <option value="preparando" className="bg-[#121214] text-primary font-black uppercase">Preparando</option>
                                     <option value="entrega" className="bg-[#121214] text-secondary font-black uppercase">Em Entrega</option>
                                     <option value="concluido" className="bg-[#121214] text-emerald-500 font-black uppercase">Concluído</option>
                                     <option value="cancelado" className="bg-[#121214] text-red-500 font-black uppercase">Cancelado</option>
                                   </select>
                                 )}
                               </div>
                             </td>
                             <td className="px-8 py-5 text-right">
                                <div className="flex items-center justify-end relative gap-2">
                                   <button 
                                      onClick={() => {
                                        let items: any[] = [];
                                        if (order.order_items && order.order_items.length > 0) {
                                          items = order.order_items.map((i: any) => ({
                                            id: i.product_id,
                                            name: i.products?.name || 'Pizza',
                                            price: Number(i.price),
                                            quantity: i.quantity,
                                            ...i.customizations
                                          }));
                                        } else {
                                          const saved = localStorage.getItem(`order_items_${order.id}`);
                                          if (saved) items = JSON.parse(saved);
                                        }
                                        printOrderReceipt(order, items);
                                      }}
                                      className="p-2 text-text-muted hover:text-primary transition-all rounded-lg hover:bg-white/5"
                                      title="Imprimir Pedido"
                                    >
                                       <Printer size={18} />
                                    </button>

                                    <button 
                                      onClick={() => setActiveMenuOrderId(activeMenuOrderId === order.id ? null : order.id)}
                                      className="p-2 text-text-muted hover:text-white transition-all rounded-lg hover:bg-white/5 relative z-20"
                                    >
                                       <MoreVertical size={18} />
                                    </button>
                                   
                                   <AnimatePresence>
                                     {activeMenuOrderId === order.id && (
                                       <>
                                         {/* Click away overlay */}
                                         <div className="fixed inset-0 z-10" onClick={() => setActiveMenuOrderId(null)} />
                                         <motion.div
                                           initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                           animate={{ opacity: 1, scale: 1, y: 0 }}
                                           exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                           transition={{ duration: 0.15 }}
                                           className="absolute right-0 top-full mt-2 w-48 bg-surface border border-surface-border rounded-xl shadow-xl z-20 py-2 text-left"
                                         >
                                           <button
                                             onClick={() => {
                                               setSelectedOrderDetails(order);
                                               setActiveMenuOrderId(null);
                                             }}
                                             className="w-full text-left px-4 py-2.5 text-xs font-bold text-text-main hover:bg-white/5 transition-colors"
                                           >
                                             Ver Detalhes
                                           </button>
                                           <button
                                             onClick={() => {
                                               handleDeleteOrder(order.id);
                                               setActiveMenuOrderId(null);
                                             }}
                                             className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-500 hover:bg-red-500/5 transition-colors"
                                           >
                                             Excluir Pedido
                                           </button>
                                         </motion.div>
                                       </>
                                     )}
                                   </AnimatePresence>
                                </div>
                             </td>
                          </motion.tr>
                       );
                    })}
                 </tbody>
              </table>
           </div>
           
           {filteredOrders.length === 0 && !loading && (
             <div className="p-20 text-center">
                <Package size={48} className="mx-auto text-surface-border mb-4" />
                <p className="text-text-muted">Nenhum pedido encontrado para esta busca/filtro.</p>
             </div>
           )}
        </div>
      </div>

      <AnimatePresence>
        {newOrderAlert && (
          <div className="fixed bottom-6 right-6 z-50 w-full max-w-md p-2">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="bg-[#18181b] border-2 border-amber-500/60 rounded-3xl p-6 shadow-2xl shadow-amber-500/20 relative overflow-hidden text-left"
            >
              <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center animate-bounce">
                    <Bell size={20} className="animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Novo Pedido Recebido</span>
                    <h3 className="text-lg font-black text-white">Pedido #{newOrderAlert.id}</h3>
                  </div>
                </div>
                <span className="bg-amber-500/10 text-amber-500 border border-amber-500/30 text-[10px] font-black uppercase px-2.5 py-1 rounded-full animate-pulse">
                  Aguardando Aceite
                </span>
              </div>

              <div className="space-y-2 bg-black/40 p-4 rounded-2xl border border-white/5 mb-5 text-xs">
                {(() => {
                  const { name: alertName, address: alertAddress } = getOrderClientDetails(newOrderAlert);
                  return (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-text-muted font-bold">Cliente:</span>
                        <span className="font-black text-white">{alertName}</span>
                      </div>
                      <div className="flex justify-between items-start">
                        <span className="text-text-muted font-bold">Endereço:</span>
                        <span className="font-bold text-white text-right max-w-[220px] truncate">{alertAddress}</span>
                      </div>
                    </>
                  );
                })()}
                <div className="flex justify-between items-center">
                  <span className="text-text-muted font-bold">Pagamento:</span>
                  <span className="font-black text-secondary uppercase">
                    {PAYMENT_METHODS_LABELS[newOrderAlert.payment_method] || newOrderAlert.payment_method || 'Entrega'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-white/10 text-sm">
                  <span className="text-text-muted font-bold">Total:</span>
                  <span className="font-black text-primary text-base">R$ {Number(newOrderAlert.total_amount).toFixed(2)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleRejectClick(newOrderAlert)}
                  className="py-3.5 bg-red-500/15 hover:bg-red-500/30 text-red-400 rounded-2xl text-xs font-black uppercase tracking-widest border border-red-500/30 transition-all cursor-pointer"
                >
                  Recusar
                </button>
                <button
                  type="button"
                  onClick={() => handleAcceptOrder(newOrderAlert.id)}
                  className="py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  Aceitar Pedido
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Confirmação de Rejeição / Cancelamento */}
      <AnimatePresence>
        {orderToReject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="w-full max-w-md bg-surface border border-surface-border rounded-3xl p-8 shadow-2xl relative text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-500/10 text-red-500 rounded-full mb-4">
                <AlertTriangle size={32} />
              </div>

              <h2 className="text-xl font-black text-text-main">Cancelar Pedido?</h2>
              <p className="text-xs text-text-muted font-bold mt-2 leading-relaxed">
                Tem certeza de que deseja rejeitar e cancelar o pedido <strong className="text-white">#{orderToReject.id}</strong>? O cliente será notificado em tempo real.
              </p>

              <div className="grid grid-cols-2 gap-4 mt-8">
                <button
                  type="button"
                  onClick={() => setOrderToReject(null)}
                  className="py-3.5 bg-white/5 hover:bg-white/10 text-text-main rounded-2xl text-xs font-black uppercase tracking-widest border border-white/10 transition-all cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={() => handleConfirmRejectOrder(orderToReject.id)}
                  className="py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-red-500/20 transition-all cursor-pointer"
                >
                  Sim, Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedOrderDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="w-full max-w-lg bg-surface border border-surface-border rounded-3xl p-8 shadow-2xl relative overflow-hidden"
            >
              <button 
                onClick={() => setSelectedOrderDetails(null)}
                className="absolute top-6 right-6 p-2 text-text-muted hover:text-white transition-all bg-white/5 rounded-full"
              >
                <X size={16} />
              </button>

              <div className="mb-6">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Detalhes do Pedido</span>
                <h2 className="text-2xl font-black text-text-main mt-1">Pedido #{selectedOrderDetails.id}</h2>
                <p className="text-[10px] text-text-muted font-bold mt-1">
                  Realizado em {new Date(selectedOrderDetails.created_at).toLocaleString()}
                </p>
              </div>

              <div className="space-y-6">
                {/* Status Section */}
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                  <span className="text-xs font-bold text-text-muted">Status Atual:</span>
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${STATUS_CONFIG[selectedOrderDetails.status]?.bg || 'bg-amber-500/10'} ${STATUS_CONFIG[selectedOrderDetails.status]?.color || 'text-amber-500'}`}>
                    {(() => {
                      const Icon = STATUS_CONFIG[selectedOrderDetails.status]?.icon || Clock;
                      return <Icon size={14} />;
                    })()}
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {STATUS_CONFIG[selectedOrderDetails.status]?.label || selectedOrderDetails.status}
                    </span>
                  </div>
                </div>

                {/* Cliente / Endereço */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-text-muted border-b border-white/5 pb-2">Cliente e Entrega</h3>
                  {(() => {
                    const { name: detailName, address: detailAddress } = getOrderClientDetails(selectedOrderDetails);
                    return (
                      <div className="space-y-2">
                        <p className="text-sm font-black text-text-main">{detailName}</p>
                        <div className="bg-white/5 p-4 rounded-xl space-y-1">
                          <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Endereço:</p>
                          <div className="text-xs text-text-main leading-relaxed space-y-2">
                            <p>
                              {detailAddress}
                            </p>
                            {detailAddress.includes('(Obs:') && (
                              <div className="bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest p-2 rounded-lg border border-amber-500/20 mt-2">
                                Obs: {detailAddress.substring(detailAddress.indexOf('(Obs:') + 5).replace(/\)$/, '').trim()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Itens do Pedido */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-text-muted border-b border-white/5 pb-2">Itens do Pedido</h3>
                  {loadingItems ? (
                    <div className="flex justify-center py-4">
                      <Loader2 size={16} className="animate-spin text-primary" />
                    </div>
                  ) : selectedOrderItems.length > 0 ? (
                    <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                      {selectedOrderItems.map((item) => {
                        const name = item.products?.name || 'Item do Cardápio';
                        const cust = item.customizations || {};
                        const extras = cust.extras || [];
                        const halfAndHalf = cust.halfAndHalf;
                        
                        return (
                          <div key={item.id} className="bg-white/5 p-4 rounded-xl space-y-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-xs font-black text-text-main">{item.quantity}x {name}</span>
                                {cust.size && (
                                  <span className="text-[9px] uppercase font-black tracking-wider text-primary ml-2">
                                    ({cust.size === 'pequena' ? 'Pequena (16cm)' : cust.size === 'media' ? 'Média (20cm)' : cust.size === 'grande' ? 'Grande (25cm)' : cust.size === 'familia' ? 'Família (30cm)' : cust.size === 'gigante' ? 'Gigante (35cm)' : cust.size})
                                  </span>
                                )}
                              </div>
                              <span className="text-xs font-black text-secondary">R$ {(Number(item.price) * item.quantity).toFixed(2)}</span>
                            </div>
                            
                            {halfAndHalf && (
                              <p className="text-[10px] text-text-muted font-bold">
                                Metade 2: <span className="text-text-main">{halfAndHalf.secondFlavorName}</span>
                              </p>
                            )}
                            
                            {cust.border && cust.border !== 'none' && (
                              <p className="text-[9px] text-text-muted uppercase tracking-wider font-bold">
                                Borda: <span className="text-text-main">{cust.border === 'catupiry' ? 'Catupiry' : 'Cheddar'}</span>
                              </p>
                            )}

                            {extras.length > 0 && (
                              <p className="text-[9px] text-text-muted uppercase tracking-wider font-bold">
                                Extras: <span className="text-text-main">{extras.map((e: any) => e.name).join(', ')}</span>
                              </p>
                            )}

                            {cust.observation && (
                              <p className="text-[9px] text-amber-500 font-bold bg-amber-500/5 px-2 py-1 rounded border border-amber-500/10 mt-1">
                                Obs: {cust.observation}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-text-muted">Nenhum item encontrado.</p>
                  )}
                </div>

                {/* Pagamento e Valores */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-text-muted border-b border-white/5 pb-2">Pagamento e Valores</h3>
                  <div className="space-y-2 bg-white/5 p-4 rounded-xl">
                    <div className="flex justify-between text-xs">
                      <span className="text-text-muted font-bold">Forma de Pagamento:</span>
                      <span className="text-secondary font-black uppercase tracking-wider">
                        {PAYMENT_METHODS_LABELS[selectedOrderDetails.payment_method] || selectedOrderDetails.payment_method || 'Não informado'}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs pt-2 border-t border-white/5">
                      <span className="text-text-muted font-bold">Taxa de Entrega:</span>
                      <span className="text-text-main font-black">
                        R$ {Number(selectedOrderDetails.delivery_fee || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-white/5">
                      <span className="text-text-muted font-bold">Total do Pedido:</span>
                      <span className="text-primary font-black">
                        R$ {Number(selectedOrderDetails.total_amount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button
                  onClick={() => setSelectedOrderDetails(null)}
                  className="w-full py-4 bg-white/5 hover:bg-white/10 text-text-main rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  Fechar Detalhes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
