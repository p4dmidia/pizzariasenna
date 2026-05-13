import { 
  TrendingUp,
  Wallet,
  ShoppingCart,
  Percent,
  Zap,
  ArrowRight,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  Menu,
  X,
  User,
  Users,
  Target,
  Award
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const FEATURES = [
  {
    icon: ShoppingCart,
    title: "Delivery Inteligente",
    description: "Peça suas pizzas favoritas com rapidez e receba cashback real em cada compra.",
    color: "primary"
  },
  {
    icon: TrendingUp,
    title: "MMN de Consumo",
    description: "Construa uma rede sólida baseada no consumo real de produtos de alta demanda.",
    color: "secondary"
  },
  {
    icon: Percent,
    title: "Bônus Recorrente",
    description: "Receba comissões mensais sobre as ativações e pedidos da sua rede.",
    color: "primary"
  },
  {
    icon: Wallet,
    title: "Saques via PIX",
    description: "Seus ganhos caem na conta com agilidade e total transparência.",
    color: "secondary"
  }
];

const STEPS = [
  {
    title: "1. Cadastro Inteligente",
    description: "Crie sua conta em segundos e escolha seu perfil. Como cliente, você já começa economizando com cashback em cada pedido de pizza.",
    icon: User
  },
  {
    title: "2. Consumo & Experiência",
    description: "Peça suas pizzas favoritas no Casarão Delivery. A cada mordida, uma porcentagem do valor volta direto para sua carteira digital.",
    icon: ShoppingCart
  },
  {
    title: "3. Expansão de Rede",
    description: "Compartilhe seu link exclusivo com amigos e familiares. Quando eles pedirem pizza, você ganha comissões sobre o consumo deles.",
    icon: TrendingUp
  },
  {
    title: "4. Liberdade Financeira",
    description: "Acompanhe seus ganhos crescendo em tempo real. Saque via PIX ou use para pagar seus próprios pedidos. Sua rede é seu patrimônio.",
    icon: Wallet
  }
];

const PLANS = [
  {
    name: "Cliente",
    price: "Grátis",
    description: "Para quem ama pizza e quer economizar no dia a dia.",
    features: [
      "Cashback em todos os pedidos",
      "Acesso ao Delivery Premium",
      "Cupons de desconto exclusivos",
      "Sem taxa de adesão",
      "Participação em sorteios"
    ],
    cta: "Começar Agora",
    popular: false
  },
  {
    name: "Empreendedor",
    price: "49,90",
    period: "/mês",
    description: "Para quem busca uma renda extra sólida indicando amigos.",
    features: [
      "Tudo do plano Cliente",
      "Ganhos sobre rede até 3º nível",
      "Painel de controle de rede",
      "Suporte via WhatsApp 24h",
      "Material de marketing pronto",
      "Bônus de indicação direta"
    ],
    cta: "Ser Empreendedor",
    popular: true
  },
  {
    name: "Visionário",
    price: "97,00",
    period: "/mês",
    description: "Para líderes que buscam a independência financeira total.",
    features: [
      "Tudo do plano Empreendedor",
      "Ganhos sobre rede até 7º nível",
      "Bônus de Liderança Global",
      "Mentoria exclusiva com fundadores",
      "Eventos presenciais VIP",
      "Participação nos lucros da empresa",
      "Prioridade em novos lançamentos"
    ],
    cta: "Ser Visionário",
    popular: false
  }
];

import logoImg from '../assets/logo-casarao.jpeg';

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-text-main font-sans selection:bg-primary selection:text-background">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass h-20 flex items-center px-6 md:px-12 justify-between">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3">
             <img src={logoImg} alt="Casarão Clube 7" className="h-12 w-auto object-contain" />
          </Link>
        </div>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center gap-8">
          <Link to="/" className="text-sm font-bold hover:text-primary transition-colors">Delivery</Link>
          <a href="#como-funciona" className="text-sm font-bold hover:text-primary transition-colors">Como Funciona</a>
          <a href="#planos" className="text-sm font-bold hover:text-primary transition-colors">Planos</a>
          <Link to="/login" className="bg-primary text-background px-6 py-2.5 rounded-full font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-lg glow-primary uppercase tracking-widest text-[10px]">
            ÁREA DO AFILIADO
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden text-primary">
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed inset-0 z-40 glass pt-24 px-6 lg:hidden"
        >
          <nav className="flex flex-col gap-6 text-center">
            <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-xl font-black">Delivery</Link>
            <a href="#como-funciona" onClick={() => setIsMenuOpen(false)} className="text-xl font-black">Como Funciona</a>
            <a href="#planos" onClick={() => setIsMenuOpen(false)} className="text-xl font-black">Planos</a>
            <Link to="/login" onClick={() => setIsMenuOpen(false)} className="bg-primary text-background py-4 rounded-2xl font-black uppercase tracking-widest mt-4">
              ÁREA DO AFILIADO
            </Link>
          </nav>
        </motion.div>
      )}

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full -mr-64 -mt-32" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/10 blur-[120px] rounded-full -ml-64 -mb-32" />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black tracking-widest uppercase mb-8">
              <Zap size={14} /> O Futuro do Mercado Multinível é o Consumo Real
            </div>
            <h1 className="font-display text-5xl md:text-8xl font-black mb-8 leading-[0.9]">
              Sua Pizza agora gera <span className="text-primary text-glow">Lucro Vitalício</span>.
            </h1>
            <p className="text-text-muted text-lg md:text-xl mb-10 max-w-xl leading-relaxed">
              Diferente de tudo o que você já viu, o Casarão Clube 7 remunera você pelo consumo diário. Sem produtos difíceis de vender, apenas a melhor pizza da região direto na sua rede.
            </p>
            <div className="flex flex-col sm:flex-row gap-5">
              <Link to="/register" className="bg-gradient-primary text-background px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl glow-primary flex items-center justify-center gap-2">
                Começar Agora <ArrowRight size={18} />
              </Link>
              <Link to="/" className="glass px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-surface-hover transition-all flex items-center justify-center gap-2">
                Ir para o Delivery
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            {/* Phone Mockup */}
            <div className="relative z-10 mx-auto w-[300px] h-[620px] bg-zinc-950 rounded-[3.5rem] border-8 border-zinc-900 shadow-2xl overflow-hidden p-2">
               <div className="w-full h-full rounded-[2.8rem] bg-background overflow-hidden relative border border-white/5">
                  <div className="p-6 pt-12 bg-gradient-to-b from-primary/10 to-transparent">
                     <div className="flex justify-between items-center mb-6">
                        <div>
                           <p className="text-[10px] text-text-muted uppercase font-black">Meu Saldo</p>
                           <p className="text-2xl font-black">R$ 14.280,50</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                           <Wallet size={20} />
                        </div>
                     </div>
                     <div className="space-y-4">
                        <div className="p-4 rounded-2xl bg-surface/50 border border-white/5">
                           <div className="flex justify-between text-[10px] font-black mb-2">
                              <span>BÔNUS DE REDE</span>
                              <span className="text-primary">+R$ 840,00</span>
                           </div>
                           <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full w-4/5 bg-primary" />
                           </div>
                        </div>
                     </div>
                  </div>
                  <div className="p-6">
                     <p className="text-[10px] font-black text-text-muted uppercase mb-4">Extrato Recente</p>
                     {[1,2,3].map(i => (
                       <div key={i} className="flex items-center justify-between py-3 border-b border-white/5">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center">
                                <Users size={14} className="text-primary" />
                             </div>
                             <div>
                                <p className="text-[10px] font-bold">Indicação Nível {i}</p>
                                <p className="text-[8px] text-text-muted">Consumo de Pizza G</p>
                             </div>
                          </div>
                          <p className="text-[10px] font-black text-emerald-400">+ R$ {15 * i},00</p>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
            
            {/* Floating Visuals */}
            <motion.div animate={{ x: [0, 15, 0] }} transition={{ duration: 6, repeat: Infinity }} className="absolute -left-16 top-1/4 glass p-4 rounded-2xl z-20 hidden md:block">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                     <Target size={20} />
                  </div>
                  <p className="text-xs font-bold whitespace-nowrap">Meta de Liderança: 85%</p>
               </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Como Funciona Section */}
      <section id="como-funciona" className="py-32 px-6 bg-surface/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="font-display text-4xl md:text-6xl font-black mb-6">O Ciclo da <span className="text-primary text-glow">Prosperidade</span></h2>
            <p className="text-text-muted max-w-3xl mx-auto text-lg">
              Nosso sistema foi desenhado para ser autossustentável. Ao contrário de pirâmides financeiras, aqui o ganho vem do consumo real de um produto que todo mundo ama: PIZZA.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {STEPS.map((step, index) => (
              <motion.div 
                key={index}
                whileHover={{ y: -10 }}
                className="relative p-10 rounded-[2.5rem] bg-surface/50 border border-surface-border group transition-all hover:bg-surface/80"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-8 group-hover:scale-110 transition-transform">
                  <step.icon size={32} />
                </div>
                <h4 className="text-xl font-black mb-4">{step.title}</h4>
                <p className="text-text-muted text-sm leading-relaxed">{step.description}</p>
                <div className="absolute bottom-6 right-8 text-5xl font-black text-white/5 group-hover:text-primary/10 transition-colors">
                  0{index + 1}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Planos Section */}
      <section id="planos" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="font-display text-4xl md:text-6xl font-black mb-6">Escolha o seu <span className="text-primary text-glow">Destino</span></h2>
            <p className="text-text-muted max-w-3xl mx-auto text-lg">Seja um consumidor inteligente ou um grande líder de rede. Temos o plano perfeito para você escalar seus resultados.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {PLANS.map((plan, index) => (
              <motion.div 
                key={index}
                whileHover={{ y: -5 }}
                className={`relative p-12 rounded-[3rem] flex flex-col ${
                  plan.popular 
                    ? 'bg-surface border-2 border-primary shadow-2xl glow-primary' 
                    : 'glass border border-surface-border'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-primary text-background px-8 py-2 rounded-full text-xs font-black uppercase tracking-widest">
                    RECOMENDADO
                  </div>
                )}
                <div className="mb-10">
                  <div className="flex items-center gap-3 mb-4">
                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${plan.popular ? 'bg-primary/20 text-primary' : 'bg-white/5 text-text-muted'}`}>
                        {index === 0 ? <User size={20} /> : index === 1 ? <TrendingUp size={20} /> : <Award size={20} />}
                     </div>
                     <h3 className="text-2xl font-black">{plan.name}</h3>
                  </div>
                  <p className="text-text-muted text-sm leading-relaxed">{plan.description}</p>
                </div>
                <div className="mb-10 flex items-baseline gap-1">
                  <span className="text-text-muted text-sm font-bold">R$</span>
                  <span className="text-6xl font-black">{plan.price}</span>
                  <span className="text-text-muted text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-5 mb-12 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-4 text-sm">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
                         <CheckCircle2 size={12} />
                      </div>
                      <span className="text-text-muted font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${
                  plan.popular 
                    ? 'bg-primary text-background hover:scale-105 shadow-xl' 
                    : 'glass hover:bg-surface-hover'
                }`}>
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-surface/10">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {FEATURES.map((feature, index) => (
            <div key={index} className="flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${
                feature.color === 'primary' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
              }`}>
                <feature.icon size={30} />
              </div>
              <h5 className="text-lg font-black mb-2">{feature.title}</h5>
              <p className="text-text-muted text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto glass-card p-16 text-center relative overflow-hidden border-primary/20">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/10 via-transparent to-secondary/10 opacity-50" />
          <h2 className="font-display text-5xl md:text-7xl font-black mb-8 relative z-10 leading-tight">Chegou a sua hora de <br/> <span className="text-primary text-glow italic">Fazer História</span>.</h2>
          <p className="text-text-muted mb-12 max-w-2xl mx-auto text-lg relative z-10">
            O Casarão Clube 7 é a única plataforma que une um produto real e amado com um sistema de ganhos escalável. Não deixe essa oportunidade passar.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center relative z-10">
            <Link to="/register" className="bg-primary text-background px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-2xl glow-primary">
              Cadastre-se Agora
            </Link>
            <button className="glass px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-surface-hover transition-all">
              Falar com Consultor
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-surface-border bg-background">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
               <img src={logoImg} alt="Casarão Clube 7" className="h-10 w-auto object-contain" />
            </div>
            <p className="text-sm text-text-muted max-w-sm">A maior plataforma de fidelidade e consumo recorrente do Brasil. Pizza, Ganhos e Liberdade.</p>
          </div>
          <div className="flex items-center gap-10 text-xs text-text-muted uppercase font-black tracking-widest">
            <a href="#" className="hover:text-primary transition-colors">Termos</a>
            <a href="#" className="hover:text-primary transition-colors">Privacidade</a>
            <a href="#" className="hover:text-primary transition-colors">Suporte</a>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-surface-border flex flex-col md:flex-row justify-between items-center gap-4">
           <p className="text-[10px] text-text-muted uppercase tracking-widest">© 2026 Casarão Clube 7. CNPJ: 00.000.000/0001-00</p>
           <div className="flex items-center gap-6">
              <ShieldCheck size={16} className="text-emerald-500" />
              <CheckCircle2 size={16} className="text-emerald-500" />
           </div>
        </div>
      </footer>
    </div>
  );
}
