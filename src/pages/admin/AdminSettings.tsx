import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Settings, 
  Globe, 
  Percent, 
  Wallet, 
  ShieldCheck, 
  Save, 
  Loader2,
  AlertCircle,
  Smartphone,
  Mail,
  Instagram,
  Facebook,
  Database,
  Lock,
  History,
  TrendingUp,
  CreditCard,
  Zap
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

const TABS = [
  { id: 'geral', label: 'Geral', icon: Globe },
  { id: 'comissoes', label: 'Comissões', icon: Percent },
  { id: 'financeiro', label: 'Financeiro', icon: Wallet },
  { id: 'seguranca', label: 'Segurança & API', icon: ShieldCheck },
];

const DEFAULT_COMMISSIONS: any = {
  cliente: {
    l1: 10, l2: 0, l3: 0, l4: 0, l5: 0, l6: 0, l7: 0, l8: 0, l9: 0, l10: 0
  },
  empreendedor: {
    l1: 10, l2: 5, l3: 3, l4: 0, l5: 0, l6: 0, l7: 0, l8: 0, l9: 0, l10: 0
  },
  visionario: {
    l1: 10, l2: 5, l3: 3, l4: 2, l5: 1, l6: 1, l7: 1, l8: 1, l9: 0.5, l10: 0.5
  }
};

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('geral');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any[]>([]);
  const [cashbackConfig, setCashbackConfig] = useState<any[]>([]);
  
  const [selectedCommissionPlan, setSelectedCommissionPlan] = useState('visionario');
  const [planCommissions, setPlanCommissions] = useState<any>({ cliente: {}, empreendedor: {}, visionario: {} });
  const [planCommissionsActive, setPlanCommissionsActive] = useState<any>({ cliente: {}, empreendedor: {}, visionario: {} });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [settingsRes, cashbackRes] = await Promise.all([
        supabase.from('system_settings').select('*').order('key'),
        supabase.from('cashback_config').select('*').order('level'),
      ]);

      if (settingsRes.error) throw settingsRes.error;
      if (cashbackRes.error) throw cashbackRes.error;

      setSettings(settingsRes.data || []);
      setCashbackConfig(cashbackRes.data || []);

      const commissions: any = { cliente: {}, empreendedor: {}, visionario: {} };
      const commissionsActive: any = { cliente: {}, empreendedor: {}, visionario: {} };
      
      ['cliente', 'empreendedor', 'visionario'].forEach(plan => {
        for (let level = 1; level <= 10; level++) {
          const key = `commission_${plan}_l${level}`;
          const activeKey = `commission_${plan}_l${level}_active`;
          
          const setting = settingsRes.data?.find((s: any) => s.key === key);
          const activeSetting = settingsRes.data?.find((s: any) => s.key === activeKey);
          
          commissions[plan][`l${level}`] = setting ? parseFloat(setting.value) : DEFAULT_COMMISSIONS[plan][`l${level}`];
          commissionsActive[plan][`l${level}`] = activeSetting ? activeSetting.value === 'true' : (DEFAULT_COMMISSIONS[plan][`l${level}`] > 0);
        }
      });
      
      setPlanCommissions(commissions);
      setPlanCommissionsActive(commissionsActive);
    } catch (error: any) {
      toast.error('Erro ao carregar configurações: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
  };

  const updateCashback = (id: number, field: string, value: any) => {
    setCashbackConfig(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const saveSettings = async (keys: string[]) => {
    try {
      setSaving(true);
      const itemsToUpdate = settings.filter(s => keys.includes(s.key));
      
      const { error } = await supabase.from('system_settings').upsert(
        itemsToUpdate.map(s => ({
          key: s.key,
          value: s.value,
          description: s.description,
          updated_at: new Date().toISOString()
        })),
        { onConflict: 'key' }
      );

      if (error) throw error;
      toast.success('Configurações salvas com sucesso!');
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const saveCashback = async () => {
    try {
      setSaving(true);
      const { error } = await supabase.from('cashback_config').upsert(
        cashbackConfig.map(c => ({
          id: c.id,
          level: c.level,
          amount: c.amount,
          is_active: c.is_active,
          updated_at: new Date().toISOString()
        }))
      );

      if (error) throw error;
      toast.success('Regras de comissão atualizadas!');
    } catch (error: any) {
      toast.error('Erro ao salvar comissões: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const savePlanCommissions = async () => {
    try {
      setSaving(true);
      
      const payload: any[] = [];
      ['cliente', 'empreendedor', 'visionario'].forEach(plan => {
        for (let level = 1; level <= 10; level++) {
          const key = `commission_${plan}_l${level}`;
          const activeKey = `commission_${plan}_l${level}_active`;
          const value = planCommissions[plan]?.[`l${level}`] ?? DEFAULT_COMMISSIONS[plan][`l${level}`];
          const isActive = planCommissionsActive[plan]?.[`l${level}`] ?? (DEFAULT_COMMISSIONS[plan][`l${level}`] > 0);
          
          payload.push({
            key,
            value: value.toString(),
            description: `Comissão do plano ${plan} no nível ${level}`,
            updated_at: new Date().toISOString()
          });
          payload.push({
            key: activeKey,
            value: isActive.toString(),
            description: `Status da comissão do plano ${plan} no nível ${level}`,
            updated_at: new Date().toISOString()
          });
        }
      });

      const { error } = await supabase.from('system_settings').upsert(payload, { onConflict: 'key' });

      if (error) throw error;
      toast.success('Comissões por perfil salvas com sucesso!');
      
      fetchData();
    } catch (error: any) {
      toast.error('Erro ao salvar comissões: ' + error.message);
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
          <p className="text-text-muted text-sm">Ajuste as regras de negócio, limites e integrações da plataforma.</p>
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

              {activeTab === 'comissoes' && (
                <div className="space-y-6">
                  <SectionCard 
                    title="Níveis de Rede & Cashback por Perfil" 
                    icon={TrendingUp} 
                    onSave={savePlanCommissions}
                    saving={saving}
                    description="Configure as porcentagens de comissão para cada nível de acordo com o plano do patrocinador."
                  >
                    {/* Abas de Planos */}
                    <div className="flex bg-surface rounded-xl p-1 border border-surface-border mb-6 max-w-md">
                      {['cliente', 'empreendedor', 'visionario'].map((plan) => (
                        <button
                          key={plan}
                          type="button"
                          onClick={() => setSelectedCommissionPlan(plan)}
                          className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                            selectedCommissionPlan === plan 
                              ? 'bg-primary text-background shadow-lg' 
                              : 'text-text-muted hover:text-white'
                          }`}
                        >
                          {plan}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Array.from({ length: 10 }).map((_, i) => {
                        const level = i + 1;
                        const levelKey = `l${level}`;
                        const value = planCommissions[selectedCommissionPlan]?.[levelKey] ?? 0;
                        const isActive = planCommissionsActive[selectedCommissionPlan]?.[levelKey] ?? false;

                        return (
                          <div key={level} className="p-4 rounded-2xl bg-background border border-surface-border flex items-center justify-between group hover:border-primary/30 transition-all">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                                L{level}
                              </div>
                              <div>
                                <p className="text-[10px] font-black uppercase text-text-muted tracking-widest">Nível {level}</p>
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="number" 
                                    step="0.1"
                                    value={value}
                                    onChange={(e) => {
                                      const newVal = parseFloat(e.target.value) || 0;
                                      setPlanCommissions((prev: any) => ({
                                        ...prev,
                                        [selectedCommissionPlan]: {
                                          ...prev[selectedCommissionPlan],
                                          [levelKey]: newVal
                                        }
                                      }));
                                    }}
                                    className="w-16 bg-transparent border-none text-lg font-black text-white focus:ring-0 p-0"
                                  />
                                  <span className="text-primary font-black">%</span>
                                </div>
                              </div>
                            </div>
                            <button 
                              type="button"
                              onClick={() => {
                                setPlanCommissionsActive((prev: any) => ({
                                  ...prev,
                                  [selectedCommissionPlan]: {
                                    ...prev[selectedCommissionPlan],
                                    [levelKey]: !isActive
                                  }
                                }));
                              }}
                              className={`w-10 h-6 rounded-full relative transition-all ${isActive ? 'bg-primary' : 'bg-surface border border-surface-border'}`}
                            >
                              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isActive ? 'left-5' : 'left-1'}`} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </SectionCard>

                  <SectionCard 
                    title="Regras Globais de MLM" 
                    icon={Zap} 
                    onSave={() => saveSettings([
                      'max_network_levels', 
                      'mlm_enabled', 
                      'max_matrix_width', 
                      'min_points_to_activate',
                      'plan_levels_cliente',
                      'plan_levels_empreendedor',
                      'plan_levels_visionario'
                    ])}
                    saving={saving}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <SettingInput 
                        label="Máximo de Níveis Geral" 
                        value={getSetting('max_network_levels').value} 
                        onChange={(val: string) => updateSetting('max_network_levels', val)} 
                        type="number"
                      />
                      <SettingInput 
                        label="Largura da Matriz" 
                        value={getSetting('max_matrix_width').value} 
                        onChange={(val: string) => updateSetting('max_matrix_width', val)} 
                        type="number"
                      />
                      <SettingInput 
                        label="Pontos Mínimos para Ativação" 
                        value={getSetting('min_points_to_activate').value} 
                        onChange={(val: string) => updateSetting('min_points_to_activate', val)} 
                        type="number"
                      />
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-text-muted ml-1">Status do MLM</label>
                        <select 
                          value={getSetting('mlm_enabled').value} 
                          onChange={(e) => updateSetting('mlm_enabled', e.target.value)}
                          className="w-full bg-background border border-surface-border rounded-xl py-3 px-4 outline-none focus:border-primary/50 text-sm appearance-none cursor-pointer"
                        >
                          <option value="true">Ativado</option>
                          <option value="false">Desativado</option>
                        </select>
                      </div>
                      <SettingInput 
                        label="Níveis de Indicação - Cliente" 
                        value={getSetting('plan_levels_cliente').value || '0'} 
                        onChange={(val: string) => updateSetting('plan_levels_cliente', val)} 
                        type="number"
                      />
                      <SettingInput 
                        label="Níveis de Indicação - Empreendedor" 
                        value={getSetting('plan_levels_empreendedor').value || '3'} 
                        onChange={(val: string) => updateSetting('plan_levels_empreendedor', val)} 
                        type="number"
                      />
                      <SettingInput 
                        label="Níveis de Indicação - Visionário" 
                        value={getSetting('plan_levels_visionario').value || '7'} 
                        onChange={(val: string) => updateSetting('plan_levels_visionario', val)} 
                        type="number"
                      />
                    </div>
                  </SectionCard>
                </div>
              )}

              {activeTab === 'financeiro' && (
                <div className="space-y-6">
                  <SectionCard 
                    title="Regras de Saque" 
                    icon={Wallet} 
                    onSave={() => saveSettings(['min_withdrawal_amount', 'withdrawal_fee_percentage', 'withdrawal_fee'])}
                    saving={saving}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <SettingInput 
                        label="Saque Mínimo (R$)" 
                        value={getSetting('min_withdrawal_amount').value} 
                        onChange={(val: string) => updateSetting('min_withdrawal_amount', val)} 
                        type="number"
                      />
                      <SettingInput 
                        label="Taxa de Saque (%)" 
                        value={getSetting('withdrawal_fee_percentage').value} 
                        onChange={(val: string) => updateSetting('withdrawal_fee_percentage', val)} 
                        type="number"
                      />
                      <SettingInput 
                        label="Taxa Fixa (R$)" 
                        value={getSetting('withdrawal_fee').value} 
                        onChange={(val: string) => updateSetting('withdrawal_fee', val)} 
                        type="number"
                      />
                    </div>
                  </SectionCard>

                  <SectionCard 
                    title="Dados de Pagamento (Matriz)" 
                    icon={CreditCard} 
                    onSave={() => saveSettings(['matrix_cpf', 'matrix_pix_key'])}
                    saving={saving}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <SettingInput 
                        label="CPF/CNPJ da Matriz" 
                        value={getSetting('matrix_cpf').value} 
                        onChange={(val: string) => updateSetting('matrix_cpf', val)} 
                      />
                      <SettingInput 
                        label="Chave PIX da Matriz" 
                        value={getSetting('matrix_pix_key').value} 
                        onChange={(val: string) => updateSetting('matrix_pix_key', val)} 
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

function SettingInput({ label, value, onChange, type = 'text', icon: Icon }: any) {
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
        className="w-full bg-background border border-surface-border rounded-xl py-3 px-4 outline-none focus:border-primary/50 text-sm transition-all focus:ring-1 focus:ring-primary/20" 
      />
    </div>
  );
}
