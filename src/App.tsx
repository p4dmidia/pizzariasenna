import { 
  BrowserRouter as Router,
  Routes,
  Route,
  Link
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
  Package, 
  PlusCircle,
  Menu,
  X,
  Loader2,
  LayoutDashboard,
  Settings,
  LogOut,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import CartDrawer from './components/CartDrawer';

import { CartProvider, useCart } from './context/CartContext';

import Login from './pages/Login';
import Register from './pages/Register';
import MyOrders from './pages/MyOrders';
import MyAccount from './pages/MyAccount';
import Favorites from './pages/Favorites';
import Coupons from './pages/Coupons';
import Support from './pages/Support';
import Checkout from './pages/Checkout';
import { FavoritesProvider, useFavorites } from './context/FavoritesContext';
import { MAIS_PEDIDAS, CLASSICAS, BEBIDAS, COMBOS, SOBREMESAS } from './data/products';
import AppLogo from './components/AppLogo';
import { supabase } from './lib/supabase';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { Toaster } from 'react-hot-toast';
import NotificationBell from './components/NotificationBell';
import ProductCustomizerModal from './components/ProductCustomizerModal';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminMenu from './pages/admin/AdminMenu';
import AdminSettings from './pages/admin/AdminSettings';
import AdminLogin from './pages/admin/AdminLogin';

const CATEGORIES = [
  { id: 'pizzas', name: 'Pizzas', icon: PizzaIcon },
  { id: 'bebidas', name: 'Bebidas', icon: Wine },
  { id: 'combos', name: 'Combos', icon: Sparkles },
  { id: 'sobremesas', name: 'Sobremesas', icon: IceCream },
];

const ICON_MAP: Record<string, any> = {
  'pizzas': PizzaIcon,
  'bebidas': Wine,
  'combos': Sparkles,
  'sobremesas': IceCream,
};

const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'Pizza':
    case 'PizzaIcon':
      return PizzaIcon;
    case 'Wine':
      return Wine;
    case 'Sparkles':
      return Sparkles;
    case 'IceCream':
      return IceCream;
    case 'Package':
      return Package;
    default:
      return null;
  }
};

