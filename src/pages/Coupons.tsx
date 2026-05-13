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
  AlertCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import CartDrawer from '../components/CartDrawer';
import { useCart } from '../context/CartContext';



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

export default function Coupons() {
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

  return (
    <div className="min-h-screen bg-background flex flex-col text-text-main">
      {/* Header */}
      <header className="sticky top-0 z-50 glass h-20 flex items-center px-4 md:px-8 justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-primary">
            <Menu size={24} />
          </button>
          <Link to="/" className="flex items-center gap-3">
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
          <button className="p-2.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-full transition-all relative">
            <Bell size={22} />
          </button>
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

      <div className="flex flex-1 relative">
        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-[60] w-72 bg-surface border-r border-surface-border flex flex-col transition-transform duration-300 lg:sticky lg:top-20 lg:h-[calc(100vh-80px)] lg:translate-x-0
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}>
          <div className="p-6 flex items-center justify-between lg:hidden">
            <span className="font-black text-primary uppercase tracking-widest text-sm">Menu</span>
            <button onClick={() => setIsSidebarOpen(false)} className="text-text-muted hover:text-white">
              <X size={24} />
            </button>
          </div>

          <div className="p-6">
            <div className="flex items-center gap-4 mb-8 p-4 rounded-2xl bg-surface border border-surface-border">
              <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-background">
                <User size={24} />
              </div>
              <div>
                <p className="font-bold text-sm">Miguel Oliveira</p>
                <p className="text-[10px] text-text-muted uppercase font-black tracking-widest">Visionário</p>
              </div>
            </div>

            <nav className="space-y-1">
              <SidebarLink icon={User} label="Minha Conta" isLink to="/profile" />
              <SidebarLink icon={History} label="Meus Pedidos" isLink to="/" />
              <SidebarLink icon={Heart} label="Favoritos" isLink to="/favorites" />
              <SidebarLink icon={Ticket} label="Cupons" active />
              <SidebarLink icon={TrendingUp} label="Clube 7" isLink to="/clube" />
              <SidebarLink icon={HelpCircle} label="Suporte" isLink to="/support" />

            </nav>

            <Link to="/login" className="block w-full mt-8 bg-surface border border-surface-border text-text-muted font-black py-4 rounded-2xl text-xs uppercase tracking-widest hover:text-red-400 transition-all text-center">
              SAIR DA CONTA
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-12 max-w-7xl mx-auto w-full">
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
        </main>
      </div>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </div>

  );
}

function SidebarLink({ icon: Icon, label, active = false, isLink = false, to = "" }: any) {
  const content = (
    <div className={`flex items-center gap-4 p-3.5 rounded-2xl transition-all ${
      active 
        ? 'bg-primary/10 text-primary font-bold border border-primary/20 shadow-[0_0_15px_rgba(0,229,255,0.1)]' 
        : 'text-text-muted hover:text-white hover:bg-surface-hover'
    }`}>
      <Icon size={20} />
      <span className="text-sm">{label}</span>
    </div>
  );

  if (isLink) return <Link to={to}>{content}</Link>;
  return <button className="w-full text-left">{content}</button>;
}
