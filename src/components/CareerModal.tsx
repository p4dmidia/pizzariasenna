import { motion, AnimatePresence } from 'motion/react';
import { X, Award, Target, Users, TrendingUp, CheckCircle2, ChevronRight, Crown } from 'lucide-react';

interface CareerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPoints?: number;
}

export default function CareerModal({ isOpen, onClose, currentPoints = 0 }: CareerModalProps) {
  const levels = [
    {
      id: 'iniciante',
      name: 'Iniciante',
      pointsRequired: 0,
      icon: Users,
      color: 'text-text-muted',
      badgeBg: 'bg-white/10 text-white',
      borderClass: 'border-white/10',
      glowClass: '',
      requirements: 'Nenhum requisito necessário.',
      benefits: [
        'Cashback padrão de 10% nos seus pedidos',
        'Acesso aos painéis de indicação básicos'
      ]
    },
    {
      id: 'bronze',
      name: 'Bronze',
      pointsRequired: 1000,
      icon: Award,
      color: 'text-amber-600',
      badgeBg: 'bg-amber-600/20 text-amber-500',
      borderClass: 'border-amber-600/30',
      glowClass: 'hover:shadow-[0_0_20px_rgba(217,119,6,0.15)]',
      requirements: '1.000 pontos acumulados + 3 indicados diretos ativos.',
      benefits: [
        'Comissão adicional de +1% no seu 1º nível de indicação',
        'Tag exclusiva Bronze no perfil'
      ]
    },
    {
      id: 'prata',
      name: 'Prata',
      pointsRequired: 3000,
      icon: TrendingUp,
      color: 'text-slate-300',
      badgeBg: 'bg-slate-300/20 text-slate-300',
      borderClass: 'border-slate-300/30',
      glowClass: 'hover:shadow-[0_0_20px_rgba(203,213,225,0.15)]',
      requirements: '3.000 pontos acumulados + 5 indicados diretos ativos.',
      benefits: [
        'Comissão adicional de +2% no 1º e 2º nível de indicação',
        'Tag exclusiva Prata no perfil',
        'Acesso a materiais de suporte avançados'
      ]
    },
    {
      id: 'ouro',
      name: 'Ouro',
      pointsRequired: 10000,
      icon: Target,
      color: 'text-secondary',
      badgeBg: 'bg-secondary/20 text-secondary',
      borderClass: 'border-secondary/30',
      glowClass: 'hover:shadow-[0_0_20px_rgba(255,184,0,0.15)]',
      requirements: '10.000 pontos acumulados + 10 indicados diretos ativos + 2 afiliados Prata na rede.',
      benefits: [
        'Comissão adicional de +3% no 1º, 2º e 3º nível de indicação',
        'Bônus fixo de desempenho mensal (R$ 200,00)',
        'Tag exclusiva Ouro no perfil'
      ]
    },
    {
      id: 'diamante',
      name: 'Diamante',
      pointsRequired: 30000,
      icon: Crown,
      color: 'text-primary',
      badgeBg: 'bg-primary/20 text-primary',
      borderClass: 'border-primary/30',
      glowClass: 'hover:shadow-[0_0_25px_rgba(0,229,255,0.2)]',
      requirements: '30.000 pontos acumulados + 15 indicados diretos ativos + 2 afiliados Ouro na rede.',
      benefits: [
        'Divisão de 1% do faturamento global da empresa (Pool Diamante)',
        'Viagem anual corporativa com acompanhante',
        'Mentoria e consultoria de negócios individual com a diretoria',
        'Tag exclusiva Diamante com destaque brilhante no painel'
      ]
    }
  ];

  // Determinar nível atual
  let currentLevelIndex = 0;
  for (let i = levels.length - 1; i >= 0; i--) {
    if (currentPoints >= levels[i].pointsRequired) {
      currentLevelIndex = i;
      break;
    }
  }

  const currentLevel = levels[currentLevelIndex];
  const isMaxLevel = currentLevelIndex === levels.length - 1;
  const nextLevel = isMaxLevel ? null : levels[currentLevelIndex + 1];

  // Cálculo da barra de progresso para a próxima meta
  const pointsStart = currentLevel.pointsRequired;
  const pointsEnd = nextLevel ? nextLevel.pointsRequired : currentLevel.pointsRequired;
  const pointsDiff = pointsEnd - pointsStart;
  const pointsProgress = nextLevel ? Math.max(0, currentPoints - pointsStart) : 0;
  const percentageToNext = nextLevel 
    ? Math.min(100, Math.round((pointsProgress / pointsDiff) * 100))
    : 100;

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
              className="relative w-full max-w-4xl bg-surface border border-surface-border rounded-3xl shadow-2xl p-6 md:p-8 my-8 overflow-hidden"
            >
              {/* Decorative light rays */}
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-6 right-6 p-2 bg-surface-hover hover:bg-white/10 text-text-muted hover:text-white rounded-xl transition-all z-50"
              >
                <X size={20} />
              </button>

              {/* Header */}
              <div className="text-center mb-8 relative">
                <p className="text-[10px] font-black uppercase tracking-widest text-secondary mb-2">Plano de Carreira</p>
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mb-2">
                  Evolução & Graduações
                </h2>
                <p className="text-sm text-text-muted max-w-lg mx-auto">
                  Acumule pontos em vendas e indicações da sua rede para subir de nível e desbloquear comissões vitalícias e prêmios.
                </p>
              </div>

              {/* Status & Progress Card */}
              <div className="glass-card p-6 border-white/5 mb-8 relative overflow-hidden bg-surface-hover/30">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div className="md:border-r border-surface-border md:pr-6 text-center md:text-left">
                    <p className="text-[10px] text-text-muted uppercase font-black tracking-widest mb-1">Seu Status Atual</p>
                    <div className="flex items-center justify-center md:justify-start gap-2.5">
                      <div className={`p-2 bg-white/5 rounded-xl ${currentLevel.color}`}>
                        <currentLevel.icon size={24} />
                      </div>
                      <div>
                        <h4 className="text-xl font-black uppercase tracking-tight">{currentLevel.name}</h4>
                        <p className="text-xs text-primary font-bold">{currentPoints} pontos acumulados</p>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 md:pl-2">
                    {nextLevel ? (
                      <div>
                        <div className="flex justify-between items-end mb-2 text-xs">
                          <p className="text-text-muted font-bold">
                            Próxima Graduação: <span className="text-text-main font-black uppercase">{nextLevel.name}</span>
                          </p>
                          <p className="font-black text-primary">{percentageToNext}%</p>
                        </div>
                        <div className="h-3 w-full bg-surface rounded-full overflow-hidden border border-surface-border p-[1px]">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentageToNext}%` }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            className="h-full bg-gradient-primary rounded-full glow-primary"
                          />
                        </div>
                        <div className="flex justify-between items-center mt-2.5 text-[10px] text-text-muted font-bold">
                          <span>{currentPoints} pts</span>
                          <span className="flex items-center gap-1 text-secondary">
                            Faltam {(nextLevel.pointsRequired - currentPoints).toLocaleString('pt-BR')} pts para {nextLevel.name}
                          </span>
                          <span>{nextLevel.pointsRequired} pts</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center md:text-left py-2">
                        <p className="text-secondary font-black text-sm uppercase tracking-widest flex items-center justify-center md:justify-start gap-2">
                          <Crown size={18} className="animate-pulse" /> Nível Máximo Atingido!
                        </p>
                        <p className="text-xs text-text-muted mt-1">Você atingiu o topo do plano de carreira do Casarão Clube 7.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Levels Progression List */}
              <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2 hide-scrollbar relative">
                {levels.map((lvl, index) => {
                  const isUserLevel = currentLevelIndex === index;
                  const isCompleted = currentLevelIndex > index;
                  const isLocked = currentLevelIndex < index;
                  const LvlIcon = lvl.icon;

                  return (
                    <div
                      key={lvl.id}
                      className={`relative flex flex-col md:flex-row md:items-center justify-between p-5 rounded-2xl border transition-all duration-300 ${
                        isUserLevel
                          ? 'border-primary bg-surface-hover/60 shadow-[0_0_20px_rgba(0,229,255,0.08)] z-10'
                          : isCompleted
                          ? 'border-emerald-500/20 bg-surface/30 opacity-75'
                          : 'border-surface-border bg-surface/20 opacity-50 ' + lvl.glowClass
                      }`}
                    >
                      {/* Left Column: Title and Badge */}
                      <div className="flex items-start md:items-center gap-4 mb-4 md:mb-0 md:w-1/3">
                        <div className={`p-3 rounded-xl ${
                          isUserLevel ? 'bg-primary/20 ' + lvl.color : isCompleted ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 ' + lvl.color
                        }`}>
                          <LvlIcon size={22} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-black text-sm uppercase tracking-tight">{lvl.name}</h4>
                            {isUserLevel && (
                              <span className="bg-primary/20 text-primary px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">
                                Seu Nível
                              </span>
                            )}
                            {isCompleted && (
                              <span className="bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-0.5">
                                <CheckCircle2 size={8} /> Concluído
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-text-muted mt-0.5">Requisito: {lvl.pointsRequired} pts</p>
                        </div>
                      </div>

                      {/* Middle Column: Requirements */}
                      <div className="mb-4 md:mb-0 md:w-1/3 border-t md:border-t-0 md:border-x border-surface-border pt-3 md:pt-0 md:px-4">
                        <span className="text-[9px] uppercase font-black tracking-widest text-text-muted block mb-1">Requisitos</span>
                        <p className="text-xs leading-relaxed text-text-main/90">{lvl.requirements}</p>
                      </div>

                      {/* Right Column: Benefits */}
                      <div className="md:w-1/3 md:pl-4">
                        <span className="text-[9px] uppercase font-black tracking-widest text-emerald-400 block mb-1">Benefícios</span>
                        <ul className="space-y-1">
                          {lvl.benefits.map((bf, i) => (
                            <li key={i} className="text-xs text-text-main/80 flex items-start gap-1.5">
                              <span className="text-emerald-400 mt-0.5">•</span>
                              <span>{bf}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
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
