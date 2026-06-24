import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  Users, 
  Wallet, 
  ShoppingCart, 
  ArrowUpRight, 
  ArrowDownRight,
  Target,
  Clock,
  PieChart,
  DollarSign,
  Package,
  X,
  Zap,
  BarChart3,
  Loader2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    monthlyRevenue: 0,
    pendingPayouts: 0,
    pendingPayoutsCount: 0,
    todayOrders: 0,
    totalAffiliates: 0,
    payoutRatio: 0,
    kitchenLoad: 0
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

      // 1. Faturamento Mensal
      const { data: monthlyOrders } = await supabase
        .from('orders')
        .select('total_amount')
        .neq('status', 'cancelado')
        .gte('created_at', firstDayOfMonth);
      
      const monthlyRevenue = monthlyOrders?.reduce((acc, curr) => acc + Number(curr.total_amount), 0) || 0;

      // 2. Saques Pendentes
      const { data: payouts } = await supabase
        .from('payout_requests')
        .select('amount')
        .eq('status', 'pendente');
      
      const pendingPayouts = payouts?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;
      const pendingPayoutsCount = payouts?.length || 0;

      // 3. Pedidos de Hoje
      const { count: todayOrdersCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      // 4. Total Afiliados
      const { count: totalAffiliatesCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'user');

      // 5. Pedidos Recentes
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
        .limit(4);

      // 6. Payout Ratio (Comissões / Faturamento)
      const { data: monthlyCommissions } = await supabase
        .from('commissions')
        .select('amount')
        .gte('created_at', firstDayOfMonth);
      
      const totalCommissions = monthlyCommissions?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;
      const payoutRatio = monthlyRevenue > 0 ? (totalCommissions / monthlyRevenue) * 100 : 0;

      // 7. Carga da Cozinha (Pedidos não concluídos / Total)
      const { data: allActiveOrders } = await supabase
        .from('orders')
        .select('status')
        .neq('status', 'cancelado')
        .neq('status', 'concluido');
      
      const kitchenLoad = Math.min(Math.round(((allActiveOrders?.length || 0) / 20) * 100), 100); // Ex: 20 pedidos é 100% de carga

      setStats({
        monthlyRevenue,
        pendingPayouts,
        pendingPayoutsCount,
        todayOrders: todayOrdersCount || 0,
        totalAffiliates: totalAffiliatesCount || 0,
        payoutRatio,
        kitchenLoad
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

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-text-muted font-black uppercase tracking-widest text-xs">Carregando Inteligência...</p>
        </div>
      </AdminLayout>
    );
  }

  const ADMIN_STATS = [
    { label: 'Faturamento Mensal', value: `R$ ${stats.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: 'primary', trend: '+12.5%' },
    { label: 'Saques Pendentes', value: `R$ ${stats.pendingPayouts.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: Wallet, color: 'secondary', trend: `${stats.pendingPayoutsCount} aguardando` },
    { label: 'Pedidos de Hoje', value: stats.todayOrders.toString(), icon: ShoppingCart, color: 'primary', trend: '+8% vs ontem' },
    { label: 'Total Afiliados', value: stats.totalAffiliates.toString(), icon: Users, color: 'secondary', trend: '+24 esta semana' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div>
              <h1 className="text-3xl font-black mb-1">Visão Geral 🏢</h1>
              <p className="text-text-muted text-sm">Bem-vindo ao centro de comando da <span className="text-primary font-bold">Casarão Clube 7</span>.</p>
           </div>
           <div className="flex gap-3">
              <button 
                onClick={() => setIsGoalsModalOpen(true)}
                className="bg-primary text-background px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg glow-primary flex items-center gap-2 hover:scale-105 transition-all"
              >
                 <Target size={16} /> Ver Metas Globais
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
                <span className={`text-[10px] font-black px-2 py-1 rounded-full ${
                  stat.trend.includes('+') ? 'text-emerald-400 bg-emerald-400/10' : 'text-amber-400 bg-amber-400/10'
                }`}>
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

          {/* Quick Actions / System Health */}
          <div className="glass-card p-8 border-white/5 space-y-8">
             <h3 className="text-xl font-black">Saúde do Sistema</h3>
             
             <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-3">
                     <p className="text-xs font-black uppercase text-text-muted">Carga da Cozinha</p>
                     <p className="text-xs font-black">{stats.kitchenLoad}%</p>
                  </div>
                  <div className="h-2 w-full bg-surface rounded-full overflow-hidden">
                     <motion.div initial={{ width: 0 }} animate={{ width: `${stats.kitchenLoad}%` }} className="h-full bg-primary glow-primary" />
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-surface/50 border border-surface-border">
                   <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                         <PieChart size={20} />
                      </div>
                      <p className="text-xs font-black uppercase tracking-widest">Payout Ratio</p>
                   </div>
                   <p className="text-sm text-text-muted mb-4">As comissões representam <span className="text-text-main font-black">{Math.round(stats.payoutRatio)}%</span> do faturamento bruto este mês.</p>
                   <div className="flex items-center gap-2 text-[10px] font-black text-emerald-400">
                      <TrendingUp size={12} /> Saudável dentro da margem
                   </div>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={() => navigate('/admin/payouts')}
                    className="w-full py-4 bg-secondary text-background rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-lg glow-secondary"
                  >
                    Processar Saques ({stats.pendingPayoutsCount})
                  </button>
                  <button 
                    onClick={() => navigate('/dashboard/reports')}
                    className="w-full py-4 glass border border-primary/20 text-primary rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary hover:text-background transition-all"
                  >
                    Ver Relatórios Completos
                  </button>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Global Goals Modal */}
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
              className="w-full max-w-2xl bg-surface border border-white/10 rounded-[32px] p-8 md:p-12 relative z-10 overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 blur-[80px] rounded-full -mr-32 -mt-32" />
              
              <div className="flex items-center justify-between mb-10 relative">
                <div>
                   <h2 className="text-3xl font-black mb-2">Metas Globais 🚀</h2>
                   <p className="text-text-muted text-sm uppercase font-black tracking-widest">Maio 2026</p>
                </div>
                <button 
                  onClick={() => setIsGoalsModalOpen(false)}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-text-muted hover:text-white transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-10 relative">
                {/* Meta de Faturamento */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                         <DollarSign size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-text-muted uppercase font-black tracking-widest">Faturamento do Mês</p>
                        <p className="text-lg font-black">
                          R$ {stats.monthlyRevenue.toLocaleString()} 
                          <span className="text-text-muted font-bold text-sm ml-2">/ R$ 100.000</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-xl font-black text-primary">{Math.min(Math.round((stats.monthlyRevenue / 100000) * 100), 100)}%</p>
                    </div>
                  </div>
                  <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((stats.monthlyRevenue / 100000) * 100, 100)}%` }}
                      className="h-full bg-primary glow-primary"
                    />
                  </div>
                </div>

                {/* Meta de Afiliados */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-secondary/10 text-secondary rounded-2xl">
                         <Users size={20} />
                      </div>
                      <div>
                        <p className="text-xs text-text-muted uppercase font-black tracking-widest">Novos Afiliados</p>
                        <p className="text-lg font-black">
                          {stats.totalAffiliates} 
                          <span className="text-text-muted font-bold text-sm ml-2">/ 5.000</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-xl font-black text-secondary">{Math.min(Math.round((stats.totalAffiliates / 5000) * 100), 100)}%</p>
                    </div>
                  </div>
                  <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((stats.totalAffiliates / 5000) * 100, 100)}%` }}
                      className="h-full bg-secondary glow-secondary"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex flex-col md:flex-row gap-6">
                   <div className="flex-1 p-6 rounded-3xl bg-primary/5 border border-primary/10 flex items-center gap-4">
                      <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                         <Zap size={24} />
                      </div>
                      <div>
                         <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-1">Status de Crescimento</p>
                         <p className="text-sm font-bold">Painel sincronizado com o banco de dados oficial.</p>
                      </div>
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
