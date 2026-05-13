import { motion } from 'motion/react';
import { 
  Settings, 
  User, 
  Lock, 
  Share2, 
  Wallet, 
  Bell, 
  Check, 
  Camera,
  LayoutDashboard,
  Users,
  ShoppingCart,
  PieChart,
  LogOut,
  ChevronRight,
  Shield,
  CreditCard,
  Target
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';

const TABS = [
  { id: 'profile', label: 'Perfil', icon: User },
  { id: 'security', label: 'Segurança', icon: Lock },
  { id: 'network', label: 'Rede', icon: Share2 },
  { id: 'payment', label: 'Pagamentos', icon: Wallet },
];

import logoImg from '../assets/logo-casarao.jpeg';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="min-h-screen bg-background text-text-main font-sans flex">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-72 flex-col glass border-r border-surface-border fixed h-full z-50">
        <div className="p-8">
          <Link to="/" className="flex items-center gap-3">
             <img src={logoImg} alt="Casarão Clube 7" className="h-12 w-auto object-contain" />
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          <SidebarLink icon={LayoutDashboard} label="Dashboard" to="/dashboard" />
          <SidebarLink icon={Users} label="Minha Rede" to="/dashboard/network" />
          <SidebarLink icon={Wallet} label="Financeiro" to="/dashboard/financial" />
          <SidebarLink icon={ShoppingCart} label="Delivery" to="/" />
          <SidebarLink icon={PieChart} label="Relatórios" to="/dashboard/reports" />
          <SidebarLink icon={Settings} label="Configurações" active />
        </nav>

        <div className="p-6">
          <Link to="/login" className="flex items-center gap-3 w-full p-4 text-text-muted hover:text-red-400 transition-colors font-black text-xs uppercase tracking-widest">
            <LogOut size={18} /> Sair da Conta
          </Link>

        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 min-h-screen">
        {/* Header */}
        <header className="h-20 glass-card mx-6 mt-6 flex items-center justify-between px-8 border border-white/5">
          <div className="flex items-center gap-4 flex-1">
             <h2 className="text-xl font-black uppercase tracking-widest">Configurações</h2>
          </div>

          <div className="flex items-center gap-6">
            <button className="relative p-2 text-text-muted hover:text-primary transition-colors">
              <Bell size={22} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-surface-border">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black uppercase">Miguel Oliveira</p>
                <p className="text-[10px] text-primary font-bold">ID: CASARAO007</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-surface border border-surface-border flex items-center justify-center overflow-hidden">
                <img src="https://ui-avatars.com/api/?name=Miguel+Oliveira&background=00E5FF&color=0B0E14&bold=true" alt="Avatar" />
              </div>
            </div>
          </div>
        </header>

        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-8">
             {/* Tab Navigation */}
             <div className="lg:w-64 space-y-2">
                {TABS.map((tab) => (
                   <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all ${
                      activeTab === tab.id 
                        ? 'bg-primary text-background shadow-lg glow-primary font-black' 
                        : 'text-text-muted hover:text-white hover:bg-surface'
                    }`}
                   >
                      <tab.icon size={18} />
                      <span className="text-sm uppercase tracking-widest">{tab.label}</span>
                   </button>
                ))}
             </div>

             {/* Tab Content */}
             <div className="flex-1 max-w-3xl">
                {activeTab === 'profile' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                     <div className="glass-card p-8 border-white/5">
                        <div className="flex items-center gap-6 mb-8">
                           <div className="relative group">
                              <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-primary/20">
                                 <img src="https://ui-avatars.com/api/?name=Miguel+Oliveira&background=00E5FF&color=0B0E14&bold=true" alt="Profile" />
                              </div>
                              <button className="absolute -bottom-2 -right-2 p-2 bg-primary text-background rounded-xl shadow-lg hover:scale-110 transition-all">
                                 <Camera size={16} />
                              </button>
                           </div>
                           <div>
                              <h3 className="text-xl font-black">Miguel Oliveira</h3>
                              <p className="text-text-muted text-sm uppercase font-bold tracking-tighter">Membro desde Abril 2026</p>
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-text-muted ml-1">Nome Completo</label>
                              <input type="text" defaultValue="Miguel Oliveira" className="w-full bg-background border border-surface-border rounded-xl py-3 px-4 outline-none focus:border-primary/50 text-sm" />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-text-muted ml-1">E-mail</label>
                              <input type="email" defaultValue="miguel@email.com" className="w-full bg-background border border-surface-border rounded-xl py-3 px-4 outline-none focus:border-primary/50 text-sm" />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-text-muted ml-1">Telefone</label>
                              <input type="text" defaultValue="(11) 99999-9999" className="w-full bg-background border border-surface-border rounded-xl py-3 px-4 outline-none focus:border-primary/50 text-sm" />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-text-muted ml-1">CPF</label>
                              <input type="text" defaultValue="***.***.***-**" disabled className="w-full bg-background/50 border border-surface-border rounded-xl py-3 px-4 outline-none text-text-muted text-sm cursor-not-allowed" />
                           </div>
                        </div>

                        <button className="mt-8 bg-primary text-background px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg glow-primary hover:scale-105 transition-all">
                           Salvar Alterações
                        </button>
                     </div>
                  </motion.div>
                )}

                {activeTab === 'security' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                     <div className="glass-card p-8 border-white/5">
                        <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                           <Shield className="text-primary" size={24} /> Alterar Senha
                        </h3>
                        <div className="space-y-4 max-w-md">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-text-muted ml-1">Senha Atual</label>
                              <input type="password" placeholder="••••••••" className="w-full bg-background border border-surface-border rounded-xl py-3 px-4 outline-none focus:border-primary/50 text-sm" />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-text-muted ml-1">Nova Senha</label>
                              <input type="password" placeholder="••••••••" className="w-full bg-background border border-surface-border rounded-xl py-3 px-4 outline-none focus:border-primary/50 text-sm" />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-text-muted ml-1">Confirmar Nova Senha</label>
                              <input type="password" placeholder="••••••••" className="w-full bg-background border border-surface-border rounded-xl py-3 px-4 outline-none focus:border-primary/50 text-sm" />
                           </div>
                        </div>
                        <button className="mt-8 bg-primary text-background px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg glow-primary">
                           Atualizar Senha
                        </button>
                     </div>

                     <div className="glass-card p-8 border-white/5 flex items-center justify-between">
                        <div>
                           <h3 className="text-lg font-black mb-1">Autenticação de Dois Fatores (2FA)</h3>
                           <p className="text-sm text-text-muted">Adicione uma camada extra de segurança à sua conta.</p>
                        </div>
                        <div className="w-12 h-6 bg-surface border border-surface-border rounded-full relative cursor-pointer group">
                           <div className="absolute top-1 left-1 w-4 h-4 bg-text-muted rounded-full group-hover:bg-white transition-all" />
                        </div>
                     </div>
                  </motion.div>
                )}

                {activeTab === 'network' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                     <div className="glass-card p-8 border-white/5">
                        <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                           <Target className="text-primary" size={24} /> Preferência de Lado (Derramamento)
                        </h3>
                        <p className="text-sm text-text-muted mb-8">Defina para qual lado novas indicações diretas serão posicionadas na sua rede.</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                           {['Esquerda', 'Automático', 'Direita'].map((side) => (
                              <button 
                                key={side}
                                className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                                  side === 'Automático' 
                                    ? 'border-primary bg-primary/5 shadow-[0_0_20px_rgba(0,229,255,0.1)]' 
                                    : 'border-surface-border hover:border-white/20'
                                }`}
                              >
                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center ${side === 'Automático' ? 'bg-primary text-background' : 'bg-surface text-text-muted'}`}>
                                    {side === 'Automático' ? <Check size={18} /> : null}
                                 </div>
                                 <span className="text-xs font-black uppercase tracking-widest">{side}</span>
                              </button>
                           ))}
                        </div>
                     </div>

                     <div className="glass-card p-8 border-white/5">
                        <h3 className="text-lg font-black mb-4">Link de Indicação</h3>
                        <div className="flex gap-4">
                           <input type="text" readOnly defaultValue="casarao.com.br/clube/CASARAO007" className="flex-1 bg-background border border-surface-border rounded-xl py-3 px-4 outline-none text-text-muted text-sm font-mono" />
                           <button className="bg-surface border border-surface-border text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-surface-hover transition-all">
                              Copiar
                           </button>
                        </div>
                     </div>
                  </motion.div>
                )}

                {activeTab === 'payment' && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                     <div className="glass-card p-8 border-white/5">
                        <h3 className="text-xl font-black mb-6 flex items-center gap-3">
                           <CreditCard className="text-primary" size={24} /> Dados de Recebimento
                        </h3>
                        <p className="text-sm text-text-muted mb-8">Configure sua chave PIX para receber seus ganhos e comissões.</p>
                        
                        <div className="space-y-6 max-w-md">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-text-muted ml-1">Tipo de Chave</label>
                              <select className="w-full bg-background border border-surface-border rounded-xl py-3 px-4 outline-none focus:border-primary/50 text-sm appearance-none cursor-pointer">
                                 <option>CPF</option>
                                 <option>E-mail</option>
                                 <option>Celular</option>
                                 <option>Chave Aleatória</option>
                              </select>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-text-muted ml-1">Chave PIX</label>
                              <input type="text" placeholder="Insira sua chave" className="w-full bg-background border border-surface-border rounded-xl py-3 px-4 outline-none focus:border-primary/50 text-sm" />
                           </div>
                        </div>

                        <div className="mt-8 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex gap-4">
                           <div className="p-2 h-fit bg-amber-500/20 rounded-lg text-amber-500">
                              <Shield size={16} />
                           </div>
                           <p className="text-[10px] text-amber-500/80 font-bold leading-relaxed uppercase tracking-wider">
                              Por segurança, alterações nos dados de pagamento podem levar até 48h para serem validadas pela nossa equipe financeira.
                           </p>
                        </div>

                        <button className="mt-8 bg-primary text-background px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg glow-primary">
                           Salvar Dados Pix
                        </button>
                     </div>
                  </motion.div>
                )}
             </div>
          </div>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 w-full glass z-50 flex items-center justify-around py-3 px-4">
        <MobileNavLink icon={LayoutDashboard} label="Home" to="/dashboard" />
        <MobileNavLink icon={Users} label="Rede" to="/dashboard/network" />
        <MobileNavLink icon={Wallet} label="Saldo" to="/dashboard/financial" />
        <MobileNavLink icon={Settings} label="Config" active />
      </nav>
    </div>
  );
}

function SidebarLink({ icon: Icon, label, active, to = '#' }: any) {
  return (
    <Link 
      to={to}
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

function MobileNavLink({ icon: Icon, label, active, to = '#' }: any) {
  return (
    <Link to={to} className={`flex flex-col items-center gap-1 p-2 ${active ? 'text-primary' : 'text-text-muted'}`}>
      <Icon size={20} />
      <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
    </Link>
  );
}
