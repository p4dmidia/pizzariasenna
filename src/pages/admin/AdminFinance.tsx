import { motion } from 'motion/react';
import { 
  BarChart3, 
  DollarSign, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  Calendar, 
  Printer, 
  Loader2, 
  Search, 
  ArrowLeft,
  Pizza
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

export default function AdminFinance() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [filterPeriod, setFilterPeriod] = useState<'today' | '7days' | '30days' | 'custom'>('7days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchFinanceData();
  }, []);

  const fetchFinanceData = async () => {
    try {
      setLoading(true);
      let list: any[] = [];
      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            user_profiles (full_name, phone)
          `)
          .order('created_at', { ascending: false });
        if (!error && data) list = data;
      } catch (e) {
        console.warn('Erro ao carregar do Supabase:', e);
      }

      const mockOrders = JSON.parse(localStorage.getItem('supabase.mock-orders') || '[]');
      const mergedMap = new Map();
      [...list, ...mockOrders].forEach(item => {
        if (item && item.id) mergedMap.set(item.id, item);
      });
      const finalOrders = Array.from(mergedMap.values()).sort((a: any, b: any) => 
        new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      );
      setOrders(finalOrders);
    } catch (error: any) {
      toast.error('Erro ao buscar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredOrders = () => {
    const now = new Date();
    return orders.filter(order => {
      const orderDate = new Date(order.created_at);
      
      // Period filter
      let matchesPeriod = true;
      if (filterPeriod === 'today') {
        matchesPeriod = orderDate.toDateString() === now.toDateString();
      } else if (filterPeriod === '7days') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        matchesPeriod = orderDate >= sevenDaysAgo;
      } else if (filterPeriod === '30days') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        matchesPeriod = orderDate >= thirtyDaysAgo;
      } else if (filterPeriod === 'custom' && startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchesPeriod = orderDate >= start && orderDate <= end;
      }

      // Search filter
      const searchLower = searchTerm.toLowerCase();
      let clientName = order.user_profiles?.full_name || 'Visitante';
      if (order.address_summary && order.address_summary.startsWith("Nome: ")) {
        clientName = order.address_summary.split(" | ")[0].replace("Nome: ", "");
      }
      const matchesSearch = 
        order.id.toString().includes(searchTerm) || 
        clientName.toLowerCase().includes(searchLower);

      return matchesPeriod && matchesSearch;
    });
  };

  const filteredOrders = getFilteredOrders();

  // Stats calculation
  const concludedOrders = filteredOrders.filter(o => o.status === 'concluido');
  const canceledOrders = filteredOrders.filter(o => o.status === 'cancelado');
  
  const totalRevenue = concludedOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
  const avgTicket = concludedOrders.length > 0 ? totalRevenue / concludedOrders.length : 0;

  // Payments breakdown
  const paymentCounts = concludedOrders.reduce((acc: any, o) => {
    const method = o.payment_method || 'outro';
    acc[method] = (acc[method] || 0) + Number(o.total_amount || 0);
    return acc;
  }, { pix: 0, card: 0, cash: 0 });

  const printReport = () => {
    const startStr = filterPeriod === 'custom' ? startDate : new Date(Date.now() - (filterPeriod === 'today' ? 0 : filterPeriod === '7days' ? 7 : 30) * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR');
    const endStr = filterPeriod === 'custom' ? endDate : new Date().toLocaleDateString('pt-BR');

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, autorize pop-ups para gerar o PDF.');
      return;
    }

    const ordersHtml = filteredOrders.map((o) => {
      let clientName = o.user_profiles?.full_name || 'Cliente';
      if (o.address_summary && o.address_summary.startsWith("Nome: ")) {
        clientName = o.address_summary.split(" | ")[0].replace("Nome: ", "");
      }
      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px dashed #ccc;">#${o.id}</td>
          <td style="padding: 10px; border-bottom: 1px dashed #ccc;">${new Date(o.created_at).toLocaleString('pt-BR')}</td>
          <td style="padding: 10px; border-bottom: 1px dashed #ccc;">${clientName}</td>
          <td style="padding: 10px; border-bottom: 1px dashed #ccc; text-transform: uppercase; font-weight: bold;">${o.payment_method}</td>
          <td style="padding: 10px; border-bottom: 1px dashed #ccc; text-transform: uppercase;">${o.status}</td>
          <td style="padding: 10px; border-bottom: 1px dashed #ccc; text-align: right; font-weight: bold;">R$ ${Number(o.total_amount).toFixed(2)}</td>
        </tr>
      `;
    }).join('');

    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <title>Relatório de Fechamento - Pizza Senna</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; margin: 20px; color: #000; }
            .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 15px; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 24px; font-weight: bold; }
            .header p { margin: 4px 0; font-size: 12px; }
            .stats { display: flex; justify-content: space-between; border-bottom: 2px dashed #000; padding: 15px 0; margin-bottom: 20px; font-size: 13px; }
            .stats-col { flex: 1; text-align: center; }
            .stats-col strong { font-size: 16px; display: block; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { text-align: left; padding: 10px; border-bottom: 1px solid #000; background: #f2f2f2; }
            .no-print-btn {
              width: 100%;
              padding: 12px;
              background: #00E5FF;
              color: #000;
              text-align: center;
              font-weight: bold;
              border: none;
              border-radius: 8px;
              cursor: pointer;
              margin-bottom: 20px;
              font-size: 14px;
            }
            @media print {
              .no-print-btn { display: none; }
            }
          </style>
        </head>
        <body>
          <button class="no-print-btn" onclick="window.print()">🖨️ IMPRIMIR RELATÓRIO (PDF)</button>
          
          <div class="header">
            <h1>🍕 PIZZARIA SENNA</h1>
            <p>RELATÓRIO FINANCEIRO DE VENDAS E CAIXA</p>
            <p>Período: ${startStr} até ${endStr}</p>
            <p>Gerado em: ${new Date().toLocaleString('pt-BR')}</p>
          </div>

          <div class="stats">
            <div class="stats-col">Faturamento Bruto: <strong>R$ ${totalRevenue.toFixed(2)}</strong></div>
            <div class="stats-col">Ticket Médio: <strong>R$ ${avgTicket.toFixed(2)}</strong></div>
            <div class="stats-col">Pedidos Concluídos: <strong>${concludedOrders.length}</strong></div>
            <div class="stats-col">Cancelados: <strong>${canceledOrders.length}</strong></div>
          </div>

          <div class="header" style="border-bottom: 1px dashed #000; text-align: left; padding-bottom: 10px;">
            <h3>Resumo de Entradas por Método:</h3>
            <p>• PIX: <strong>R$ ${paymentCounts.pix.toFixed(2)}</strong></p>
            <p>• Cartão: <strong>R$ ${paymentCounts.card.toFixed(2)}</strong></p>
            <p>• Dinheiro: <strong>R$ ${paymentCounts.cash.toFixed(2)}</strong></p>
          </div>

          <h3 style="margin-top: 25px;">Lista Detalhada de Pedidos:</h3>
          <table>
            <thead>
              <tr>
                <th>PEDIDO</th>
                <th>DATA/HORA</th>
                <th>CLIENTE</th>
                <th>PAGAMENTO</th>
                <th>STATUS</th>
                <th style="text-align: right;">VALOR</th>
              </tr>
            </thead>
            <tbody>
              ${ordersHtml}
            </tbody>
          </table>

          <script>
            setTimeout(function() {
              window.print();
            }, 300);
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <AdminLayout>
      <div className="space-y-8 text-text-main">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black mb-1">Financeiro & Relatórios 📊</h1>
            <p className="text-text-muted text-sm">Controle financeiro de vendas e exportação de relatórios.</p>
          </div>
          <button 
            onClick={printReport}
            className="px-6 py-3.5 bg-primary text-background rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl glow-primary hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer size={16} /> Imprimir Relatório (PDF)
          </button>
        </div>

        {/* Date Filters Dashboard */}
        <div className="glass-card p-6 border-white/5 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            {[
              { id: 'today', label: 'Hoje' },
              { id: '7days', label: 'Últimos 7 Dias' },
              { id: '30days', label: 'Últimos 30 Dias' },
              { id: 'custom', label: 'Personalizado' }
            ].map(period => (
              <button
                key={period.id}
                onClick={() => setFilterPeriod(period.id as any)}
                className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                  filterPeriod === period.id 
                    ? 'bg-primary text-background shadow-md' 
                    : 'bg-surface hover:bg-surface-hover text-text-muted hover:text-white border border-surface-border'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>

          {filterPeriod === 'custom' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2"
            >
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-text-muted">Data Inicial</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-background border border-surface-border rounded-xl py-3 px-4 text-xs font-bold text-text-main outline-none focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-text-muted">Data Final</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-background border border-surface-border rounded-xl py-3 px-4 text-xs font-bold text-text-main outline-none focus:border-primary"
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Faturamento Bruto', value: `R$ ${totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-primary bg-primary/10' },
                { label: 'Ticket Médio', value: `R$ ${avgTicket.toFixed(2)}`, icon: TrendingUp, color: 'text-secondary bg-secondary/10' },
                { label: 'Pedidos Concluídos', value: concludedOrders.length.toString(), icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-400/10' },
                { label: 'Cancelados', value: canceledOrders.length.toString(), icon: XCircle, color: 'text-red-400 bg-red-400/10' }
              ].map((stat, i) => (
                <div key={i} className="glass-card p-6 border-white/5">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-2xl ${stat.color}`}>
                      <stat.icon size={24} />
                    </div>
                  </div>
                  <p className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-1">{stat.label}</p>
                  <p className="text-2xl font-black">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Payments breakdown SVG simulation chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="glass-card p-8 border-white/5 space-y-6 lg:col-span-2">
                <h3 className="text-lg font-black uppercase tracking-wider">Entradas por Método de Pagamento</h3>
                
                <div className="space-y-4">
                  {[
                    { key: 'pix', label: 'PIX', value: paymentCounts.pix, color: 'bg-emerald-400 text-emerald-400' },
                    { key: 'card', label: 'Cartão na Entrega', value: paymentCounts.card, color: 'bg-primary text-primary' },
                    { key: 'cash', label: 'Dinheiro', value: paymentCounts.cash, color: 'bg-amber-400 text-amber-400' }
                  ].map(payment => {
                    const percentage = totalRevenue > 0 ? (payment.value / totalRevenue) * 100 : 0;
                    return (
                      <div key={payment.key} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span>{payment.label}</span>
                          <span>R$ {payment.value.toFixed(2)} ({percentage.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full h-3.5 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${payment.color.split(' ')[0]} transition-all duration-1000`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pizza Selling list */}
              <div className="glass-card p-8 border-white/5 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-black uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Pizza className="text-primary animate-pulse" size={20} /> Mais Vendidos
                  </h3>
                  <div className="space-y-4">
                    <p className="text-xs text-text-muted font-bold">
                      Acompanhe o ranking completo de pizzas e produtos vendidos na tela principal do Dashboard.
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => navigate('/admin')}
                  className="w-full mt-6 py-3.5 bg-white/5 hover:bg-white/10 text-text-main border border-surface-border rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  Ver Dashboard
                </button>
              </div>
            </div>

            {/* Sales Detailed table */}
            <div className="glass-card overflow-hidden border-white/5">
              <div className="p-6 border-b border-surface-border flex items-center justify-between">
                <h3 className="text-base font-black uppercase tracking-wider">Histórico Detalhado do Período</h3>
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={14} />
                  <input
                    type="text"
                    placeholder="Buscar pelo nome ou ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-background border border-surface-border rounded-xl py-2 pl-9 pr-4 text-xs font-bold text-text-main outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-surface-border bg-surface/30">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Pedido</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Data/Hora</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Cliente</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Forma Pgto</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Status</th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-border text-xs">
                    {filteredOrders.map(order => {
                      let clientName = order.user_profiles?.full_name || 'Cliente';
                      if (order.address_summary && order.address_summary.startsWith("Nome: ")) {
                        clientName = order.address_summary.split(" | ")[0].replace("Nome: ", "");
                      }
                      return (
                        <tr key={order.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-black text-primary">#{order.id}</td>
                          <td className="px-6 py-4 text-text-muted">{new Date(order.created_at).toLocaleString()}</td>
                          <td className="px-6 py-4 font-bold">{clientName}</td>
                          <td className="px-6 py-4 uppercase font-black text-text-muted">{order.payment_method}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              order.status === 'concluido' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              order.status === 'cancelado' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                              'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-black text-secondary text-right">R$ {Number(order.total_amount).toFixed(2)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
