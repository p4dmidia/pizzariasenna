import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter,
  LayoutDashboard,
  Users,
  ShoppingCart,
  PieChart,
  Settings,
  LogOut,
  Bell,
  CreditCard,
  DollarSign,
  ChevronRight,
  Loader2,
  X,
  Ticket
} from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const FINANCIAL_STATS = [
  { label: 'Saldo Disponível', value: 'R$ 1.250,00', icon: Wallet, color: 'primary', description: 'Disponível para saque imediato' },
  { label: 'Saldo Pendente', value: 'R$ 450,00', icon: Clock, color: 'secondary', description: 'Em processo de liberação' },
  { label: 'Ganhos Totais', value: 'R$ 14.820,00', icon: TrendingUp, color: 'primary', description: 'Acumulado desde o início' },
  { label: 'Próximo Saque', value: 'R$ 0,00', icon: CheckCircle2, color: 'secondary', description: 'Valor mínimo atingido' },
];

const TRANSACTIONS = [
  { id: 1, type: 'comissao', description: 'Comissão - Venda Marcos Silva (Nível 1)', amount: 15.00, date: '13/05/2026', status: 'confirmado' },
  { id: 2, type: 'cashback', description: 'Cashback - Seu Pedido #4820', amount: 8.40, date: '13/05/2026', status: 'pendente' },
  { id: 3, type: 'saque', description: 'Saque solicitado (PIX)', amount: -500.00, date: '12/05/2026', status: 'confirmado' },
  { id: 4, type: 'comissao', description: 'Comissão - Venda Ana Paula (Nível 2)', amount: 10.00, date: '11/05/2026', status: 'confirmado' },
  { id: 5, type: 'ativacao', description: 'Bônus Ativação - Ricardo Santos', amount: 25.00, date: '11/05/2026', status: 'confirmado' },
  { id: 6, type: 'comissao', description: 'Comissão - Venda Carlos Eduardo (Nível 1)', amount: 12.50, date: '10/05/2026', status: 'confirmado' },
  { id: 7, type: 'saque', description: 'Saque solicitado (PIX)', amount: -250.00, date: '08/05/2026', status: 'cancelado' },
];

import AppLogo from '../components/AppLogo';
import NotificationBell from '../components/NotificationBell';

