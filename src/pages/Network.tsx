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
  User,
  Loader2,
  Ticket
} from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

import logoImg from '../assets/logo-casarao.jpeg';
import NotificationBell from '../components/NotificationBell';

export default function Network() {
  const { user, profile, loading, signOut } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');
  const [networkMembers, setNetworkMembers] = useState<any[]>([]);
  const [networkLoading, setNetworkLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      fetchNetworkData(profile.id);
    } else if (!loading) {
      setNetworkLoading(false);
    }
  }, [profile, loading]);

  const fetchNetworkData = async (userId: number) => {
    try {
      setNetworkLoading(true);

      // Determinar limite máximo de profundidade com base no plano do usuário
      let planMaxDepth = 7;
      const userPlan = profile?.plan || 'cliente';
      if (userPlan === 'cliente') planMaxDepth = 0;
      else if (userPlan === 'empreendedor') planMaxDepth = 3;
      else if (userPlan === 'visionario') planMaxDepth = 7;

      try {
        const { data: settingsData } = await supabase
          .from('system_settings')
          .select('key, value')
          .eq('key', `plan_levels_${userPlan}`)
          .maybeSingle();
          
        if (settingsData && settingsData.value) {
          planMaxDepth = parseInt(settingsData.value, 10);
        }
      } catch (err) {
        console.warn('Erro ao carregar regras de níveis do Supabase, usando padrão do plano:', err);
      }
      
      let allMembers: any[] = [];
      try {
        let currentLevelSponsorIds = [userId];
        let depth = 1;

        while (currentLevelSponsorIds.length > 0 && depth <= planMaxDepth) {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .in('sponsor_id', currentLevelSponsorIds);

          if (error) throw error;
          if (!data || data.length === 0) break;

          const levelMembers = data.map(member => ({
            ...member,
            level: depth
          }));

          allMembers = [...allMembers, ...levelMembers];
          currentLevelSponsorIds = data.map(member => member.id);
          depth++;
        }
      } catch (err) {
        console.warn('Erro ao carregar rede do Supabase, tentando local storage:', err);
        const mockProfiles = JSON.parse(localStorage.getItem('supabase.mock-profiles') || '[]');
        
        const mockProfilesWithId = mockProfiles.map((p: any, idx: number) => ({
          ...p,
          id: p.id || (idx + 1000)
        }));
        
        mockProfilesWithId.forEach((p: any) => {
          if (p.sponsor_id && typeof p.sponsor_id === 'string') {
            const sponsor = mockProfilesWithId.find((s: any) => s.referral_code === p.sponsor_id);
            if (sponsor) p.sponsor_id = sponsor.id;
          }
        });

        let currentLevelSponsorIds = [userId];
        let depth = 1;
        
        while (currentLevelSponsorIds.length > 0 && depth <= planMaxDepth) {
          const levelData = mockProfilesWithId.filter((p: any) => currentLevelSponsorIds.includes(p.sponsor_id));
          if (levelData.length === 0) break;

          const levelMembers = levelData.map((member: any) => ({
            ...member,
            level: depth
          }));

          allMembers = [...allMembers, ...levelMembers];
          currentLevelSponsorIds = levelData.map((member: any) => member.id);
          depth++;
        }
      }

      setNetworkMembers(allMembers);
    } catch (err) {
      console.error('Failed to fetch network:', err);
    } finally {
      setNetworkLoading(false);
    }
  };

  const handleInvite = () => {
    if (profile?.referral_code) {
      const link = `casarao.com.br/clube/${profile.referral_code}`;
      navigator.clipboard.writeText(link);
      toast.success('Link de convite copiado para a área de transferência!');
    } else {
      toast.error('Código de indicação não disponível.');
    }
  };

  if (loading || networkLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-text-muted font-black uppercase tracking-widest text-xs">Carregando Rede...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const buildTree = (parentId: number, currentLevel: number): any[] => {
    return networkMembers
      .filter(m => m.sponsor_id === parentId)
      .map(m => {
        const nameParam = encodeURIComponent(m.full_name || 'Afiliado');
        const bg = currentLevel === 1 ? '00E5FF' : 'FF3D00';
        const color = currentLevel === 1 ? '0B0E14' : 'FFFFFF';
        const avatar = m.avatar_url || `https://ui-avatars.com/api/?name=${nameParam}&background=${bg}&color=${color}&bold=true`;
        
        return {
          id: m.id,
          name: m.full_name,
          level: currentLevel,
          status: m.is_active ? 'active' : 'pending',
          avatar,
          children: buildTree(m.id, currentLevel + 1)
        };
      });
  };

  const userTree = {
    id: 'me',
    name: profile?.full_name || 'Usuário',
    level: 0,
    status: 'active',
    avatar: profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'Usuário')}&background=00E5FF&color=0B0E14&bold=true`,
    children: buildTree(profile?.id || 0, 1)
  };

  const directCount = networkMembers.filter(m => m.level === 1).length;
  const activeCount = networkMembers.filter(m => m.is_active).length;
  
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const newCount = networkMembers.filter(m => m.created_at && new Date(m.created_at) >= thirtyDaysAgo).length;

  const statsCards = [
    { label: 'Total na Rede', value: networkMembers.length.toString(), icon: Users, color: 'primary' },
    { label: 'Indicações Diretas', value: directCount.toString(), icon: UserPlus, color: 'secondary' },
    { label: 'Ativos este Mês', value: activeCount.toString(), icon: TrendingUp, color: 'primary' },
    { label: 'Novos (30 dias)', value: `+${newCount}`, icon: Award, color: 'secondary' },
  ];

  const referrals = networkMembers.map(member => {
    let sponsorName = '';
    if (member.level > 1) {
      const sponsor = networkMembers.find(m => m.id === member.sponsor_id) || (member.sponsor_id === profile?.id ? profile : null);
      sponsorName = sponsor?.full_name || '';
    }
    
    const nameParam = encodeURIComponent(member.full_name || 'Afiliado');
    const bg = member.level === 1 ? '00E5FF' : 'FF3D00';
    const color = member.level === 1 ? '0B0E14' : 'FFFFFF';
    const avatar = member.avatar_url || `https://ui-avatars.com/api/?name=${nameParam}&background=${bg}&color=${color}&bold=true`;
    
    const referralsCount = networkMembers.filter(m => m.sponsor_id === member.id).length;
    
    return {
      id: member.id,
      name: member.full_name,
      level: member.level,
      status: member.is_active ? 'active' : 'pending',
      date: member.created_at ? new Date(member.created_at).toLocaleDateString('pt-BR') : 'Sem data',
      email: member.email,
      phone: member.phone || '(S/ Telefone)',
      avatar,
      referralsCount,
      sponsorName
    };
  });

  const filteredReferrals = referrals.filter(ref => {
    const matchesSearch = ref.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         ref.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === 'all' || ref.level.toString() === filterLevel;
    return matchesSearch && matchesLevel;
  });

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
          <SidebarLink icon={LayoutDashboard} label="Dashboard" to="/dashboard" />
          <SidebarLink icon={Users} label="Minha Rede" active />
          <SidebarLink icon={Wallet} label="Financeiro" to="/dashboard/financial" />

          <SidebarLink icon={ShoppingCart} label="Delivery" to="/" />
          <SidebarLink icon={Ticket} label="Cupons" to="/coupons" />
          <SidebarLink icon={PieChart} label="Relatórios" to="/dashboard/reports" />

          <SidebarLink icon={Settings} label="Configurações" to="/dashboard/settings" />

        </nav>

        <div className="p-6">
          <button 
            onClick={signOut}
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
                  placeholder="Buscar na rede..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                <button onClick={handleInvite} className="bg-primary text-background px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg glow-primary flex items-center gap-2">
                   <UserPlus size={16} /> Convidar Novo
                </button>
             </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsCards.map((stat, index) => (
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
                      <TreeNode node={userTree} />
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
      <span className="text-sm font-black">{label}</span>
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
