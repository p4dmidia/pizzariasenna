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
  Bell
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

const STATUS_CONFIG: any = {
  pendente: { label: 'Pendente', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', next: 'preparando' },
  preparando: { label: 'Preparando', icon: Package, color: 'text-primary', bg: 'bg-primary/10', next: 'entrega' },
  entrega: { label: 'Em Entrega', icon: Truck, color: 'text-secondary', bg: 'bg-secondary/10', next: 'concluido' },
  concluido: { label: 'Concluído', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', next: null },
  cancelado: { label: 'Cancelado', icon: X, color: 'text-red-500', bg: 'bg-red-500/10', next: null },
};

const TAB_LABELS: Record<string, string> = {
  aberto: 'Em Aberto',
  todos: 'Todos',
  pendente: 'Pendente',
  preparando: 'Preparando',
  entrega: 'Em Entrega',
  concluido: 'Concluído'
};

import { X } from 'lucide-react';

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
  const ringerRef = useRef<{ stop: () => void } | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [activeMenuOrderId, setActiveMenuOrderId] = useState<number | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any | null>(null);

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

  useEffect(() => {
    fetchOrders();

    // Iniciar/desbloquear o AudioContext no primeiro gesto do usuário na página
    const unlockAudio = () => {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext && !audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(console.error);
      }
    };

    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', unlockAudio);

    // Inscrição em tempo real para novos pedidos
    const channel = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        fetchOrders();
        if (payload.eventType === 'INSERT') {
          // Play ringtone loop
          if (ringerRef.current) {
            ringerRef.current.stop();
          }
          ringerRef.current = startPhoneRinger(audioCtxRef.current);

          // Fetch full details of the newly inserted order (including user profile)
          const fetchNewOrderDetails = async () => {
            try {
              const { data, error } = await supabase
                .from('orders')
                .select(`
                  *,
                  user_profiles (full_name, address, number, complement, neighborhood, city)
                `)
                .eq('id', payload.new.id)
                .single();
              if (error) throw error;
              if (data) {
                setNewOrderAlert(data);
              }
            } catch (e) {
              console.error("Error fetching new order details:", e);
              // Fallback to payload.new
              setNewOrderAlert(payload.new);
            }
          };
          fetchNewOrderDetails();

          toast.success('Novo pedido recebido!', {
            duration: 6000,
            icon: '🔔'
          });
        }
      })
      .subscribe((status) => {
        console.log("Supabase Realtime Status (AdminOrders):", status);
        if (status === 'CHANNEL_ERROR') {
          console.error("Erro na inscrição do Realtime. Certifique-se de que a replicação do Realtime está ativada para a tabela 'orders' no Supabase Dashboard.");
        }
      });

    return () => {
      supabase.removeChannel(channel);
      if (ringerRef.current) {
        ringerRef.current.stop();
      }
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          user_profiles (full_name, address, number, complement, neighborhood, city)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar pedidos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const distributeOrderRewards = async (orderId: number) => {
    try {
      // Evitar duplicar recompensas usando cache local no localStorage
      const distributedOrders = JSON.parse(localStorage.getItem('casarao.rewards-distributed') || '[]');
      if (distributedOrders.includes(orderId)) {
        return;
      }

      // 1. Buscar o pedido
      const { data: order, error: orderErr } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderErr || !order) {
        console.error('Erro ao buscar dados do pedido para recompensas:', orderErr);
        return;
      }

      const buyerId = order.user_id;
      const amountToCalculate = Math.max(0, order.total_amount - (order.delivery_fee || 0));

      if (amountToCalculate <= 0) return;

      // 2. Buscar perfil do comprador para obter o sponsor_id
      const { data: buyerProfile, error: buyerErr } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', buyerId)
        .single();

      if (buyerErr || !buyerProfile) {
        console.error('Erro ao buscar perfil do comprador:', buyerErr);
        return;
      }

      // 3. Carregar configurações do sistema (comissões/cashback)
      const { data: settingsData } = await supabase
        .from('system_settings')
        .select('key, value');

      const getSettingVal = (key: string, defaultVal: string) => {
        const item = settingsData?.find(s => s.key === key);
        return item ? item.value : defaultVal;
      };

      const buyerPlan = buyerProfile.plan || 'cliente';
      const personalCashbackKey = `commission_${buyerPlan}_l1`;
      const personalActiveKey = `commission_${buyerPlan}_l1_active`;
      
      const isPersonalActive = getSettingVal(personalActiveKey, 'true') === 'true';
      
      let personalCashbackPercent = 10;
      if (isPersonalActive) {
        personalCashbackPercent = parseFloat(getSettingVal(personalCashbackKey, '10'));
      } else {
        personalCashbackPercent = 0;
      }

      // O cashback pessoal deve ser calculado sobre o subtotal do pedido (descontando a taxa de entrega)
      const personalCashbackAmount = amountToCalculate * (personalCashbackPercent / 100);
      
      // Creditar saldo ao comprador no banco
      const { error: buyerUpdateErr } = await supabase
        .from('user_profiles')
        .update({ balance: (buyerProfile.balance || 0) + personalCashbackAmount })
        .eq('id', buyerId);

      if (buyerUpdateErr) {
        console.error('Erro ao atualizar saldo de cashback do comprador:', buyerUpdateErr);
      } else {
        console.log(`Cashback pessoal de R$ ${personalCashbackAmount.toFixed(2)} creditado para ${buyerProfile.full_name}`);
      }

      // Atualizar também no mock-profiles do localStorage para testes locais
      const mockProfiles = JSON.parse(localStorage.getItem('supabase.mock-profiles') || '[]');
      const buyerMockIndex = mockProfiles.findIndex((p: any) => p.mocha_user_id === buyerProfile.mocha_user_id);
      if (buyerMockIndex !== -1) {
        mockProfiles[buyerMockIndex].balance = (mockProfiles[buyerMockIndex].balance || 0) + personalCashbackAmount;
        localStorage.setItem('supabase.mock-profiles', JSON.stringify(mockProfiles));
      }

      // 4. Distribuir comissões na rede (MLM) para os patrocinadores up-line
      let currentSponsorId = buyerProfile.sponsor_id;
      let level = 1;
      const maxNetworkLevels = 10;

      while (currentSponsorId && level <= maxNetworkLevels) {
        const { data: sponsor, error: sponsorErr } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', currentSponsorId)
          .single();

        if (sponsorErr || !sponsor) break;

        const plan = sponsor.plan || 'cliente';
        
        let maxDepth = plan === 'cliente' ? 0 : plan === 'empreendedor' ? 3 : 7;
        const depthSettingKey = `plan_levels_${plan}`;
        const depthSettingVal = getSettingVal(depthSettingKey, maxDepth.toString());
        maxDepth = parseInt(depthSettingVal, 10);

        if (level <= maxDepth) {
          const commissionKey = `commission_${plan}_l${level}`;
          const activeKey = `commission_${plan}_l${level}_active`;
          
          const isCommissionActive = getSettingVal(activeKey, 'true') === 'true';
          
          if (isCommissionActive) {
            const commissionPercent = parseFloat(getSettingVal(commissionKey, '0'));
            
            if (commissionPercent > 0) {
              const commissionAmount = amountToCalculate * (commissionPercent / 100);
              
              const { error: sponsorUpdateErr } = await supabase
                .from('user_profiles')
                .update({ balance: (sponsor.balance || 0) + commissionAmount })
                .eq('id', sponsor.id);

              if (sponsorUpdateErr) {
                console.error(`Erro ao creditar comissão para sponsor ID ${sponsor.id}:`, sponsorUpdateErr);
              } else {
                console.log(`Comissão de R$ ${commissionAmount.toFixed(2)} (Nível ${level}) creditada para ${sponsor.full_name}`);
                
                const sponsorMockIndex = mockProfiles.findIndex((p: any) => p.mocha_user_id === sponsor.mocha_user_id);
                if (sponsorMockIndex !== -1) {
                  mockProfiles[sponsorMockIndex].balance = (mockProfiles[sponsorMockIndex].balance || 0) + commissionAmount;
                  localStorage.setItem('supabase.mock-profiles', JSON.stringify(mockProfiles));
                }
              }
            }
          }
        }

        currentSponsorId = sponsor.sponsor_id;
        level++;
      }

      // Registrar que já foi distribuído para evitar duplicidade
      distributedOrders.push(orderId);
      localStorage.setItem('casarao.rewards-distributed', JSON.stringify(distributedOrders));

    } catch (err) {
      console.error('Erro na distribuição de recompensas do pedido:', err);
    }
  };

  const updateOrderStatus = async (orderId: number, nextStatus: string) => {
    try {
      setUpdatingId(orderId);
      const { error } = await supabase
        .from('orders')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;

      // Se o status foi alterado para concluído, distribuir cashback e comissões da rede
      if (nextStatus === 'concluido') {
        await distributeOrderRewards(orderId);
      }

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
    try {
      if (ringerRef.current) {
        ringerRef.current.stop();
        ringerRef.current = null;
      }
      setNewOrderAlert(null);
      
      const { error } = await supabase
        .from('orders')
        .update({ status: 'preparando', updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
      toast.success(`Pedido #${orderId} aceito! Enviado para a cozinha.`);
      fetchOrders();
    } catch (error: any) {
      toast.error('Erro ao aceitar pedido: ' + error.message);
    }
  };

  const handleRejectOrder = async (orderId: number) => {
    try {
      if (ringerRef.current) {
        ringerRef.current.stop();
        ringerRef.current = null;
      }
      setNewOrderAlert(null);

      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelado', updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (error) throw error;
      toast.error(`Pedido #${orderId} recusado.`);
      fetchOrders();
    } catch (error: any) {
      toast.error('Erro ao recusar pedido: ' + error.message);
    }
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
              <h1 className="text-3xl font-black mb-1">Pedidos 🍕</h1>
              <p className="text-text-muted text-sm">Gerencie o fluxo de pedidos da <span className="text-primary font-bold">Casarão</span>.</p>
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
                       const StatusIcon = config.icon;
                       const time = new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
                                <p className="text-[10px] text-text-muted font-bold mt-1">{time}</p>
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
                                <div className="flex items-center justify-end relative">
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
                                             className="w-full text-left px-4 py-2.5 text-xs font-bold text-white hover:bg-white/5 transition-colors"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="w-full max-w-lg bg-surface border border-surface-border rounded-3xl p-8 shadow-2xl relative overflow-hidden"
            >
              {/* Pulsing Glow */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl animate-pulse" />
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-secondary/20 rounded-full blur-3xl animate-pulse" />

              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 text-primary rounded-full mb-4 animate-bounce">
                  <Bell size={32} className="animate-pulse" />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-wider text-text-main">Novo Pedido Recebido!</h2>
                <p className="text-primary font-bold text-lg mt-1">#{newOrderAlert.id}</p>
              </div>

              <div className="space-y-4 bg-white/5 p-6 rounded-2xl border border-white/5 mb-8">
                {(() => {
                  const { name: alertName, address: alertAddress } = getOrderClientDetails(newOrderAlert);
                  return (
                    <>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Cliente:</span>
                        <span className="col-span-2 text-sm font-black text-text-main">{alertName}</span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Endereço:</span>
                        <div className="col-span-2 space-y-1">
                          <span className="text-xs font-bold text-text-muted leading-relaxed">
                            {alertAddress}
                          </span>
                          {alertAddress.includes('(Obs:') && (
                            <div className="bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-widest p-2 rounded-lg border border-amber-500/20 mt-1">
                              Obs: {alertAddress.substring(alertAddress.indexOf('(Obs:') + 5).replace(/\)$/, '').trim()}
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  );
                })()}

                <div className="grid grid-cols-3 gap-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Pagamento:</span>
                  <span className="col-span-2 text-xs font-black text-secondary uppercase tracking-wider">
                    {PAYMENT_METHODS_LABELS[newOrderAlert.payment_method] || newOrderAlert.payment_method || 'Não especificado'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Valor Total:</span>
                  <span className="col-span-2 text-lg font-black text-primary">
                    R$ {Number(newOrderAlert.total_amount).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleRejectOrder(newOrderAlert.id)}
                  className="py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-2xl text-xs font-black uppercase tracking-widest border border-red-500/20 hover:border-red-500/30 transition-all"
                >
                  Recusar
                </button>
                <button
                  onClick={() => handleAcceptOrder(newOrderAlert.id)}
                  className="py-4 bg-primary text-background hover:bg-primary/95 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30"
                >
                  Aceitar
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
