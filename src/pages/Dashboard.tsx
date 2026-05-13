import { motion } from 'motion/react';
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
  PieChart
} from 'lucide-react';
import { Link } from 'react-router-dom';

import logoImg from '../assets/logo-casarao.jpeg';

const STATS = [
  { label: 'Saldo Disponível', value: 'R$ 1.250,00', icon: Wallet, color: 'primary', trend: '+12%' },
  { label: 'Ganhos Totais', value: 'R$ 14.820,00', icon: TrendingUp, color: 'secondary', trend: '+5.4%' },
  { label: 'Minha Rede', value: '142', icon: Users, color: 'primary', trend: '+8' },
  { label: 'Pontuação Mensal', value: '2.500 pts', icon: Award, color: 'secondary', trend: '+150' },
];

const RECENT_ACTIVITY = [
  { id: 1, type: 'comissao', user: 'Marcos Silva', level: 'Nível 1', amount: 'R$ 15,00', date: 'Hoje, 14:20', status: 'confirmado' },
  { id: 2, type: 'cashback', user: 'Seu Pedido #4820', level: 'Pessoal', amount: 'R$ 8,40', date: 'Hoje, 12:10', status: 'pendente' },
  { id: 3, type: 'comissao', user: 'Ana Paula', level: 'Nível 2', amount: 'R$ 10,00', date: 'Ontem, 20:45', status: 'confirmado' },
  { id: 4, type: 'ativacao', user: 'Ricardo Santos', level: 'Nível 1', amount: 'R$ 25,00', date: 'Ontem, 18:30', status: 'confirmado' },
];

export default function Dashboard() {
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
          <SidebarLink icon={LayoutDashboard} label="Dashboard" active />
          <SidebarLink icon={Users} label="Minha Rede" to="/dashboard/network" />

          <SidebarLink icon={Wallet} label="Financeiro" to="/dashboard/financial" />

          <SidebarLink icon={ShoppingCart} label="Delivery" to="/" />
          <SidebarLink icon={PieChart} label="Relatórios" to="/dashboard/reports" />

          <SidebarLink icon={Settings} label="Configurações" to="/dashboard/settings" />

        </nav>

        <div className="p-6">
          <div className="p-6 rounded-3xl bg-primary/10 border border-primary/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-2 opacity-20 group-hover:scale-110 transition-transform">
               <Zap size={40} className="text-primary" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Seu Plano</p>
            <p className="text-lg font-black mb-4">Visionário</p>
            <button className="w-full py-2.5 bg-primary text-background rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all">
              Ver Benefícios
            </button>
          </div>
          <Link to="/login" className="flex items-center gap-3 w-full p-4 mt-6 text-text-muted hover:text-red-400 transition-colors font-black text-xs uppercase tracking-widest">
            <LogOut size={18} /> Sair da Conta
          </Link>

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
                  placeholder="Buscar na rede ou transações..."
                  className="w-full bg-background/50 border border-surface-border rounded-xl py-2.5 pl-12 pr-4 outline-none focus:border-primary/50 text-sm"
                />
             </div>
          </div>

          <div className="flex items-center gap-6">
            <button className="relative p-2 text-text-muted hover:text-primary transition-colors">
              <Bell size={22} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-surface-border">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black uppercase">Miguel Oliveira</p>
                <p className="text-[10px] text-primary font-bold">ID: CASARAO007</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-surface border border-surface-border flex items-center justify-center overflow-hidden">
                <img src="https://ui-avatars.com/api/?name=Miguel+Oliveira&background=00E5FF&color=0B0E14&bold=true" alt="Avatar" />
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="p-6 space-y-6">
          {/* Welcome Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div>
                <h1 className="text-3xl font-black mb-1">Olá, Miguel! 👋</h1>
                <p className="text-text-muted text-sm">Seu negócio cresceu <span className="text-primary font-bold">12%</span> esta semana.</p>
             </div>
             <div className="flex gap-3">
                <button className="bg-primary text-background px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg glow-primary flex items-center gap-2">
                   <ArrowUpRight size={16} /> Solicitar Saque
                </button>
                <button className="glass px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-surface-hover flex items-center gap-2">
                   <Users size={16} /> Convidar Amigo
                </button>
             </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map((stat, index) => (
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
            {/* Recent Activity Table */}
            <div className="lg:col-span-2 glass-card p-8 border-white/5">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xl font-black">Atividades Recentes</h3>
                 <button className="text-xs font-black text-primary uppercase tracking-widest hover:underline">Ver Tudo</button>
              </div>
              <div className="space-y-6">
                {RECENT_ACTIVITY.map((item) => (
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
                ))}
              </div>
            </div>

            {/* Network Progress */}
            <div className="glass-card p-8 border-white/5 space-y-8">
               <h3 className="text-xl font-black">Progresso de Carreira</h3>
               
               <div className="space-y-6">
                  <div>
                    <div className="flex justify-between items-end mb-3">
                       <div>
                          <p className="text-xs font-black uppercase text-text-muted">Nível Atual</p>
                          <p className="text-lg font-black text-primary">Diamante Pro</p>
                       </div>
                       <p className="text-xs font-black">85%</p>
                    </div>
                    <div className="h-2 w-full bg-surface rounded-full overflow-hidden">
                       <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: '85%' }}
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
                     <p className="text-sm text-text-muted mb-4">Indique mais <span className="text-white font-black">12 pessoas</span> para atingir o nível <span className="text-secondary font-black">Embaixador</span>.</p>
                     <div className="flex items-center gap-2 text-[10px] font-black text-secondary">
                        <Clock size={12} /> Faltam 12 dias para o fechamento
                     </div>
                  </div>

                  <button className="w-full py-4 glass border border-primary/20 text-primary rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary hover:text-background transition-all shadow-lg">
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

        <MobileNavLink icon={Settings} label="Perfil" />
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
      <span className="text-sm font-black uppercase tracking-widest">{label}</span>
    </Link>
  );
}

function MobileNavLink({ icon: Icon, label, active }: any) {
  return (
    <button className={`flex flex-col items-center gap-1 p-2 ${active ? 'text-primary' : 'text-text-muted'}`}>
      <Icon size={20} />
      <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
    </button>
  );
}

const Zap = ({ size, className }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
  </svg>
);
