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
  LogOut
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import CartDrawer from '../components/CartDrawer';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';



const COUPONS = [
  {
    id: 1,
    code: 'BEMVINDO15',
    discount: '15%',
    description: 'Válido para seu primeiro pedido acima de R$ 50.',
    expires: '31/05/2026',
    status: 'ativo',
    type: 'percentage'
  },
  {
    id: 2,
    code: 'PIZZAFREE',
    discount: 'R$ 10,00',
    description: 'Desconto direto em qualquer pizza clássica.',
    expires: '20/05/2026',
    status: 'ativo',
    type: 'fixed'
  },
  {
    id: 3,
    code: 'QUARTALOUCA',
    discount: 'Entrega Grátis',
    description: 'Aproveite entrega gratuita em pedidos feitos às quartas-feiras.',
    expires: '15/05/2026',
    status: 'ativo',
    type: 'shipping'
  },
  {
    id: 4,
    code: 'CLIENTEANTIGO',
    discount: '20%',
    description: 'Cupom de fidelidade para clientes recorrentes.',
    expires: '01/05/2026',
    status: 'expirado',
    type: 'percentage'
  }
];

import logoImg from '../assets/logo-casarao.jpeg';
import NotificationBell from '../components/NotificationBell';

export default function Coupons() {
  const { user, profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('ativo');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { cartCount } = useCart();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const navigate = useNavigate();

  const filteredCoupons = COUPONS.filter(c => c.status === activeTab);

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
    <div className="min-h-screen bg-background text-text-main font-sans flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-[70] w-72 glass border-r border-surface-border flex flex-col transition-transform duration-300 lg:translate-x-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="p-6 flex items-center justify-between lg:hidden border-b border-surface-border/5">
          <span className="font-black text-primary uppercase tracking-widest text-sm">Menu</span>
          <button onClick={() => setIsSidebarOpen(false)} className="text-text-muted hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Logo no topo da Sidebar (Desktop) */}
        <div className="p-8 hidden lg:block border-b border-surface-border/5">
          <Link to="/" className="flex items-center gap-3">
             <img src={logoImg} alt="Casarão Clube 7" className="h-12 w-auto object-contain" />
          </Link>
        </div>

        <div className="p-6 flex-1 flex flex-col justify-between overflow-y-auto">
          <div>
            {!user && (
              <div className="flex items-center gap-4 mb-8 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-background flex-shrink-0">
                  <User size={24} />
                </div>
                <div>
                  <p className="font-bold text-sm leading-tight">Olá, Visitante</p>
                  <p className="text-[10px] text-text-muted uppercase font-black tracking-widest leading-none mt-1">Seja Bem-vindo</p>
                </div>
              </div>
            )}

            <nav className="space-y-1">
              {profile?.plan === 'empreendedor' || profile?.plan === 'visionario' ? (
                <>
                  <SidebarLink icon={LayoutDashboard} label="Dashboard" isLink to="/dashboard" />
                  <SidebarLink icon={Users} label="Minha Rede" isLink to="/dashboard/network" />
                  <SidebarLink icon={Wallet} label="Financeiro" isLink to="/dashboard/financial" />
                  <SidebarLink icon={ShoppingCart} label="Delivery" isLink to="/" />
                  <SidebarLink icon={Ticket} label="Cupons" active />
                  <SidebarLink icon={PieChart} label="Relatórios" isLink to="/dashboard/reports" />
                  <SidebarLink icon={Settings} label="Configurações" isLink to="/dashboard/settings" />
                </>
              ) : (
                <>
                  <SidebarLink icon={User} label="Minha Conta" isLink to="/profile" />
                  <SidebarLink icon={History} label="Meus Pedidos" isLink to="/" />
                  <SidebarLink icon={Heart} label="Favoritos" isLink to="/favorites" />
                  <SidebarLink icon={Ticket} label="Cupons" active />
                  <SidebarLink icon={TrendingUp} label="Clube 7" isLink to="/clube" />
                  <SidebarLink icon={HelpCircle} label="Suporte" isLink to="/support" />
                </>
              )}
            </nav>
          </div>

          <div className="mt-8">
            {user ? (
              <button 
                onClick={signOut}
                className="flex items-center gap-3 w-full p-4 text-text-muted hover:text-red-400 transition-colors font-black text-xs uppercase tracking-widest"
              >
                <LogOut size={18} /> Sair da Conta
              </button>
            ) : (
              <Link to="/login" className="block w-full mt-8 bg-gradient-primary text-background font-black py-4 rounded-2xl text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg glow-primary text-center">
                ENTRAR OU CADASTRAR
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 min-h-screen flex flex-col">
        {/* Header */}
        <header className="h-20 glass-card mx-6 mt-6 flex items-center justify-between px-8 border border-white/5 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-primary">
              <Menu size={24} />
            </button>
            <Link to="/" className="flex items-center gap-3 lg:hidden">
               <img src={logoImg} alt="Casarão Clube 7" className="h-12 w-auto object-contain" />
            </Link>
          </div>

          <div className="flex-1 max-w-xl hidden md:block">
             <div className="relative">
                <input 
                  type="text" 
                  placeholder="Busque seus cupons..."
                  className="w-full bg-surface/50 border border-surface-border rounded-full py-2.5 px-12 focus:ring-2 focus:ring-primary/50 transition-all text-sm outline-none"
                />
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
             </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <Link to="/clube" className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-black uppercase hover:bg-secondary/20 transition-all">
               <TrendingUp size={14} /> Clube 7
            </Link>
            {user ? (
              <div className="flex items-center gap-3 pl-4 md:pl-6 border-l border-surface-border">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-black uppercase text-text-main leading-tight">{profile?.full_name}</p>
                  <p className="text-[10px] text-primary font-bold mt-0.5">ID: {profile?.referral_code || 'Cliente'}</p>
                </div>
                <Link to="/profile" className="w-10 h-10 rounded-xl bg-surface border border-surface-border flex items-center justify-center overflow-hidden flex-shrink-0 hover:scale-105 transition-all">
                  <img src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'User')}&background=EA1D2C&color=FFFFFF&bold=true`} alt="Avatar" className="w-full h-full object-cover" />
                </Link>
              </div>
            ) : (
              <Link to="/login" className="p-2.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-full transition-all flex items-center justify-center overflow-hidden w-10 h-10 rounded-full border border-surface-border">
                <User size={22} />
              </Link>
            )}
            <NotificationBell />
            <button 
              onClick={() => setIsCartOpen(true)}
              className="p-2.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-full transition-all relative"
            >
              <ShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="absolute top-2 right-2 w-4 h-4 bg-primary text-background text-[8px] font-black rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(0,229,255,0.8)]">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Inner Content */}
        <div className="flex-1 p-6 md:p-12 max-w-7xl mx-auto w-full overflow-x-hidden">
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