function DeliveryApp() {
  const { user, profile, signOut } = useAuth();
  const [activeCategory, setActiveCategory] = useState('pizzas');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { addToCart, cartCount } = useCart();

  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados do Customizer Modal
  const [selectedProductForCustomization, setSelectedProductForCustomization] = useState<any | null>(null);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  
  // Status de funcionamento da loja e infos gerais
  const [storeSettings, setStoreSettings] = useState({
    store_open: true,
    delivery_time_est: '35 - 50 min',
    store_address: 'Av. Pizzaria Casarão, 1234 - Centro',
    support_whatsapp: '5511999999999'
  });
  const [storeRating, setStoreRating] = useState({ rating: 4.8, count: 42 });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [categoriesRes, productsRes] = await Promise.all([
          supabase.from('product_categories').select('*').order('id'),
          supabase.from('products').select('*').eq('is_active', true).order('name')
        ]);

        if (categoriesRes.error) throw categoriesRes.error;
        if (productsRes.error) throw productsRes.error;

        if (categoriesRes.data && categoriesRes.data.length > 0) {
          setCategories(categoriesRes.data);
        } else {
          setCategories([]);
        }

        if (productsRes.data && productsRes.data.length > 0) {
          setProducts(productsRes.data);
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error("Error loading data from Supabase, using mock fallback:", err);
        setCategories([]);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    async function loadSettings() {
      try {
        const [settingsRes, reviewsRes] = await Promise.all([
          supabase.from('system_settings').select('*'),
          supabase.from('order_reviews').select('rating')
        ]);

        if (settingsRes.data) {
          const settingsMap: any = {};
          settingsRes.data.forEach(s => {
            settingsMap[s.key] = s.value;
          });
          
          setStoreSettings({
            store_open: settingsMap['store_open'] === 'true',
            delivery_time_est: settingsMap['delivery_time_est'] || '35 - 50 min',
            store_address: settingsMap['store_address'] || 'Av. Pizzaria Casarão, 1234 - Centro',
            support_whatsapp: settingsMap['support_whatsapp'] || '5511999999999'
          });
        }

        if (reviewsRes.data && reviewsRes.data.length > 0) {
          const sum = reviewsRes.data.reduce((acc, r) => acc + Number(r.rating), 0);
          setStoreRating({
            rating: parseFloat((sum / reviewsRes.data.length).toFixed(1)),
            count: reviewsRes.data.length
          });
        }
      } catch (err) {
        console.warn('Error loading settings/reviews:', err);
      }
    }

    loadData();
    loadSettings();
  }, []);

  const displayedCategories = categories.length > 0 ? categories.map(cat => ({
    id: cat.slug,
    name: cat.name,
    icon: ICON_MAP[cat.slug] || getIconComponent(cat.icon) || PizzaIcon,
    dbId: cat.id
  })) : CATEGORIES;

  const getProductsByCategory = (categorySlug: string) => {
    if (categories.length > 0 && products.length > 0) {
      const cat = categories.find(c => c.slug === categorySlug);
      if (!cat) return [];
      return products.filter(p => p.category_id === cat.id);
    }
    if (categorySlug === 'pizzas') {
      return [...MAIS_PEDIDAS, ...CLASSICAS];
    } else if (categorySlug === 'bebidas') {
      return BEBIDAS;
    } else if (categorySlug === 'combos') {
      return COMBOS;
    } else if (categorySlug === 'sobremesas') {
      return SOBREMESAS;
    }
    return [];
  };

  const activeCategoryProducts = getProductsByCategory(activeCategory);
  const maisPedidas = activeCategory === 'pizzas' ? activeCategoryProducts.slice(0, 3) : [];
  const classicas = activeCategory === 'pizzas' ? activeCategoryProducts.slice(3) : [];

  const handleAddProduct = (product: any) => {
    const isPizza = activeCategory === 'pizzas' || product.category === 'pizzas' || product.category_id === 1;
    if (isPizza) {
      setSelectedProductForCustomization(product);
      setIsCustomizerOpen(true);
    } else {
      addToCart(product);
    }
  };

  const handleConfirmCustomization = (customOptions: any) => {
    if (selectedProductForCustomization) {
      addToCart(selectedProductForCustomization, customOptions);
    }
  };

  // Listar sabores de pizzas disponíveis para opção Meio a Meio
  const pizzaFlavorsList = products.length > 0 
    ? products.filter(p => {
        const cat = categories.find(c => c.id === p.category_id);
        return cat?.slug === 'pizzas';
      })
    : [...MAIS_PEDIDAS, ...CLASSICAS];

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
             <AppLogo />
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
              <SidebarLink icon={User} label="Minha Conta" isLink to="/profile" />
              <SidebarLink icon={History} label="Meus Pedidos" isLink to="/orders" />
              <SidebarLink icon={Heart} label="Favoritos" isLink to="/favorites" />
              <SidebarLink icon={Ticket} label="Cupons" isLink to="/coupons" />
              <SidebarLink icon={HelpCircle} label="Suporte" isLink to="/support" />
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
               <AppLogo />
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
            {user ? (
              <div className="flex items-center gap-3 pl-4 md:pl-6">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-black uppercase text-text-main leading-tight">{profile?.full_name}</p>
                  <p className="text-[10px] text-primary font-bold mt-0.5">Cliente Casarão</p>
                </div>
                <Link to="/profile" className="w-10 h-10 rounded-xl bg-surface border border-surface-border flex items-center justify-center overflow-hidden flex-shrink-0 hover:scale-105 transition-all">
                  <img src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'User')}&background=EA1D2C&color=FFFFFF&bold=true`} alt="Avatar" className="w-full h-full object-cover" />
                </Link>
              </div>
            ) : (
              <Link to="/login" className="p-2.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-full transition-all flex items-center justify-center overflow-hidden w-10 h-10 border border-surface-border">
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

        {/* Location & Store Info Bar */}
        <div className="mx-6 mt-4 p-4 glass-card border border-white/5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-[280px]">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <MapPin size={20} />
            </div>
            <div>
              <p className="text-[10px] text-text-muted uppercase font-black tracking-widest leading-none">Entregar em</p>
              <p className="font-bold text-sm text-text-main mt-1 leading-tight">
                {profile?.address 
                  ? `${profile.address}, ${profile.number} - ${profile.neighborhood}` 
                  : 'Endereço não cadastrado (Preencha em "Minha Conta")'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 ml-auto">
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
              storeSettings.store_open 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              {storeSettings.store_open ? 'Aberto' : 'Fechado'}
            </div>
            <div className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-[10px] font-black uppercase tracking-wider border border-secondary/20 flex items-center gap-1">
              <Clock size={10} /> {storeSettings.delivery_time_est}
            </div>
            {storeRating.count > 0 && (
              <div className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase tracking-wider border border-amber-500/20 flex items-center gap-1">
                ⭐ {storeRating.rating} ({storeRating.count})
              </div>
            )}
            <Link to="/profile" className="text-primary text-xs font-black uppercase tracking-widest hover:underline ml-2">
              Alterar
            </Link>
          </div>
        </div>

        {/* Loja Fechada Banner */}
        {!storeSettings.store_open && (
          <div className="mx-6 mt-4 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider rounded-2xl text-center">
            A pizzaria está fechada no momento. Você pode visualizar o cardápio, mas pedidos não podem ser finalizados.
          </div>
        )}

        {/* Inner Content */}
        <div className="flex-1 overflow-x-hidden">
          {/* Hero Section */}
          <section className="relative h-[250px] md:h-[350px] flex items-center overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent z-10" />
            <img 
              src="https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&q=80&w=1500" 
              alt="Pizzaria Casarão"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="relative z-20 px-6 md:px-12 max-w-2xl">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-display text-4xl md:text-5xl font-black mb-4 leading-tight"
              >
                O Sabor Original do <span className="text-primary text-glow">Delivery</span> na sua Casa.
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
                onClick={() => {
                  setActiveCategory('pizzas');
                  document.getElementById('cardapio-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-primary text-background px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl glow-primary"
              >
                PEÇA SUA PIZZA AGORA
              </motion.button>
            </div>
          </section>

          {/* Category Bar */}
          <section id="cardapio-section" className="sticky top-0 z-40 glass py-4 px-4 md:px-8 overflow-x-auto hide-scrollbar scroll-mt-24 border-b border-surface-border/20">
            <div className="flex gap-4">
              {displayedCategories.map((category) => (
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
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
            ) : (
              <>
                {activeCategory === 'pizzas' ? (
                  <>
                    {/* Mais Pedidas */}
                    {maisPedidas.length > 0 && (
                      <section>
                        <div className="flex justify-between items-end mb-8">
                          <h3 className="font-display text-3xl font-black flex items-center gap-3">
                            <span className="text-primary text-glow">🔥</span> Mais Pedidas
                          </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                          {maisPedidas.map((pizza) => (
                            <ProductCard key={pizza.id} pizza={pizza} onAdd={() => handleAddProduct(pizza)} />
                          ))}
                        </div>
                      </section>
                    )}

                    {/* Cardápio Completo */}
                    {classicas.length > 0 && (
                      <section>
                        <h3 className="font-display text-2xl font-black mb-8 border-b border-surface-border pb-4">
                           🍕 Cardápio Clássico
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          {classicas.map((pizza) => (
                            <ListItem key={pizza.id} pizza={pizza} onAdd={() => handleAddProduct(pizza)} />
                          ))}
                        </div>
                      </section>
                    )}
                  </>
                ) : (
                  <section>
                    <h3 className="font-display text-3xl font-black mb-8 border-b border-surface-border pb-4 flex items-center gap-3">
                       <span className="text-primary text-glow">
                         {activeCategory === 'bebidas' ? '🥤' : activeCategory === 'combos' ? '✨' : activeCategory === 'sobremesas' ? '🍨' : '🍽️'}
                       </span> {displayedCategories.find(c => c.id === activeCategory)?.name || 'Produtos'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {activeCategoryProducts.map((item) => (
                        <ProductCard key={item.id} pizza={item} onAdd={() => handleAddProduct(item)} />
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full glass z-50 flex items-center justify-around py-3 px-4">
        <MobileNavLink icon={PizzaIcon} label="Delivery" active />
        <MobileNavLink icon={History} label="Pedidos" to="/orders" />
        <MobileNavLink icon={ShoppingCart} label="Carrinho" onClick={() => setIsCartOpen(true)} />
        <MobileNavLink icon={User} label="Perfil" to="/profile" />
      </nav>

      {/* Product Customizer Modal */}
      <ProductCustomizerModal 
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        product={selectedProductForCustomization}
        onConfirm={handleConfirmCustomization}
        pizzaFlavors={pizzaFlavorsList}
      />

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

function ProductCard({ pizza, onAdd }: any) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const favorite = isFavorite(pizza.id);

  return (
    <motion.div 
      whileHover={{ y: -8 }}
      className="glass-card flex flex-col group overflow-hidden"
    >
      <div className="h-56 overflow-hidden relative">
        <img src={pizza.image || pizza.main_image_url} alt={pizza.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
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
          <span className="font-display text-2xl font-black text-secondary">R$ {Number(pizza.price).toFixed(2)}</span>
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
        {pizza.image || pizza.main_image_url ? (
          <img src={pizza.image || pizza.main_image_url} alt={pizza.name} className="w-full h-full object-cover" />
        ) : (
          (() => {
            const IconComponent = pizza.icon || PizzaIcon;
            return <IconComponent className="w-8 h-8 text-primary/20 m-auto mt-6" />;
          })()
        )}
      </div>
      <div className={`flex-1 flex flex-col justify-center ${pizza.soldOut ? 'opacity-30' : ''}`}>
        <h5 className="text-sm font-black mb-1 group-hover:text-primary transition-colors">{pizza.name}</h5>
        <p className="text-[10px] text-text-muted leading-tight mb-2 line-clamp-1">{pizza.description}</p>
        <div className="flex justify-between items-center mt-auto">
          <span className="text-sm font-black text-secondary">R$ {Number(pizza.price).toFixed(2)}</span>
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

import { AuthProvider, useAuth } from './context/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <FavoritesProvider>
        <PWAInstallPrompt />
        <Toaster 
          position="top-right" 
          toastOptions={{
            duration: 4000,
            style: {
              background: '#FFFFFF',
              color: '#1F2937',
              border: '1px solid rgba(0, 0, 0, 0.08)',
            },
            success: {
              duration: 4000,
              iconTheme: {
                primary: '#EA1D2C',
                secondary: '#FFFFFF',
              },
            },
          }}
        />
        <CartProvider>
          <Router>
            <Routes>
              <Route path="/" element={<DeliveryApp />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/orders" element={<MyOrders />} />
              
              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/menu" element={<AdminMenu />} />
              <Route path="/admin/settings" element={<AdminSettings />} />

              <Route path="/profile" element={<MyAccount />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/coupons" element={<Coupons />} />
              <Route path="/support" element={<Support />} />
              <Route path="/checkout" element={<Checkout />} />
            </Routes>
          </Router>
        </CartProvider>
      </FavoritesProvider>
    </AuthProvider>
  );
}
