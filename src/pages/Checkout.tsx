import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  MapPin, 
  CreditCard, 
  QrCode, 
  Banknote, 
  ChevronRight, 
  CheckCircle2, 
  ShoppingCart,
  Clock,
  ShieldCheck,
  Plus,
  Wallet,
  Truck
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

import logoImg from '../assets/logo-casarao.jpeg';

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, cartTotal, clearCart } = useCart();
  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const deliveryFee = cartItems.length > 0 ? 5.00 : 0;
  const total = cartTotal + deliveryFee;

  const handleFinish = () => {
    setIsProcessing(true);
    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      clearCart();
    }, 2000);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card max-w-md w-full p-12 text-center"
        >
          <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-8 relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <CheckCircle2 size={64} className="text-primary" />
            </motion.div>
            <motion.div 
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute inset-0 rounded-full bg-primary/10 -z-10"
            />
          </div>
          
          <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-4 text-glow">Pedido Confirmado!</h2>
          <p className="text-text-muted text-sm mb-8">
            Sua pizza já está sendo preparada com muito carinho e chegará em breve.
          </p>
          
          <div className="bg-surface/50 border border-surface-border rounded-2xl p-6 mb-8 text-left space-y-4">
             <div className="flex items-center gap-3">
                <Clock className="text-primary" size={20} />
                <div>
                   <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">Tempo Estimado</p>
                   <p className="text-sm font-bold">30 - 45 minutos</p>
                </div>
             </div>
             <div className="flex items-center gap-3">
                <MapPin className="text-primary" size={20} />
                <div>
                   <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">Endereço de Entrega</p>
                   <p className="text-sm font-bold truncate max-w-[200px]">Rua das Pizzas, 123 - Centro</p>
                </div>
             </div>
          </div>

          <Link 
            to="/" 
            className="block w-full bg-primary text-background py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl glow-primary hover:scale-[1.02] transition-all"
          >
            VOLTAR PARA O MENU
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text-main pb-12">
      {/* Header */}
      <header className="glass h-20 flex items-center px-6 md:px-12 sticky top-0 z-50 justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2.5 bg-surface border border-surface-border rounded-xl text-text-muted hover:text-white transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <img src={logoImg} alt="Casarão Clube 7" className="h-10 w-auto object-contain" />
        </div>
        <h1 className="text-xl font-black italic uppercase tracking-tighter hidden sm:block">Checkout</h1>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Forms */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Step 1: Delivery Address */}
          <section className="glass-card p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <MapPin size={20} />
                </div>
                <h3 className="text-lg font-black italic uppercase tracking-tighter">Endereço de Entrega</h3>
              </div>
              <button className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">
                Alterar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-center gap-4 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full -mr-4 -mt-4 transition-all group-hover:scale-150" />
                  <div className="w-10 h-10 rounded-full bg-primary text-background flex items-center justify-center flex-shrink-0">
                     <MapPin size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                     <p className="font-bold text-sm">Principal</p>
                     <p className="text-[10px] text-text-muted truncate uppercase tracking-widest">Rua das Pizzas, 123 - Centro</p>
                  </div>
                  <CheckCircle2 className="text-primary" size={20} />
               </div>

               <button className="p-4 rounded-2xl border border-surface-border border-dashed flex items-center justify-center gap-3 text-text-muted hover:text-primary hover:border-primary transition-all">
                  <Plus size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Novo Endereço</span>
               </button>
            </div>
          </section>

          {/* Step 2: Payment Method */}
          <section className="glass-card p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                <CreditCard size={20} />
              </div>
              <h3 className="text-lg font-black italic uppercase tracking-tighter">Forma de Pagamento</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              <PaymentOption 
                icon={QrCode} 
                label="PIX" 
                selected={paymentMethod === 'pix'} 
                onClick={() => setPaymentMethod('pix')} 
                highlight
              />
              <PaymentOption 
                icon={Wallet} 
                label="Carteira" 
                selected={paymentMethod === 'wallet'} 
                onClick={() => setPaymentMethod('wallet')} 
                badge="Bônus"
              />
              <PaymentOption 
                icon={CreditCard} 
                label="Cartão" 
                selected={paymentMethod === 'card'} 
                onClick={() => setPaymentMethod('card')} 
              />
              <PaymentOption 
                icon={Banknote} 
                label="Dinheiro" 
                selected={paymentMethod === 'cash'} 
                onClick={() => setPaymentMethod('cash')} 
              />
              <PaymentOption 
                icon={Truck} 
                label="Entrega" 
                selected={paymentMethod === 'delivery'} 
                onClick={() => setPaymentMethod('delivery')} 
              />
            </div>

            {paymentMethod === 'wallet' && (
               <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-6 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between"
               >
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Wallet size={24} />
                     </div>
                     <div>
                        <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">Saldo Disponível</p>
                        <p className="text-xl font-black text-primary">R$ 1.240,50</p>
                     </div>
                  </div>
                  <div className="text-right">
                     <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">Valor do Pedido</p>
                     <p className="text-lg font-black text-white">R$ {total.toFixed(2)}</p>
                  </div>
               </motion.div>
            )}

            {paymentMethod === 'delivery' && (
               <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 p-6 rounded-2xl bg-amber-500/5 border border-amber-500/20"
               >
                  <p className="text-sm font-bold text-amber-500 mb-2 flex items-center gap-2">
                     <Truck size={18} /> Pagamento na Entrega
                  </p>
                  <p className="text-[10px] text-text-muted uppercase font-black tracking-widest leading-relaxed">
                     O entregador levará a máquina de cartão ou troco para dinheiro conforme solicitado. Por favor, informe no campo de observações se precisar de troco.
                  </p>
               </motion.div>
            )}

            {paymentMethod === 'card' && (
               <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-8 space-y-4 overflow-hidden"
               >
                  <input 
                    type="text" 
                    placeholder="NÚMERO DO CARTÃO" 
                    className="w-full bg-background border border-surface-border rounded-xl py-4 px-6 text-xs font-black tracking-widest outline-none focus:border-primary/50" 
                  />
                  <div className="grid grid-cols-2 gap-4">
                     <input type="text" placeholder="MM/AA" className="w-full bg-background border border-surface-border rounded-xl py-4 px-6 text-xs font-black tracking-widest outline-none focus:border-primary/50" />
                     <input type="text" placeholder="CVV" className="w-full bg-background border border-surface-border rounded-xl py-4 px-6 text-xs font-black tracking-widest outline-none focus:border-primary/50" />
                  </div>
               </motion.div>
            )}
          </section>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-5">
           <div className="glass-card p-8 sticky top-32">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <ShoppingCart size={20} />
                </div>
                <h3 className="text-lg font-black italic uppercase tracking-tighter">Resumo do Pedido</h3>
              </div>

              <div className="space-y-4 mb-8 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-background border border-surface-border flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black truncate">{item.name}</p>
                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{item.quantity}x R$ {item.price.toFixed(2)}</p>
                      </div>
                    </div>
                    <span className="text-xs font-black">R$ {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-6 border-t border-surface-border">
                <div className="flex justify-between text-xs font-bold text-text-muted uppercase tracking-widest">
                  <span>Subtotal</span>
                  <span>R$ {cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-text-muted uppercase tracking-widest">
                  <span>Taxa de Entrega</span>
                  <span>R$ {deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-2xl font-black pt-4 border-t border-white/5 italic">
                  <span>TOTAL</span>
                  <span className="text-primary text-glow">R$ {total.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                 <div className="flex items-center gap-2 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-emerald-500">
                    <ShieldCheck size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Pagamento Seguro</span>
                 </div>

                 <button 
                  disabled={!paymentMethod || isProcessing || cartItems.length === 0}
                  onClick={handleFinish}
                  className="w-full bg-primary disabled:opacity-50 disabled:cursor-not-allowed text-background py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl glow-primary hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                 >
                    {isProcessing ? (
                       <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
                    ) : (
                       <>FINALIZAR E PAGAR <ChevronRight size={18} /></>
                    )}
                 </button>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
}

function PaymentOption({ icon: Icon, label, selected, onClick, highlight = false, badge = "" }: any) {
  return (
    <button 
      onClick={onClick}
      className={`p-4 sm:p-6 rounded-2xl border transition-all flex flex-col items-center justify-center gap-3 relative overflow-hidden ${
        selected 
          ? 'bg-primary/10 border-primary shadow-lg' 
          : 'bg-surface border-surface-border hover:border-white/20'
      }`}
    >
      {badge && (
         <div className="absolute top-2 -right-6 bg-primary text-background text-[8px] font-black uppercase px-6 py-1 rotate-45 shadow-lg">
            {badge}
         </div>
      )}
      <div className={`p-3 rounded-xl ${selected ? 'bg-primary text-background' : 'bg-background text-text-muted'}`}>
         <Icon size={24} />
      </div>
      <span className={`text-[10px] font-black uppercase tracking-widest text-center ${selected ? 'text-primary' : 'text-text-muted'}`}>
         {label}
         {highlight && <span className="block text-[8px] text-emerald-500 mt-1 whitespace-nowrap">Recomendado</span>}
      </span>
    </button>
  );
}
