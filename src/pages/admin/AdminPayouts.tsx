import { motion } from 'motion/react';
import { 
  Search, 
  Wallet, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowUpRight, 
  CreditCard,
  Filter,
  MoreVertical,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

export default function AdminPayouts() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [stats, setStats] = useState({
    pending: 0,
    paidThisMonth: 0,
    fees: 0
  });

  useEffect(() => {
    fetchPayoutData();
  }, []);

  const fetchPayoutData = async () => {
    try {
      setLoading(true);
      
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // 1. Buscar Solicitações
      const { data: payoutData, error: payoutError } = await supabase
        .from('payout_requests')
        .select(`
          *,
          user_profiles (full_name, referral_code)
        `)
        .order('created_at', { ascending: false });

      if (payoutError) throw payoutError;
      setRequests(payoutData || []);

      // 2. Calcular Estatísticas
      const pending = payoutData
        ?.filter(r => r.status === 'pendente')
        .reduce((acc, curr) => acc + Number(curr.amount), 0) || 0;

      const paidThisMonth = payoutData
        ?.filter(r => r.status === 'concluido' && r.processed_at >= firstDayOfMonth)
        .reduce((acc, curr) => acc + Number(curr.net_amount), 0) || 0;

      const fees = payoutData
        ?.filter(r => r.status === 'concluido' && r.processed_at >= firstDayOfMonth)
        .reduce((acc, curr) => acc + Number(curr.fee), 0) || 0;

      setStats({ pending, paidThisMonth, fees });

    } catch (error: any) {
      toast.error('Erro ao carregar saques: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (requestId: number, newStatus: 'concluido' | 'cancelado') => {
    try {
      const { error } = await supabase
        .from('payout_requests')
        .update({ 
          status: newStatus, 
          processed_at: new Date().toISOString() 
        })
        .eq('id', requestId);

      if (error) throw error;
      toast.success(`Solicitação #${requestId} ${newStatus === 'concluido' ? 'aprovada' : 'cancelada'}.`);
      fetchPayoutData();
    } catch (error: any) {
      toast.error('Erro ao processar ação: ' + error.message);
    }
  };

  const filteredRequests = requests.filter(req => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      req.user_profiles?.full_name?.toLowerCase().includes(searchLower) || 
      req.user_profiles?.referral_code?.toLowerCase().includes(searchLower) ||
      req.id.toString().includes(searchTerm);
    
    const matchesStatus = filterStatus === 'todos' || req.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading && requests.length === 0) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-text-muted font-black uppercase tracking-widest text-xs">Carregando Fluxo de Caixa...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div>
              <h1 className="text-3xl font-black mb-1">Saques 💰</h1>
              <p className="text-text-muted text-sm">Gerencie e processe os pagamentos da rede <span className="text-primary font-bold">Clube 7</span>.</p>
           </div>
           <div className="flex gap-3">
              <div className="flex bg-surface rounded-2xl p-1 border border-surface-border overflow-x-auto">
                 {['todos', 'pendente', 'concluido', 'cancelado'].map((status) => (
                    <button 
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                        filterStatus === status ? 'bg-primary text-background shadow-lg' : 'text-text-muted hover:text-white'
                      }`}
                    >
                      {status}
                    </button>
                 ))}
              </div>
           </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="glass-card p-6 border-white/5">
              <p className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-1">Total Pendente</p>
              <p className="text-2xl font-black text-amber-500">R$ {stats.pending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
           </div>
           <div className="glass-card p-6 border-white/5">
              <p className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-1">Pago este Mês</p>
              <p className="text-2xl font-black text-emerald-400">R$ {stats.paidThisMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
           </div>
           <div className="glass-card p-6 border-white/5">
              <p className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-1">Taxas Retidas</p>
              <p className="text-2xl font-black text-primary">R$ {stats.fees.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
           </div>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4">
           <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por afiliado, ID ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-surface/50 border border-surface-border rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:border-primary/50 text-sm"
              />
           </div>
           <button className="p-3.5 bg-surface border border-surface-border rounded-2xl text-text-muted hover:text-white transition-all">
              <Filter size={20} />
           </button>
        </div>

        {/* Payouts Table */}
        <div className="glass-card overflow-hidden border-white/5">
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="border-b border-surface-border bg-surface/30">
                       <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Afiliado</th>
                       <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Valor</th>
                       <th className="px-8 py-4 text-[10px) font-black uppercase tracking-widest text-text-muted">Chave PIX</th>
                       <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Data</th>
                       <th className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Status</th>
                       <th className="px-8 py-4"></th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-surface-border">
                    {filteredRequests.map((req) => (
                       <motion.tr 
                        key={req.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="group hover:bg-white/5 transition-colors"
                       >
                          <td className="px-8 py-5">
                             <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-surface border border-surface-border flex items-center justify-center overflow-hidden">
                                   <img src={`https://ui-avatars.com/api/?name=${req.user_profiles?.full_name}&background=00E5FF&color=0B0E14&bold=true`} alt={req.user_profiles?.full_name} />
                                </div>
                                <div>
                                   <p className="text-sm font-black">{req.user_profiles?.full_name || 'Afiliado'}</p>
                                   <p className="text-[10px] text-primary font-bold uppercase tracking-widest">{req.user_profiles?.referral_code || 'ID'}</p>
                                </div>
                             </div>
                          </td>
                          <td className="px-8 py-5">
                             <div className="flex flex-col">
                                <span className="text-sm font-black text-white">R$ {Number(req.amount).toFixed(2)}</span>
                                <span className="text-[8px] text-text-muted font-bold uppercase">Líquido: R$ {Number(req.net_amount).toFixed(2)}</span>
                             </div>
                          </td>
                          <td className="px-8 py-5">
                             <div className="flex items-center gap-2 group/pix">
                                <span className="text-xs text-text-muted font-mono">{req.pix_key}</span>
                                <button className="opacity-0 group-hover/pix:opacity-100 p-1 text-primary hover:bg-primary/10 rounded transition-all" onClick={() => {
                                  navigator.clipboard.writeText(req.pix_key);
                                  toast.success('Chave PIX copiada!');
                                }}>
                                   <ExternalLink size={12} />
                                </button>
                             </div>
                             <p className="text-[8px] text-text-muted font-black uppercase mt-1">{req.pix_type}</p>
                          </td>
                          <td className="px-8 py-5">
                             <p className="text-[10px] text-text-muted font-bold">{new Date(req.created_at).toLocaleDateString('pt-BR')}</p>
                          </td>
                          <td className="px-8 py-5">
                             <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${
                                req.status === 'pendente' ? 'bg-amber-500/10 text-amber-500' : 
                                req.status === 'concluido' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                             }`}>
                                {req.status === 'pendente' ? <Clock size={14} /> : 
                                 req.status === 'concluido' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                <span className="text-[10px] font-black uppercase tracking-widest">{req.status}</span>
                             </div>
                          </td>
                          <td className="px-8 py-5 text-right">
                             <div className="flex items-center justify-end gap-2">
                                {req.status === 'pendente' && (
                                  <>
                                    <button 
                                      onClick={() => handleAction(req.id, 'concluido')}
                                      className="px-4 py-2 bg-emerald-500 text-background rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-emerald-500/20"
                                    >
                                       Aprovar
                                    </button>
                                    <button 
                                      onClick={() => handleAction(req.id, 'cancelado')}
                                      className="p-2 text-text-muted hover:text-red-400 transition-all"
                                    >
                                       <XCircle size={18} />
                                    </button>
                                  </>
                                )}
                                <button className="p-2 text-text-muted hover:text-white transition-all">
                                   <MoreVertical size={18} />
                                </button>
                             </div>
                          </td>
                       </motion.tr>
                    ))}
                 </tbody>
              </table>
           </div>
           
           {filteredRequests.length === 0 && !loading && (
             <div className="p-20 text-center">
                <Wallet size={48} className="mx-auto text-surface-border mb-4" />
                <p className="text-text-muted">Nenhuma solicitação encontrada.</p>
             </div>
           )}
        </div>
      </div>
    </AdminLayout>
  );
}
