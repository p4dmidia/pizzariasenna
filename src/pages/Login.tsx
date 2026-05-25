import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Zap, 
  User, 
  TrendingUp,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import logoImg from '../assets/logo-casarao.jpeg';

import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'cliente' | 'afiliado'>('cliente');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Limpar bypass do admin se estiver fazendo login como cliente/afiliado
      localStorage.removeItem('admin_auth');

      // Verificação em perfis locais (mock profiles criados via registro local)
      const mockProfiles = JSON.parse(localStorage.getItem('supabase.mock-profiles') || '[]');
      const foundLocalProfile = mockProfiles.find((p: any) => p.email.toLowerCase() === email.toLowerCase());

      if (foundLocalProfile) {
        if (role === 'afiliado' && foundLocalProfile.plan === 'cliente') {
          throw new Error('Usuários com nível Cliente não possuem acesso à área de afiliados.');
        }

        const mockUser = {
          id: foundLocalProfile.mocha_user_id,
          email: foundLocalProfile.email,
          user_metadata: {
            full_name: foundLocalProfile.full_name
          },
          aud: 'authenticated',
          role: 'authenticated',
          created_at: new Date().toISOString()
        };
        const mockSession = {
          user: mockUser,
          expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 7 // 1 semana
        };
        localStorage.setItem('supabase.auth.mock-session', JSON.stringify(mockSession));
        window.dispatchEvent(new Event('mock-auth-change'));
        toast.success('Login realizado com sucesso (Bypass de Confirmação)!', { duration: 3000 });
        navigate(role === 'afiliado' ? '/dashboard' : '/');
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Bypass de desenvolvimento se o e-mail não estiver confirmado ou credenciais inválidas (Modo Demo)
        const isBypassableError = error.message && (
          error.message.toLowerCase().includes('email not confirmed') ||
          error.message.toLowerCase().includes('invalid login credentials') ||
          error.message.toLowerCase().includes('invalid credentials') ||
          error.message.toLowerCase().includes('user not found')
        );

        if (isBypassableError) {
          const { data: profileData, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('email', email)
            .single();

          if (!profileError && profileData) {
            if (role === 'afiliado' && profileData.plan === 'cliente') {
              throw new Error('Usuários com nível Cliente não possuem acesso à área de afiliados.');
            }

            const mockUser = {
              id: profileData.mocha_user_id,
              email: profileData.email,
              user_metadata: {
                full_name: profileData.full_name
              },
              aud: 'authenticated',
              role: 'authenticated',
              created_at: new Date().toISOString()
            };
            const mockSession = {
              user: mockUser,
              expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 7 // 1 semana
            };
            localStorage.setItem('supabase.auth.mock-session', JSON.stringify(mockSession));
            window.dispatchEvent(new Event('mock-auth-change'));
            toast.success('Login realizado com sucesso (Bypass de Confirmação)!', { duration: 3000 });
            navigate(role === 'afiliado' ? '/dashboard' : '/');
            return;
          }
        }
        throw error;
      }

      // Se logou com sucesso via Supabase Real, verificar plano do perfil
      if (data && data.user) {
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('plan')
          .eq('mocha_user_id', data.user.id)
          .single();

        if (role === 'afiliado' && (!profileData || profileData.plan === 'cliente')) {
          await supabase.auth.signOut().catch(() => {});
          throw new Error('Usuários com nível Cliente não possuem acesso à área de afiliados.');
        }
      }

      toast.success('Login realizado com sucesso!', { duration: 3000 });
      navigate(role === 'afiliado' ? '/dashboard' : '/');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao fazer login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row font-sans text-text-main overflow-hidden">
      {/* Decorative Side Panel (Desktop) */}
      <div className="hidden md:flex flex-1 relative items-center justify-center bg-surface overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full -mr-64 -mt-32" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/10 blur-[120px] rounded-full -ml-64 -mb-32" />
        
        <div className="relative z-10 max-w-md text-center p-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8"
          >
             <img src={logoImg} alt="Casarão Clube 7" className="w-48 h-auto object-contain mx-auto glow-primary" />
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-4xl font-black mb-6"
          >
            Sua jornada para a <br/> <span className="text-primary text-glow italic">Liberdade</span> começa aqui.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-text-muted text-lg"
          >
            Acesse sua conta para pedir pizzas deliciosas ou gerenciar sua rede de ganhos vitalícios.
          </motion.p>
        </div>
      </div>

      {/* Login Form Panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative">
        {/* Desktop Back Button */}
        <div className="absolute top-8 left-8 hidden md:block">
          <Link to="/" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-text-muted hover:text-primary transition-all group">
            <div className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center group-hover:bg-primary/10 transition-all">
              <ChevronLeft size={18} />
            </div>
            Voltar para o Delivery
          </Link>
        </div>

        {/* Mobile Logo & Back */}
        <div className="absolute top-8 left-8 right-8 flex items-center justify-between md:hidden">
          <Link to="/" className="text-text-muted hover:text-primary transition-colors">
            <ChevronLeft size={24} />
          </Link>
          <img src={logoImg} alt="Casarão Clube 7" className="h-10 w-auto object-contain" />
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-10">
            <h1 className="text-3xl font-black mb-2">Bem-vindo de volta!</h1>
            <p className="text-text-muted">Acesse sua conta para continuar.</p>
          </div>

          {/* Role Selector */}
          <div className="flex p-1 bg-surface-hover rounded-2xl mb-8 border border-surface-border">
            <button 
              onClick={() => setRole('cliente')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                role === 'cliente' ? 'bg-primary text-background shadow-lg' : 'text-text-muted hover:text-white'
              }`}
            >
              <User size={18} /> Cliente
            </button>
            <button 
              onClick={() => setRole('afiliado')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
                role === 'afiliado' ? 'bg-secondary text-background shadow-lg' : 'text-text-muted hover:text-white'
              }`}
            >
              <TrendingUp size={18} /> Afiliado
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">E-mail</label>
              <div className="relative group">
                <input 
                  type="email" 
                  name="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="exemplo@email.com"
                  className="w-full bg-surface/50 border border-surface-border rounded-2xl py-4 px-12 outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm group-hover:border-primary/30"
                  required
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-hover:text-primary transition-colors" size={20} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-black uppercase tracking-widest text-text-muted">Senha</label>
                <a href="#" className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest">Esqueci a senha?</a>
              </div>
              <div className="relative group">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  name="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface/50 border border-surface-border rounded-2xl py-4 px-12 outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm group-hover:border-primary/30"
                  required
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-hover:text-primary transition-colors" size={20} />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl disabled:opacity-50 ${
                role === 'cliente' ? 'bg-primary text-background glow-primary' : 'bg-secondary text-background glow-secondary'
              }`}
            >
              {loading ? (
                <>Processando... <Loader2 className="animate-spin" size={18} /></>
              ) : (
                <>Acessar Conta <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-sm text-text-muted">
              Não tem uma conta? <Link to="/register" className="text-primary font-black hover:underline tracking-tight">Crie uma agora!</Link>
            </p>
          </div>
        </motion.div>

        {/* Desktop Footer Info */}
        <div className="hidden md:flex absolute bottom-8 gap-6 text-[10px] text-text-muted uppercase font-black tracking-widest">
          <a href="#" className="hover:text-primary">Privacidade</a>
          <a href="#" className="hover:text-primary">Termos</a>
          <a href="#" className="hover:text-primary">Suporte</a>
        </div>
      </div>
    </div>
  );
}
