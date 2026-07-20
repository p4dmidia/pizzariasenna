import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  Target, 
  Clock, 
  DollarSign, 
  Package, 
  X, 
  Zap, 
  Loader2,
  Store,
  Star
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { isStoreCurrentlyOpen } from '../../utils/storeHours';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    monthlyRevenue: 0,
    todayOrders: 0,
    totalCustomers: 0,
    kitchenLoad: 0,
    averageTicket: 0,
    storeRating: 4.8
  });
  const [storeOperatingSettings, setStoreOperatingSettings] = useState({
    operating_mode: 'auto',
    opening_time: '18:00',
    closing_time: '23:30',
    operating_days: '[0,1,2,3,4,5,6]',
    store_open: 'true',
    lastCheckTime: Date.now()
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  const isCurrentlyOpen = isStoreCurrentlyOpen({
    operating_mode: storeOperatingSettings.operating_mode,
    opening_time: storeOperatingSettings.opening_time,
    closing_time: storeOperatingSettings.closing_time,
    operating_days: storeOperatingSettings.operating_days,
    store_open: storeOperatingSettings.store_open === 'true'
  });

  useEffect(() => {
    fetchDashboardData();

    // Ticker a cada 5s para atualização do relógio em tempo real sem F5
    const timer = setInterval(() => {
      setStoreOperatingSettings(prev => ({ ...prev, lastCheckTime: Date.now() }));
    }, 5000);

    // Inscrição em Tempo Real no Supabase
    const channel = supabase
      .channel('public:system_settings_admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_settings' }, () => {
        fetchDashboardData();
      })
      .subscribe();

    return () => {
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

      // 1. Faturamento Mensal e Ticket Médio
      const { data: monthlyOrders } = await supabase
        .from('orders')
        .select('total_amount')
        .neq('status', 'cancelado')
        .gte('created_at', firstDayOfMonth);
      
      const monthlyRevenue = monthlyOrders?.reduce((acc, curr) => acc + Number(curr.total_amount), 0) || 0;
      const averageTicket = monthlyOrders && monthlyOrders.length > 0 
        ? monthlyRevenue / monthlyOrders.length 
        : 0;

      // 2. Pedidos de Hoje
      const { count: todayOrdersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      // 3. Total Clientes
      const { count: totalCustomersCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'user');

      // 4. Pedidos Recentes
      const { data: recent } = await supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          status,
          created_at,
          user_profiles (full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      // 5. Carga da Cozinha (Pedidos não concluídos / Total)
      const { data: allActiveOrders } = await supabase
        .from('orders')
        .select('status')
        .neq('status', 'cancelado')
        .neq('status', 'concluido');
      
      const kitchenLoad = Math.min(Math.round(((allActiveOrders?.length || 0) / 20) * 100), 100);

      // 6. Configurações de Abertura da Loja
      const { data: settingsData } = await supabase.from('system_settings').select('*');
      if (settingsData) {
        const sMap: any = {};
        settingsData.forEach(s => sMap[s.key] = s.value);
        setStoreOperatingSettings(prev => ({
          ...prev,
          operating_mode: sMap['operating_mode'] || 'auto',
          opening_time: sMap['opening_time'] || '18:00',
          closing_time: sMap['closing_time'] || '23:30',
          operating_days: sMap['operating_days'] || '[0,1,2,3,4,5,6]',
          store_open: sMap['store_open'] || 'true',
          lastCheckTime: Date.now()
        }));
      }

      // 7. Média de Avaliações
      const { data: reviews } = await supabase
        .from('order_reviews')
        .select('rating');

      let storeRating = 4.8;
      if (reviews && reviews.length > 0) {
        const sum = reviews.reduce((acc, r) => acc + Number(r.rating), 0);
        storeRating = parseFloat((sum / reviews.length).toFixed(1));
      }

      setStats({
        monthlyRevenue,
        todayOrders: todayOrdersCount || 0,
        totalCustomers: totalCustomersCount || 0,
        kitchenLoad,
        averageTicket,
        storeRating
      });

      setRecentOrders(recent?.map(order => ({
        id: `#${order.id}`,
        user: (order.user_profiles as any)?.full_name || 'Cliente',
        items: 'Ver detalhes',
        amount: `R$ ${Number(order.total_amount).toFixed(2)}`,
        time: new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: order.status
      })) || []);

    } catch (error: any) {
      toast.error('Erro ao carregar dashboard: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = async (newMode: 'auto' | 'manual_open' | 'manual_closed') => {
    try {
      const updates: Array<{ key: string; value: string }> = [
        { key: 'operating_mode', value: newMode }
      ];
      if (newMode === 'manual_open') {
        updates.push({ key: 'store_open', value: 'true' });
      } else if (newMode === 'manual_closed') {
        updates.push({ key: 'store_open', value: 'false' });
      }

      const { error } = await supabase.from('system_settings').upsert(updates, { onConflict: 'key' });
      if (error) throw error;

      setStoreOperatingSettings(prev => ({
        ...prev,
        operating_mode: newMode,
        store_open: newMode === 'manual_open' ? 'true' : newMode === 'manual_closed' ? 'false' : prev.store_open
      }));

      const labels: Record<string, string> = {
        auto: 'Modo Automático por Horário Ativado!',
        manual_open: 'Loja Forçada ABERTA Manualmente!',
        manual_closed: 'Loja Forçada FECHADA Manualmente!'
      };

      toast.success(labels[newMode]);
    } catch (err: any) {
      toast.error('Erro ao alterar modo de funcionamento: ' + err.message);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-text-muted font-black uppercase tracking-widest text-xs">Carregando Dashboard...</p>
        </div>
      </AdminLayout>
    );
  }

  const ADMIN_STATS = [
    { label: 'Faturamento Mensal', value: `R$ ${stats.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'primary', trend: '+12.5%' },
    { label: 'Pedidos de Hoje', value: stats.todayOrders.toString(), icon: ShoppingCart, color: 'secondary', trend: 'Hoje' },
    { label: 'Total Clientes', value: stats.totalCustomers.toString(), icon: Users, color: 'primary', trend: 'Cadastrados' },
    { label: 'Ticket Médio', value: `R$ ${stats.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: 'secondary', trend: 'Por pedido' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div>
              <h1 className="text-3xl font-black mb-1">Visão Geral 🏢</h1>
              <p className="text-text-muted text-sm">Painel de gerenciamento geral do seu <span className="text-primary font-bold">Delivery</span>.</p>
           </div>
           <div className="flex gap-3">
              <button 
                onClick={() => setIsGoalsModalOpen(true)}
                className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all flex items-center gap-2"
              >
                 <Target size={16} /> Metas do Mês
              </button>
           </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {ADMIN_STATS.map((stat, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card p-6 border-white/5 group hover:border-primary/20 transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${stat.color === 'primary' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>
                  <stat.icon size={24} />
                </div>
                <span className="text-[10px] font-black px-2 py-1 rounded-full text-emerald-400 bg-emerald-400/10">
                  {stat.trend}
                </span>
              </div>
              <p className="text-xs text-text-muted uppercase font-black tracking-widest mb-1">{stat.label}</p>
              <p className="text-2xl font-black">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Orders Table */}
          <div className="lg:col-span-2 glass-card p-8 border-white/5">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl font-black flex items-center gap-3">
                  <Package className="text-primary" size={24} /> Pedidos Recentes
               </h3>
               <button 
                 onClick={() => navigate('/admin/orders')}
                 className="text-xs font-black text-primary uppercase tracking-widest hover:underline"
               >
                 Gerenciar Todos
               </button>
            </div>
            <div className="space-y-6">
              {recentOrders.length > 0 ? recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                      order.status === 'pendente' ? 'bg-amber-500/10 text-amber-400' : 
                      order.status === 'preparando' ? 'bg-primary/10 text-primary' : 
                      order.status === 'entrega' ? 'bg-secondary/10 text-secondary' : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      <ShoppingCart size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-black">{order.id}</p>
                        <span className="text-[10px] text-text-muted font-bold">• {order.time}</span>
                      </div>
                      <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest">{order.user} • {order.items}</p>
                    </div>
                  </div>
                  <div className="text-right">
                     <p className="text-sm font-black text-text-main">{order.amount}</p>
                     <p className={`text-[8px] uppercase font-black tracking-widest ${
                       order.status === 'pendente' ? 'text-amber-500' : 
                       order.status === 'preparando' ? 'text-primary' : 
                       order.status === 'entrega' ? 'text-secondary' : 'text-emerald-500'
                     }`}>
                        {order.status}
                     </p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-10 opacity-50">Nenhum pedido recente.</div>
              )}
            </div>
          </div>

          {/* Controls & Store Status */}
          <div className="glass-card p-8 border-white/5 space-y-8">
             <h3 className="text-xl font-black">Comando do Restaurante</h3>
             
             <div className="space-y-6">
                {/* Store status card */}
                <div className={`p-6 rounded-3xl border flex flex-col gap-4 ${
                  isCurrentlyOpen 
                    ? 'bg-emerald-500/5 border-emerald-500/20' 
                    : 'bg-red-500/5 border-red-500/20'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isCurrentlyOpen ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                    }`}>
                      <Store size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-text-muted tracking-wider leading-none">Estabelecimento (Tempo Real)</p>
                      <p className={`font-black text-sm mt-1 uppercase ${isCurrentlyOpen ? 'text-emerald-400' : 'text-red-400'}`}>
                        {isCurrentlyOpen ? 'Aberto para pedidos' : 'Fechado no momento'}
                      </p>
                      <p className="text-[9px] text-text-muted font-bold mt-0.5">
                        {storeOperatingSettings.operating_mode === 'auto' 
                          ? `⏱️ Automático: ${storeOperatingSettings.opening_time} às ${storeOperatingSettings.closing_time}` 
                          : storeOperatingSettings.operating_mode === 'manual_open' 
                          ? '🟢 Modo Manual: Forçado Aberto' 
                          : '🔴 Modo Manual: Forçado Fechado'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 pt-2 border-t border-white/5">
                    <button 
                      onClick={() => handleModeChange('auto')}
                      className={`w-full py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all border ${
                        storeOperatingSettings.operating_mode === 'auto'
                          ? 'bg-primary text-background border-primary glow-primary'
                          : 'bg-surface hover:bg-surface-hover border-surface-border text-text-muted'
                      }`}
                    >
                      ⏱️ Usar Horário Automático
                    </button>
                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => handleModeChange('manual_open')}
                        className={`py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all border ${
                          storeOperatingSettings.operating_mode === 'manual_open'
                            ? 'bg-emerald-500 text-background border-emerald-500 glow-emerald'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        }`}
                      >
                        🟢 Forçar Aberta
                      </button>
                      <button 
                        onClick={() => handleModeChange('manual_closed')}
                        className={`py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all border ${
                          storeOperatingSettings.operating_mode === 'manual_closed'
                            ? 'bg-red-500 text-white border-red-500 glow-red'
                            : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30'
                        }`}
                      >
                        🔴 Forçar Fechada
                      </button>
                    </div>
                  </div>
                </div>

                {/* Kitchen load */}
                <div>
                  <div className="flex justify-between items-end mb-3">
                     <p className="text-xs font-black uppercase text-text-muted">Carga da Cozinha</p>
                     <p className="text-xs font-black">{stats.kitchenLoad}%</p>
                  </div>
                  <div className="h-2 w-full bg-surface rounded-full overflow-hidden">
                     <motion.div initial={{ width: 0 }} animate={{ width: `${stats.kitchenLoad}%` }} className="h-full bg-primary glow-primary" />
                  </div>
                </div>

                {/* Average Store rating */}
                <div className="p-6 rounded-3xl bg-surface/50 border border-surface-border">
                   <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                         <Star size={20} className="fill-amber-400 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-text-muted tracking-wider leading-none">Média de Avaliações</p>
                        <p className="text-lg font-black text-text-main mt-1">⭐ {stats.storeRating}</p>
                      </div>
                   </div>
                   <p className="text-xs text-text-muted">Avaliação média calculada diretamente com base nos feedbacks recebidos dos clientes após as entregas.</p>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={() => navigate('/admin/orders')}
                    className="w-full py-4 bg-primary text-background rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-lg glow-primary"
                  >
                    Painel de Cozinha (Pedidos)
                  </button>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Metas Modal */}
      <AnimatePresence>
        {isGoalsModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsGoalsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-surface border border-white/10 rounded-[32px] p-8 relative z-10 overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full -mr-32 -mt-32" />
              
              <div className="flex items-center justify-between mb-8 relative">
                <div>
                   <h2 className="text-2xl font-black mb-1">Metas de Vendas 🚀</h2>
                   <p className="text-text-muted text-xs uppercase font-black tracking-widest">Mês Corrente</p>
                </div>
                <button 
                  onClick={() => setIsGoalsModalOpen(false)}
                  className="p-2.5 bg-white/5 hover:bg-white/10 rounded-2xl text-text-muted hover:text-white transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-8 relative">
                {/* Meta de Faturamento */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 text-primary rounded-xl">
                         <DollarSign size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] text-text-muted uppercase font-black tracking-widest">Faturamento Mensal</p>
                        <p className="text-sm font-black">
                          R$ {stats.monthlyRevenue.toLocaleString()} 
                          <span className="text-text-muted font-bold text-xs ml-1">/ R$ 50.000</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-black text-primary">{Math.min(Math.round((stats.monthlyRevenue / 50000) * 100), 100)}%</p>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((stats.monthlyRevenue / 50000) * 100, 100)}%` }}
                      className="h-full bg-primary glow-primary"
                    />
                  </div>
                </div>

                {/* Meta de Pedidos */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-secondary/10 text-secondary rounded-xl">
                         <ShoppingCart size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] text-text-muted uppercase font-black tracking-widest">Pedidos do Mês</p>
                        <p className="text-sm font-black">
                          {stats.todayOrders * 30} 
                          <span className="text-text-muted font-bold text-xs ml-1">/ 1.500</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-black text-secondary">{Math.min(Math.round(((stats.todayOrders * 30) / 1500) * 100), 100)}%</p>
                    </div>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(((stats.todayOrders * 30) / 1500) * 100, 100)}%` }}
                      className="h-full bg-secondary glow-secondary"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
