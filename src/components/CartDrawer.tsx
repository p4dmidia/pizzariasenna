import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Minus, 
  Plus, 
  Trash2, 
  ShoppingCart, 
  ArrowRight,
  Ticket
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { calculateFeeForAddressObj } from '../utils/deliveryCalculator';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const [couponCode, setCouponCode] = useState('');
  const { 
    cartItems, 
    updateQuantity, 
    removeFromCart, 
    cartTotal,
    deliveryFee,
    appliedCoupon,
    discountAmount,
    applyCoupon,
    removeCoupon
  } = useCart();
  const navigate = useNavigate();

  const currentDeliveryFee = cartItems.length > 0 ? (deliveryFee || 5.00) : 0;
  const total = Math.max(0, cartTotal + currentDeliveryFee - discountAmount);

  const handleCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-surface border-l border-surface-border z-[101] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-surface-border flex items-center justify-between bg-surface/50 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <ShoppingCart size={20} />
                </div>
                <div>
                  <h2 className="font-black italic uppercase tracking-tighter">Seu Carrinho</h2>
                  <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{cartItems.length} Itens Selecionados</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-surface-hover rounded-xl transition-all text-text-muted hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
               {cartItems.length > 0 ? (
                 cartItems.map((item) => (
                   <div key={item.id} className="flex gap-4 group">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-background border border-surface-border flex-shrink-0">
                         <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                         <div className="flex justify-between items-start">
                            <div>
                               <h4 className="text-sm font-black mb-1 group-hover:text-primary transition-colors">{item.name}</h4>
                               <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">R$ {item.price.toFixed(2)} / un</p>
                            </div>
                            <button 
                              onClick={() => removeFromCart(item.id)}
                              className="text-text-muted hover:text-red-400 transition-colors"
                            >
                               <Trash2 size={16} />
                            </button>
                         </div>
                         
                         <div className="flex justify-between items-end">
                            <div className="flex items-center bg-background rounded-lg border border-surface-border p-1">
                               <button 
                                 onClick={() => updateQuantity(item.id, -1)}
                                 className="p-1 hover:text-primary transition-colors"
                               >
                                  <Minus size={14} />
                                </button>
                               <span className="px-3 text-xs font-black">{item.quantity}</span>
                               <button 
                                 onClick={() => updateQuantity(item.id, 1)}
                                 className="p-1 hover:text-primary transition-colors"
                               >
                                  <Plus size={14} />
                               </button>
                            </div>
                            <span className="text-sm font-black text-secondary">R$ {(item.price * item.quantity).toFixed(2)}</span>
                         </div>
                      </div>
                   </div>
                 ))
               ) : (
                 <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                    <ShoppingCart size={48} className="mb-4" />
                    <p className="font-bold uppercase tracking-widest text-[10px]">Carrinho vazio</p>
                 </div>
               )}
            </div>

            {/* Footer / Summary */}
            <div className="p-6 bg-surface-hover border-t border-surface-border space-y-4">
               {/* Coupon */}
               <div className="flex gap-2">
                  <div className="flex-1 relative">
                     <input 
                       type="text" 
                       placeholder="CUPOM"
                       value={couponCode}
                       onChange={(e) => setCouponCode(e.target.value)}
                       disabled={!!appliedCoupon}
                       className="w-full bg-background border border-surface-border rounded-xl py-3 px-10 text-[10px] font-black tracking-widest outline-none focus:border-primary/50 disabled:opacity-70 uppercase"
                     />
                     <Ticket className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                  </div>
                  {appliedCoupon ? (
                    <button 
                      onClick={() => {
                        removeCoupon();
                        setCouponCode('');
                      }}
                      className="px-6 bg-red-500/10 border border-red-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500/20 transition-all cursor-pointer"
                    >
                      Remover
                    </button>
                  ) : (
                    <button 
                      onClick={async () => {
                        if (couponCode.trim()) {
                          await applyCoupon(couponCode);
                        }
                      }}
                      className="px-6 bg-surface border border-surface-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:border-primary/50 transition-all cursor-pointer"
                    >
                      Aplicar
                    </button>
                  )}
               </div>

               <div className="space-y-2 pt-4">
                  <div className="flex justify-between text-xs font-bold text-text-muted uppercase tracking-widest">
                     <span>Subtotal</span>
                     <span>R$ {cartTotal.toFixed(2)}</span>
                  </div>
                  {discountAmount > 0 && (
                     <div className="flex justify-between text-xs font-bold text-emerald-400 uppercase tracking-widest">
                        <span>Desconto {appliedCoupon ? `(${appliedCoupon.code})` : ''}</span>
                        <span>- R$ {discountAmount.toFixed(2)}</span>
                      </div>
                  )}
                  <div className="flex justify-between text-xs font-bold text-text-muted uppercase tracking-widest">
                     <span>Taxa de Entrega</span>
                     <span>R$ {currentDeliveryFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-black pt-2 border-t border-white/5 italic">
                     <span>TOTAL</span>
                     <span className="text-primary text-glow">R$ {total.toFixed(2)}</span>
                  </div>
               </div>

               <button 
                disabled={cartItems.length === 0}
                onClick={handleCheckout}
                className="w-full bg-primary disabled:opacity-50 disabled:cursor-not-allowed text-background py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl glow-primary hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4"
               >
                  Finalizar Pedido <ArrowRight size={18} />
               </button>
               
               <p className="text-[8px] text-center text-text-muted font-bold uppercase tracking-widest">
                  Ao finalizar você concorda com nossos termos
               </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

