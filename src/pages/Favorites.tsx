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
  ArrowLeft,
  LayoutDashboard,
  Users,
  Wallet,
  PieChart,
  Settings,
  LogOut
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useMemo } from 'react';
import CartDrawer from '../components/CartDrawer';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { ALL_PRODUCTS } from '../data/products';
import { useAuth } from '../context/AuthContext';

import AppLogo from '../components/AppLogo';
import NotificationBell from '../components/NotificationBell';
import UserHeader from '../components/UserHeader';

export default function Favorites() {
  const { user, profile, signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { addToCart, cartCount } = useCart();
  const { favorites, toggleFavorite } = useFavorites();
  const navigate = useNavigate();

  const favoriteProducts = useMemo(() => {
    return ALL_PRODUCTS.filter(product => favorites.includes(product.id));
  }, [favorites]);

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
        <div className="flex-1 p-6 md:p-12 max-w-5xl mx-auto w-full">
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
