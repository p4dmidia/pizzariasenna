import React from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Wallet, 
  Users, 
  Pizza, 
  Settings, 
  LogOut,
  Menu,
  X,
  Loader2,
  BarChart3
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import AppLogo from './AppLogo';
import { supabase } from '../lib/supabase';
import NotificationBell from './NotificationBell';

const ADMIN_LINKS = [
  { icon: LayoutDashboard, label: 'Dashboard', to: '/admin' },
  { icon: ShoppingCart, label: 'Pedidos', to: '/admin/orders' },
  { icon: BarChart3, label: 'Financeiro', to: '/admin/finance' },
  { icon: Users, label: 'Usuários', to: '/admin/users' },
  { icon: Pizza, label: 'Cardápio', to: '/admin/menu' },
  { icon: Settings, label: 'Configurações', to: '/admin/settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    checkAuth();
    
    // Garantir que o toast de login seja removido após 3 segundos para não ficar preso
    const timer = setTimeout(() => {
      toast.dismiss('admin-login-success');
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      // Bypass de desenvolvimento: se admin_auth estiver setado no localStorage, autoriza imediatamente
      if (localStorage.getItem('admin_auth') === 'true') {
        setAuthenticated(true);
        
        let userId = session?.user?.id || null;
        if (!userId) {
          const mockSessionStr = localStorage.getItem('supabase.auth.mock-session');
          if (mockSessionStr) {
            try {
              const mockSession = JSON.parse(mockSessionStr);
              userId = mockSession.user?.id || null;
            } catch (e) {
              console.error('Erro ao decodificar mock session no AdminLayout:', e);
            }
          }
        }

        if (userId) {
          try {
            const { data: profile } = await supabase
              .from('user_profiles')
              .select('role')
              .eq('mocha_user_id', userId)
              .single();
            setUserRole(profile?.role || 'admin');
          } catch (e) {
            console.warn('Erro ao carregar permissão do banco, usando admin como fallback:', e);
            setUserRole('admin');
          }
        } else {
          setUserRole('admin');
        }
        setLoading(false);
        return;
      }
      
      if (!session) {
        setAuthenticated(false);
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('mocha_user_id', session.user.id)
        .single();

      if (profile?.role === 'admin' || profile?.role === 'caixa') {
        setAuthenticated(true);
        setUserRole(profile.role);
      } else {
        setAuthenticated(false);
        toast.error('Acesso negado. Esta conta não possui permissões administrativas.', { id: 'admin-access-denied' });
      }
    } catch (error) {
      if (localStorage.getItem('admin_auth') === 'true') {
        setAuthenticated(true);
        setUserRole('admin');
      } else {
        setAuthenticated(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut().catch(() => {});
    localStorage.removeItem('admin_auth');
    localStorage.removeItem('supabase.auth.mock-session');
    toast.success('Sessão encerrada.');
  };

  if (loading && location.pathname !== '/admin/login') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-text-muted font-black uppercase tracking-widest text-xs">Verificando Credenciais...</p>
      </div>
    );
  }

  if (!authenticated && location.pathname !== '/admin/login') {
    return <Navigate to="/admin/login" replace />;
  }

  if (userRole === 'caixa' && location.pathname !== '/admin/orders') {
    return <Navigate to="/admin/orders" replace />;
  }

  return (
    <div className="min-h-screen bg-background text-text-main font-sans flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-72 flex-col glass border-r border-surface-border fixed h-full z-50">
        <div className="p-8">
          <Link to="/" className="flex items-center gap-3">
             <AppLogo />
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {ADMIN_LINKS.filter(link => {
            if (userRole === 'caixa') {
              return link.to === '/admin/orders';
            }
            return true;
          }).map((link) => (
            <SidebarLink 
              key={link.to}
              icon={link.icon} 
              label={link.label} 
              to={link.to}
              active={location.pathname === link.to}
            />
          ))}
        </nav>

        <div className="p-6">
          <Link 
            to="/admin/login" 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full p-4 text-text-muted hover:text-red-400 transition-colors font-black text-xs uppercase tracking-widest"
          >
            <LogOut size={18} /> Sair do Painel
          </Link>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-[70] w-72 bg-surface border-r border-surface-border flex flex-col transition-transform duration-300 lg:hidden
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="p-8 flex items-center justify-between">
          <AppLogo />
          <button onClick={() => setIsSidebarOpen(false)} className="text-text-muted hover:text-white">
            <X size={24} />
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {ADMIN_LINKS.filter(link => {
            if (userRole === 'caixa') {
              return link.to === '/admin/orders';
            }
            return true;
          }).map((link) => (
            <SidebarLink 
              key={link.to}
              icon={link.icon} 
              label={link.label} 
              to={link.to}
              active={location.pathname === link.to}
              onClick={() => setIsSidebarOpen(false)}
            />
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 min-h-screen flex flex-col">
        {/* Header */}
        <header className="h-20 glass-card mx-6 mt-6 flex items-center justify-between px-8 border border-white/5 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-primary hover:bg-primary/10 rounded-xl transition-all"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-sm font-black uppercase tracking-widest text-primary">Painel do Administrador</h2>
          </div>

          <div className="flex items-center gap-6">
            <NotificationBell />
            <div className="flex items-center gap-3 pl-6 border-l border-surface-border">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black uppercase">
                  {userRole === 'caixa' ? 'Caixa Pizza Senna' : 'Admin Pizza Senna'}
                </p>
                <p className="text-[10px] text-primary font-bold">
                  {userRole === 'caixa' ? 'Acesso Pedidos' : 'Acesso Total'}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-surface border border-surface-border flex items-center justify-center overflow-hidden">
                <img src={`https://ui-avatars.com/api/?name=${userRole === 'caixa' ? 'Caixa' : 'Admin'}&background=00E5FF&color=0B0E14&bold=true`} alt="Avatar" />
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

function SidebarLink({ icon: Icon, label, active, to, onClick }: any) {
  return (
    <Link 
      to={to}
      onClick={onClick}
      className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group ${
        active 
          ? 'bg-primary text-background shadow-lg glow-primary' 
          : 'text-text-muted hover:text-white hover:bg-surface-hover'
      }`}
    >
      <Icon size={20} className={active ? '' : 'group-hover:text-primary transition-colors'} />
      <span className="text-sm font-black uppercase tracking-widest">{label}</span>
    </Link>
  );
}
