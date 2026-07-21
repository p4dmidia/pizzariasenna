import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Menu, 
  ChevronDown, 
  User, 
  History, 
  Heart, 
  Ticket, 
  HelpCircle, 
  LogOut, 
  Search, 
  ShoppingCart,
  Pizza,
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import AppLogo from './AppLogo';
import NotificationBell from './NotificationBell';

interface UserHeaderProps {
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  showSearch?: boolean;
}

export default function UserHeader({ searchQuery = '', onSearchChange, showSearch = false }: UserHeaderProps) {
  const { user, profile, signOut } = useAuth();
  const { cartCount, setIsCartOpen } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);

  // Fecha o menu dropdown em mudança de rota
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Fecha o menu dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { label: 'Cardápio', icon: Pizza, to: '/', path: '/' },
    { label: 'Minha Conta', icon: User, to: '/profile', path: '/profile' },
    { label: 'Meus Pedidos', icon: History, to: '/orders', path: '/orders' },
    { label: 'Favoritos', icon: Heart, to: '/favorites', path: '/favorites' },
    { label: 'Cupons', icon: Ticket, to: '/coupons', path: '/coupons' },
    { label: 'Suporte', icon: HelpCircle, to: '/support', path: '/support' },
  ];

  const nameInitials = profile?.full_name 
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : 'US';

  return (
    <header className="sticky top-0 z-50 glass-card mx-4 sm:mx-6 mt-4 flex items-center justify-between px-4 sm:px-8 py-3.5 border border-white/10 shadow-2xl backdrop-blur-md">
      {/* Esquerda: Logo e Botão do Menu Dropdown */}
      <div className="flex items-center gap-4 sm:gap-6">
        <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <AppLogo />
        </Link>

        {/* Menu Dropdown Toggle Button */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all border ${
              isMenuOpen 
                ? 'bg-primary text-background border-primary shadow-[0_0_15px_rgba(234,29,44,0.4)]' 
                : 'bg-surface/80 hover:bg-surface border-surface-border text-text-main hover:border-primary/50'
            }`}
          >
            <Menu size={18} className={isMenuOpen ? 'text-background' : 'text-primary'} />
            <span className="hidden xs:inline">Menu</span>
            <ChevronDown size={14} className={`transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Menu Dropdown Card */}
          {isMenuOpen && (
            <div className="absolute left-0 mt-3 w-72 bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Header do Menu Dropdown */}
              {user ? (
                <div className="flex items-center gap-3 p-3 mb-3 rounded-xl bg-red-50 border border-red-100">
                  <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold overflow-hidden shrink-0 shadow-md">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span>{nameInitials}</span>
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-xs text-gray-900 truncate">{profile?.full_name || 'Usuário Senna'}</p>
                    <p className="text-[10px] text-primary font-black uppercase tracking-wider mt-0.5">Cliente Senna</p>
                  </div>
                </div>
              ) : (
                <div className="p-3 mb-3 rounded-xl bg-gray-50 border border-gray-200">
                  <p className="font-bold text-xs text-gray-900">Olá, Visitante!</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Faça login para ver seus pedidos</p>
                </div>
              )}

              {/* Items de Navegação */}
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.to}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                        isActive
                          ? 'bg-primary text-white font-black shadow-md'
                          : 'text-gray-700 hover:text-primary hover:bg-red-50'
                      }`}
                    >
                      <Icon size={18} className={isActive ? 'text-white' : 'text-primary'} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                {/* Painel Admin (Se for Admin) */}
                {profile?.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all mt-2"
                  >
                    <LayoutDashboard size={18} className="text-amber-600" />
                    <span>Painel Admin</span>
                  </Link>
                )}
              </nav>

              {/* Rodapé / Auth Action */}
              <div className="mt-3 pt-3 border-t border-gray-100">
                {user ? (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      signOut();
                    }}
                    className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors font-bold text-xs uppercase tracking-wider"
                  >
                    <LogOut size={16} />
                    <span>Sair da Conta</span>
                  </button>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full text-center bg-primary text-white font-black py-2.5 rounded-xl text-xs uppercase tracking-wider hover:opacity-95 active:scale-98 transition-all shadow-md"
                  >
                    Entrar ou Cadastrar
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Centro: Campo de Busca */}
      {showSearch && onSearchChange && (
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Busque sua pizza favorita..."
              className="w-full bg-surface/50 border border-surface-border rounded-full py-2 px-10 focus:ring-2 focus:ring-primary/50 transition-all text-xs sm:text-sm outline-none text-text-main placeholder:text-text-muted"
            />
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          </div>
        </div>
      )}

      {/* Direita: Perfil rápido, Notificações e Carrinho */}
      <div className="flex items-center gap-2 sm:gap-4">
        {user ? (
          <div className="flex items-center gap-2">
            <div className="text-right hidden lg:block">
              <p className="text-xs font-black uppercase text-text-main leading-tight truncate max-w-[140px]">{profile?.full_name}</p>
              <p className="text-[10px] text-primary font-bold mt-0.5">Cliente Senna</p>
            </div>
            <Link 
              to="/profile" 
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-surface border border-surface-border flex items-center justify-center overflow-hidden shrink-0 hover:scale-105 transition-all shadow-sm"
              title="Minha Conta"
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-primary flex items-center justify-center text-background font-bold text-xs">
                  {nameInitials}
                </div>
              )}
            </Link>
          </div>
        ) : (
          <Link 
            to="/login" 
            className="p-2 text-text-muted hover:text-primary hover:bg-primary/10 rounded-xl transition-all flex items-center justify-center border border-surface-border text-xs font-bold gap-2 px-3"
          >
            <User size={18} />
            <span className="hidden sm:inline">Entrar</span>
          </Link>
        )}

        <NotificationBell />

        <button
          onClick={() => setIsCartOpen(true)}
          className="hidden md:flex p-2 sm:p-2.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-xl transition-all relative border border-transparent hover:border-primary/20 items-center justify-center"
          title="Carrinho de Compras"
        >
          <ShoppingCart size={20} />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-background text-[10px] font-black rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(234,29,44,0.8)] animate-pulse">
              {cartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
