import { motion } from 'motion/react';
import { 
  Search, 
  User, 
  Users, 
  ShieldCheck, 
  MoreVertical, 
  Filter,
  Mail,
  Phone,
  Award,
  TrendingUp,
  UserCheck,
  Loader2,
  Trash2
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

const PLAN_CONFIG: any = {
  cliente: { label: 'Cliente', icon: User, color: 'text-text-muted', bg: 'bg-white/5' },
  empreendedor: { label: 'Empreendedor', icon: TrendingUp, color: 'text-secondary', bg: 'bg-secondary/10' },
  visionario: { label: 'Visionário', icon: Award, color: 'text-primary', bg: 'bg-primary/10' },
};

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlan, setFilterPlan] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [activeDropdownUserId, setActiveDropdownUserId] = useState<string | number | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (target.closest('.dropdown-trigger') || target.closest('.dropdown-menu')) {
        return;
      }
      setActiveDropdownUserId(null);
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar usuários: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (user: any) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: !user.is_active })
        .eq('id', user.id);

      if (error) throw error;
      toast.success(`Usuário ${user.full_name} ${!user.is_active ? 'ativado' : 'bloqueado'} com sucesso!`);
      fetchUsers();
    } catch (error: any) {
      toast.error('Erro ao atualizar status: ' + error.message);
    }
  };

  const changeUserPlan = async (user: any, newPlan: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ plan: newPlan })
        .eq('id', user.id);

      if (error) throw error;
      toast.success(`Plano de ${user.full_name} atualizado para ${newPlan}!`);
      fetchUsers();
    } catch (error: any) {
      toast.error('Erro ao atualizar plano: ' + error.message);
    }
  };

  const changeUserRole = async (user: any, newRole: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('id', user.id);

      if (error) throw error;
      toast.success(`Cargo de ${user.full_name} atualizado para ${newRole === 'caixa' ? 'Caixa' : 'Cliente'}!`);
      fetchUsers();
    } catch (error: any) {
      toast.error('Erro ao atualizar cargo: ' + error.message);
    }
  };

  const deleteUser = async (user: any) => {
    if (!window.confirm(`Tem certeza de que deseja excluir permanentemente o usuário ${user.full_name}?`)) {
      return;
    }

    try {
      // 1. Excluir do banco de dados do Supabase
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', user.id);

      if (error) throw error;

      // 2. Excluir do localStorage (fallback para mock)
      const mockProfiles = JSON.parse(localStorage.getItem('supabase.mock-profiles') || '[]');
      const updatedMockProfiles = mockProfiles.filter((p: any) => 
        p.id !== user.id && 
        p.mocha_user_id !== user.mocha_user_id && 
        p.email !== user.email
      );
      localStorage.setItem('supabase.mock-profiles', JSON.stringify(updatedMockProfiles));

      toast.success(`Usuário ${user.full_name} excluído com sucesso!`);
      fetchUsers();
    } catch (error: any) {
      toast.error('Erro ao excluir usuário: ' + error.message);
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchLower) || 
      user.email?.toLowerCase().includes(searchLower) ||
      user.referral_code?.toLowerCase().includes(searchLower);
    
    const matchesPlan = filterPlan === 'todos' || user.plan === filterPlan;
    return matchesSearch && matchesPlan;
  });

  if (loading && users.length === 0) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-text-muted font-black uppercase tracking-widest text-xs">Mapeando a Rede...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
               <h1 className="text-3xl font-black mb-1">Usuários 👥</h1>
               <p className="text-text-muted text-sm">Gerencie todos os clientes e a rede de afiliados do <span className="text-primary font-bold">APP Delivery</span>.</p>
            </div>
            <Link 
              to="/register"
              className="bg-primary text-background px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg glow-primary flex items-center gap-2 hover:scale-105 transition-all cursor-pointer"
            >
               <UserCheck size={16} /> Novo Usuário
            </Link>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4">
           <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por nome, e-mail ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-surface/50 border border-surface-border rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:border-primary/50 text-sm"
              />
           </div>
           <div className="flex gap-4">
              <select 
                value={filterPlan}
                onChange={(e) => setFilterPlan(e.target.value)}
                className="bg-surface border border-surface-border rounded-2xl px-6 py-3 text-[10px] font-black uppercase tracking-widest outline-none focus:border-primary/50 cursor-pointer appearance-none min-w-[160px] text-text-muted"
              >
                 <option value="todos">Todos os Planos</option>
                 <option value="cliente">Cliente</option>
                 <option value="empreendedor">Empreendedor</option>
                 <option value="visionario">Visionário</option>
              </select>
              <button className="p-3.5 bg-surface border border-surface-border rounded-2xl text-text-muted hover:text-white transition-all">
                 <Filter size={20} />
              </button>
           </div>
        </div>

        {/* Users Table */}
        <div className="glass-card overflow-hidden border-white/5">
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="border-b border-surface-border bg-surface/30">
                       <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Usuário</th>
                       <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Contato</th>
                       <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Plano</th>
                       <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Data Adesão</th>
                       <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Status</th>
                       <th className="px-8 py-4"></th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-surface-border">
                    {filteredUsers.map((user) => {
                       const plan = PLAN_CONFIG[user.plan] || PLAN_CONFIG.cliente;
                       const PlanIcon = plan.icon;
                       
                       return (
                          <motion.tr 
                            key={user.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="group hover:bg-white/5 transition-colors"
                          >
                             <td className="px-8 py-5">
                                <div className="flex items-center gap-4">
                                   <div className="w-12 h-12 rounded-2xl bg-surface border border-surface-border flex items-center justify-center overflow-hidden">
                                      <img src={`https://ui-avatars.com/api/?name=${user.full_name}&background=00E5FF&color=0B0E14&bold=true`} alt={user.full_name} />
                                   </div>
                                    <div>
                                       <p className="text-sm font-black">{user.full_name || 'Usuário'}</p>
                                       <div className="flex gap-2 items-center mt-1 flex-wrap">
                                         <p className="text-[10px] text-primary font-bold uppercase tracking-widest">{user.referral_code || 'SEM CÓDIGO'}</p>
                                         {user.role === 'caixa' && (
                                           <span className="text-[8px] bg-amber-500/10 text-amber-500 font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">Caixa</span>
                                         )}
                                         {user.role === 'admin' && (
                                           <span className="text-[8px] bg-red-500/10 text-red-500 font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">Admin</span>
                                         )}
                                       </div>
                                    </div>
                                </div>
                             </td>
                             <td className="px-8 py-5">
                                <div className="space-y-1">
                                   <div className="flex items-center gap-2 text-xs text-text-muted">
                                      <Mail size={12} className="text-primary" />
                                      {user.email}
                                   </div>
                                   <div className="flex items-center gap-2 text-xs text-text-muted">
                                      <Phone size={12} className="text-primary" />
                                      {user.phone || '(S/ Telefone)'}
                                   </div>
                                </div>
                             </td>
                             <td className="px-8 py-5">
                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${plan.bg} ${plan.color}`}>
                                   <PlanIcon size={14} />
                                   <span className="text-[10px] font-black uppercase tracking-widest">{plan.label}</span>
                                </div>
                             </td>
                             <td className="px-8 py-5">
                                <p className="text-[10px] text-text-muted font-bold">{new Date(user.created_at).toLocaleDateString('pt-BR')}</p>
                             </td>
                             <td className="px-8 py-5">
                                <div className={`inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${
                                  user.is_active ? 'text-emerald-500' : 'text-red-500'
                                }`}>
                                   <div className={`w-1.5 h-1.5 rounded-full ${
                                     user.is_active ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'
                                   }`} />
                                   {user.is_active ? 'ATIVO' : 'BLOQUEADO'}
                                </div>
                             </td>
                             <td className="px-8 py-5 text-right relative">
                                 <button 
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     setActiveDropdownUserId(activeDropdownUserId === user.id ? null : user.id);
                                   }}
                                   className="dropdown-trigger p-2 text-text-muted hover:text-white transition-all cursor-pointer rounded hover:bg-white/5"
                                 >
                                    <MoreVertical size={20} />
                                 </button>
                                 
                                 {activeDropdownUserId === user.id && (
                                   <div className="dropdown-menu absolute right-8 top-12 w-48 bg-surface border border-surface-border rounded-xl shadow-xl z-30 py-2 text-left overflow-hidden">
                                     <button 
                                       onClick={() => {
                                         toggleUserStatus(user);
                                         setActiveDropdownUserId(null);
                                       }}
                                       className="w-full px-4 py-2 hover:bg-white/5 text-xs text-text-main flex items-center gap-2 cursor-pointer font-bold"
                                     >
                                        {user.is_active ? 'Bloquear Usuário' : 'Ativar Usuário'}
                                     </button>
                                     <div className="h-px bg-surface-border my-1" />
                                     <div className="px-4 py-1 text-[8px] font-black uppercase tracking-widest text-text-muted">Alterar Plano</div>
                                     <button 
                                       onClick={() => {
                                         changeUserPlan(user, 'cliente');
                                         setActiveDropdownUserId(null);
                                       }}
                                       className="w-full px-4 py-2 hover:bg-white/5 text-xs text-text-main flex items-center gap-2 cursor-pointer font-bold pl-6"
                                     >
                                        Cliente
                                     </button>
                                     <button 
                                       onClick={() => {
                                         changeUserPlan(user, 'empreendedor');
                                         setActiveDropdownUserId(null);
                                       }}
                                       className="w-full px-4 py-2 hover:bg-white/5 text-xs text-text-main flex items-center gap-2 cursor-pointer font-bold pl-6"
                                     >
                                        Empreendedor
                                     </button>
                                     <button 
                                       onClick={() => {
                                         changeUserPlan(user, 'visionario');
                                         setActiveDropdownUserId(null);
                                       }}
                                       className="w-full px-4 py-2 hover:bg-white/5 text-xs text-text-main flex items-center gap-2 cursor-pointer font-bold pl-6"
                                     >
                                        Visionário
                                     </button>
                                     <div className="h-px bg-surface-border my-1" />
                                     <div className="px-4 py-1 text-[8px] font-black uppercase tracking-widest text-text-muted">Cargo</div>
                                     {user.role === 'caixa' ? (
                                       <button 
                                         onClick={() => {
                                           changeUserRole(user, 'user');
                                           setActiveDropdownUserId(null);
                                         }}
                                         className="w-full px-4 py-2 hover:bg-white/5 text-xs text-text-main flex items-center gap-2 cursor-pointer font-bold pl-6"
                                       >
                                          Remover Caixa
                                       </button>
                                     ) : (
                                       <button 
                                         onClick={() => {
                                           changeUserRole(user, 'caixa');
                                           setActiveDropdownUserId(null);
                                         }}
                                         className="w-full px-4 py-2 hover:bg-white/5 text-xs text-text-main flex items-center gap-2 cursor-pointer font-bold pl-6"
                                       >
                                          Definir como Caixa
                                       </button>
                                     )}
                                     <div className="h-px bg-surface-border my-1" />
                                     <button 
                                       onClick={() => {
                                         deleteUser(user);
                                         setActiveDropdownUserId(null);
                                       }}
                                       className="w-full px-4 py-2 hover:bg-red-500/10 text-xs text-red-400 flex items-center gap-2 cursor-pointer font-bold"
                                     >
                                        <Trash2 size={12} className="text-red-400" /> Excluir Usuário
                                     </button>
                                  </div>
                                )}
                             </td>
                          </motion.tr>
                       );
                    })}
                 </tbody>
              </table>
           </div>
           
           {filteredUsers.length === 0 && !loading && (
             <div className="p-20 text-center">
                <Users size={48} className="mx-auto text-surface-border mb-4" />
                <p className="text-text-muted">Nenhum usuário encontrado para esta busca.</p>
             </div>
           )}
        </div>
      </div>
    </AdminLayout>
  );
}
