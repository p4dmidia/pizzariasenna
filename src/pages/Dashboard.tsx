import { motion, AnimatePresence } from 'motion/react';
import BenefitsModal from '../components/BenefitsModal';
import CareerModal from '../components/CareerModal';
import { 
  TrendingUp, 
  Users, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  LayoutDashboard, 
  ShoppingCart, 
  Award, 
  Settings, 
  LogOut,
  Bell,
  Search,
  ChevronRight,
  Target,
  Clock,
  PieChart,
  Loader2,
  Zap,
  Ticket
} from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import AppLogo from '../components/AppLogo';
import NotificationBell from '../components/NotificationBell';

export default function Dashboard() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalEarnings: 0,
    networkCount: 0
  });
  const [isBenefitsOpen, setIsBenefitsOpen] = useState(false);
  const [isCareerOpen, setIsCareerOpen] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchDashboardData();
    }
  }, [profile]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 1. Ganhos Totais
      const { data: commissions } = await supabase
        .from('commissions')
        .select('amount')
        .eq('user_id', profile?.id);
      
      const totalEarnings = commissions?.reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

      // 2. Tamanho da Rede (Diretos por enquanto)
      const { count } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('sponsor_id', profile?.id);

      setStats({
        totalEarnings,
        networkCount: count || 0
      });

      // 3. Atividades Recentes (Comissões e Pedidos)
      const { data: recentCommissions } = await supabase
        .from('commissions')
        .select(`
          id,
          amount,
          created_at,
          from_user_id,
          level,
          from_user:user_profiles!commissions_from_user_id_fkey(full_name)
        `)
        .eq('user_id', profile?.id)
        .order('created_at', { ascending: false })
        .limit(4);

      setActivities(recentCommissions?.map(c => ({
        id: c.id,
        type: 'comissao',
        user: (c as any).from_user?.full_name || 'Afiliado',
        level: `Nível ${c.level}`,
        amount: `R$ ${Number(c.amount).toFixed(2)}`,
        date: new Date(c.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
        status: 'confirmado'
      })) || []);

    } catch (error) {
      console.error('Erro no dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-text-muted font-black uppercase tracking-widest text-xs">Acessando Terminal...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const STATS_CARDS = [
    { label: 'Saldo Disponível', value: `R$ ${profile?.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: Wallet, color: 'primary', trend: '+0%' },
    { label: 'Ganhos Totais', value: `R$ ${stats.totalEarnings.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: 'secondary', trend: '+0%' },
    { label: 'Minha Rede', value: stats.networkCount.toString(), icon: Users, color: 'primary', trend: `+${stats.networkCount}` },
    { label: 'Pontuação Mensal', value: `${profile?.points} pts`, icon: Award, color: 'secondary', trend: '+0' },
  ];

  return (
    <div className="min-h-screen bg-background text-text-main font-sans flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-72 flex-col glass border-r border-surface-border fixed h-full z-50">
        <div className="p-8">
          <Link to="/" className="flex items-center gap-3">
             <AppLogo />
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <SidebarLink icon={LayoutDashboard} label="Dashboard" active />
          <SidebarLink icon={Users} label="Minha Rede" to="/dashboard/network" />
          <SidebarLink icon={Wallet} label="Financeiro" to="/dashboard/financial" />
          <SidebarLink icon={ShoppingCart} label="Delivery" to="/" />
          <SidebarLink icon={Ticket} label="Cupons" to="/coupons" />
          <SidebarLink icon={PieChart} label="Relatórios" to="/dashboard/reports" />
          <SidebarLink icon={Settings} label="Configurações" to="/dashboard/settings" />
        </nav>

        <div className="p-6">
          <div className="p-6 rounded-3xl bg-primary/10 border border-primary/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:scale-110 transition-transform">
               <Zap size={40} className="text-primary" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Seu Plano</p>
            <p className="text-lg font-black mb-4 capitalize">{profile?.plan || 'Cliente'}</p>
            <button 
              onClick={() => setIsBenefitsOpen(true)}
              className="w-full py-2.5 bg-primary text-background rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all"
            >
              Ver Benefícios
            </button>
          </div>
          <button 
            onClick={signOut}
            className="flex items-center gap-3 w-full p-4 mt-6 text-text-muted hover:text-red-400 transition-colors font-black text-xs uppercase tracking-widest"
          >
            <LogOut size={18} /> Sair da Conta
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 min-h-screen">
        <header className="h-20 glass-card mx-6 mt-6 flex items-center justify-between px-8 border border-white/5">
          <div className="flex items-center gap-4 flex-1">
             <div className="relative max-w-md w-full hidden md:block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar na rede ou transações..."
                  className="w-full bg-background/50 border border-surface-border rounded-xl py-2.5 pl-12 pr-4 outline-none focus:border-primary/50 text-sm"
                />
             </div>
          </div>

          <div className="flex items-center gap-6">
            <NotificationBell />
            <div className="flex items-center gap-3 pl-6 border-l border-surface-border">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black uppercase">{profile?.full_name}</p>
                <p className="text-[10px] text-primary font-bold">ID: {profile?.referral_code}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-surface border border-surface-border flex items-center justify-center overflow-hidden">
                <img src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name}&background=00E5FF&color=0B0E14&bold=true`} alt="Avatar" />
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div>
                <h1 className="text-3xl font-black mb-1">Olá, {profile?.full_name.split(' ')[0]}! 👋</h1>
                <p className="text-text-muted text-sm">Seu negócio cresceu <span className="text-primary font-bold">{stats.networkCount > 0 ? '+12%' : '0%'}</span> esta semana.</p>
             </div>
             <div className="flex gap-3">
                <Link to="/dashboard/financial" className="bg-primary text-background px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg glow-primary flex items-center gap-2 hover:scale-105 transition-all">
                   <ArrowUpRight size={16} /> Solicitar Saque
                </Link>
                <Link to="/dashboard/network" className="glass px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-surface-hover flex items-center gap-2 hover:scale-105 transition-all">
                   <Users size={16} /> Convidar Amigo
                </Link>
             </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS_CARDS.map((stat, index) => (
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
                  <span className="text-[10px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                    {stat.trend}
                  </span>
                </div>
                <p className="text-xs text-text-muted uppercase font-black tracking-widest mb-1">{stat.label}</p>
                <p className="text-2xl font-black">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-card p-8 border-white/5">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xl font-black">Atividades Recentes</h3>
                 <Link to="/dashboard/reports" className="text-xs font-black text-primary uppercase tracking-widest hover:underline">Ver Tudo</Link>
              </div>
              <div className="space-y-6">
                {activities.length > 0 ? activities.map((item) => (
                  <div key={item.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        item.type === 'comissao' ? 'bg-emerald-500/10 text-emerald-400' : 
                        item.type === 'cashback' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
                      }`}>
                        {item.type === 'comissao' ? <TrendingUp size={20} /> : <ShoppingCart size={20} />}
                      </div>
                      <div>
                        <p className="text-sm font-black">{item.user}</p>
                        <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest">{item.level} • {item.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className={`text-sm font-black ${item.type === 'cashback' ? 'text-primary' : 'text-emerald-400'}`}>
                          +{item.amount}
                       </p>
                       <p className={`text-[8px] uppercase font-black tracking-widest ${item.status === 'confirmado' ? 'text-emerald-500/60' : 'text-amber-500/60'}`}>
                          {item.status}
                       </p>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-10 opacity-50">Nenhuma atividade recente.</div>
                )}
              </div>
            </div>

            <div className="glass-card p-8 border-white/5 space-y-8">
               <h3 className="text-xl font-black">Progresso de Carreira</h3>
               
               <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-end mb-3">
                       <div>
                          <p className="text-xs font-black uppercase text-text-muted">Nível Atual</p>
                          <p className="text-lg font-black text-primary">Iniciante</p>
                       </div>
                       <p className="text-xs font-black">0%</p>
                    </div>
                    <div className="h-2 w-full bg-surface rounded-full overflow-hidden">
                       <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '0%' }}
                        className="h-full bg-gradient-primary glow-primary" 
                       />
                    </div>
                  </div>

                  <div className="p-6 rounded-3xl bg-surface/50 border border-surface-border">
                     <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                           <Target size={20} />
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest">Próxima Meta</p>
                     </div>
                     <p className="text-sm text-text-muted mb-4">Indique seus primeiros amigos para começar a ganhar bônus de rede!</p>
                     <div className="flex items-center gap-2 text-[10px] font-black text-secondary">
                        <Clock size={12} /> Faltam 12 dias para o fechamento
                     </div>
                  </div>

                  <button 
                    onClick={() => setIsCareerOpen(true)}
                    className="w-full py-4 glass border border-primary/20 text-primary rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary hover:text-background transition-all shadow-lg"
                  >
                    Ver Plano de Carreira
                  </button>
               </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full glass z-50 flex items-center justify-around py-3 px-4">
        <MobileNavLink icon={LayoutDashboard} label="Home" active />
        <MobileNavLink icon={Users} label="Rede" to="/dashboard/network" />
        <MobileNavLink icon={Wallet} label="Saldo" to="/dashboard/financial" />
        <MobileNavLink icon={Settings} label="Perfil" to="/dashboard/settings" />
      </nav>

      {/* Modais de Benefícios e Carreira */}
      <BenefitsModal 
        isOpen={isBenefitsOpen} 
        onClose={() => setIsBenefitsOpen(false)} 
        currentPlan={profile?.plan}
      />
      <CareerModal 
        isOpen={isCareerOpen} 
        onClose={() => setIsCareerOpen(false)} 
        currentPoints={profile?.points}
      />
    </div>
  );
}

function SidebarLink({ icon: Icon, label, active = false, to = '#' }: any) {
  return (
    <Link 
      to={to}
      className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${
        active 
          ? 'bg-primary text-background shadow-lg glow-primary' 
          : 'text-text-muted hover:text-white hover:bg-surface-hover'
      }`}
    >
      <Icon size={20} className={active ? '' : 'group-hover:text-primary transition-colors'} />
      <span className="text-sm">{label}</span>
    </Link>
  );
}

function MobileNavLink({ icon: Icon, label, active = false, to = "" }: any) {
  return (
    <Link to={to} className={`flex flex-col items-center gap-1 p-2 ${active ? 'text-primary' : 'text-text-muted'}`}>
      <Icon size={20} />
      <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
    </Link>
  );
}
