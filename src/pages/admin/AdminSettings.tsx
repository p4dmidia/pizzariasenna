import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Settings, 
  Globe, 
  Save, 
  Loader2,
  Smartphone,
  Mail,
  Database,
  Lock,
  ShieldCheck,
  Store,
  Clock,
  MapPin
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

const TABS = [
  { id: 'geral', label: 'Geral', icon: Globe },
  { id: 'seguranca', label: 'Segurança & API', icon: ShieldCheck },
];

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('geral');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('key');

      if (error) throw error;
      setSettings(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar configurações: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => {
      const exists = prev.some(s => s.key === key);
      if (exists) {
        return prev.map(s => s.key === key ? { ...s, value } : s);
      }
      return [...prev, { key, value, description: '' }];
    });
  };

  const saveSettings = async (keys: string[]) => {
    try {
      setSaving(true);
      const itemsToUpdate = settings.filter(s => keys.includes(s.key));
      
      // Se algum item não estiver no array, garanta que seja adicionado com valor em branco
      keys.forEach(k => {
        if (!itemsToUpdate.some(s => s.key === k)) {
          itemsToUpdate.push({ key: k, value: '' });
        }
      });

      const { error } = await supabase.from('system_settings').upsert(
        itemsToUpdate.map(s => ({
          key: s.key,
          value: s.value || '',
          updated_at: new Date().toISOString()
        })),
        { onConflict: 'key' }
      );

      if (error) throw error;
      toast.success('Configurações salvas com sucesso!');
      fetchData();
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const getSetting = (key: string) => settings.find(s => s.key === key) || { value: '', description: '' };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-text-muted font-black uppercase tracking-widest text-xs">Carregando Configurações...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8 pb-12">
        <header>
          <h1 className="text-3xl font-black mb-2">Configurações do Sistema ⚙️</h1>
          <p className="text-text-muted text-sm">Ajuste as regras de negócio, limites de entrega e funcionamento da plataforma.</p>
        </header>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Tabs */}
          <aside className="lg:w-72 space-y-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${
                  activeTab === tab.id 
                    ? 'bg-primary text-background shadow-lg glow-primary font-black scale-105' 
                    : 'text-text-muted hover:text-white hover:bg-surface border border-transparent hover:border-surface-border'
                }`}
              >
                <tab.icon size={20} />
                <span className="text-xs uppercase tracking-widest">{tab.label}</span>
              </button>
            ))}
          </aside>

          {/* Content */}
          <div className="flex-1 max-w-4xl">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-8"
            >
              {activeTab === 'geral' && (
                <div className="space-y-6">
                  {/* Status da Loja e Funcionamento */}
                  <SectionCard 
                    title="Funcionamento & Entrega" 
                    icon={Store} 
                    onSave={() => saveSettings(['store_open', 'delivery_time_est', 'store_address'])}
                    saving={saving}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-text-muted ml-1 flex items-center gap-2">
                          <Store size={12} className="text-primary/50" /> Status da Loja
                        </label>
                        <select 
                          value={getSetting('store_open').value} 
                          onChange={(e) => updateSetting('store_open', e.target.value)}
                          className="w-full bg-background border border-surface-border rounded-xl py-3 px-4 outline-none focus:border-primary/50 text-sm cursor-pointer font-bold text-white appearance-none"
                        >
                          <option value="true">Aberta para pedidos</option>
                          <option value="false">Fechada temporariamente</option>
                        </select>
                      </div>
                      
                      <SettingInput 
                        label="Tempo Estimado de Entrega" 
                        value={getSetting('delivery_time_est').value} 
                        onChange={(val: string) => updateSetting('delivery_time_est', val)} 
                        icon={Clock}
                        placeholder="Ex: 35 - 50 min"
                      />
                      
                      <div className="md:col-span-2">
                        <SettingInput 
                          label="Endereço da Pizzaria" 
                          value={getSetting('store_address').value} 
                          onChange={(val: string) => updateSetting('store_address', val)} 
                          icon={MapPin}
                          placeholder="Ex: Av. Principal, 1234 - Centro"
                        />
                      </div>
                    </div>
                  </SectionCard>

                  {/* Informações do Site */}
                  <SectionCard 
                    title="Informações do Site" 
                    icon={Globe} 
                    onSave={() => saveSettings(['site_name', 'site_url'])}
                    saving={saving}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <SettingInput 
                        label="Nome do Site" 
                        value={getSetting('site_name').value} 
                        onChange={(val: string) => updateSetting('site_name', val)} 
                      />
                      <SettingInput 
                        label="URL do Site" 
                        value={getSetting('site_url').value} 
                        onChange={(val: string) => updateSetting('site_url', val)} 
                      />
                    </div>
                  </SectionCard>

                  {/* Canais de Suporte */}
                  <SectionCard 
                    title="Canais de Suporte" 
                    icon={Smartphone} 
                    onSave={() => saveSettings(['support_whatsapp', 'support_email'])}
                    saving={saving}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <SettingInput 
                        label="WhatsApp de Suporte" 
                        value={getSetting('support_whatsapp').value} 
                        onChange={(val: string) => updateSetting('support_whatsapp', val)} 
                        icon={Smartphone}
                      />
                      <SettingInput 
                        label="E-mail de Suporte" 
                        value={getSetting('support_email').value} 
                        onChange={(val: string) => updateSetting('support_email', val)} 
                        icon={Mail}
                      />
                    </div>
                  </SectionCard>
                </div>
              )}

              {activeTab === 'seguranca' && (
                <div className="space-y-6">
                  <SectionCard 
                    title="Segurança da Sessão" 
                    icon={Lock} 
                    onSave={() => saveSettings(['session_timeout', 'max_login_attempts'])}
                    saving={saving}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <SettingInput 
                        label="Timeout da Sessão (Min)" 
                        value={getSetting('session_timeout').value} 
                        onChange={(val: string) => updateSetting('session_timeout', val)} 
                        type="number"
                      />
                      <SettingInput 
                        label="Max Tentativas de Login" 
                        value={getSetting('max_login_attempts').value} 
                        onChange={(val: string) => updateSetting('max_login_attempts', val)} 
                        type="number"
                      />
                    </div>
                  </SectionCard>

                  <SectionCard 
                    title="Integrações & API" 
                    icon={Database} 
                    onSave={() => saveSettings(['google_analytics_id', 'webhook_secret'])}
                    saving={saving}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <SettingInput 
                        label="Google Analytics ID" 
                        value={getSetting('google_analytics_id').value} 
                        onChange={(val: string) => updateSetting('google_analytics_id', val)} 
                      />
                      <SettingInput 
                        label="Segredo do Webhook" 
                        value={getSetting('webhook_secret').value} 
                        onChange={(val: string) => updateSetting('webhook_secret', val)} 
                        type="password"
                      />
                    </div>
                  </SectionCard>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function SectionCard({ title, icon: Icon, children, onSave, saving, description }: any) {
  return (
    <div className="glass-card p-8 border-white/5 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[40px] rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-all" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 text-primary rounded-2xl">
            <Icon size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black">{title}</h3>
            {description && <p className="text-xs text-text-muted font-bold mt-1">{description}</p>}
          </div>
        </div>
        <button 
          onClick={onSave}
          disabled={saving}
          className="bg-primary text-background px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg glow-primary flex items-center gap-2 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>

      <div className="relative">
        {children}
      </div>
    </div>
  );
}

function SettingInput({ label, value, onChange, type = 'text', icon: Icon, placeholder }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase text-text-muted ml-1 flex items-center gap-2">
        {Icon && <Icon size={12} className="text-primary/50" />}
        {label}
      </label>
      <input 
        type={type} 
        value={value} 
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-background border border-surface-border rounded-xl py-3 px-4 outline-none focus:border-primary/50 text-sm transition-all focus:ring-1 focus:ring-primary/20 text-white font-bold" 
      />
    </div>
  );
}
