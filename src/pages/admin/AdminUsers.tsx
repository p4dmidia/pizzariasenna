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
  UserCheck,
  Loader2,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);
  const [activeDropdownUserId, setActiveDropdownUserId] = useState<string | number | null>(null);

  // Estados de Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Resetar página quando a busca ou filtro mudar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRole]);

  // Fechar dropdown ao clicar fora
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
        .update({ role: user.role })
        .eq('id', user.id);

      if (error) throw error;
      toast.success(`Status de ${user.full_name} atualizado!`);
      fetchUsers();
    } catch (error: any) {
      toast.error('Erro ao atualizar status: ' + error.message);
    }
  };

  const changeUserRole = async (user: any, newRole: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('id', user.id);

      if (error) throw error;
      toast.success(`Cargo de ${user.full_name} atualizado para ${newRole === 'admin' ? 'Administrador' : newRole === 'caixa' ? 'Caixa' : 'Cliente'}!`);
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
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', user.id);

      if (error) throw error;

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
      user.phone?.toLowerCase().includes(searchLower);
    
    const matchesRole = filterRole === 'todos' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  if (loading && users.length === 0) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-text-muted font-black uppercase tracking-widest text-xs">Carregando Clientes...</p>
        </div>
      </AdminLayout>
    );
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-[9px] font-black uppercase tracking-wider border border-red-500/20">Administrador</span>;
      case 'caixa':
        return <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[9px] font-black uppercase tracking-wider border border-amber-500/20">Operador / Caixa</span>;
      default:
        return <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase tracking-wider border border-primary/20">Cliente</span>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
               <h1 className="text-3xl font-black mb-1">Usuários e Clientes 👥</h1>
               <p className="text-text-muted text-sm">Gerencie todos os clientes, caixas e administradores do <span className="text-primary font-bold">Pizza Senna</span>.</p>
            </div>
            <Link 
              to="/register"
              className="bg-primary text-background px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg glow-primary flex items-center gap-2 hover:scale-105 transition-all cursor-pointer"
            >
               <UserCheck size={16} /> Novo Cliente
            </Link>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4">
           <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por nome, e-mail ou WhatsApp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-surface/50 border border-surface-border rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:border-primary/50 text-sm font-bold"
              />
           </div>
           <div className="flex gap-4">
              <select 
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="bg-surface border border-surface-border rounded-2xl px-6 py-3 text-[10px] font-black uppercase tracking-widest outline-none focus:border-primary/50 cursor-pointer appearance-none min-w-[160px] text-text-muted"
              >
                 <option value="todos">Todos os Cargos</option>
                 <option value="user">Clientes</option>
                 <option value="caixa">Caixas</option>
                 <option value="admin">Administradores</option>
              </select>
           </div>
        </div>

        {/* Users Table */}
        <div className="glass-card overflow-hidden border-white/5">
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="border-b border-surface-border bg-surface/30">
                       <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Nome</th>
                       <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Contato</th>
                       <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Cargo</th>
                       <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Data Cadastro</th>
                       <th className="px-8 py-4"></th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-surface-border">
                    {paginatedUsers.map((u) => {
                       return (
                          <motion.tr 
                            key={u.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="group hover:bg-white/5 transition-colors"
                          >
                             <td className="px-8 py-5">
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 rounded-xl bg-surface border border-surface-border flex items-center justify-center overflow-hidden shrink-0">
                                      <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name || 'U')}&background=EA1D2C&color=FFFFFF&bold=true`} alt={u.full_name} />
                                   </div>
                                    <div>
                                       <p className="text-sm font-black text-text-main">{u.full_name || 'Usuário'}</p>
                                       <p className="text-[9px] text-text-muted uppercase font-black tracking-wider mt-0.5">{u.city ? `${u.city} - ${u.state || 'UF'}` : 'Endereço não cadastrado'}</p>
                                    </div>
                                </div>
                             </td>
                             <td className="px-8 py-5">
                                <div className="space-y-1">
                                   <div className="flex items-center gap-2 text-xs text-text-muted font-bold">
                                      <Mail size={12} className="text-primary" />
                                      {u.email}
                                   </div>
                                   <div className="flex items-center gap-2 text-xs text-text-muted font-bold">
                                      <Phone size={12} className="text-primary" />
                                      {u.phone || '(S/ WhatsApp)'}
                                   </div>
                                </div>
                             </td>
                             <td className="px-8 py-5">
                                {getRoleLabel(u.role)}
                             </td>
                             <td className="px-8 py-5">
                                <p className="text-xs font-bold text-text-muted">{new Date(u.created_at).toLocaleDateString('pt-BR')}</p>
                             </td>
                             <td className="px-8 py-5 text-right relative">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveDropdownUserId(activeDropdownUserId === u.id ? null : u.id);
                                    }}
                                    className="dropdown-trigger p-2 text-text-muted hover:text-white transition-all cursor-pointer rounded hover:bg-white/5"
                                  >
                                     <MoreVertical size={20} />
                                  </button>
                                  
                                  {activeDropdownUserId === u.id && (
                                    <div className="dropdown-menu absolute right-8 top-12 w-48 bg-surface border border-surface-border rounded-xl shadow-xl z-30 py-2 text-left overflow-hidden">
                                      <div className="px-4 py-1 text-[8px] font-black uppercase tracking-widest text-text-muted">Alterar Cargo</div>
                                      
                                      <button 
                                        onClick={() => {
                                          changeUserRole(u, 'user');
                                          setActiveDropdownUserId(null);
                                        }}
                                        className="w-full px-4 py-2 hover:bg-white/5 text-xs text-text-main flex items-center gap-2 cursor-pointer font-bold pl-6"
                                      >
                                         Cliente Padrão
                                      </button>
                                      
                                      <button 
                                        onClick={() => {
                                          changeUserRole(u, 'caixa');
                                          setActiveDropdownUserId(null);
                                        }}
                                        className="w-full px-4 py-2 hover:bg-white/5 text-xs text-text-main flex items-center gap-2 cursor-pointer font-bold pl-6"
                                      >
                                         Operador de Caixa
                                      </button>

                                      <button 
                                        onClick={() => {
                                          changeUserRole(u, 'admin');
                                          setActiveDropdownUserId(null);
                                        }}
                                        className="w-full px-4 py-2 hover:bg-white/5 text-xs text-text-main flex items-center gap-2 cursor-pointer font-bold pl-6"
                                      >
                                         Administrador
                                      </button>
                                      
                                      <div className="h-px bg-surface-border my-1" />
                                      <button 
                                        onClick={() => {
                                          deleteUser(u);
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

           {/* Controles de Paginação */}
           {filteredUsers.length > 0 && (
             <div className="p-4 px-8 border-t border-surface-border bg-surface/20 flex flex-col sm:flex-row items-center justify-between gap-4">
               <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted font-bold">
                 <span>Exibindo {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredUsers.length)} de {filteredUsers.length} usuários</span>
                 <span className="text-surface-border hidden sm:inline">•</span>
                 <div className="flex items-center gap-2">
                   <span>Por página:</span>
                   <select 
                     value={itemsPerPage}
                     onChange={(e) => {
                       setItemsPerPage(Number(e.target.value));
                       setCurrentPage(1);
                     }}
                     className="bg-background border border-surface-border rounded-lg px-2.5 py-1 text-xs text-text-main font-bold outline-none focus:border-primary/50 cursor-pointer"
                   >
                     <option value={5}>5</option>
                     <option value={10}>10</option>
                     <option value={20}>20</option>
                     <option value={50}>50</option>
                   </select>
                 </div>
               </div>

               <div className="flex items-center gap-2">
                 <button
                   disabled={currentPage === 1}
                   onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                   className="p-2 px-3 rounded-xl bg-surface border border-surface-border text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-hover hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                 >
                   <ChevronLeft size={16} />
                   <span className="hidden sm:inline">Anterior</span>
                 </button>

                 <div className="flex items-center gap-1">
                   {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                     <button
                       key={page}
                       onClick={() => setCurrentPage(page)}
                       className={`w-8 h-8 rounded-xl text-xs font-black transition-all cursor-pointer ${
                         currentPage === page
                           ? 'bg-primary text-white shadow-lg glow-primary'
                           : 'bg-surface border border-surface-border text-text-muted hover:text-white hover:bg-surface-hover'
                       }`}
                     >
                       {page}
                     </button>
                   ))}
                 </div>

                 <button
                   disabled={currentPage === totalPages}
                   onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                   className="p-2 px-3 rounded-xl bg-surface border border-surface-border text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-hover hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                 >
                   <span className="hidden sm:inline">Próximo</span>
                   <ChevronRight size={16} />
                 </button>
               </div>
             </div>
           )}
        </div>
      </div>
    </AdminLayout>
  );
}
