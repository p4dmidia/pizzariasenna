import { motion } from 'motion/react';
import { 
  Users, 
  Search, 
  Filter, 
  ChevronRight, 
  UserPlus, 
  Award, 
  TrendingUp,
  LayoutDashboard,
  Wallet,
  ShoppingCart,
  PieChart,
  Settings,
  LogOut,
  Bell,
  ArrowUpRight,
  Mail,
  Phone,
  Calendar,
  LayoutList,
  Network as NetworkIcon,
  ChevronDown,
  User
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const NETWORK_STATS = [
  { label: 'Total na Rede', value: '142', icon: Users, color: 'primary' },
  { label: 'Indicações Diretas', value: '48', icon: UserPlus, color: 'secondary' },
  { label: 'Ativos este Mês', value: '126', icon: TrendingUp, color: 'primary' },
  { label: 'Novos (30 dias)', value: '+12', icon: Award, color: 'secondary' },
];

const REFERRALS = [
  { 
    id: 67, 
    name: 'Rogerio Lima', 
    level: 1, 
    status: 'active', 
    date: '12/04/2026', 
    email: 'rogerio@email.com', 
    phone: '(11) 99999-9999',
    avatar: 'https://ui-avatars.com/api/?name=Rogerio+Lima&background=00E5FF&color=0B0E14&bold=true',
    referralsCount: 12
  },
  { 
    id: 75, 
    name: 'Afiliado #75', 
    level: 1, 
    status: 'active', 
    date: '15/04/2026', 
    email: 'afiliado75@email.com', 
    phone: '(11) 98888-8888',
    avatar: 'https://ui-avatars.com/api/?name=Afiliado+75&background=00E5FF&color=0B0E14&bold=true',
    referralsCount: 0
  },
  { 
    id: 76, 
    name: 'Afiliado #76', 
    level: 1, 
    status: 'pending', 
    date: '16/04/2026', 
    email: 'afiliado76@email.com', 
    phone: '(11) 97777-7777',
    avatar: 'https://ui-avatars.com/api/?name=Afiliado+76&background=00E5FF&color=0B0E14&bold=true',
    referralsCount: 2
  },
  { 
    id: 77, 
    name: 'Afiliado #77', 
    level: 1, 
    status: 'active', 
    date: '18/04/2026', 
    email: 'afiliado77@email.com', 
    phone: '(11) 96666-6666',
    avatar: 'https://ui-avatars.com/api/?name=Afiliado+77&background=00E5FF&color=0B0E14&bold=true',
    referralsCount: 5
  },
  { 
    id: 78, 
    name: 'Márcio Bento Rezende', 
    level: 2, 
    status: 'active', 
    date: '20/04/2026', 
    email: 'marcio@email.com', 
    phone: '(11) 95555-5555',
    avatar: 'https://ui-avatars.com/api/?name=Marcio+Bento&background=FF3D00&color=FFFFFF&bold=true',
    referralsCount: 3,
    sponsorName: 'Rogerio Lima'
  },
];

// Recursive data structure for the tree view (Limited to 2-3 levels for the visual demo)
const TREE_NETWORK = {
  id: 'me',
  name: 'Miguel Oliveira',
  level: 0,
  status: 'active',
  avatar: 'https://ui-avatars.com/api/?name=Miguel+Oliveira&background=00E5FF&color=0B0E14&bold=true',
  children: [
    { 
      id: 67, 
      name: 'Rogerio Lima', 
      level: 1, 
      status: 'active', 
      avatar: 'https://ui-avatars.com/api/?name=Rogerio+Lima&background=00E5FF&color=0B0E14&bold=true',
      children: [
        { 
          id: 78, 
          name: 'Márcio Bento', 
          level: 2, 
          status: 'active', 
          avatar: 'https://ui-avatars.com/api/?name=MB&background=FF3D00&color=FFFFFF&bold=true',
          children: []
        },
        { 
          id: 79, 
          name: 'Ana Souza', 
          level: 2, 
          status: 'active', 
          avatar: 'https://ui-avatars.com/api/?name=AS&background=FF3D00&color=FFFFFF&bold=true',
          children: []
        }
      ]
    },
    { 
      id: 76, 
      name: 'Afiliado #76', 
      level: 1, 
      status: 'pending', 
      avatar: 'https://ui-avatars.com/api/?name=A76&background=00E5FF&color=0B0E14&bold=true',
      children: [
        { 
          id: 80, 
          name: 'Carlos P.', 
          level: 2, 
          status: 'active', 
          avatar: 'https://ui-avatars.com/api/?name=CP&background=FF3D00&color=FFFFFF&bold=true',
          children: []
        }
      ]
    }
  ]
};

import logoImg from '../assets/logo-casarao.jpeg';

export default function Network() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');

  const filteredReferrals = REFERRALS.filter(ref => {
    const matchesSearch = ref.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         ref.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === 'all' || ref.level.toString() === filterLevel;
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="min-h-screen bg-background text-text-main font-sans flex">
      {/* Sidebar Desktop (Reused from Dashboard for consistency) */}
      <aside className="hidden lg:flex w-72 flex-col glass border-r border-surface-border fixed h-full z-50">
        <div className="p-8">
          <Link to="/" className="flex items-center gap-3">
             <img src={logoImg} alt="Casarão Clube 7" className="h-12 w-auto object-contain" />
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <SidebarLink icon={LayoutDashboard} label="Dashboard" to="/dashboard" />
          <SidebarLink icon={Users} label="Minha Rede" active />
          <SidebarLink icon={Wallet} label="Financeiro" to="/dashboard/financial" />

          <SidebarLink icon={ShoppingCart} label="Delivery" to="/" />
          <SidebarLink icon={PieChart} label="Relatórios" to="/dashboard/reports" />

          <SidebarLink icon={Settings} label="Configurações" to="/dashboard/settings" />

        </nav>

        <div className="p-6">
          <Link to="/login" className="flex items-center gap-3 w-full p-4 text-text-muted hover:text-red-400 transition-colors font-black text-xs uppercase tracking-widest">
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
                  placeholder="Buscar na rede..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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

        <div className="p-6 space-y-8">
          {/* Page Title */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div>
                <h1 className="text-3xl font-black mb-1">Minha Rede 🌐</h1>
                <p className="text-text-muted text-sm">Visualize e gerencie seus afiliados diretos e indiretos.</p>
             </div>
             <div className="flex items-center gap-3">
                <div className="flex bg-surface rounded-xl p-1 border border-surface-border mr-2">
                   <button 
                     onClick={() => setViewMode('list')}
                     className={`p-2.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-primary text-background' : 'text-text-muted hover:text-white'}`}
                     title="Visualização em Lista"
                   >
                     <LayoutList size={18} />
                   </button>
                   <button 
                     onClick={() => setViewMode('tree')}
                     className={`p-2.5 rounded-lg transition-all ${viewMode === 'tree' ? 'bg-primary text-background' : 'text-text-muted hover:text-white'}`}
                     title="Visualização em Árvore"
                   >
                     <NetworkIcon size={18} />
                   </button>
                </div>
                <button className="bg-primary text-background px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg glow-primary flex items-center gap-2">
                   <UserPlus size={16} /> Convidar Novo
                </button>
             </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {NETWORK_STATS.map((stat, index) => (
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
                </div>
                <p className="text-xs text-text-muted uppercase font-black tracking-widest mb-1">{stat.label}</p>
                <p className="text-2xl font-black">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Network Table/List or Tree View */}
          <div className="glass-card border-white/5 overflow-hidden">
             {viewMode === 'list' ? (
                <>
                  <div className="p-6 border-b border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <h3 className="text-xl font-black">Membros da Rede</h3>
                      <div className="flex items-center gap-3">
                        <div className="flex bg-surface rounded-xl p-1 border border-surface-border">
                            <button 
                              onClick={() => setFilterLevel('all')}
                              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${filterLevel === 'all' ? 'bg-primary text-background' : 'text-text-muted hover:text-white'}`}
                            >
                              Todos
                            </button>
                            <button 
                              onClick={() => setFilterLevel('1')}
                              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${filterLevel === '1' ? 'bg-primary text-background' : 'text-text-muted hover:text-white'}`}
                            >
                              Nível 1
                            </button>
                            <button 
                              onClick={() => setFilterLevel('2')}
                              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${filterLevel === '2' ? 'bg-primary text-background' : 'text-text-muted hover:text-white'}`}
                            >
                              Nível 2
                            </button>
                        </div>
                        <button className="p-2.5 bg-surface border border-surface-border rounded-xl text-text-muted hover:text-white transition-all">
                            <Filter size={18} />
                        </button>
                      </div>
                  </div>

                  <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-surface-border bg-surface/30">
                              <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Afiliado</th>
                              <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Nível</th>
                              <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Status</th>
                              <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Rede</th>
                              <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Data Adesão</th>
                              <th className="px-8 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-border">
                            {filteredReferrals.map((ref) => (
                              <motion.tr 
                                key={ref.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="group hover:bg-white/5 transition-colors"
                              >
                                  <td className="px-8 py-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-surface-border">
                                          <img src={ref.avatar} alt={ref.name} />
                                        </div>
                                        <div>
                                          <p className="text-sm font-black">{ref.name}</p>
                                          <div className="flex items-center gap-2 text-[10px] text-text-muted">
                                              <Mail size={10} /> {ref.email}
                                          </div>
                                        </div>
                                    </div>
                                  </td>
                                  <td className="px-8 py-5">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                      ref.level === 1 ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
                                    }`}>
                                        G{ref.level}
                                    </span>
                                    {ref.sponsorName && (
                                      <p className="text-[8px] text-text-muted mt-1 uppercase font-bold">Por: {ref.sponsorName}</p>
                                    )}
                                  </td>
                                  <td className="px-8 py-5">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 rounded-full ${ref.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                        <span className={`text-[10px] font-black uppercase ${ref.status === 'active' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                          {ref.status === 'active' ? 'Ativo' : 'Pendente'}
                                        </span>
                                    </div>
                                  </td>
                                  <td className="px-8 py-5">
                                    <div className="flex items-center gap-2 text-sm font-black">
                                        <Users size={14} className="text-text-muted" />
                                        {ref.referralsCount}
                                    </div>
                                  </td>
                                  <td className="px-8 py-5">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted">
                                        <Calendar size={12} />
                                        {ref.date}
                                    </div>
                                  </td>
                                  <td className="px-8 py-5 text-right">
                                    <button className="p-2 text-text-muted hover:text-primary transition-all">
                                        <ChevronRight size={18} />
                                    </button>
                                  </td>
                              </motion.tr>
                            ))}
                        </tbody>
                      </table>
                  </div>

                  {filteredReferrals.length === 0 && (
                    <div className="p-20 text-center">
                        <Users size={48} className="mx-auto text-surface-border mb-4" />
                        <p className="text-text-muted">Nenhum afiliado encontrado.</p>
                    </div>
                  )}
                </>
             ) : (
                <div className="p-8 md:p-12 min-h-[600px] overflow-x-auto">
                   <h3 className="text-xl font-black mb-12 text-center">Mapa de Rede</h3>
                   <div className="flex justify-center min-w-[800px]">
                      <TreeNode node={TREE_NETWORK} />
                   </div>
                </div>
             )}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full glass z-50 flex items-center justify-around py-3 px-4">
        <MobileNavLink icon={LayoutDashboard} label="Home" to="/dashboard" />
        <MobileNavLink icon={Users} label="Rede" active />
        <MobileNavLink icon={Wallet} label="Saldo" to="/dashboard/financial" />

        <MobileNavLink icon={Settings} label="Perfil" />
      </nav>
    </div>
  );
}

function TreeNode({ node }: any) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="flex flex-col items-center relative">
      {/* Node Circle */}
      <div className="flex flex-col items-center z-10">
        <div 
          className={`relative w-20 h-20 rounded-full border-4 transition-all duration-300 flex items-center justify-center ${
            node.level === 0 ? 'border-primary glow-primary' : 
            node.level === 1 ? 'border-primary/50' : 'border-secondary/50'
          } ${isExpanded ? 'scale-110' : 'scale-100 hover:scale-105'} bg-surface cursor-pointer group`}
          onClick={() => hasChildren && setIsExpanded(!isExpanded)}
        >
          <img 
            src={node.avatar} 
            alt={node.name} 
            className="w-full h-full rounded-full object-cover p-1" 
          />
          
          {/* Status Indicator Dot */}
          <div className={`absolute -bottom-1 right-2 w-5 h-5 rounded-full border-4 border-background ${
            node.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'
          }`} />

          {/* Level Label */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-surface border border-white/10 px-2 py-0.5 rounded-full shadow-xl">
             <span className="text-[10px] font-black text-primary">G{node.level}</span>
          </div>

          {/* Tooltip on Hover */}
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 bg-background border border-white/10 px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
             <p className="text-[10px] font-black text-white">{node.name}</p>
          </div>
        </div>

        {/* Vertical connector to children */}
        {hasChildren && isExpanded && (
          <div className="w-[2px] h-12 bg-gradient-to-b from-primary/50 to-surface-border relative">
             {/* Diagonal lines for children branches */}
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-4 w-full justify-center">
                {/* Visual lines are handled by the container below */}
             </div>
          </div>
        )}
      </div>

      {/* Children Container */}
      {isExpanded && hasChildren && (
        <div className="flex justify-center gap-12 mt-4 relative pt-4">
          {/* horizontal line connector */}
          <div className="absolute top-0 left-[10%] right-[10%] h-[2px] bg-surface-border" />
          
          {node.children.map((child: any) => (
            <div key={child.id} className="relative flex flex-col items-center">
               {/* vertical line connector to child */}
               <div className="absolute -top-4 w-[2px] h-4 bg-surface-border" />
               <TreeNode node={child} />
            </div>
          ))}
        </div>
      )}
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

function MobileNavLink({ icon: Icon, label, active, to = '#' }: any) {
  return (
    <Link to={to} className={`flex flex-col items-center gap-1 p-2 ${active ? 'text-primary' : 'text-text-muted'}`}>
      <Icon size={20} />
      <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
    </Link>
  );
}
