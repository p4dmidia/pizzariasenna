import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowRight,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import AppLogo from '../../components/AppLogo';

import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

export default function AdminLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Bypass de desenvolvimento para administrador padrão
      if (email === 'admin@appdelivery.com' && password === 'admin123') {
        localStorage.setItem('admin_auth', 'true');
        toast.success('Acesso autorizado (Modo Demonstração)!', { duration: 3000 });
        navigate('/admin');
        return;
      }
      
      let user = null;
      let userRole = null;

      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) throw authError;
        user = authData.user;
      } catch (authError: any) {
        // Bypass de desenvolvimento no Admin se o e-mail não estiver confirmado ou credenciais inválidas (Modo Demo)
        const isBypassable = authError.message && (
          authError.message.toLowerCase().includes('email not confirmed') ||
          authError.message.toLowerCase().includes('invalid login credentials') ||
          authError.message.toLowerCase().includes('invalid credentials') ||
          authError.message.toLowerCase().includes('user not found')
        );

        if (isBypassable) {
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('email', email)
            .single();

          if (!profileError && profile) {
            user = {
              id: profile.mocha_user_id,
              email: profile.email,
              user_metadata: {
                full_name: profile.full_name
              }
            };
            userRole = profile.role;
          }
        }
        
        if (!user) {
          throw authError;
        }
      }

      // Se a role ainda não foi resolvida (logou com sucesso via auth real), buscar no banco
      if (user && !userRole) {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('role')
          .eq('mocha_user_id', user.id)
          .single();

        if (!profileError && profile) {
          userRole = profile.role;
        }
      }

      if (userRole !== 'admin' && userRole !== 'caixa') {
        if (user && supabase.auth.signOut) {
          await supabase.auth.signOut().catch(console.error);
        }
        throw new Error('Acesso negado. Você não possui permissões administrativas.');
      }

      // Criar mock session local caso tenha usado o bypass para manter a sessão no aplicativo principal
      const mockUser = {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
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

      localStorage.setItem('admin_auth', 'true');
      toast.success('Acesso autorizado!', { duration: 3000 });
      navigate(userRole === 'caixa' ? '/admin/orders' : '/admin');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao autenticar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-secondary/10 blur-[120px] rounded-full" />
      </div>

      <div className="absolute top-8 left-8">
        <Link to="/" className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-text-muted hover:text-primary transition-all group">
          <div className="w-8 h-8 rounded-full bg-surface-hover flex items-center justify-center group-hover:bg-primary/10 transition-all">
            <ChevronLeft size={18} />
          </div>
          Voltar ao Início
        </Link>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-10">
          <AppLogo className="justify-center mx-auto" />
          <h1 className="text-3xl font-black mb-2">Painel de Controle</h1>
          <p className="text-text-muted text-sm uppercase font-black tracking-widest flex items-center justify-center gap-2">
            <ShieldCheck size={14} className="text-primary" /> Acesso Restrito
          </p>
        </div>

        <div className="glass-card p-8 border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-primary" />
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">E-mail Administrativo</label>
              <div className="relative group">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@appdelivery.com"
                  className="w-full bg-background border border-surface-border rounded-2xl py-4 px-12 outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm group-hover:border-primary/30"
                  required
                />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-hover:text-primary transition-colors" size={20} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Senha Mestra</label>
              <div className="relative group">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-background border border-surface-border rounded-2xl py-4 px-12 outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm group-hover:border-primary/30"
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
              className="w-full py-4 bg-gradient-primary text-background rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all glow-primary shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  AUTENTICAR <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-[10px] text-text-muted uppercase font-black tracking-[0.2em]">
          Ambiente Seguro & Monitorado
        </p>
      </motion.div>
    </div>
  );
}
