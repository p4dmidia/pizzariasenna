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
  Trash2,
  ArrowLeft
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import CartDrawer from '../components/CartDrawer';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { ALL_PRODUCTS } from '../data/products';

import logoImg from '../assets/logo-casarao.jpeg';

export default function Favorites() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { addToCart, cartCount } = useCart();
  const { favorites, toggleFavorite } = useFavorites();
  const navigate = useNavigate();

  const favoriteProducts = useMemo(() => {
    return ALL_PRODUCTS.filter(product => favorites.includes(product.id));
  }, [favorites]);

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
                placeholder="Busque nos seus favoritos..."
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
              <SidebarLink icon={Heart} label="Favoritos" active />
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
        <main className="flex-1 p-6 md:p-12 max-w-7xl mx-auto w-full">
           <div className="flex items-center gap-4 mb-12">
              <button onClick={() => navigate('/')} className="p-2 hover:bg-surface rounded-xl transition-all text-text-muted hover:text-primary">
                 <ArrowLeft size={20} />
              </button>
              <h1 className="text-3xl font-black italic">Meus Favoritos ❤️</h1>
           </div>

           {favoriteProducts.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {favoriteProducts.map((item) => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ y: -8 }}
                    className="glass-card flex flex-col group overflow-hidden border-white/5"
                  >
                    <div className="h-56 overflow-hidden relative">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                      <button 
                        onClick={() => toggleFavorite(item.id)}
                        className="absolute top-4 right-4 p-2.5 bg-background/80 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg backdrop-blur-md"
                      >
                         <Trash2 size={18} />
                      </button>
                    </div>
                    <div className="p-6 flex-1 flex flex-col">
                      <h4 className="text-xl font-black mb-2 group-hover:text-primary transition-colors">{item.name}</h4>
                      <p className="text-xs text-text-muted line-clamp-2 mb-6 flex-1">{item.description}</p>
                      <div className="flex justify-between items-center mt-auto">
                        <span className="font-display text-2xl font-black text-secondary">R$ {item.price.toFixed(2)}</span>
                        <button 
                          onClick={() => addToCart(item)}
                          className="bg-primary text-background px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-110 active:scale-95 transition-all shadow-lg glow-primary flex items-center gap-2"
                        >
                          <Plus size={16} /> Adicionar
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
             </div>
           ) : (
             <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="w-24 h-24 rounded-full bg-surface border border-surface-border flex items-center justify-center text-text-muted mb-6">
                   <Heart size={40} />
                </div>
                <h3 className="text-xl font-black mb-2">Sua lista está vazia</h3>
                <p className="text-text-muted mb-8 max-w-sm">Favorite suas pizzas prediletas para encontrá-las rapidamente aqui.</p>
                <Link to="/" className="bg-primary text-background px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg glow-primary">
                   Explorar Cardápio
                </Link>
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
