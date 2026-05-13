import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Lock, 
  Phone, 
  Users, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2,
  Zap,
  TrendingUp,
  Award,
  ShoppingCart
} from 'lucide-react';

import logoImg from '../assets/logo-casarao.jpeg';

export default function Register() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    sponsorId: '',
    plan: 'cliente'
  });
  const navigate = useNavigate();

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Registration data:', formData);
    // Simulate success
    setStep(4);
  };

  return (
    <div className="min-h-screen bg-background text-text-main font-sans overflow-x-hidden">
      {/* Header */}
      <header className="h-20 flex items-center px-6 md:px-12 justify-between glass fixed top-0 w-full z-50">
        <Link to="/" className="flex items-center gap-3">
           <img src={logoImg} alt="Casarão Clube 7" className="h-12 w-auto object-contain" />
        </Link>
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="text-[10px] font-black uppercase tracking-widest text-text-muted hover:text-primary transition-colors flex items-center gap-2">
             <ChevronLeft size={14} /> Voltar para o Delivery
          </Link>
          <div className="flex items-center gap-2">
            <p className="text-[10px] text-text-muted uppercase font-black tracking-widest">Já tem conta?</p>
            <Link to="/login" className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline">Fazer Login</Link>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-20 px-6 flex flex-col items-center">
        {/* Progress Bar */}
        <div className="w-full max-w-xl mb-12 flex items-center justify-between relative px-2">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-surface-border -translate-y-1/2 z-0" />
          <div 
            className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-500" 
            style={{ width: `${((step - 1) / 3) * 100}%` }}
          />
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i} 
              className={`w-10 h-10 rounded-full flex items-center justify-center z-10 font-black text-xs transition-all duration-500 ${
                step >= i ? 'bg-primary text-background shadow-[0_0_15px_rgba(0,229,255,0.5)]' : 'bg-surface text-text-muted border border-surface-border'
              }`}
            >
              {step > i ? <CheckCircle2 size={18} /> : i}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-md space-y-8"
            >
              <div className="text-center">
                <h2 className="text-3xl font-black mb-2">Crie sua Conta</h2>
                <p className="text-text-muted">Vamos começar com suas informações básicas.</p>
              </div>

              <div className="space-y-4">
                <Input icon={User} label="Nome Completo" placeholder="Seu nome" value={formData.name} onChange={(e: any) => setFormData({...formData, name: e.target.value})} />
                <Input icon={Mail} label="E-mail" placeholder="seu@email.com" type="email" value={formData.email} onChange={(e: any) => setFormData({...formData, email: e.target.value})} />
                <Input icon={Phone} label="Telefone / WhatsApp" placeholder="(00) 00000-0000" value={formData.phone} onChange={(e: any) => setFormData({...formData, phone: e.target.value})} />
                <Input icon={Lock} label="Senha de Acesso" placeholder="••••••••" type="password" value={formData.password} onChange={(e: any) => setFormData({...formData, password: e.target.value})} />
              </div>

              <button 
                onClick={handleNext}
                className="w-full py-4 bg-primary text-background rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all glow-primary shadow-xl"
              >
                Continuar <ChevronRight size={18} />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-md space-y-8"
            >
              <div className="text-center">
                <h2 className="text-3xl font-black mb-2">Quem te indicou?</h2>
                <p className="text-text-muted">Se você foi convidado por alguém, insira o ID de indicação abaixo.</p>
              </div>

              <div className="space-y-6">
                <div className="p-6 rounded-3xl bg-surface/50 border border-surface-border">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
                      <Users size={24} />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Convite Especial</p>
                      <p className="text-xs text-text-muted">Fazendo parte de uma rede, você cresce mais rápido.</p>
                    </div>
                  </div>
                  <Input icon={Zap} label="ID do Patrocinador" placeholder="Ex: CASARAO007" value={formData.sponsorId} onChange={(e: any) => setFormData({...formData, sponsorId: e.target.value})} />
                </div>

                <div className="flex gap-4">
                  <button onClick={handleBack} className="flex-1 py-4 glass rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2">
                    <ChevronLeft size={18} /> Voltar
                  </button>
                  <button onClick={handleNext} className="flex-[2] py-4 bg-primary text-background rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 glow-primary shadow-xl">
                    Continuar <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-3xl space-y-8"
            >
              <div className="text-center">
                <h2 className="text-3xl font-black mb-2">Escolha seu Perfil</h2>
                <p className="text-text-muted">Como você deseja começar no Casarão Clube 7?</p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <PlanCard 
                  active={formData.plan === 'cliente'} 
                  onClick={() => setFormData({...formData, plan: 'cliente'})}
                  icon={ShoppingCart}
                  title="Cliente"
                  desc="Consumo & Cashback"
                  color="primary"
                />
                <PlanCard 
                  active={formData.plan === 'empreendedor'} 
                  onClick={() => setFormData({...formData, plan: 'empreendedor'})}
                  icon={TrendingUp}
                  title="Empreendedor"
                  desc="Renda Extra (3 níveis)"
                  color="secondary"
                />
                <PlanCard 
                  active={formData.plan === 'visionario'} 
                  onClick={() => setFormData({...formData, plan: 'visionario'})}
                  icon={Award}
                  title="Visionário"
                  desc="Independência (7 níveis)"
                  color="primary"
                />
              </div>

              <div className="flex gap-4 max-w-md mx-auto">
                <button onClick={handleBack} className="flex-1 py-4 glass rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2">
                  <ChevronLeft size={18} /> Voltar
                </button>
                <button onClick={handleSubmit} className="flex-[2] py-4 bg-primary text-background rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 glow-primary shadow-xl">
                  Finalizar Cadastro <ChevronRight size={18} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md text-center space-y-8"
            >
              <div className="w-24 h-24 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(16,185,129,0.3)] border border-emerald-500/30">
                <CheckCircle2 size={48} />
              </div>
              <div>
                <h2 className="text-4xl font-black mb-4">Parabéns!</h2>
                <p className="text-text-muted mb-8 text-lg">Seu cadastro foi realizado com sucesso. Você agora faz parte do Clube 7.</p>
              </div>
              <button 
                onClick={() => navigate('/login')}
                className="w-full py-4 bg-primary text-background rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl glow-primary"
              >
                Ir para o Login
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function Input({ icon: Icon, label, ...props }: any) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">{label}</label>
      <div className="relative group">
        <input 
          {...props}
          className="w-full bg-surface/50 border border-surface-border rounded-2xl py-4 px-12 outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm group-hover:border-primary/30"
        />
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-hover:text-primary transition-colors" size={20} />
      </div>
    </div>
  );
}

function PlanCard({ active, onClick, icon: Icon, title, desc, color }: any) {
  return (
    <button 
      onClick={onClick}
      className={`p-8 rounded-[2.5rem] border-2 transition-all flex flex-col items-center text-center gap-4 ${
        active 
          ? `border-${color} bg-${color}/5 shadow-lg scale-105` 
          : 'border-surface-border bg-surface/30 hover:bg-surface/50 grayscale'
      }`}
    >
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-2 ${
        color === 'primary' ? 'bg-primary/10 text-primary' : 'bg-secondary/10 text-secondary'
      }`}>
        <Icon size={28} />
      </div>
      <div>
        <h4 className="text-xl font-black mb-1">{title}</h4>
        <p className="text-[10px] text-text-muted uppercase font-black tracking-widest">{desc}</p>
      </div>
      {active && (
         <div className={`w-6 h-6 rounded-full bg-${color} flex items-center justify-center text-background`}>
            <CheckCircle2 size={14} />
         </div>
      )}
    </button>
  );
}
