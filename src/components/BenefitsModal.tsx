import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Zap, Award, ShoppingCart } from 'lucide-react';

interface BenefitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan?: string;
}

export default function BenefitsModal({ isOpen, onClose, currentPlan = 'cliente' }: BenefitsModalProps) {
  const normalizedPlan = currentPlan?.toLowerCase() || 'cliente';

  const plansList = [
    {
      id: 'cliente',
      name: 'Cliente',
      price: 'Grátis',
      description: 'Ideal para quem quer economizar nos pedidos do dia a dia.',
      icon: ShoppingCart,
      colorClass: 'text-text-muted',
      bgGlow: 'hover:border-white/10',
      badgeBg: 'bg-white/10 text-white',
      features: [
        'Cashback de 10% em todos os pedidos',
        'Acesso ao Delivery Premium',
        'Cupons de desconto exclusivos',
        'Participação automática em sorteios',
        'Sem taxa de adesão ou mensalidade',
      ]
    },
    {
      id: 'empreendedor',
      name: 'Empreendedor',
      price: 'R$ 49,90/mês',
      description: 'Para quem busca uma renda extra sólida indicando amigos.',
      icon: Zap,
      colorClass: 'text-primary',
      bgGlow: 'hover:border-primary/30 hover:shadow-[0_0_25px_rgba(0,229,255,0.15)]',
      badgeBg: 'bg-primary/20 text-primary',
      features: [
        'Tudo do plano Cliente',
        'Comissões sobre rede até o 3º nível',
        'Painel exclusivo de controle de rede',
        'Bônus de indicação direta (R$ 10,00)',
        'Suporte prioritário via WhatsApp 24h',
        'Materiais e banners de marketing inclusos',
      ]
    },
    {
      id: 'visionario',
      name: 'Visionário',
      price: 'R$ 97,00/mês',
      description: 'Para líderes focados na independência financeira completa.',
      icon: Award,
      colorClass: 'text-secondary',
      bgGlow: 'hover:border-secondary/30 hover:shadow-[0_0_25px_rgba(255,184,0,0.15)]',
      badgeBg: 'bg-secondary/20 text-secondary',
      features: [
        'Tudo do plano Empreendedor',
        'Comissões expandidas até o 7º nível',
        'Bônus de Liderança Global',
        'Mentoria direta com os fundadores',
        'Acesso a eventos e reuniões VIP presenciais',
        'Participação na divisão de lucros semestral',
        'Prioridade máxima em novos recursos',
      ]
    }
  ];

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
            className="fixed inset-0 bg-background/80 backdrop-blur-md z-[100]"
          />

          {/* Modal Container */}
          <div
            onClick={onClose}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-5xl bg-surface border border-surface-border rounded-3xl shadow-2xl p-6 md:p-8 my-8 overflow-hidden"
            >
              {/* Decorative light rays */}
              <div className="absolute -top-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 bg-surface-hover hover:bg-white/10 text-text-muted hover:text-white rounded-xl transition-all z-50"
              >
                <X size={20} />
              </button>

              {/* Header */}
              <div className="text-center mb-8 md:mb-12 relative">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Clube de Vantagens</p>
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-2">
                  Benefícios & Planos
                </h2>
                <p className="text-sm text-text-muted max-w-lg mx-auto">
                  Compare as vantagens exclusivas de cada plano e descubra o potencial de alavancagem para o seu negócio.
                </p>
              </div>

              {/* Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                {plansList.map((plan) => {
                  const isCurrent = normalizedPlan === plan.id;
                  const Icon = plan.icon;
                  
                  const planRank: Record<string, number> = {
                    cliente: 1,
                    empreendedor: 2,
                    visionario: 3
                  };
                  
                  const currentRank = planRank[normalizedPlan] || 1;
                  const targetRank = planRank[plan.id] || 1;
                  const isDowngrade = targetRank < currentRank;

                  return (
                    <div
                      key={plan.id}
                      className={`relative flex flex-col p-6 rounded-3xl border transition-all duration-300 ${isCurrent
                          ? plan.id === 'visionario'
                            ? 'border-secondary bg-surface/85 shadow-[0_0_30px_rgba(255,184,0,0.2)] scale-[1.02] z-10'
                            : 'border-primary bg-surface/85 shadow-[0_0_30px_rgba(0,229,255,0.2)] scale-[1.02] z-10'
                          : 'border-surface-border bg-surface/40 ' + plan.bgGlow
                        }`}
                    >
                      {/* Current Plan Badge */}
                      {isCurrent && (
                        <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${plan.id === 'visionario' ? 'bg-secondary text-background glow-secondary' : 'bg-primary text-background glow-primary'
                          }`}>
                          Seu Plano Atual
                        </div>
                      )}

                      {/* Plan Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2.5 rounded-xl ${isCurrent ? (plan.id === 'visionario' ? 'bg-secondary/20' : 'bg-primary/20') : 'bg-white/5'} ${plan.colorClass}`}>
                          <Icon size={20} />
                        </div>
                        <div>
                          <h3 className="font-black text-lg uppercase tracking-tight">{plan.name}</h3>
                          <p className="text-xs text-text-muted">{plan.price}</p>
                        </div>
                      </div>

                      <p className="text-xs text-text-muted mb-6 leading-relaxed">
                        {plan.description}
                      </p>

                      {/* Separator */}
                      <div className="h-px bg-surface-border mb-6" />

                      {/* Features List */}
                      <ul className="space-y-3 flex-1 mb-8">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-xs text-text-main/90">
                            <Check size={14} className={`mt-0.5 flex-shrink-0 ${isCurrent ? (plan.id === 'visionario' ? 'text-secondary' : 'text-primary') : 'text-emerald-400'
                              }`} />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Action / Upgrade Button */}
                      {!isCurrent && (
                        <a
                          href={`https://wa.me/5511999999999?text=Ol%C3%A1%21+Gostaria+de+${isDowngrade ? 'solicitar+o+downgrade' : 'fazer+o+upgrade'}+do+meu+plano+para+${plan.name}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`w-full py-3 text-center rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                            isDowngrade
                              ? 'bg-white/10 text-white hover:bg-white/20 border border-white/10 hover:scale-[1.03]'
                              : plan.id === 'visionario'
                              ? 'bg-secondary text-background hover:scale-[1.03] shadow-md hover:shadow-secondary/20'
                              : 'bg-primary text-background hover:scale-[1.03] shadow-md hover:shadow-primary/20'
                          }`}
                        >
                          {isDowngrade ? 'Fazer Downgrade' : 'Fazer Upgrade'}
                        </a>
                      )}

                      {isCurrent && (
                        <div className="w-full py-3 text-center rounded-2xl font-black text-[10px] uppercase tracking-widest border border-white/10 bg-white/5 text-text-muted cursor-default">
                          Plano Ativo
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
