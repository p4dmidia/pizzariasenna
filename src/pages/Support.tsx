import { motion, AnimatePresence } from 'motion/react';
import { 
  User, 
  History, 
  Heart, 
  Ticket, 
  TrendingUp, 
  HelpCircle, 
  Menu, 
  X, 
  Search, 
  ShoppingCart,
  Bell,
  MessageCircle,
  Mail,
  ChevronDown,
  ArrowLeft,
  Clock,
  Phone,
  MessageSquare
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import CartDrawer from '../components/CartDrawer';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';



const FAQ = [
  {
    question: 'Qual o prazo de entrega médio?',
    answer: 'Nossa entrega média é de 30 a 45 minutos, dependendo da sua localização e do horário do pedido. Você pode acompanhar o status em tempo real na tela "Meus Pedidos".'
  },
  {
    question: 'Como funciona o cashback do Clube 7?',
    answer: 'A cada pedido realizado, uma porcentagem do valor volta para sua carteira digital no Clube 7. Você pode usar esse saldo para pagar novos pedidos ou sacar via PIX se for um afiliado.'
  },
  {
    question: 'Quais as formas de pagamento aceitas?',
    answer: 'Aceitamos PIX direto pelo app, Cartão de Crédito e Débito (Online ou na entrega) e Dinheiro.'
  },
  {
    question: 'Posso agendar um pedido?',
    answer: 'Sim! No momento do checkout, você pode escolher entre "Entrega Imediata" ou "Agendar" para um horário específico do dia.'
  }
];

import logoImg from '../assets/logo-casarao.jpeg';
import NotificationBell from '../components/NotificationBell';

export default function Support() {
  const { user, profile, signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { cartCount } = useCart();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const navigate = useNavigate();

  const nameInitials = (profile?.full_name || 'Visitante')
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

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
                placeholder="Como podemos ajudar?"
                className="w-full bg-surface/50 border border-surface-border rounded-full py-2.5 px-12 focus:ring-2 focus:ring-primary/50 transition-all text-sm outline-none"
              />
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
           </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <Link to="/clube" className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-black uppercase hover:bg-secondary/20 transition-all">
             <TrendingUp size={14} /> Clube 7
          </Link>
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
            <div className="flex items-center gap-4 mb-8 p-4 rounded-2xl bg-primary/10 border border-primary/20 shadow-[0_0_15px_rgba(0,229,255,0.1)]">
              <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-background overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-bold text-sm">{nameInitials}</span>
                )}
              </div>
              <div>
                <p className="font-bold text-sm line-clamp-1">{profile?.full_name || 'Visitante'}</p>
                <p className="text-[10px] text-text-muted uppercase font-black tracking-widest">{profile?.plan || 'Cliente'}</p>
              </div>
            </div>

            <nav className="space-y-1">
              <SidebarLink icon={User} label="Minha Conta" isLink to="/profile" />
              <SidebarLink icon={History} label="Meus Pedidos" isLink to="/" />
              <SidebarLink icon={Heart} label="Favoritos" isLink to="/favorites" />
              <SidebarLink icon={Ticket} label="Cupons" isLink to="/coupons" />
              <SidebarLink icon={TrendingUp} label="Clube 7" isLink to="/clube" />
              <SidebarLink icon={HelpCircle} label="Suporte" active />
            </nav>

            <button 
              onClick={signOut}
              className="block w-full mt-8 bg-surface border border-surface-border text-text-muted font-black py-4 rounded-2xl text-xs uppercase tracking-widest hover:text-red-400 transition-all text-center"
            >
              SAIR DA CONTA
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-12 max-w-5xl mx-auto w-full">
           <div className="flex items-center gap-4 mb-12">
              <button onClick={() => navigate('/')} className="p-2 hover:bg-surface rounded-xl transition-all text-text-muted hover:text-primary">
                 <ArrowLeft size={20} />
              </button>
              <h1 className="text-3xl font-black italic">Suporte & Ajuda</h1>
           </div>

           <div className="grid lg:grid-cols-3 gap-8 mb-16">
              {/* WhatsApp Support */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="glass-card p-8 border-primary/20 bg-primary/5 flex flex-col items-center text-center group"
              >
                 <div className="w-16 h-16 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-all">
                    <MessageCircle size={32} />
                 </div>
                 <h3 className="text-xl font-black mb-2">WhatsApp</h3>
                 <p className="text-xs text-text-muted mb-8 leading-relaxed">Fale com um atendente humano agora mesmo.</p>
                 <button className="w-full bg-primary text-background py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg glow-primary hover:scale-105 transition-all">
                    Abrir Chat
                 </button>
              </motion.div>

              {/* Email Support */}
              <motion.div 
                whileHover={{ y: -5 }}
                className="glass-card p-8 border-secondary/20 bg-secondary/5 flex flex-col items-center text-center group"
              >
                 <div className="w-16 h-16 rounded-[2rem] bg-secondary/10 flex items-center justify-center text-secondary mb-6 group-hover:scale-110 transition-all">
                    <Mail size={32} />
                 </div>
                 <h3 className="text-xl font-black mb-2">E-mail</h3>
                 <p className="text-xs text-text-muted mb-8 leading-relaxed">Envie sua dúvida e responderemos em até 24h.</p>
                 <button className="w-full bg-secondary text-background py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-105 transition-all">
                    Enviar E-mail
                 </button>
              </motion.div>

              {/* Business Hours */}
              <div className="glass-card p-8 border-white/5 flex flex-col">
                 <div className="flex items-center gap-3 mb-6">
                    <Clock size={20} className="text-text-muted" />
                    <h3 className="text-sm font-black uppercase tracking-widest">Horários</h3>
                 </div>
                 <div className="space-y-4 flex-1">
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                       <span className="text-xs text-text-muted font-bold">Segunda a Quinta</span>
                       <span className="text-xs font-black">18h - 23h</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                       <span className="text-xs text-text-muted font-bold">Sexta a Domingo</span>
                       <span className="text-xs font-black text-primary">18h - 00h</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 mt-4">
                       <div className="flex items-center gap-3 text-emerald-400">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 glow-primary" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Aberto Agora</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           {/* FAQ Section */}
           <section className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-black italic mb-8 flex items-center gap-3">
                 <MessageSquare className="text-primary" size={24} /> Perguntas Frequentes
              </h2>
              
              <div className="space-y-4">
                 {FAQ.map((item, index) => (
                    <div key={index} className="glass-card border-white/5 overflow-hidden">
                       <button 
                         onClick={() => setOpenFaq(openFaq === index ? null : index)}
                         className="w-full p-6 flex items-center justify-between text-left hover:bg-white/5 transition-all"
                       >
                          <span className="font-bold text-sm">{item.question}</span>
                          <ChevronDown size={18} className={`text-text-muted transition-transform duration-300 ${openFaq === index ? 'rotate-180 text-primary' : ''}`} />
                       </button>
                       <AnimatePresence>
                          {openFaq === index && (
                             <motion.div 
                               initial={{ height: 0, opacity: 0 }}
                               animate={{ height: 'auto', opacity: 1 }}
                               exit={{ height: 0, opacity: 0 }}
                               transition={{ duration: 0.3 }}
                             >
                                <div className="px-6 pb-6 text-xs text-text-muted leading-relaxed border-t border-white/5 pt-4">
                                   {item.answer}
                                </div>
                             </motion.div>
                          )}
                       </AnimatePresence>
                    </div>
                 ))}
              </div>
           </section>

           {/* Quick Contact Bar */}
           <div className="mt-20 p-8 glass-card border-white/5 bg-gradient-to-r from-primary/5 to-transparent flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-6">
                 <div className="w-14 h-14 rounded-2xl bg-surface border border-surface-border flex items-center justify-center text-primary">
                    <Phone size={24} />
                 </div>
                 <div>
                    <h4 className="font-black mb-1">Precisa de algo urgente?</h4>
                    <p className="text-xs text-text-muted uppercase font-bold tracking-widest">Ligue para nossa central de atendimento</p>
                 </div>
              </div>
              <p className="text-xl font-black text-primary text-glow">(11) 4004-0000</p>
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
