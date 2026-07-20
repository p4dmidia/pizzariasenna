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
  MessageSquare,
  LayoutDashboard,
  Users,
  Wallet,
  PieChart,
  Settings,
  LogOut
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
    question: 'Quais as formas de pagamento aceitas?',
    answer: 'Aceitamos PIX direto pelo app, Cartão de Crédito e Débito (Online ou na entrega) e Dinheiro.'
  },
  {
    question: 'Posso agendar um pedido?',
    answer: 'Sim! No momento do checkout, você pode escolher entre "Entrega Imediata" ou "Agendar" para um horário específico do dia.'
  }
];

import AppLogo from '../components/AppLogo';
import NotificationBell from '../components/NotificationBell';
import UserHeader from '../components/UserHeader';

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
    <div className="min-h-screen bg-background text-text-main font-sans flex flex-col">
      <UserHeader />

      {/* Main Content */}
      <main className="flex-1 min-h-screen flex flex-col w-full max-w-[1400px] mx-auto px-2 sm:px-4">
        {/* Inner Content */}
        <div className="flex-1 p-6 md:p-12 max-w-5xl mx-auto w-full overflow-x-hidden">
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
