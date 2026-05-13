import { 
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation
} from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  User, 
  ShoppingCart, 
  History, 
  Heart, 
  Ticket, 
  HelpCircle, 
  Pizza as PizzaIcon, 
  Wine, 
  Sparkles, 
  IceCream, 
  Plus, 
  ChevronRight,
  TrendingUp,
  Package,
  PlusCircle,
  Menu,
  X
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import CartDrawer from './components/CartDrawer';

import { CartProvider, useCart } from './context/CartContext';

import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Network from './pages/Network';
import Financial from './pages/Financial';
import Reports from './pages/Reports';
import SettingsPage from './pages/Settings';
import MyAccount from './pages/MyAccount';
import Favorites from './pages/Favorites';
import Coupons from './pages/Coupons';
import Support from './pages/Support';
import Checkout from './pages/Checkout';
import { FavoritesProvider, useFavorites } from './context/FavoritesContext';
import { MAIS_PEDIDAS, CLASSICAS } from './data/products';
import logoImg from './assets/logo-casarao.jpeg';
import PWAInstallPrompt from './components/PWAInstallPrompt';










const CATEGORIES = [
  { id: 'pizzas', name: 'Pizzas', icon: PizzaIcon },
  { id: 'bebidas', name: 'Bebidas', icon: Wine },
  { id: 'combos', name: 'Combos', icon: Sparkles },
  { id: 'sobremesas', name: 'Sobremesas', icon: IceCream },
];

