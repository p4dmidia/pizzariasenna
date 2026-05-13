import { motion } from 'motion/react';
import { 
  User, 
  History, 
  Heart, 
  Ticket, 
  TrendingUp, 
  HelpCircle, 
  MapPin, 
  ShieldCheck, 
  ChevronRight, 
  Plus, 
  Menu, 
  X, 
  Search, 
  ShoppingCart,
  Bell,
  Camera,
  ArrowLeft
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import CartDrawer from '../components/CartDrawer';
import { useCart } from '../context/CartContext';



import logoImg from '../assets/logo-casarao.jpeg';

export default function MyAccount() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { cartCount } = useCart();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col text-text-main">
      {/* Header (Same as DeliveryApp) */}
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
                placeholder="Busque sua pizza favorita..."
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
            <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
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
        {/* Sidebar (Same as DeliveryApp) */}
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
            <div className="flex items-center gap-4 mb-8 p-4 rounded-2xl bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(0,229,255,0.1)]">
              <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-background">
                <User size={24} />
              </div>
              <div>
                <p className="font-bold text-sm">Miguel Oliveira</p>
                <p className="text-[10px] text-text-muted uppercase font-black tracking-widest">Visionário</p>
              </div>
            </div>

            <nav className="space-y-1">
              <SidebarLink icon={User} label="Minha Conta" active />
              <SidebarLink icon={History} label="Meus Pedidos" isLink to="/" />
              <SidebarLink icon={Heart} label="Favoritos" isLink to="/favorites" />

              <SidebarLink icon={Ticket} label="Cupons" isLink to="/coupons" />

              <SidebarLink icon={TrendingUp} label="Clube 7" isLink to="/clube" />
              <SidebarLink icon={HelpCircle} label="Suporte" isLink to="/support" />

            </nav>

            <Link to="/login" className="block w-full mt-8 bg-surface border border-surface-border text-text-muted font-black py-4 rounded-2xl text-xs uppercase tracking-widest hover:text-red-400 transition-all text-center">
              SAIR DA CONTA
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-12 max-w-4xl">
           <div className="flex items-center gap-4 mb-8">
              <button onClick={() => navigate('/')} className="p-2 hover:bg-surface rounded-xl transition-all text-text-muted hover:text-primary">
                 <ArrowLeft size={20} />
              </button>
              <h1 className="text-3xl font-black italic">Minha Conta</h1>
           </div>

           <div className="space-y-8">
              {/* Profile Card */}
              <section className="glass-card p-8 border-white/5 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full" />
                 
                 <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
                    <div className="relative group">
                       <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-2 border-primary/20 shadow-2xl">
                          <img src="https://ui-avatars.com/api/?name=Miguel+Oliveira&background=00E5FF&color=0B0E14&bold=true" alt="Profile" />
                       </div>
                       <button className="absolute -bottom-2 -right-2 p-3 bg-primary text-background rounded-2xl shadow-xl hover:scale-110 transition-all">
                          <Camera size={18} />
                       </button>
                    </div>
                    <div className="text-center md:text-left">
                       <h3 className="text-2xl font-black mb-1">Miguel Oliveira</h3>
                       <p className="text-text-muted text-sm uppercase font-bold tracking-widest mb-4">miguel.oliveira@email.com</p>
                       <div className="flex flex-wrap justify-center md:justify-start gap-3">
                          <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">
                             Visionário
                          </span>
                          <span className="px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                             Ativo
                          </span>
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-text-muted ml-1">Nome Completo</label>
                       <input type="text" defaultValue="Miguel Oliveira" className="w-full bg-background border border-surface-border rounded-2xl py-4 px-6 outline-none focus:border-primary/50 transition-all text-sm font-bold" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-text-muted ml-1">WhatsApp</label>
                       <input type="text" defaultValue="(11) 99999-9999" className="w-full bg-background border border-surface-border rounded-2xl py-4 px-6 outline-none focus:border-primary/50 transition-all text-sm font-bold" />
                    </div>
                 </div>
                 
                 <button className="mt-10 bg-primary text-background px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl glow-primary hover:scale-105 transition-all">
                    Salvar Dados
                 </button>
              </section>

              {/* Addresses */}
              <section className="space-y-4">
                 <div className="flex items-center justify-between px-2">
                    <h3 className="text-xl font-black flex items-center gap-3">
                       <MapPin className="text-primary" size={24} /> Meus Endereços
                    </h3>
                    <button className="text-primary text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:scale-110 transition-all">
                       <Plus size={14} /> Adicionar Novo
                    </button>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <AddressCard 
                      label="Casa" 
                      address="Rua das Flores, 123 - Centro" 
                      city="São Paulo - SP" 
                      active 
                    />
                    <AddressCard 
                      label="Trabalho" 
                      address="Av. Paulista, 1000 - Bela Vista" 
                      city="São Paulo - SP" 
                    />
                 </div>
              </section>

              {/* Security */}
              <section className="glass-card p-8 border-white/5 flex items-center justify-between">
                 <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-surface border border-surface-border flex items-center justify-center text-text-muted">
                       <ShieldCheck size={28} />
                    </div>
                    <div>
                       <h3 className="text-lg font-black mb-1">Segurança da Conta</h3>
                       <p className="text-xs text-text-muted uppercase font-bold tracking-widest">Senha e autenticação</p>
                    </div>
                 </div>
                 <button className="p-3 bg-surface hover:bg-surface-hover rounded-xl border border-surface-border transition-all">
                    <ChevronRight size={20} />
                 </button>
              </section>
           </div>
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

function AddressCard({ label, address, city, active = false }: any) {
  return (
    <div className={`p-6 rounded-3xl border transition-all cursor-pointer group ${
      active 
        ? 'bg-primary/5 border-primary/30 shadow-lg' 
        : 'bg-surface border-surface-border hover:border-white/10'
    }`}>
       <div className="flex justify-between items-start mb-4">
          <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
            active ? 'bg-primary text-background' : 'bg-white/5 text-text-muted'
          }`}>
             {label}
          </div>
          {active && <div className="w-2 h-2 rounded-full bg-primary glow-primary" />}
       </div>
       <p className="text-sm font-bold mb-1 group-hover:text-white transition-colors">{address}</p>
       <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest">{city}</p>
    </div>
  );
}
