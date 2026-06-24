import { motion } from 'motion/react';
import { 
  PieChart, 
  TrendingUp, 
  Users, 
  Download, 
  Calendar, 
  ChevronDown, 
  ArrowUpRight, 
  ArrowDownRight,
  LayoutDashboard,
  Wallet,
  ShoppingCart,
  Settings,
  LogOut,
  Bell,
  Search,
  Filter,
  BarChart3,
  Target,
  Award,
  Loader2,
  Ticket
} from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const REPORT_STATS = [
  { label: 'Crescimento Mensal', value: '+24%', icon: TrendingUp, color: 'primary', trend: 'up' },
  { label: 'Taxa de Retenção', value: '88%', icon: Target, color: 'secondary', trend: 'up' },
  { label: 'Média de Pedidos', value: 'R$ 42,50', icon: ShoppingCart, color: 'primary', trend: 'down' },
  { label: 'Novos Qualificados', value: '18', icon: Award, color: 'secondary', trend: 'up' },
];

const MONTHLY_DATA = [
  { month: 'Jan', value: 45, height: '45%' },
  { month: 'Fev', value: 52, height: '52%' },
  { month: 'Mar', value: 38, height: '38%' },
  { month: 'Abr', value: 65, height: '65%' },
  { month: 'Mai', value: 48, height: '48%' },
  { month: 'Jun', value: 72, height: '72%' },
];

const CATEGORY_BREAKDOWN = [
  { label: 'Pizzas Clássicas', value: '45%', color: 'bg-primary' },
  { label: 'Pizzas Premium', value: '30%', color: 'bg-secondary' },
  { label: 'Bebidas', value: '15%', color: 'bg-emerald-500' },
  { label: 'Sobremesas', value: '10%', color: 'bg-amber-500' },
];

import logoImg from '../assets/logo-casarao.jpeg';
import NotificationBell from '../components/NotificationBell';

