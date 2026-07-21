import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Lock, 
  Phone, 
  ChevronRight, 
  ChevronLeft,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

import AppLogo from '../components/AppLogo';

export default function Register() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  });
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Limpar bypass do admin se estiver registrando um novo cliente
      localStorage.removeItem('admin_auth');
      
      // UUID v4 generator para simulações
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };
      
      const mochaUserId = generateUUID();
      let authUser = null;
      let bypassAuth = false;

      try {
        // 1. Criar usuário no Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.name,
            }
          }
        });

        if (authError) {
          // Se houver limite de taxa, ignorar erro de autenticação para fins locais e simulação
          if (authError.status === 429 || authError.message.includes('rate limit')) {
            console.warn('Supabase rate limit reached. Using development auth bypass.');
            bypassAuth = true;
          } else {
            toast.error(authError.message);
            setLoading(false);
            return;
          }
        } else if (authData?.user) {
          authUser = authData.user;
        }
      } catch (err) {
        console.warn('Erro ao conectar ao Supabase Auth:', err);
        bypassAuth = true;
      }

      const profilePayload = {
        mocha_user_id: authUser ? authUser.id : mochaUserId,
        email: formData.email,
        full_name: formData.name,
        phone: formData.phone,
        role: 'user'
      };

      // 2. Criar perfil no banco se possível
      try {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert(profilePayload);

        if (profileError && profileError.code !== '23505') { 
          console.error('Erro ao criar perfil:', profileError);
        }
      } catch (err) {
        console.warn('Erro de conexão ao banco de dados:', err);
      }

      // Salvar nos perfis locais (mock-profiles) para testes e desenvolvimento
      const existingMockProfiles = JSON.parse(localStorage.getItem('supabase.mock-profiles') || '[]');
      existingMockProfiles.push(profilePayload);
      localStorage.setItem('supabase.mock-profiles', JSON.stringify(existingMockProfiles));

      if (bypassAuth) {
        toast.success('Cadastro realizado com sucesso (Modo de Teste)!');
      } else {
        toast.success('Cadastro realizado com sucesso!');
      }
      setStep(2);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao realizar cadastro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text-main font-sans overflow-x-hidden">
      {/* Header */}
      <header className="h-20 flex items-center px-6 md:px-12 justify-between glass fixed top-0 w-full z-50">
        <Link to="/" className="flex items-center gap-3">
           <AppLogo />
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
        <div className="w-full max-w-md mb-12 flex items-center justify-between relative px-2">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-surface-border -translate-y-1/2 z-0" />
          <div 
            className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-500" 
            style={{ width: `${((step - 1) / 1) * 100}%` }}
          />
          {[1, 2].map((i) => (
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
            <motion.form 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full max-w-md space-y-8"
              onSubmit={handleSubmit}
            >
              <div className="text-center">
                <h2 className="text-3xl font-black mb-2">Crie sua Conta</h2>
                <p className="text-text-muted">Preencha os campos abaixo para começar a pedir na Pizzaria Senna.</p>
              </div>

              <div className="space-y-4">
                <Input icon={User} label="Nome Completo" placeholder="Seu nome" name="name" autoComplete="name" value={formData.name} onChange={(e: any) => setFormData({...formData, name: e.target.value})} required />
                <Input icon={Phone} label="Telefone / WhatsApp" placeholder="(00) 00000-0000" name="phone" autoComplete="tel" value={formData.phone} onChange={(e: any) => setFormData({...formData, phone: e.target.value})} required />
                <Input icon={Mail} label="E-mail" placeholder="seu@email.com" type="email" name="email" autoComplete="username" value={formData.email} onChange={(e: any) => setFormData({...formData, email: e.target.value})} required />
                <Input icon={Lock} label="Senha de Acesso" placeholder="••••••••" type="password" name="password" autoComplete="new-password" value={formData.password} onChange={(e: any) => setFormData({...formData, password: e.target.value})} required />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary text-background rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all glow-primary shadow-xl disabled:opacity-50"
              >
                {loading ? (
                  <>Sincronizando... <Loader2 className="animate-spin" size={18} /></>
                ) : (
                  <>Criar Conta <ChevronRight size={18} /></>
                )}
              </button>
            </motion.form>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md text-center space-y-8"
            >
              <div className="w-24 h-24 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-8 shadow-[0_0_30px_rgba(16,185,129,0.3)] border border-emerald-500/30">
                <CheckCircle2 size={48} />
              </div>
              <div>
                <h2 className="text-4xl font-black mb-4">Parabéns!</h2>
                <p className="text-text-muted mb-8 text-lg">Seu cadastro foi realizado com sucesso. Agora você pode fazer o login para fazer pedidos.</p>
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
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = props.type === 'password';

  return (
    <div className="space-y-2">
      <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">{label}</label>
      <div className="relative group">
        <input 
          {...props}
          type={isPassword ? (showPassword ? 'text' : 'password') : props.type}
          className="w-full bg-white border border-surface-border rounded-2xl py-4 px-12 outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm font-bold text-gray-900 placeholder:text-gray-400 group-hover:border-primary/30 shadow-sm"
        />
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-hover:text-primary transition-colors" size={20} />
        {isPassword && (
          <button 
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors z-10"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
    </div>
  );
}
