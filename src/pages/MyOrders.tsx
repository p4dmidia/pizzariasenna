import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  History, 
  Heart, 
  Ticket, 
  HelpCircle, 
  ChevronRight, 
  ArrowLeft, 
  Loader2, 
  ShoppingCart,
  Star,
  MessageSquare,
  Clock,
  CheckCircle2,
  XCircle,
  Truck,
  ArrowRight,
  LogOut,
  X,
  MapPin,
  Search,
  Menu
} from 'lucide-react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import AppLogo from '../components/AppLogo';
import CartDrawer from '../components/CartDrawer';
import NotificationBell from '../components/NotificationBell';
import UserHeader from '../components/UserHeader';

export default function MyOrders() {
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const { addToCart, cartCount } = useCart();
  const navigate = useNavigate();

  // Estados para modal de avaliação
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [existingReviews, setExistingReviews] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (profile?.id) {
      fetchOrders();
    }
  }, [profile]);

  const fetchOrders = async () => {
    try {
      setLoadingOrders(true);
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            price,
            product_id,
            customizations,
            products (name, main_image_url)
          )
        `)
        .eq('user_id', profile?.id)
        .order('id', { ascending: false });

      if (error) throw error;
      setOrders(ordersData || []);

      if (ordersData && ordersData.length > 0) {
        const orderIds = ordersData.map(o => o.id);
        const { data: reviewsData } = await supabase
          .from('order_reviews')
          .select('order_id')
          .in('order_id', orderIds);

        const reviewedMap: Record<number, boolean> = {};
        reviewsData?.forEach(r => {
          reviewedMap[r.order_id] = true;
        });
        setExistingReviews(reviewedMap);
      }
    } catch (err: any) {
      console.error('Erro ao buscar pedidos:', err);
      toast.error('Não foi possível carregar seu histórico de pedidos.');
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleOpenReviewModal = (orderId: number) => {
    setSelectedOrderId(orderId);
    setRating(5);
    setComment('');
    setIsReviewModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedOrderId || !profile?.id) return;
    try {
      setSubmittingReview(true);
      
      const { error } = await supabase
        .from('order_reviews')
        .insert({
          order_id: selectedOrderId,
          user_id: profile.id,
          rating,
          comment: comment.trim()
        });

      if (error) throw error;

      toast.success('Avaliação enviada com sucesso! Obrigado pelo feedback.');
      setExistingReviews(prev => ({ ...prev, [selectedOrderId]: true }));
      setIsReviewModalOpen(false);
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao enviar avaliação.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleReorder = (order: any) => {
    try {
      let items: any[] = [];
      
      if (order.order_items && order.order_items.length > 0) {
        items = order.order_items.map((item: any) => ({
          id: item.product_id,
          name: item.products?.name || 'Pizza',
          price: Number(item.price),
          quantity: item.quantity,
          image: item.products?.main_image_url || '',
          ...item.customizations
        }));
      } else {
        const savedItems = localStorage.getItem(`order_items_${order.id}`);
        if (!savedItems) {
          toast.error('Não foi possível recuperar os itens deste pedido para reordenar.');
          return;
        }
        items = JSON.parse(savedItems);
      }

      if (items && Array.isArray(items)) {
        items.forEach(item => {
          addToCart(item, {
            size: item.size,
            border: item.border,
            halfAndHalf: item.halfAndHalf,
            extras: item.extras,
            observation: item.observation,
            quantity: item.quantity
          });
        });
        toast.success('Itens adicionados ao seu carrinho!');
        navigate('/');
      }
    } catch (err) {
      console.error(err);
      toast.error('Erro ao reordenar itens.');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-text-muted font-black uppercase tracking-widest text-xs">Carregando Perfil...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return (
          <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase tracking-wider border border-amber-500/20">
            <Clock size={12} /> Pendente
          </span>
        );
      case 'preparando':
        return (
          <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider border border-primary/20">
            <Loader2 className="w-3 h-3 animate-spin text-primary" /> Na Cozinha
          </span>
        );
      case 'entrega':
        return (
          <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-secondary/10 text-secondary text-[10px] font-black uppercase tracking-wider border border-secondary/20">
            <Truck size={12} /> Em Rota
          </span>
        );
      case 'concluido':
        return (
          <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/20">
            <CheckCircle2 size={12} /> Concluído
          </span>
        );
      case 'cancelado':
        return (
          <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-500/10 text-red-400 text-[10px] font-black uppercase tracking-wider border border-red-500/20">
            <XCircle size={12} /> Cancelado
          </span>
        );
      default:
        return (
          <span className="px-3.5 py-1.5 rounded-full bg-surface-border text-text-muted text-[10px] font-black uppercase tracking-wider">
            {status}
          </span>
        );
    }
  };

  const getOrderItemsList = (order: any) => {
    if (order.order_items && order.order_items.length > 0) {
      return order.order_items.map((item: any) => `${item.quantity}x ${item.products?.name || 'Pizza'}`).join(', ');
    }
    try {
      const savedItems = localStorage.getItem(`order_items_${order.id}`);
      if (savedItems) {
        const items = JSON.parse(savedItems);
        return items.map((item: any) => `${item.quantity}x ${item.name}`).join(', ');
      }
    } catch (e) {
      // Ignorar erro
    }
    return 'Ver detalhes no WhatsApp';
  };

  return (
    <div className="min-h-screen bg-background text-text-main font-sans flex flex-col">
      <UserHeader />

      {/* Main Content */}
      <main className="flex-1 min-h-screen flex flex-col w-full max-w-[1400px] mx-auto px-2 sm:px-4">
        {/* Inner Content */}
        <div className="flex-1 p-6 md:p-12 max-w-5xl mx-auto w-full overflow-x-hidden">
          <div className="flex items-center gap-4 mb-8">
            <button onClick={() => navigate('/')} className="p-2 hover:bg-surface rounded-xl transition-all text-text-muted hover:text-primary">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-3xl font-black italic">Meus Pedidos</h1>
          </div>

          {loadingOrders ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="glass-card p-12 text-center flex flex-col items-center justify-center gap-4 border-white/5 py-20">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 animate-bounce">
                <ShoppingCart size={36} />
              </div>
              <h3 className="text-xl font-black">Nenhum pedido realizado</h3>
              <p className="text-text-muted text-sm max-w-sm">Você ainda não fez nenhum pedido no nosso delivery. Dê uma olhada no nosso cardápio de pizzas deliciosas!</p>
              <button 
                onClick={() => navigate('/')}
                className="mt-4 bg-primary text-background px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl glow-primary hover:scale-105 transition-all"
              >
                Ver Cardápio
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => {
                const isActive = ['pendente', 'preparando', 'entrega'].includes(order.status);
                return (
                  <motion.div 
                    key={order.id} 
                    className="glass-card p-6 border-white/5 relative overflow-hidden group hover:border-white/10 transition-all"
                    whileHover={{ y: -2 }}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                      <div>
                        <span className="text-xs text-text-muted font-bold block mb-1">
                          Pedido #{order.id} • {new Date(order.created_at).toLocaleDateString('pt-BR')}
                        </span>
                        <h3 className="text-lg font-black group-hover:text-primary transition-colors">
                          {getOrderItemsList(order)}
                        </h3>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(order.status)}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-surface-border/50 pt-4 mt-4">
                      <div>
                        <span className="text-[10px] text-text-muted uppercase font-bold block">Total</span>
                        <span className="text-lg font-black text-secondary">R$ {Number(order.total_amount).toFixed(2)}</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {isActive && (
                          <button 
                            onClick={() => navigate(`/checkout?status=success&order_id=${order.id}`)}
                            className="px-5 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-bold text-xs uppercase tracking-wider border border-primary/20 transition-all flex items-center gap-1.5"
                          >
                            Rastrear <ArrowRight size={14} />
                          </button>
                        )}

                        {order.status === 'concluido' && (
                          <>
                            {existingReviews[order.id] ? (
                              <span className="px-5 py-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl font-bold text-xs uppercase tracking-wider border border-emerald-500/20 flex items-center gap-1.5">
                                Avaliado <CheckCircle2 size={14} />
                              </span>
                            ) : (
                              <button 
                                onClick={() => handleOpenReviewModal(order.id)}
                                className="px-5 py-2.5 bg-secondary/10 hover:bg-secondary/20 text-secondary rounded-xl font-bold text-xs uppercase tracking-wider border border-secondary/20 transition-all flex items-center gap-1.5"
                              >
                                Avaliar <Star size={14} />
                              </button>
                            )}
                          </>
                        )}

                        <button 
                          onClick={() => handleReorder(order)}
                          className="px-5 py-2.5 bg-surface hover:bg-surface-hover text-text-muted hover:text-white rounded-xl font-bold text-xs uppercase tracking-wider border border-surface-border transition-all"
                        >
                          Repetir Pedido
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Modal de Avaliação de Pedido */}
      <AnimatePresence>
        {isReviewModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-surface border border-surface-border p-8 rounded-[2.5rem] relative shadow-2xl overflow-hidden"
            >
              <button 
                onClick={() => setIsReviewModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-xl text-text-muted hover:text-white hover:bg-surface-hover transition-all"
              >
                <X size={18} />
              </button>

              <h2 className="text-2xl font-black italic mb-2">Avaliar Pedido</h2>
              <p className="text-text-muted text-xs uppercase font-bold tracking-widest mb-6">
                Como foi sua experiência com o pedido #{selectedOrderId}?
              </p>

              <div className="space-y-6">
                {/* Seleção de Estrelas */}
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button 
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-125 transition-transform"
                    >
                      <Star 
                        size={36} 
                        className={star <= rating ? 'text-amber-400 fill-amber-400' : 'text-surface-border'} 
                      />
                    </button>
                  ))}
                </div>

                {/* Comentário */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-text-muted ml-1">Deixe um Comentário</label>
                  <textarea 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Conte o que achou da pizza e da entrega..."
                    rows={4}
                    className="w-full bg-background border border-surface-border rounded-2xl py-4 px-6 outline-none focus:border-primary/50 transition-all text-sm font-bold text-white resize-none"
                  />
                </div>

                <button 
                  onClick={handleSubmitReview}
                  disabled={submittingReview}
                  className="w-full py-4 bg-primary text-background rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 glow-primary shadow-xl disabled:opacity-50"
                >
                  {submittingReview ? (
                    <>Enviando... <Loader2 className="animate-spin" size={18} /></>
                  ) : (
                    <>Enviar Avaliação <ChevronRight size={18} /></>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