export default function Reports() {
  const { user, profile: authProfile, loading, signOut } = useAuth();
  const [period, setPeriod] = useState('Mensal');

  const isAdminDemo = localStorage.getItem('admin_auth') === 'true';
  const profile = isAdminDemo ? {
    id: 0,
    mocha_user_id: 'admin',
    email: 'admin@casarao.com',
    full_name: 'Admin Casarão',
    role: 'admin',
    plan: 'master',
    referral_code: 'ADMIN',
    balance: 0,
    points: 0
  } : authProfile;

  const handleSignOut = async () => {
    localStorage.removeItem('admin_auth');
    await signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-text-muted font-black uppercase tracking-widest text-xs">Carregando Relatórios...</p>
      </div>
    );
  }

  if (!user && !isAdminDemo) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen bg-background text-text-main font-sans flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-72 flex-col glass border-r border-surface-border fixed h-full z-50">
        <div className="p-8">
          <Link to="/" className="flex items-center gap-3">
             <img src={logoImg} alt="Casarão Clube 7" className="h-12 w-auto object-contain" />
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <SidebarLink icon={LayoutDashboard} label="Dashboard" to={isAdminDemo ? "/admin" : "/dashboard"} />
          {!isAdminDemo && <SidebarLink icon={Users} label="Minha Rede" to="/dashboard/network" />}
          {!isAdminDemo && <SidebarLink icon={Wallet} label="Financeiro" to="/dashboard/financial" />}
          <SidebarLink icon={ShoppingCart} label="Delivery" to="/" />
          {!isAdminDemo && <SidebarLink icon={Ticket} label="Cupons" to="/coupons" />}
          <SidebarLink icon={PieChart} label="Relatórios" active />
          {!isAdminDemo && <SidebarLink icon={Settings} label="Configurações" to="/dashboard/settings" />}
          {isAdminDemo && (
            <>
              <SidebarLink icon={Wallet} label="Saques" to="/admin/payouts" />
              <SidebarLink icon={Users} label="Usuários" to="/admin/users" />
              <SidebarLink icon={Settings} label="Configurações" to="/admin/settings" />
            </>
          )}
        </nav>

        <div className="p-6">
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full p-4 text-text-muted hover:text-red-400 transition-colors font-black text-xs uppercase tracking-widest text-left"
          >
            <LogOut size={18} /> Sair da Conta
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 min-h-screen">
        {/* Header */}
        <header className="h-20 glass-card mx-6 mt-6 flex items-center justify-between px-8 border border-white/5">
          <div className="flex items-center gap-4 flex-1">
             <div className="relative max-w-md w-full hidden md:block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar em relatórios..."
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

        <div className="p-6 space-y-8">
          {/* Page Title */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div>
                <h1 className="text-3xl font-black mb-1">Relatórios 📊</h1>
                <p className="text-text-muted text-sm">Analise o desempenho da sua rede e a evolução dos seus ganhos.</p>
             </div>
             <div className="flex gap-3">
                <div className="flex bg-surface rounded-2xl p-1 border border-surface-border">
                   {['Semanal', 'Mensal', 'Anual'].map((p) => (
                      <button 
                        key={p}
                        onClick={() => setPeriod(p)}
                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${period === p ? 'bg-primary text-background shadow-lg' : 'text-text-muted hover:text-white'}`}
                      >
                        {p}
                      </button>
                   ))}
                </div>
                <button className="glass px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-surface-hover flex items-center gap-2 border border-white/10">
                   <Download size={16} /> Exportar PDF
                </button>
             </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {REPORT_STATS.map((stat, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-6 border-white/5"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-2xl ${stat.color === 'primary' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'}`}>
                    <stat.icon size={24} />
                  </div>
                  <div className={`flex items-center gap-1 text-[10px] font-black uppercase ${stat.trend === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>
                     {stat.trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                     {stat.trend === 'up' ? 'Crescendo' : 'Caindo'}
                  </div>
                </div>
                <p className="text-xs text-text-muted uppercase font-black tracking-widest mb-1">{stat.label}</p>
                <p className="text-2xl font-black">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Performance Chart (CSS based) */}
            <div className="lg:col-span-2 glass-card p-8 border-white/5">
               <div className="flex items-center justify-between mb-12">
                  <h3 className="text-xl font-black flex items-center gap-3">
                     <BarChart3 className="text-primary" size={24} /> Evolução de Ganhos
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-text-muted font-bold">
                     <div className="w-3 h-3 rounded-full bg-primary" /> Entradas
                     <div className="w-3 h-3 rounded-full bg-secondary ml-4" /> Projeção
                  </div>
               </div>
               
               <div className="h-64 flex items-end justify-between gap-2 px-4 relative">
                  {/* Grid Lines */}
                  <div className="absolute inset-x-0 top-0 h-px bg-white/5" />
                  <div className="absolute inset-x-0 top-1/4 h-px bg-white/5" />
                  <div className="absolute inset-x-0 top-2/4 h-px bg-white/5" />
                  <div className="absolute inset-x-0 top-3/4 h-px bg-white/5" />

                  {MONTHLY_DATA.map((data, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                       <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: data.height }}
                        transition={{ delay: i * 0.1, duration: 1 }}
                        className={`w-full max-w-[40px] rounded-t-xl relative group-hover:brightness-125 transition-all ${
                          i === MONTHLY_DATA.length - 1 ? 'bg-secondary glow-secondary' : 'bg-gradient-primary glow-primary'
                        }`}
                       >
                          <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-surface border border-white/10 px-2 py-1 rounded text-[10px] font-black opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                             R$ {data.value * 100},00
                          </div>
                       </motion.div>
                       <p className="mt-4 text-[10px] font-black uppercase text-text-muted">{data.month}</p>
                    </div>
                  ))}
               </div>
            </div>

            {/* Category Breakdown */}
            <div className="glass-card p-8 border-white/5 space-y-8">
               <h3 className="text-xl font-black">Vendas por Categoria</h3>
               
               <div className="flex justify-center py-4">
                  <div className="relative w-32 h-32">
                     <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        <path className="text-surface stroke-current" strokeWidth="4" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className="text-primary stroke-current" strokeWidth="4" strokeDasharray="45, 100" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className="text-secondary stroke-current" strokeWidth="4" strokeDasharray="30, 100" strokeDashoffset="-45" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className="text-emerald-500 stroke-current" strokeWidth="4" strokeDasharray="15, 100" strokeDashoffset="-75" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        <path className="text-amber-500 stroke-current" strokeWidth="4" strokeDasharray="10, 100" strokeDashoffset="-90" fill="none" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                     </svg>
                     <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <p className="text-lg font-black leading-none">142</p>
                        <p className="text-[8px] text-text-muted uppercase font-black">Total</p>
                     </div>
                  </div>
               </div>

               <div className="space-y-4">
                  {CATEGORY_BREAKDOWN.map((cat, i) => (
                     <div key={i} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                           <div className={`w-2 h-2 rounded-full ${cat.color}`} />
                           <span className="text-xs text-text-muted font-bold group-hover:text-white transition-colors">{cat.label}</span>
                        </div>
                        <span className="text-xs font-black">{cat.value}</span>
                     </div>
                  ))}
               </div>

               <button className="w-full py-4 glass border border-primary/20 text-primary rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary hover:text-background transition-all shadow-lg">
                  Ver Análise Detalhada
               </button>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full glass z-50 flex items-center justify-around py-3 px-4">
        <MobileNavLink icon={LayoutDashboard} label="Home" to={isAdminDemo ? "/admin" : "/dashboard"} />
        {!isAdminDemo && <MobileNavLink icon={Users} label="Rede" to="/dashboard/network" />}
        {!isAdminDemo && <MobileNavLink icon={Wallet} label="Saldo" to="/dashboard/financial" />}
        <MobileNavLink icon={PieChart} label="Relatórios" active />
      </nav>
    </div>
  );
}

function SidebarLink({ icon: Icon, label, active, to = '#' }: any) {
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

function MobileNavLink({ icon: Icon, label, active, to = '#' }: any) {
  return (
    <Link to={to} className={`flex flex-col items-center gap-1 p-2 ${active ? 'text-primary' : 'text-text-muted'}`}>
      <Icon size={20} />
      <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
    </Link>
  );
}