export default function Financial() {
  const { user, profile, loading, signOut } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-text-muted font-black uppercase tracking-widest text-xs">Carregando Financeiro...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const filteredTransactions = TRANSACTIONS.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || 
                       (filterType === 'entrada' && t.amount > 0) || 
                       (filterType === 'saida' && t.amount < 0);
    return matchesSearch && matchesType;
  });

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
          <SidebarLink icon={LayoutDashboard} label="Dashboard" to="/dashboard" />
          <SidebarLink icon={Users} label="Minha Rede" to="/dashboard/network" />
          <SidebarLink icon={Wallet} label="Financeiro" active />
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
                  placeholder="Buscar transações..."
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
                <h1 className="text-3xl font-black mb-1">Financeiro 💰</h1>
                <p className="text-text-muted text-sm">Gerencie seus ganhos, extratos e solicitações de saque.</p>
             </div>
             <div className="flex gap-3">
                <button className="glass px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-surface-hover flex items-center gap-2 border border-white/10">
                   <CreditCard size={16} /> Meus Dados Pix
                </button>
                <button className="bg-primary text-background px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg glow-primary flex items-center gap-2">
                   <ArrowUpRight size={16} /> Solicitar Saque
                </button>
             </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Saldo Disponível', value: `R$ ${(profile?.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: Wallet, color: 'primary', description: 'Disponível para saque imediato' },
              { label: 'Saldo Pendente', value: 'R$ 0,00', icon: Clock, color: 'secondary', description: 'Em processo de liberação' },
              { label: 'Ganhos Totais', value: `R$ ${(profile?.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: TrendingUp, color: 'primary', description: 'Acumulado desde o início' },
              { label: 'Próximo Saque', value: 'R$ 0,00', icon: CheckCircle2, color: 'secondary', description: 'Valor mínimo atingido' },
            ].map((stat, index) => (
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
                  <div className="p-1.5 rounded-lg bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                     <ChevronRight size={14} className="text-text-muted" />
                  </div>
                </div>
                <p className="text-xs text-text-muted uppercase font-black tracking-widest mb-1">{stat.label}</p>
                <p className="text-2xl font-black mb-1">{stat.value}</p>
                <p className="text-[10px] text-text-muted font-bold">{stat.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Transactions Table */}
          <div className="glass-card overflow-hidden border-white/5">
             <div className="p-6 border-b border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-xl font-black">Histórico de Transações</h3>
                <div className="flex items-center gap-3">
                   <div className="flex bg-surface rounded-xl p-1 border border-surface-border">
                      <button 
                        onClick={() => setFilterType('all')}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${filterType === 'all' ? 'bg-primary text-background' : 'text-text-muted hover:text-white'}`}
                      >
                        Tudo
                      </button>
                      <button 
                        onClick={() => setFilterType('entrada')}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${filterType === 'entrada' ? 'bg-primary text-background' : 'text-text-muted hover:text-white'}`}
                      >
                        Entradas
                      </button>
                      <button 
                        onClick={() => setFilterType('saida')}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${filterType === 'saida' ? 'bg-primary text-background' : 'text-text-muted hover:text-white'}`}
                      >
                        Saídas
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
                         <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Descrição</th>
                         <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Valor</th>
                         <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Data</th>
                         <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Status</th>
                         <th className="px-8 py-4"></th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-surface-border">
                      {filteredTransactions.map((t) => (
                         <motion.tr 
                          key={t.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          onClick={() => setSelectedTransaction(t)}
                          className="group hover:bg-white/5 transition-colors cursor-pointer"
                         >
                            <td className="px-8 py-5">
                               <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                    t.amount > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                  }`}>
                                     {t.amount > 0 ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                                  </div>
                                  <div>
                                     <p className="text-sm font-black">{t.description}</p>
                                     <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest">
                                        {t.type === 'comissao' ? 'Indicação' : t.type === 'saque' ? 'Saque' : 'Cashback'}
                                     </p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-8 py-5">
                               <span className={`text-sm font-black ${t.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {t.amount > 0 ? '+' : ''} R$ {Math.abs(t.amount).toFixed(2)}
                               </span>
                            </td>
                            <td className="px-8 py-5">
                               <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted">
                                  {t.date}
                               </div>
                            </td>
                            <td className="px-8 py-5">
                               <div className="flex items-center gap-2">
                                  {t.status === 'confirmado' ? (
                                    <CheckCircle2 size={14} className="text-emerald-500" />
                                  ) : t.status === 'pendente' ? (
                                    <Clock size={14} className="text-amber-500" />
                                  ) : (
                                    <XCircle size={14} className="text-red-500" />
                                  )}
                                  <span className={`text-[10px] font-black uppercase ${
                                    t.status === 'confirmado' ? 'text-emerald-500' : 
                                    t.status === 'pendente' ? 'text-amber-500' : 'text-red-500'
                                  }`}>
                                     {t.status === 'confirmado' ? 'Concluído' : 
                                      t.status === 'pendente' ? 'Pendente' : 'Cancelado'}
                                  </span>
                               </div>
                            </td>
                            <td className="px-8 py-5 text-right">
                               <button 
                                 onClick={(e) => { e.stopPropagation(); setSelectedTransaction(t); }}
                                 className="p-2 text-text-muted hover:text-primary transition-all"
                               >
                                  <ChevronRight size={18} />
                                </button>
                            </td>
                         </motion.tr>
                      ))}
                   </tbody>
                </table>
             </div>

             {filteredTransactions.length === 0 && (
               <div className="p-20 text-center">
                  <DollarSign size={48} className="mx-auto text-surface-border mb-4" />
                  <p className="text-text-muted">Nenhuma transação encontrada.</p>
               </div>
             )}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full glass z-50 flex items-center justify-around py-3 px-4">
        <MobileNavLink icon={LayoutDashboard} label="Home" to="/dashboard" />
        <MobileNavLink icon={Users} label="Rede" to="/dashboard/network" />
        <MobileNavLink icon={Wallet} label="Saldo" active />
        <MobileNavLink icon={Settings} label="Perfil" />
      </nav>

      {/* Detalhes da Transação Modal */}
      <AnimatePresence>
        {selectedTransaction && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTransaction(null)} 
              className="fixed inset-0 bg-background/80 backdrop-blur-md" 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card max-w-md w-full border-white/10 p-8 relative z-10 overflow-hidden shadow-2xl"
            >
              {/* Decorative Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-2xl rounded-full -mr-16 -mt-16" />
              
              {/* Close Button */}
              <button 
                onClick={() => setSelectedTransaction(null)}
                className="absolute top-4 right-4 p-2 text-text-muted hover:text-white transition-colors"
              >
                <X size={20} />
              </button>

              {/* Modal Content */}
              <div className="text-center mb-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
                  selectedTransaction.amount > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {selectedTransaction.amount > 0 ? <ArrowDownLeft size={32} /> : <ArrowUpRight size={32} />}
                </div>
                <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                  selectedTransaction.status === 'confirmado' ? 'bg-emerald-500/10 text-emerald-400' : 
                  selectedTransaction.status === 'pendente' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {selectedTransaction.status === 'confirmado' ? 'Concluído' : 
                   selectedTransaction.status === 'pendente' ? 'Pendente' : 'Cancelado'}
                </span>
                <h3 className="text-3xl font-black mt-4 text-glow">
                  {selectedTransaction.amount > 0 ? '+' : ''} R$ {Math.abs(selectedTransaction.amount).toFixed(2)}
                </h3>
                <p className="text-sm text-text-muted mt-1">{selectedTransaction.description}</p>
              </div>

              <div className="space-y-4 border-t border-surface-border pt-6 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted font-bold">ID da Transação:</span>
                  <span className="font-black text-white">#TXN-{(23400 + selectedTransaction.id).toString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted font-bold">Tipo:</span>
                  <span className="font-black text-primary uppercase tracking-wider text-xs">
                    {selectedTransaction.type === 'comissao' ? 'Indicação' : 
                     selectedTransaction.type === 'saque' ? 'Saque' : 
                     selectedTransaction.type === 'ativacao' ? 'Bônus Ativação' : 'Cashback'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted font-bold">Data:</span>
                  <span className="font-black text-white">{selectedTransaction.date} às 14:32</span>
                </div>
                
                {/* Conditional detailed text */}
                <div className="bg-surface/50 border border-surface-border rounded-xl p-4 mt-4">
                  <p className="text-xs text-text-muted leading-relaxed">
                    {selectedTransaction.type === 'comissao' && (
                      "Comissão gerada pela compra de um afiliado da sua rede (Nível 1 ou 2). O valor foi creditado em seu saldo disponível."
                    )}
                    {selectedTransaction.type === 'cashback' && (
                      "Cashback gerado pelas suas compras no APP Delivery. O saldo será liberado assim que o pedido for concluído."
                    )}
                    {selectedTransaction.type === 'saque' && selectedTransaction.status === 'confirmado' && (
                      "Transferência de saque PIX processada e finalizada com sucesso para sua chave cadastrada."
                    )}
                    {selectedTransaction.type === 'saque' && selectedTransaction.status === 'cancelado' && (
                      "Solicitação de saque recusada pela instituição financeira ou cancelada por inconsistência nos dados PIX."
                    )}
                    {selectedTransaction.type === 'ativacao' && (
                      "Bônus especial de ativação recebido por trazer e ativar um novo afiliado direto na sua rede."
                    )}
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setSelectedTransaction(null)}
                className="w-full mt-6 bg-primary text-background py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg glow-primary hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Fechar Detalhes
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
