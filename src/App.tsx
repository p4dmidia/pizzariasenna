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
  Clock,
  Utensils,
  ChevronRight,
  ShoppingBag
} from 'lucide-react';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import CartDrawer from './components/CartDrawer';

import { CartProvider, useCart } from './context/CartContext';
import { isStoreCurrentlyOpen } from './utils/storeHours';

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
import UserHeader from './components/UserHeader';
import heroBanner from './assets/hero-banner.jpg';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminMenu from './pages/admin/AdminMenu';
import AdminSettings from './pages/admin/AdminSettings';
import AdminLogin from './pages/admin/AdminLogin';
import AdminFinance from './pages/admin/AdminFinance';

const ALL_CATEGORY = { id: 'todos', name: 'Todos', icon: Utensils };

const CATEGORIES = [
  ALL_CATEGORY,
  { id: 'pizzas', name: 'Pizzas', icon: PizzaIcon },
  { id: 'bebidas', name: 'Bebidas', icon: Wine },
  { id: 'combos', name: 'Combos', icon: Sparkles },
  { id: 'sobremesas', name: 'Sobremesas', icon: IceCream },
];

const ICON_MAP: Record<string, any> = {
  'todos': Utensils,
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
  const [activeCategory, setActiveCategory] = useState('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { addToCart, cartCount, cartTotal } = useCart();

  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados do Customizer Modal
  const [selectedProductForCustomization, setSelectedProductForCustomization] = useState<any | null>(null);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  // Status de funcionamento da loja e infos gerais
  const [storeSettings, setStoreSettings] = useState({
    operating_mode: 'auto',
    opening_time: '18:00',
    closing_time: '23:30',
    operating_days: '[0,1,2,3,4,5,6]',
    store_open: true,
    delivery_time_est: '35 - 50 min',
    store_address: 'Av. Pizzaria Senna, 1234 - Centro',
    support_whatsapp: '5511999999999',
    lastCheckTime: Date.now()
  });
  const [storeRating, setStoreRating] = useState({ rating: 4.8, count: 42 });

  const isCurrentlyOpen = isStoreCurrentlyOpen({
    operating_mode: storeSettings.operating_mode,
    opening_time: storeSettings.opening_time,
    closing_time: storeSettings.closing_time,
    operating_days: storeSettings.operating_days,
    store_open: storeSettings.store_open
  });

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

          setStoreSettings(prev => ({
            ...prev,
            operating_mode: settingsMap['operating_mode'] || 'auto',
            opening_time: settingsMap['opening_time'] || '18:00',
            closing_time: settingsMap['closing_time'] || '23:30',
            operating_days: settingsMap['operating_days'] || '[0,1,2,3,4,5,6]',
            store_open: settingsMap['store_open'] === 'true',
            delivery_time_est: settingsMap['delivery_time_est'] || '35 - 50 min',
            store_address: settingsMap['store_address'] || 'Av. Pizzaria Senna, 1234 - Centro',
            support_whatsapp: settingsMap['support_whatsapp'] || '5511999999999',
            lastCheckTime: Date.now()
          }));
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

    // Ticker a cada 5 segundos para re-avaliar status do horário sem F5
    const timer = setInterval(() => {
      setStoreSettings(prev => ({ ...prev, lastCheckTime: Date.now() }));
    }, 5000);

    // Inscrição em tempo real no Supabase
    const channel = supabase
      .channel('public:system_settings_app')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_settings' }, () => {
        loadSettings();
      })
      .subscribe();

    return () => {
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, []);

  const displayedCategories = [
    ALL_CATEGORY,
    ...(categories.length > 0 ? categories.map(cat => ({
      id: cat.slug,
      name: cat.name,
      icon: ICON_MAP[cat.slug] || getIconComponent(cat.icon) || PizzaIcon,
      dbId: cat.id
    })) : CATEGORIES.filter(c => c.id !== 'todos'))
  ];

  const getProductsByCategory = (categorySlug: string) => {
    if (categories.length > 0 && products.length > 0) {
      if (categorySlug === 'todos') {
        const pizzaCat = categories.find(c => c.slug === 'pizzas' || c.name.toLowerCase().includes('pizza'));
        const pizzaCatId = pizzaCat ? pizzaCat.id : 1;
        return [...products].sort((a, b) => {
          const aIsPizza = a.category_id === pizzaCatId || a.category === 'pizzas';
          const bIsPizza = b.category_id === pizzaCatId || b.category === 'pizzas';
          if (aIsPizza && !bIsPizza) return -1;
          if (!aIsPizza && bIsPizza) return 1;
          return 0;
        });
      }
      const cat = categories.find(c => c.slug === categorySlug);
      if (!cat) return [];
      return products.filter(p => p.category_id === cat.id);
    }
    if (categorySlug === 'todos') {
      return [...MAIS_PEDIDAS, ...CLASSICAS, ...BEBIDAS, ...COMBOS, ...SOBREMESAS];
    } else if (categorySlug === 'pizzas') {
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

  const rawCategoryProducts = getProductsByCategory(activeCategory);
  const activeCategoryProducts = searchQuery.trim()
    ? rawCategoryProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())))
    : rawCategoryProducts;

  // Selecionar os destaques e clássicas
  const isPizzaProduct = (p: any) => p.category === 'pizzas' || p.category_id === 1 || (categories.length > 0 && categories.find(c => c.id === p.category_id)?.slug === 'pizzas');

  let maisPedidas = (activeCategory === 'pizzas' || activeCategory === 'todos')
    ? activeCategoryProducts.filter(p => isPizzaProduct(p) && p.is_featured === true)
    : [];
  let classicas = (activeCategory === 'pizzas' || activeCategory === 'todos')
    ? activeCategoryProducts.filter(p => isPizzaProduct(p) && p.is_featured !== true)
    : activeCategoryProducts;

  // Fallback caso não haja nenhum produto marcado como destaque no banco
  if ((activeCategory === 'pizzas' || activeCategory === 'todos') && maisPedidas.length === 0) {
    const pizzaProductsOnly = activeCategoryProducts.filter(p => isPizzaProduct(p));
    const source = pizzaProductsOnly.length > 0 ? pizzaProductsOnly : activeCategoryProducts;
    maisPedidas = source.slice(0, 3);
    classicas = source.slice(3);
  }

  // Seção de outras categorias para a aba "Todos"
  const otherCategorySections = displayedCategories
    .filter(cat => cat.id !== 'todos' && cat.id !== 'pizzas')
    .map(cat => {
      let catProducts: any[] = [];
      if (categories.length > 0 && products.length > 0) {
        const categoryObj = categories.find(c => c.slug === cat.id);
        if (categoryObj) {
          catProducts = products.filter(p => p.category_id === categoryObj.id);
        }
      } else {
        if (cat.id === 'bebidas') catProducts = BEBIDAS;
        else if (cat.id === 'combos') catProducts = COMBOS;
        else if (cat.id === 'sobremesas') catProducts = SOBREMESAS;
      }
      return {
        ...cat,
        products: searchQuery.trim()
          ? catProducts.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())))
          : catProducts
      };
    })
    .filter(catSection => catSection.products.length > 0);

  const handleAddProduct = (product: any) => {
    const isCustomizable = product.allow_customizations === true ||
      (product.allow_customizations !== false && (product.category === 'pizzas' || product.category_id === 1 || (categories.length > 0 && categories.find(c => c.id === product.category_id)?.slug === 'pizzas')));

    if (isCustomizable) {
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
    <div className="min-h-screen bg-background text-text-main font-sans flex flex-col">
      {/* Header com Menu Dropdown */}
      <UserHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} showSearch={true} />

      {/* Main Content (Largura Total Expandida) */}
      <main className="flex-1 min-h-screen flex flex-col w-full max-w-[1400px] mx-auto px-2 sm:px-4">
        {/* Location & Store Info Bar */}
        <div className="mx-2 sm:mx-4 mt-4 p-4 glass-card border border-white/5 flex flex-wrap items-center justify-between gap-4">
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
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${isCurrentlyOpen
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
              }`}>
              {isCurrentlyOpen ? 'Aberto' : 'Fechado'}
            </div>
            <div className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-wider border border-amber-500/20 flex items-center gap-1.5 font-bold">
              <Clock size={12} /> {storeSettings.delivery_time_est}
            </div>
            <Link to="/profile" className="text-primary text-xs font-black uppercase tracking-widest hover:underline ml-2">
              Alterar
            </Link>
          </div>
        </div>

        {/* Loja Fechada Banner */}
        {!isCurrentlyOpen && (
          <div className="mx-2 sm:mx-4 mt-4 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider rounded-2xl text-center flex items-center justify-center gap-2">
            <span>🔒</span> A pizzaria está fechada no momento ({storeSettings.opening_time} às {storeSettings.closing_time}). Você pode navegar pelo cardápio, mas novos pedidos não podem ser finalizados.
          </div>
        )}

        {/* Inner Content */}
        <div className="flex-1 overflow-x-hidden">
          {/* Hero Section */}
          <section className="relative h-[280px] sm:h-[360px] md:h-[400px] rounded-3xl mx-2 sm:mx-4 mt-4 flex items-center overflow-hidden shadow-2xl border border-surface-border/20">
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent z-10" />
            <img
              src={heroBanner}
              alt="Pizzaria Senna - Sabor Original"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            <div className="relative z-20 px-6 md:px-12 max-w-2xl">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-display text-3xl sm:text-4xl md:text-5xl font-black mb-4 leading-tight text-text-main"
              >
                Quem Ama Pizza, <span className="text-primary text-glow">Pede Senna</span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-text-muted text-sm sm:text-base md:text-lg mb-6 max-w-lg font-medium"
              >
                Desde 1997 levando pizzas irresistíveis para a mesa da sua família.
              </motion.p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setActiveCategory('todos');
                  document.getElementById('cardapio-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-primary text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl glow-primary hover:opacity-95 transition-all"
              >
                🍕 PEÇA AGORA
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
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-full transition-all whitespace-nowrap font-bold text-sm ${activeCategory === category.id
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
            ) : searchQuery.trim() ? (
              <section>
                <h3 className="font-display text-3xl font-black mb-8 border-b border-surface-border pb-4 flex items-center gap-3">
                  <span className="text-primary text-glow">🔍</span> Resultados para "{searchQuery}"
                </h3>
                {activeCategoryProducts.length === 0 ? (
                  <p className="text-text-muted text-center py-10">Nenhum produto encontrado para sua busca.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    {activeCategoryProducts.map((item) => (
                      <ResponsiveProductItem key={item.id} pizza={item} onAdd={() => handleAddProduct(item)} />
                    ))}
                  </div>
                )}
              </section>
            ) : activeCategory === 'todos' ? (
              <>
                {/* Mais Pedidas */}
                {maisPedidas.length > 0 && (
                  <section>
                    <div className="flex justify-between items-end mb-8">
                      <h3 className="font-display text-3xl font-black flex items-center gap-3">
                        <span className="text-primary text-glow">🔥</span> Mais Pedidas
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                      {maisPedidas.map((pizza) => (
                        <ResponsiveProductItem key={pizza.id} pizza={pizza} onAdd={() => handleAddProduct(pizza)} />
                      ))}
                    </div>
                  </section>
                )}

                {/* Pizzas */}
                {classicas.length > 0 && (
                  <section>
                    <h3 className="font-display text-2xl font-black mb-8 border-b border-surface-border pb-4 flex items-center gap-3">
                      <span>🍕</span> Pizzas
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                      {classicas.map((pizza) => (
                        <ResponsiveProductItem key={pizza.id} pizza={pizza} onAdd={() => handleAddProduct(pizza)} />
                      ))}
                    </div>
                  </section>
                )}

                {/* Outras Categorias (Bebidas, Combos, Sobremesas, etc.) */}
                {otherCategorySections.map((catSection) => (
                  <section key={catSection.id}>
                    <h3 className="font-display text-3xl font-black mb-8 border-b border-surface-border pb-4 flex items-center gap-3">
                      <span className="text-primary text-glow">
                        <catSection.icon size={26} />
                      </span> {catSection.name}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                      {catSection.products.map((item: any) => (
                        <ResponsiveProductItem key={item.id} pizza={item} onAdd={() => handleAddProduct(item)} />
                      ))}
                    </div>
                  </section>
                ))}
              </>
            ) : activeCategory === 'pizzas' ? (
              <>
                {/* Mais Pedidas */}
                {maisPedidas.length > 0 && (
                  <section>
                    <div className="flex justify-between items-end mb-8">
                      <h3 className="font-display text-3xl font-black flex items-center gap-3">
                        <span className="text-primary text-glow">🔥</span> Mais Pedidas
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                      {maisPedidas.map((pizza) => (
                        <ResponsiveProductItem key={pizza.id} pizza={pizza} onAdd={() => handleAddProduct(pizza)} />
                      ))}
                    </div>
                  </section>
                )}

                {/* Cardápio Clássico */}
                {classicas.length > 0 && (
                  <section>
                    <h3 className="font-display text-2xl font-black mb-8 border-b border-surface-border pb-4 flex items-center gap-3">
                      <span>🍕</span> Cardápio Clássico
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                      {classicas.map((pizza) => (
                        <ResponsiveProductItem key={pizza.id} pizza={pizza} onAdd={() => handleAddProduct(pizza)} />
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                  {activeCategoryProducts.map((item) => (
                    <ResponsiveProductItem key={item.id} pizza={item} onAdd={() => handleAddProduct(item)} />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="w-full bg-primary py-6 px-4 text-center mt-12 mb-24 md:mb-6 rounded-3xl text-white font-bold text-xs select-none shadow-xl border border-white/10 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2">
          <span>© 2026 Pizzaria Senna. Todos os direitos reservados.</span>
          <span className="hidden sm:inline">|</span>
          <span>
            Desenvolvido por{' '}
            <a 
              href="https://www.p4dmidia.com.br/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="underline hover:text-white/80 transition-colors font-black"
            >
              P4D Mídia
            </a>
          </span>
        </footer>
      </main>

      {/* Floating Bag Bar (Sacola - Mobile & Desktop Centralizada) */}
      {cartCount > 0 && (
        <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <motion.button
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-primary text-white p-3.5 px-5 rounded-2xl shadow-[0_10px_30px_rgba(234,29,44,0.45)] flex items-center justify-between font-black border border-white/20 active:scale-98 transition-all glow-primary cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-xs font-black shrink-0">
                {cartCount}
              </div>
              <div className="text-left">
                <p className="text-[10px] text-white/80 uppercase tracking-widest font-bold leading-none">Minha Sacola</p>
                <p className="text-base font-black leading-tight mt-0.5">R$ {cartTotal.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-black bg-white/20 px-3.5 py-2 rounded-xl backdrop-blur-md hover:bg-white/30 transition-all">
              <span>Ver Sacola</span>
              <ChevronRight size={16} />
            </div>
          </motion.button>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full glass z-50 flex items-center justify-around py-2.5 px-4 border-t border-surface-border/30">
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
    <div className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${active
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

function ResponsiveProductItem({ pizza, onAdd }: any) {
  return (
    <>
      <div className="block md:hidden w-full">
        <ListItem pizza={pizza} onAdd={onAdd} />
      </div>
      <div className="hidden md:block h-full w-full">
        <ProductCard pizza={pizza} onAdd={onAdd} />
      </div>
    </>
  );
}

function ProductCard({ pizza, onAdd }: any) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const favorite = isFavorite(pizza.id);

  return (
    <motion.div
      whileHover={{ y: -6 }}
      className="glass-card flex flex-col group overflow-hidden rounded-3xl h-full border border-surface-border/60 hover:border-primary/30 transition-all shadow-sm"
    >
      <div className="h-48 sm:h-52 overflow-hidden relative">
        <img src={pizza.image || pizza.main_image_url} alt={pizza.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />

        {/* Promo Badge */}
        {pizza.promo_price && (
          <div className="absolute top-3 left-3 bg-emerald-500 text-white font-black text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-xl border border-emerald-500/20 shadow-lg glow-emerald z-20">
            🏷️ Oferta
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(pizza.id);
          }}
          className={`absolute top-3 right-3 p-2.5 rounded-2xl transition-all shadow-lg backdrop-blur-md z-20 ${favorite ? 'bg-primary text-background' : 'bg-background/80 text-primary hover:bg-primary/20'
            }`}
        >
          <Heart size={18} fill={favorite ? "currentColor" : "none"} />
        </button>
      </div>
      <div className="p-5 sm:p-6 flex-1 flex flex-col">
        <h4 className="text-xl font-black mb-1 group-hover:text-primary transition-colors text-text-main">{pizza.name}</h4>

        {(pizza.serves_description || pizza.prep_time) && (
          <div className="flex items-center gap-3 text-[10px] text-text-muted font-black uppercase tracking-wider mb-2">
            {pizza.serves_description && <span>👥 {pizza.serves_description}</span>}
            {pizza.prep_time && <span>⏱️ {pizza.prep_time} MIN</span>}
          </div>
        )}

        <p className="text-xs text-text-muted line-clamp-2 mb-6 flex-1 font-medium">{pizza.description}</p>
        <div className="flex justify-between items-center mt-auto pt-2">
          <div className="flex flex-col">
            {pizza.promo_price ? (
              <>
                <span className="text-[10px] text-text-muted line-through font-bold">R$ {Number(pizza.price).toFixed(2)}</span>
                <span className="font-display text-2xl font-black text-secondary">R$ {Number(pizza.promo_price).toFixed(2)}</span>
              </>
            ) : (
              <span className="font-display text-2xl font-black text-secondary">R$ {Number(pizza.price).toFixed(2)}</span>
            )}
          </div>
          <button
            onClick={onAdd}
            className="bg-primary text-white p-3 rounded-2xl hover:scale-110 active:scale-95 transition-all shadow-lg glow-primary"
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
    <div className="glass-card p-3.5 sm:p-4 rounded-3xl flex items-center gap-3.5 relative group hover:border-primary/30 transition-all shadow-sm w-full">
      {pizza.soldOut && (
        <div className="absolute top-2 right-2 bg-secondary text-background text-[8px] px-2 py-0.5 rounded-full font-black z-10 uppercase">
          Esgotado
        </div>
      )}

      {/* Promo Badge for ListItem */}
      {pizza.promo_price && !pizza.soldOut && (
        <div className="absolute -top-2 left-3 bg-emerald-500 text-white font-black text-[8px] uppercase tracking-widest px-2.5 py-0.5 rounded-md shadow-md z-20">
          OFERTA
        </div>
      )}

      {/* Circular Image Thumbnail */}
      <div className={`w-20 h-20 sm:w-22 sm:h-22 rounded-full overflow-hidden shrink-0 bg-surface border border-surface-border/60 shadow-md ${pizza.soldOut ? 'grayscale opacity-30' : ''}`}>
        {pizza.image || pizza.main_image_url ? (
          <img src={pizza.image || pizza.main_image_url} alt={pizza.name} className="w-full h-full object-cover" />
        ) : (
          (() => {
            const IconComponent = pizza.icon || PizzaIcon;
            return <IconComponent className="w-8 h-8 text-primary/20 m-auto mt-6" />;
          })()
        )}
      </div>

      {/* Product Information */}
      <div className={`flex-1 min-w-0 flex flex-col justify-center pr-6 ${pizza.soldOut ? 'opacity-30' : ''}`}>
        <h5 className="text-sm sm:text-base font-black mb-0.5 group-hover:text-primary transition-colors text-text-main truncate">{pizza.name}</h5>

        {(pizza.serves_description || pizza.prep_time) && (
          <div className="flex items-center gap-2 text-[9px] text-text-muted font-black uppercase tracking-wider mb-1 leading-tight">
            {pizza.serves_description && <span>👥 {pizza.serves_description}</span>}
            {pizza.prep_time && <span>⏱️ {pizza.prep_time} MIN</span>}
          </div>
        )}

        <p className="text-[11px] text-text-muted leading-tight mb-2 line-clamp-1 font-medium">{pizza.description}</p>
        
        <div className="flex justify-between items-center mt-auto">
          <div className="flex items-baseline gap-2">
            {pizza.promo_price ? (
              <>
                <span className="text-[10px] text-text-muted line-through font-bold">R$ {Number(pizza.price).toFixed(2)}</span>
                <span className="text-base font-black text-secondary">R$ {Number(pizza.promo_price).toFixed(2)}</span>
              </>
            ) : (
              <span className="text-base font-black text-secondary">R$ {Number(pizza.price).toFixed(2)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Favorite Button (Top Right) */}
      {!pizza.soldOut && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleFavorite(pizza.id);
          }}
          className={`absolute top-3 right-3 p-1 rounded-full transition-all z-20 ${favorite ? 'text-primary' : 'text-text-muted/60 hover:text-primary'}`}
          title="Favoritar"
        >
          <Heart size={16} fill={favorite ? "currentColor" : "none"} />
        </button>
      )}

      {/* Add Button (Bottom Right) */}
      {!pizza.soldOut && (
        <button
          onClick={onAdd}
          className="absolute bottom-3 right-3 p-1 text-primary hover:scale-125 transition-all z-20"
          title="Adicionar"
        >
          <PlusCircle size={24} className="text-primary" />
        </button>
      )}
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
              <Route path="/admin/finance" element={<AdminFinance />} />

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
