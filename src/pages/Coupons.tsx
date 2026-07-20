import { motion } from 'motion/react';
import { 
  User, 
  History, 
  Heart, 
  Ticket, 
  TrendingUp, 
  HelpCircle, 
  Plus, 
  Menu, 
  X, 
  Search, 
  ShoppingCart,
  Bell,
  Copy,
  CheckCircle2,
  ArrowLeft,
  Clock,
  AlertCircle,
  LayoutDashboard,
  Users,
  Wallet,
  PieChart,
  Settings,
  LogOut,
  Loader2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import CartDrawer from '../components/CartDrawer';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

import AppLogo from '../components/AppLogo';
import NotificationBell from '../components/NotificationBell';
import UserHeader from '../components/UserHeader';

export default function Coupons() {
  const { user, profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('ativo');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { cartCount } = useCart();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCoupons() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('coupons')
          .select('*')
          .order('id');
        if (error) throw error;
        if (data) {
          const mapped = data.map((c: any) => {
            const isExpired = c.expires_at && new Date(c.expires_at) < new Date();
            const status = (c.is_active && !isExpired) ? 'ativo' : 'expirado';
            
            let discount = '';
            if (c.type === 'percentage') discount = `${Number(c.value)}%`;
            else if (c.type === 'fixed') discount = `R$ ${Number(c.value).toFixed(2)}`;
            else if (c.type === 'shipping') discount = 'Entrega Grátis';

            return {
              id: c.id,
              code: c.code,
              discount,
              description: c.description || '',
              expires: c.expires_at ? new Date(c.expires_at).toLocaleDateString('pt-BR') : 'Sem expiração',
              status,
              type: c.type
            };
          });
          setCoupons(mapped);
        }
      } catch (err) {
        console.error('Erro ao buscar cupons:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCoupons();
  }, []);

  const filteredCoupons = coupons.filter(c => c.status === activeTab);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const nameInitials = (profile?.full_name || 'Visitante')
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-background text-text-main font-sans flex flex-col">
      <UserHeader />

      {/* Main Content */}
      <main className="flex-1 min-h-screen flex flex-col w-full max-w-[1400px] mx-auto px-2 sm:px-4">
        {/* Inner Content */}
        <div className="flex-1 p-6 md:p-12 max-w-5xl mx-auto w-full overflow-x-hidden">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
              <div className="flex items-center gap-4">
                 <button onClick={() => navigate('/')} className="p-2 hover:bg-surface rounded-xl transition-all text-text-muted hover:text-primary">
                    <ArrowLeft size={20} />
                 </button>
                 <h1 className="text-3xl font-black italic">Meus Cupons 🎫</h1>
              </div>

              <div className="flex bg-surface rounded-2xl p-1 border border-surface-border">
                 {['ativo', 'expirado'].map((tab) => (
                    <button 
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-8 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-primary text-background shadow-lg' : 'text-text-muted hover:text-white'}`}
                    >
                      {tab === 'ativo' ? 'Disponíveis' : 'Expirados'}
                    </button>
                 ))}
              </div>
           </div>

           {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-text-muted font-black uppercase tracking-widest text-xs">Carregando Cupons...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCoupons.map((coupon) => (
                    <motion.div 
                      key={coupon.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`relative group overflow-hidden ${coupon.status === 'expirado' ? 'opacity-60' : ''}`}
                    >
                       <div className="glass-card p-6 border-white/5 relative z-10">
                          <div className="flex justify-between items-start mb-6">
                             <div className={`p-3 rounded-2xl ${
                               coupon.type === 'percentage' ? 'bg-primary/10 text-primary' : 
                               coupon.type === 'fixed' ? 'bg-secondary/10 text-secondary' : 
                               'bg-emerald-500/10 text-emerald-400'
                             }`}>
                                <Ticket size={24} />
                             </div>
                             <div className="text-right">
                                <p className="text-2xl font-black">{coupon.discount}</p>
                                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">DE DESCONTO</p>
                             </div>
                          </div>

                          <h4 className="text-lg font-black mb-2">{coupon.code}</h4>
                          <p className="text-xs text-text-muted mb-6 line-clamp-2 leading-relaxed">{coupon.description}</p>

                          <div className="flex items-center justify-between pt-6 border-t border-surface-border">
                             <div className="flex items-center gap-2 text-text-muted">
                                <Clock size={14} />
                                <span className="text-[10px] font-bold uppercase tracking-widest">
                                   Vence em {coupon.expires}
                                </span>
                             </div>
                             <button 
                              onClick={() => handleCopy(coupon.code)}
                              className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                                copiedCode === coupon.code ? 'text-emerald-400' : 'text-primary hover:scale-105'
                              }`}
                             >
                                {copiedCode === coupon.code ? (
                                  <> <CheckCircle2 size={14} /> Copiado! </>
                                ) : (
                                  <> <Copy size={14} /> Copiar </>
                                )}
                             </button>
                          </div>
                       </div>

                       {/* Ticket Decorative Elements */}
                       <div className="absolute top-1/2 -left-3 w-6 h-6 rounded-full bg-background border-r border-white/5 z-20 -translate-y-1/2" />
                       <div className="absolute top-1/2 -right-3 w-6 h-6 rounded-full bg-background border-l border-white/5 z-20 -translate-y-1/2" />
                       <div className="absolute top-1/2 left-0 right-0 h-px border-t border-dashed border-white/10 z-0 -translate-y-1/2" />
                    </motion.div>
                  ))}
                </div>

                {filteredCoupons.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-32 text-center">
                     <div className="w-24 h-24 rounded-full bg-surface border border-surface-border flex items-center justify-center text-text-muted mb-6">
                        <AlertCircle size={40} />
                     </div>
                     <h3 className="text-xl font-black mb-2">Nenhum cupom encontrado</h3>
                     <p className="text-text-muted mb-8 max-w-sm">Fique de olho nas nossas redes sociais e no app para novos descontos!</p>
                  </div>
                )}
              </>
            )}
        </div>
      </main>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>

  );
}

function SidebarLink({ icon: Icon, label, active = false, isLink = false, to = "" }: any) {
  const content = (
    <div className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${
      active 
        ? 'bg-primary text-background shadow-lg glow-primary font-bold' 
        : 'text-text-muted hover:text-white hover:bg-surface-hover'
    }`}>
      <Icon size={20} className={active ? '' : 'group-hover:text-primary transition-colors'} />
      <span className="text-sm">{label}</span>
    </div>
  );

  if (isLink) return <Link to={to}>{content}</Link>;
  return <button className="w-full text-left">{content}</button>;
}