function DeliveryApp() {
  const [activeCategory, setActiveCategory] = useState('pizzas');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { addToCart, cartCount } = useCart();



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
          <Link to="/login" className="p-2.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-full transition-all">
            <User size={22} />
          </Link>
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
            <div className="flex items-center gap-4 mb-8 p-4 rounded-2xl bg-primary/5 border border-primary/10">
              <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-background">
                <User size={24} />
              </div>
              <div>
                <p className="font-bold text-sm">Olá, Visitante</p>
                <p className="text-[10px] text-text-muted uppercase font-black tracking-widest">Seja Bem-vindo</p>
              </div>
            </div>

            <nav className="space-y-1">
              <SidebarLink icon={User} label="Minha Conta" isLink to="/profile" />

              <SidebarLink icon={History} label="Meus Pedidos" active />
              <SidebarLink icon={Heart} label="Favoritos" isLink to="/favorites" />

              <SidebarLink icon={Ticket} label="Cupons" isLink to="/coupons" />

              <SidebarLink icon={TrendingUp} label="Clube 7" isLink to="/clube" />
              <SidebarLink icon={HelpCircle} label="Suporte" isLink to="/support" />

            </nav>

            <Link to="/login" className="block w-full mt-8 bg-gradient-primary text-background font-black py-4 rounded-2xl text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg glow-primary text-center">
              ENTRAR OU CADASTRAR
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden">
          {/* Hero Section */}
          <section className="relative h-[300px] md:h-[400px] flex items-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent z-10" />
            <img 
              src="https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&q=80&w=1500" 
              alt="Casarão Delivery"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="relative z-20 px-6 md:px-12 max-w-2xl">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-display text-4xl md:text-5xl font-black mb-4 leading-tight"
              >
                O Sabor Original da <span className="text-primary text-glow">Casarão</span> na sua Casa.
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-text-muted text-base md:text-lg mb-8 max-w-lg"
              >
                Massa artesanal, ingredientes selecionados e entrega rápida em até 30 minutos.
              </motion.p>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-primary text-background px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl glow-primary"
              >
                PEÇA SUA PIZZA AGORA
              </motion.button>
            </div>
          </section>

          {/* Category Bar */}
          <section className="sticky top-20 z-40 glass py-4 px-4 md:px-8 overflow-x-auto hide-scrollbar">
            <div className="flex gap-4">
              {CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-full transition-all whitespace-nowrap font-bold text-sm ${
                    activeCategory === category.id 
                      ? 'bg-primary text-background shadow-lg scale-105' 
                      : 'bg-surface hover:bg-surface-hover text-text-muted hover:text-white border border-surface-border'
                  }`}
                >
                  <category.icon size={18} />
                  {category.name}
                </button>
              ))}
            </div>
          </section>

          <div className="max-w-7xl mx-auto px-4 md:px-8 py-12 space-y-20">
            {/* Mais Pedidas */}
            <section>
              <div className="flex justify-between items-end mb-8">
                <h3 className="font-display text-3xl font-black flex items-center gap-3">
                  <span className="text-primary text-glow">🔥</span> Mais Pedidas
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {MAIS_PEDIDAS.map((pizza) => (
                  <ProductCard key={pizza.id} pizza={pizza} onAdd={() => addToCart(pizza)} />
                ))}
              </div>

            </section>

            {/* Cardápio Completo */}
            <section>
              <h3 className="font-display text-2xl font-black mb-8 border-b border-surface-border pb-4">
                 🍕 Cardápio Clássico
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {CLASSICAS.map((pizza) => (
                  <ListItem key={pizza.id} pizza={pizza} onAdd={() => addToCart(pizza)} />
                ))}
              </div>
            </section>

          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full glass z-50 flex items-center justify-around py-3 px-4">
        <MobileNavLink icon={PizzaIcon} label="Delivery" active />
        <MobileNavLink icon={TrendingUp} label="Clube" to="/clube" />
        <MobileNavLink icon={ShoppingCart} label="Carrinho" onClick={() => setIsCartOpen(true)} />
        <MobileNavLink icon={User} label="Perfil" to="/profile" />
      </nav>

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

function ProductCard({ pizza, onAdd }: any) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const favorite = isFavorite(pizza.id);

  return (
    <motion.div 
      whileHover={{ y: -8 }}
      className="glass-card flex flex-col group overflow-hidden"
    >
      <div className="h-56 overflow-hidden relative">
        <img src={pizza.image} alt={pizza.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        
        {/* Favorite Button */}
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(pizza.id);
          }}
          className={`absolute top-4 right-4 p-2.5 rounded-xl transition-all shadow-lg backdrop-blur-md z-20 ${
            favorite ? 'bg-primary text-background' : 'bg-background/80 text-primary hover:bg-primary/20'
          }`}
        >
          <Heart size={18} fill={favorite ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="p-6 flex-1 flex flex-col">
        <h4 className="text-xl font-black mb-2 group-hover:text-primary transition-colors">{pizza.name}</h4>
        <p className="text-xs text-text-muted line-clamp-2 mb-6 flex-1">{pizza.description}</p>
        <div className="flex justify-between items-center mt-auto">
          <span className="font-display text-2xl font-black text-secondary">R$ {pizza.price.toFixed(2)}</span>
          <button 
            onClick={onAdd}
            className="bg-primary text-background p-3 rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-lg glow-primary"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ListItem({ pizza, onAdd }: any) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const favorite = isFavorite(pizza.id);

  return (
    <div className="flex gap-4 p-4 glass-card group relative">
      {pizza.soldOut && <div className="absolute top-2 right-2 bg-secondary text-background text-[8px] px-2 py-1 rounded-full font-black z-10 uppercase">Esgotado</div>}
      
      {/* Favorite Button for List Item */}
      {!pizza.soldOut && (
        <button 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(pizza.id);
          }}
          className={`absolute top-2 right-2 p-1.5 rounded-lg transition-all z-20 ${
            favorite ? 'text-primary' : 'text-text-muted hover:text-primary'
          }`}
        >
          <Heart size={14} fill={favorite ? "currentColor" : "none"} />
        </button>
      )}

      <div className={`w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-surface border border-surface-border ${pizza.soldOut ? 'grayscale opacity-30' : ''}`}>
        {pizza.image ? <img src={pizza.image} alt={pizza.name} className="w-full h-full object-cover" /> : <pizza.icon className="w-8 h-8 text-primary/20 m-auto mt-6" />}
      </div>
      <div className={`flex-1 flex flex-col justify-center ${pizza.soldOut ? 'opacity-30' : ''}`}>
        <h5 className="text-sm font-black mb-1 group-hover:text-primary transition-colors">{pizza.name}</h5>
        <p className="text-[10px] text-text-muted leading-tight mb-2 line-clamp-1">{pizza.description}</p>
        <div className="flex justify-between items-center mt-auto">
          <span className="text-sm font-black text-secondary">R$ {pizza.price.toFixed(2)}</span>
          {!pizza.soldOut && (
            <button onClick={onAdd} className="hover:scale-125 transition-all">
              <PlusCircle size={18} className="text-primary cursor-pointer" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


function MobileNavLink({ icon: Icon, label, active = false, to = "", onClick }: any) {
  const content = (
    <div className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-primary' : 'text-text-muted hover:text-primary'}`}>
      <div className={`p-2 px-6 rounded-full ${active ? 'bg-primary/10' : ''}`}>
        <Icon size={20} />
      </div>
      <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
    </div>
  );
  if (to) return <Link to={to}>{content}</Link>;
  return <button onClick={onClick}>{content}</button>;
}


export default function App() {
  return (
    <FavoritesProvider>
      <PWAInstallPrompt />
      <CartProvider>
        <Router>
          <Routes>
            <Route path="/" element={<DeliveryApp />} />
            <Route path="/clube" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/network" element={<Network />} />
            <Route path="/dashboard/financial" element={<Financial />} />
            <Route path="/dashboard/reports" element={<Reports />} />
            <Route path="/dashboard/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<MyAccount />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/coupons" element={<Coupons />} />
            <Route path="/support" element={<Support />} />
            <Route path="/checkout" element={<Checkout />} />
          </Routes>
        </Router>
      </CartProvider>
    </FavoritesProvider>
  );
}


