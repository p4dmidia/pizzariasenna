import { motion } from 'motion/react';
import { 
  User, 
  History, 
  Heart, 
  Ticket, 
  TrendingUp, 
  HelpCircle, 
  MapPin, 
  ShieldCheck, 
  ChevronRight, 
  Plus, 
  Menu, 
  X, 
  Search, 
  ShoppingCart,
  Camera,
  ArrowLeft,
  Loader2,
  LayoutDashboard,
  Users,
  Wallet,
  PieChart,
  Settings,
  LogOut
} from 'lucide-react';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import CartDrawer from '../components/CartDrawer';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import NotificationBell from '../components/NotificationBell';



import AppLogo from '../components/AppLogo';

export default function MyAccount() {
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipcode, setZipcode] = useState('');
  const [saving, setSaving] = useState(false);
  const { cartCount } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) {
      setName(profile.full_name || '');
      setPhone(profile.phone || '');
      setAddress(profile.address || '');
      setNumber(profile.number || '');
      setComplement(profile.complement || '');
      setNeighborhood(profile.neighborhood || '');
      setCity(profile.city || '');
      setState(profile.state || '');
      setZipcode(profile.zipcode || '');
    }
  }, [profile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-text-muted font-black uppercase tracking-widest text-xs">Carregando Perfil...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('O nome completo é obrigatório.');
      return;
    }

    try {
      setSaving(true);
      
      // 1. Tentar atualizar no banco de dados real do Supabase
      if (profile?.mocha_user_id) {
        try {
          const { error } = await supabase
            .from('user_profiles')
            .update({ 
              full_name: name, 
              phone: phone,
              address: address,
              number: number,
              complement: complement,
              neighborhood: neighborhood,
              city: city,
              state: state,
              zipcode: zipcode
            })
            .eq('mocha_user_id', profile.mocha_user_id);
            
          if (error) {
            console.warn('Erro ao atualizar no banco (usando local fallback):', error);
          }
        } catch (e) {
          console.warn('Conexão com o banco falhou:', e);
        }

        // 2. Atualizar no localStorage para manter consistência nos testes locais
        const mockProfiles = JSON.parse(localStorage.getItem('supabase.mock-profiles') || '[]');
        const profileIndex = mockProfiles.findIndex((p: any) => p.mocha_user_id === profile.mocha_user_id);
        
        if (profileIndex !== -1) {
          mockProfiles[profileIndex] = {
            ...mockProfiles[profileIndex],
            full_name: name,
            phone: phone,
            address: address,
            number: number,
            complement: complement,
            neighborhood: neighborhood,
            city: city,
            state: state,
            zipcode: zipcode
          };
          localStorage.setItem('supabase.mock-profiles', JSON.stringify(mockProfiles));
        } else {
          mockProfiles.push({
            ...profile,
            full_name: name,
            phone: phone,
            address: address,
            number: number,
            complement: complement,
            neighborhood: neighborhood,
            city: city,
            state: state,
            zipcode: zipcode
          });
          localStorage.setItem('supabase.mock-profiles', JSON.stringify(mockProfiles));
        }

        // Também atualizar a sessão simulada se aplicável
        const mockSessionStr = localStorage.getItem('supabase.auth.mock-session');
        if (mockSessionStr) {
          try {
            const mockSession = JSON.parse(mockSessionStr);
            if (mockSession?.user?.id === profile.mocha_user_id) {
              mockSession.user.user_metadata = {
                ...mockSession.user.user_metadata,
                full_name: name
              };
              localStorage.setItem('supabase.auth.mock-session', JSON.stringify(mockSession));
            }
          } catch (e) {
            console.error(e);
          }
        }
      }

      await refreshProfile();
      window.dispatchEvent(new Event('mock-auth-change'));
      toast.success('Perfil atualizado com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao atualizar os dados.');
    } finally {
      setSaving(false);
    }
  };

  const nameInitials = (profile?.full_name || 'Visitante')
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const avatarUrl = profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'Visitante')}&background=00E5FF&color=0B0E14&bold=true`;

  return (
    <div className="min-h-screen bg-background text-text-main font-sans flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar (Same as DeliveryApp) */}
      <aside className={`
        fixed inset-y-0 left-0 z-[70] w-72 glass border-r border-surface-border flex flex-col transition-transform duration-300 lg:translate-x-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="p-6 flex items-center justify-between lg:hidden border-b border-surface-border/5">
          <span className="font-black text-primary uppercase tracking-widest text-sm">Menu</span>
          <button onClick={() => setIsSidebarOpen(false)} className="text-text-muted hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Logo no topo da Sidebar (Desktop) */}
        <div className="p-8 hidden lg:block border-b border-surface-border/5">
          <Link to="/" className="flex items-center gap-3">
             <AppLogo />
          </Link>
        </div>

        <div className="p-6 flex-1 flex flex-col justify-between overflow-y-auto">
          <div>
            {!user && (
              <div className="flex items-center gap-4 mb-8 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-background flex-shrink-0">
                  <User size={24} />
                </div>
                <div>
                  <p className="font-bold text-sm leading-tight">Olá, Visitante</p>
                  <p className="text-[10px] text-text-muted uppercase font-black tracking-widest leading-none mt-1">Seja Bem-vindo</p>
                </div>
              </div>
            )}

            <nav className="space-y-1">
              <SidebarLink icon={User} label="Minha Conta" active />
              <SidebarLink icon={History} label="Meus Pedidos" isLink to="/orders" />
              <SidebarLink icon={Heart} label="Favoritos" isLink to="/favorites" />
              <SidebarLink icon={Ticket} label="Cupons" isLink to="/coupons" />
              <SidebarLink icon={HelpCircle} label="Suporte" isLink to="/support" />
            </nav>
          </div>

          <div className="mt-8">
            {user ? (
              <button 
                onClick={signOut}
                className="flex items-center gap-3 w-full p-4 text-text-muted hover:text-red-400 transition-colors font-black text-xs uppercase tracking-widest"
              >
                <LogOut size={18} /> Sair da Conta
              </button>
            ) : (
              <Link to="/login" className="block w-full mt-8 bg-gradient-primary text-background font-black py-4 rounded-2xl text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg glow-primary text-center">
                ENTRAR OU CADASTRAR
              </Link>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 min-h-screen flex flex-col">
        {/* Header (Same as DeliveryApp) */}
        <header className="h-20 glass-card mx-6 mt-6 flex items-center justify-between px-8 border border-white/5 shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-primary">
              <Menu size={24} />
            </button>
            <Link to="/" className="flex items-center gap-3 lg:hidden">
               <AppLogo />
            </Link>
          </div>

          <div className="flex-1 max-w-xl hidden md:block">
             <div className="relative">
                <input 
                  type="text" 
                  placeholder="Busque sua pizza favorita..."
                  className="w-full bg-surface/50 border border-surface-border rounded-full py-2.5 px-12 focus:ring-2 focus:ring-primary/50 transition-all text-sm outline-none"
                />
                <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
             </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            {user ? (
              <div className="flex items-center gap-3 pl-4 md:pl-6">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-black uppercase text-text-main leading-tight">{profile?.full_name}</p>
                  <p className="text-[10px] text-primary font-bold mt-0.5">Cliente Casarão</p>
                </div>
                <Link to="/profile" className="w-10 h-10 rounded-xl bg-surface border border-surface-border flex items-center justify-center overflow-hidden flex-shrink-0 hover:scale-105 transition-all">
                  <img src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'User')}&background=EA1D2C&color=FFFFFF&bold=true`} alt="Avatar" className="w-full h-full object-cover" />
                </Link>
              </div>
            ) : (
              <Link to="/login" className="p-2.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-full transition-all flex items-center justify-center overflow-hidden w-10 h-10 rounded-full border border-surface-border">
                <User size={22} />
              </Link>
            )}
            <NotificationBell />
            <button 
              onClick={() => setIsCartOpen(true)}
              className="p-2.5 text-text-muted hover:text-primary hover:bg-primary/10 rounded-full transition-all relative"
            >
              <ShoppingCart size={22} />
              {cartCount > 0 && (
                <span className="absolute top-2 right-2 w-4 h-4 bg-primary text-background text-[8px] font-black rounded-full flex items-center justify-center shadow-[0_0_8px_rgba(0,229,255,0.8)]">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Inner Content */}
        <div className="flex-1 p-6 md:p-12 max-w-4xl overflow-x-hidden">
           <div className="flex items-center gap-4 mb-8">
              <button onClick={() => navigate('/')} className="p-2 hover:bg-surface rounded-xl transition-all text-text-muted hover:text-primary">
                 <ArrowLeft size={20} />
              </button>
              <h1 className="text-3xl font-black italic">Minha Conta</h1>
           </div>

           <div className="space-y-8">
              {/* Profile Card */}
              <section className="glass-card p-8 border-white/5 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full" />
                 
                 <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
                    <div className="relative group">
                       <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-2 border-primary/20 shadow-2xl">
                          <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                       </div>
                       <button className="absolute -bottom-2 -right-2 p-3 bg-primary text-background rounded-2xl shadow-xl hover:scale-110 transition-all">
                          <Camera size={18} />
                       </button>
                    </div>
                    <div className="text-center md:text-left">
                       <h3 className="text-2xl font-black mb-1">{profile?.full_name || 'Visitante'}</h3>
                       <p className="text-text-muted text-sm uppercase font-bold tracking-widest mb-4">{profile?.email || 'sem-email@appdelivery.com'}</p>
                       <div className="flex flex-wrap justify-center md:justify-start gap-3">
                          <span className="px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                             Cliente Ativo
                          </span>
                          <span className="px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-[10px] font-black uppercase tracking-widest border border-secondary/20">
                             Saldo Cashback: R$ {profile?.cashback_balance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
                          </span>
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-text-muted ml-1">Nome Completo</label>
                       <input 
                         type="text" 
                         value={name} 
                         onChange={(e) => setName(e.target.value)} 
                         className="w-full bg-background border border-surface-border rounded-2xl py-4 px-6 outline-none focus:border-primary/50 transition-all text-sm font-bold text-white" 
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-text-muted ml-1">WhatsApp</label>
                       <input 
                         type="text" 
                         value={phone} 
                         onChange={(e) => setPhone(e.target.value)} 
                         className="w-full bg-background border border-surface-border rounded-2xl py-4 px-6 outline-none focus:border-primary/50 transition-all text-sm font-bold text-white" 
                       />
                    </div>
                    
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-text-muted ml-1">CEP (Código Postal)</label>
                       <input 
                         type="text" 
                         value={zipcode} 
                         onChange={(e) => setZipcode(e.target.value)} 
                         placeholder="Ex: 01000-000"
                         className="w-full bg-background border border-surface-border rounded-2xl py-4 px-6 outline-none focus:border-primary/50 transition-all text-sm font-bold text-white" 
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-text-muted ml-1">Endereço (Rua, Avenida)</label>
                       <input 
                         type="text" 
                         value={address} 
                         onChange={(e) => setAddress(e.target.value)} 
                         placeholder="Ex: Rua das Flores"
                         className="w-full bg-background border border-surface-border rounded-2xl py-4 px-6 outline-none focus:border-primary/50 transition-all text-sm font-bold text-white" 
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-text-muted ml-1">Número</label>
                       <input 
                         type="text" 
                         value={number} 
                         onChange={(e) => setNumber(e.target.value)} 
                         placeholder="Ex: 123"
                         className="w-full bg-background border border-surface-border rounded-2xl py-4 px-6 outline-none focus:border-primary/50 transition-all text-sm font-bold text-white" 
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-text-muted ml-1">Complemento</label>
                       <input 
                         type="text" 
                         value={complement} 
                         onChange={(e) => setComplement(e.target.value)} 
                         placeholder="Ex: Apto 45, Bloco B"
                         className="w-full bg-background border border-surface-border rounded-2xl py-4 px-6 outline-none focus:border-primary/50 transition-all text-sm font-bold text-white" 
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-text-muted ml-1">Bairro</label>
                       <input 
                         type="text" 
                         value={neighborhood} 
                         onChange={(e) => setNeighborhood(e.target.value)} 
                         placeholder="Ex: Centro"
                         className="w-full bg-background border border-surface-border rounded-2xl py-4 px-6 outline-none focus:border-primary/50 transition-all text-sm font-bold text-white" 
                       />
                    </div>
                    <div className="space-y-2">
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                             <label className="text-[10px] font-black uppercase text-text-muted ml-1">Cidade</label>
                             <input 
                               type="text" 
                               value={city} 
                               onChange={(e) => setCity(e.target.value)} 
                               placeholder="Ex: São Paulo"
                               className="w-full bg-background border border-surface-border rounded-2xl py-4 px-4 outline-none focus:border-primary/50 transition-all text-sm font-bold text-white" 
                             />
                          </div>
                          <div>
                             <label className="text-[10px] font-black uppercase text-text-muted ml-1">Estado</label>
                             <input 
                               type="text" 
                               value={state} 
                               onChange={(e) => setState(e.target.value)} 
                               placeholder="Ex: SP"
                               className="w-full bg-background border border-surface-border rounded-2xl py-4 px-4 outline-none focus:border-primary/50 transition-all text-sm font-bold text-white" 
                             />
                          </div>
                       </div>
                    </div>
                 </div>
                 
                 <button 
                   onClick={handleSave}
                   disabled={saving}
                   className="mt-10 bg-primary text-background px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl glow-primary hover:scale-105 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                 >
                   {saving ? (
                     <>Salvando... <Loader2 className="animate-spin" size={16} /></>
                   ) : (
                     'Salvar Dados'
                   )}
                 </button>
              </section>

              {/* Addresses */}
              <section className="space-y-4">
                 <div className="flex items-center justify-between px-2">
                    <h3 className="text-xl font-black flex items-center gap-3">
                       <MapPin className="text-primary" size={24} /> Meus Endereços
                    </h3>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile?.address ? (
                       <AddressCard 
                         label="Principal" 
                         address={`${profile.address}, ${profile.number}${profile.complement ? ` - ${profile.complement}` : ''}`} 
                         city={`${profile.neighborhood ? `${profile.neighborhood}, ` : ''}${profile.city} - ${profile.state}`} 
                         active 
                       />
                    ) : (
                       <div className="p-8 rounded-3xl border-2 border-dashed border-surface-border bg-surface/30 text-center flex flex-col items-center justify-center gap-3 col-span-2 py-12">
                          <MapPin className="text-text-muted animate-bounce" size={32} />
                          <p className="text-sm font-black uppercase tracking-wider text-text-muted">Nenhum endereço cadastrado</p>
                          <p className="text-xs text-text-muted/60 max-w-sm">Preencha os campos de CEP, endereço, número, bairro, cidade e estado acima e clique em "Salvar Dados" para registrar seu endereço de entrega.</p>
                       </div>
                    )}
                 </div>
              </section>

              {/* Security */}
              <section className="glass-card p-8 border-white/5 flex items-center justify-between">
                 <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-surface border border-surface-border flex items-center justify-center text-text-muted">
                       <ShieldCheck size={28} />
                    </div>
                    <div>
                       <h3 className="text-lg font-black mb-1">Segurança da Conta</h3>
                       <p className="text-xs text-text-muted uppercase font-bold tracking-widest">Senha e autenticação</p>
                    </div>
                 </div>
                 <button className="p-3 bg-surface hover:bg-surface-hover rounded-xl border border-surface-border transition-all">
                    <ChevronRight size={20} />
                 </button>
              </section>
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

function AddressCard({ label, address, city, active = false }: any) {
  return (
    <div className={`p-6 rounded-3xl border transition-all cursor-pointer group ${
      active 
        ? 'bg-primary/5 border-primary/30 shadow-lg' 
        : 'bg-surface border-surface-border hover:border-white/10'
    }`}>
       <div className="flex justify-between items-start mb-4">
          <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
            active ? 'bg-primary text-background' : 'bg-white/5 text-text-muted'
          }`}>
             {label}
          </div>
          {active && <div className="w-2 h-2 rounded-full bg-primary glow-primary" />}
       </div>
       <p className="text-sm font-bold mb-1 group-hover:text-white transition-colors">{address}</p>
       <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest">{city}</p>
    </div>
  );
}
