import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  MapPin,
  Ticket,
  Plus,
  Trash2,
  Edit,
  X,
  CheckCircle2,
  Copy,
  Search,
  Navigation
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';
import { DAYS_OF_WEEK, isStoreCurrentlyOpen } from '../../utils/storeHours';

const TABS = [
  { id: 'geral', label: 'Geral', icon: Globe },
  { id: 'cupons', label: 'Cupons', icon: Ticket },
  { id: 'seguranca', label: 'Segurança & API', icon: ShieldCheck },
];

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState('geral');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any[]>([]);

  // Coupons state
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);

  // Coupon form state
  const [couponCode, setCouponCode] = useState('');
  const [couponType, setCouponType] = useState<'percentage' | 'fixed' | 'shipping'>('percentage');
  const [couponValue, setCouponValue] = useState(0);
  const [couponDescription, setCouponDescription] = useState('');
  const [couponMinSubtotal, setCouponMinSubtotal] = useState(0);
  const [couponExpiresAt, setCouponExpiresAt] = useState('');
  const [couponIsActive, setCouponIsActive] = useState(true);

  // Address lookup & geocoding state
  const [loadingCep, setLoadingCep] = useState(false);
  const [loadingGeocode, setLoadingGeocode] = useState(false);

  const formatFullAddress = (street: string, number: string, neighborhood: string, city: string, state: string, cep: string, complement: string) => {
    let parts: string[] = [];
    if (street) parts.push(street + (number ? `, ${number}` : ''));
    if (complement) parts.push(complement);
    if (neighborhood) parts.push(neighborhood);
    if (city || state) parts.push(`${city || ''}${city && state ? ' - ' : ''}${state || ''}`);
    if (cep) parts.push(`CEP ${cep}`);
    return parts.join(', ');
  };

  const updateAddressPart = (field: string, val: string) => {
    updateSetting(field, val);

    const street = field === 'store_street' ? val : getSetting('store_street').value || '';
    const number = field === 'store_number' ? val : getSetting('store_number').value || '';
    const neighborhood = field === 'store_neighborhood' ? val : getSetting('store_neighborhood').value || '';
    const city = field === 'store_city' ? val : getSetting('store_city').value || '';
    const state = field === 'store_state' ? val : getSetting('store_state').value || '';
    const cep = field === 'store_cep' ? val : getSetting('store_cep').value || '';
    const complement = field === 'store_complement' ? val : getSetting('store_complement').value || '';

    const newFull = formatFullAddress(street, number, neighborhood, city, state, cep, complement);
    updateSetting('store_address', newFull);
  };

  const handleSearchCep = async (cepInput?: string) => {
    const rawCep = cepInput || getSetting('store_cep').value || '';
    const cleanCep = rawCep.replace(/\D/g, '');
    if (cleanCep.length !== 8) {
      toast.error('Informe um CEP válido com 8 dígitos (ex: 01001000).');
      return;
    }

    try {
      setLoadingCep(true);
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();

      if (data.erro) {
        toast.error('CEP não encontrado no ViaCEP.');
        return;
      }

      const formattedCep = cleanCep.replace(/^(\d{5})(\d{3})$/, '$1-$2');
      updateSetting('store_cep', formattedCep);
      updateSetting('store_street', data.logradouro || '');
      updateSetting('store_neighborhood', data.bairro || '');
      updateSetting('store_city', data.localidade || '');
      updateSetting('store_state', data.uf || '');

      const currentNum = getSetting('store_number').value || '';
      const currentComp = getSetting('store_complement').value || '';

      const fullAddr = formatFullAddress(
        data.logradouro || '',
        currentNum,
        data.bairro || '',
        data.localidade || '',
        data.uf || '',
        formattedCep,
        currentComp
      );
      updateSetting('store_address', fullAddr);
      toast.success('Endereço preenchido com sucesso pelo CEP!');
    } catch (err: any) {
      toast.error('Erro ao buscar CEP: ' + err.message);
    } finally {
      setLoadingCep(false);
    }
  };

  const handleGeocode = async () => {
    const street = getSetting('store_street').value;
    const number = getSetting('store_number').value;
    const city = getSetting('store_city').value;
    const state = getSetting('store_state').value;
    const fullAddress = getSetting('store_address').value;

    const query = [street, number, city, state, 'Brasil'].filter(Boolean).join(', ') || fullAddress;
    if (!query || query === 'Brasil') {
      toast.error('Preencha o endereço ou CEP da pizzaria primeiro.');
      return;
    }

    try {
      setLoadingGeocode(true);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat).toFixed(6);
        const lon = parseFloat(data[0].lon).toFixed(6);
        updateSetting('store_latitude', lat.toString());
        updateSetting('store_longitude', lon.toString());
        toast.success(`Coordenadas obtidas: Lat ${lat}, Lng ${lon}`);
      } else {
        toast.error('Coordenadas não localizadas automaticamente. Tente preencher Rua, Número e Cidade.');
      }
    } catch (err: any) {
      toast.error('Erro ao buscar coordenadas: ' + err.message);
    } finally {
      setLoadingGeocode(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchCoupons();
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

  const fetchCoupons = async () => {
    try {
      setLoadingCoupons(true);
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('id', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar cupons: ' + error.message);
    } finally {
      setLoadingCoupons(false);
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
      
      keys.forEach(k => {
        if (!itemsToUpdate.some(s => s.key === k)) {
          itemsToUpdate.push({ key: k, value: '' });
        }
      });

      const { error } = await supabase.from('system_settings').upsert(
        itemsToUpdate.map(s => ({
          key: s.key,
          value: s.value || ''
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

  const openCouponModal = (coupon: any = null) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setCouponCode(coupon.code);
      setCouponType(coupon.type);
      setCouponValue(Number(coupon.value));
      setCouponDescription(coupon.description || '');
      setCouponMinSubtotal(Number(coupon.min_subtotal || 0));
      setCouponExpiresAt(coupon.expires_at ? new Date(coupon.expires_at).toISOString().split('T')[0] : '');
      setCouponIsActive(coupon.is_active);
    } else {
      setEditingCoupon(null);
      setCouponCode('');
      setCouponType('percentage');
      setCouponValue(0);
      setCouponDescription('');
      setCouponMinSubtotal(0);
      setCouponExpiresAt('');
      setCouponIsActive(true);
    }
    setShowCouponModal(true);
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) {
      toast.error('O código do cupom é obrigatório.');
      return;
    }
    try {
      const payload = {
        code: couponCode.trim().toUpperCase(),
        type: couponType,
        value: Number(couponValue),
        description: couponDescription.trim(),
        min_subtotal: Number(couponMinSubtotal),
        expires_at: couponExpiresAt ? new Date(couponExpiresAt).toISOString() : null,
        is_active: couponIsActive
      };

      if (editingCoupon) {
        const { error } = await supabase
          .from('coupons')
          .update(payload)
          .eq('id', editingCoupon.id);
        if (error) throw error;
        toast.success('Cupom atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('coupons')
          .insert(payload);
        if (error) throw error;
        toast.success('Cupom criado com sucesso!');
      }
      setShowCouponModal(false);
      fetchCoupons();
    } catch (error: any) {
      toast.error('Erro ao salvar cupom: ' + error.message);
    }
  };

  const handleDeleteCoupon = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este cupom?')) return;
    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Cupom excluído com sucesso!');
      fetchCoupons();
    } catch (error: any) {
      toast.error('Erro ao excluir cupom: ' + error.message);
    }
  };

  const handleToggleCouponActive = async (id: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      if (error) throw error;
      toast.success('Status do cupom atualizado!');
      fetchCoupons();
    } catch (error: any) {
      toast.error('Erro ao atualizar status: ' + error.message);
    }
  };

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
                    onSave={() => saveSettings(['store_open', 'operating_mode', 'opening_time', 'closing_time', 'operating_days', 'delivery_time_est', 'store_cep', 'store_street', 'store_number', 'store_neighborhood', 'store_city', 'store_state', 'store_complement', 'store_address', 'store_latitude', 'store_longitude', 'delivery_base_fee', 'delivery_rules'])}
                    saving={saving}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-text-muted ml-1 flex items-center gap-2">
                          <Store size={12} className="text-primary/50" /> Modo de Funcionamento
                        </label>
                        <select 
                          value={getSetting('operating_mode').value || 'auto'} 
                          onChange={(e) => {
                            updateSetting('operating_mode', e.target.value);
                            if (e.target.value === 'manual_open') updateSetting('store_open', 'true');
                            if (e.target.value === 'manual_closed') updateSetting('store_open', 'false');
                          }}
                          className="w-full bg-background border border-surface-border rounded-xl py-3 px-4 outline-none focus:border-primary/50 text-sm cursor-pointer font-bold text-text-main appearance-none"
                        >
                          <option value="auto">⏱️ Automático (por Horário e Dias)</option>
                          <option value="manual_open">🟢 Manual: Forçar Loja Aberta</option>
                          <option value="manual_closed">🔴 Manual: Forçar Loja Fechada</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-text-muted ml-1 flex items-center gap-2">
                          Status Atual Em Tempo Real
                        </label>
                        <div className={`py-3 px-4 rounded-xl border text-xs font-black uppercase tracking-wider flex items-center justify-between ${
                          isStoreCurrentlyOpen({
                            operating_mode: getSetting('operating_mode').value || 'auto',
                            opening_time: getSetting('opening_time').value || '18:00',
                            closing_time: getSetting('closing_time').value || '23:30',
                            operating_days: getSetting('operating_days').value || '[0,1,2,3,4,5,6]',
                            store_open: getSetting('store_open').value === 'true'
                          }) 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          <span>
                            {isStoreCurrentlyOpen({
                              operating_mode: getSetting('operating_mode').value || 'auto',
                              opening_time: getSetting('opening_time').value || '18:00',
                              closing_time: getSetting('closing_time').value || '23:30',
                              operating_days: getSetting('operating_days').value || '[0,1,2,3,4,5,6]',
                              store_open: getSetting('store_open').value === 'true'
                            }) ? '● Loja Aberta Agora' : '● Loja Fechada Agora'}
                          </span>
                          <span className="text-[9px] opacity-70">
                            {getSetting('operating_mode').value === 'manual_open' ? 'Modo Manual' : getSetting('operating_mode').value === 'manual_closed' ? 'Modo Manual' : 'Modo Automático'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-text-muted ml-1 flex items-center gap-2">
                          <Clock size={12} className="text-primary/50" /> Horário de Abertura
                        </label>
                        <input 
                          type="time" 
                          value={getSetting('opening_time').value || '18:00'}
                          onChange={(e) => updateSetting('opening_time', e.target.value)}
                          className="w-full bg-background border border-surface-border rounded-xl py-3 px-4 outline-none focus:border-primary/50 text-sm font-bold text-text-main"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-text-muted ml-1 flex items-center gap-2">
                          <Clock size={12} className="text-primary/50" /> Horário de Fechamento
                        </label>
                        <input 
                          type="time" 
                          value={getSetting('closing_time').value || '23:30'}
                          onChange={(e) => updateSetting('closing_time', e.target.value)}
                          className="w-full bg-background border border-surface-border rounded-xl py-3 px-4 outline-none focus:border-primary/50 text-sm font-bold text-text-main"
                        />
                      </div>

                      <div className="md:col-span-2 space-y-2">
                        <label className="text-[10px] font-black uppercase text-text-muted ml-1">
                          Dias da Semana de Funcionamento
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {DAYS_OF_WEEK.map((d) => {
                            let currentDays: number[] = [0, 1, 2, 3, 4, 5, 6];
                            try {
                              const raw = getSetting('operating_days').value;
                              if (raw) currentDays = typeof raw === 'string' ? JSON.parse(raw) : raw;
                            } catch (e) {
                              currentDays = [0, 1, 2, 3, 4, 5, 6];
                            }

                            const isActive = currentDays.includes(d.id);

                            const toggleDay = () => {
                              let nextDays = [...currentDays];
                              if (isActive) {
                                nextDays = nextDays.filter(id => id !== d.id);
                              } else {
                                nextDays.push(d.id);
                              }
                              updateSetting('operating_days', JSON.stringify(nextDays));
                            };

                            return (
                              <button
                                key={d.id}
                                type="button"
                                onClick={toggleDay}
                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all border ${
                                  isActive 
                                    ? 'bg-primary text-background border-primary glow-primary' 
                                    : 'bg-background hover:bg-surface-hover text-text-muted border-surface-border'
                                }`}
                              >
                                {d.short}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div className="md:col-span-2">
                        <SettingInput 
                          label="Tempo Estimado de Entrega" 
                          value={getSetting('delivery_time_est').value} 
                          onChange={(val: string) => updateSetting('delivery_time_est', val)} 
                          icon={Clock}
                          placeholder="Ex: 35 - 50 min"
                        />
                      </div>

                      {/* Endereço Completo da Pizzaria */}
                      <div className="md:col-span-2 pt-4 border-t border-surface-border space-y-4">
                        <h4 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                          <MapPin size={16} /> Endereço da Pizzaria
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {/* CEP + Botão Buscar CEP */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-text-muted ml-1 flex items-center gap-2">
                              <MapPin size={12} className="text-primary/50" /> CEP da Pizzaria
                            </label>
                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                value={getSetting('store_cep').value} 
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateAddressPart('store_cep', val);
                                  const clean = val.replace(/\D/g, '');
                                  if (clean.length === 8) {
                                    handleSearchCep(clean);
                                  }
                                }}
                                placeholder="Ex: 01001-000"
                                className="w-full bg-background border border-surface-border rounded-xl py-3 px-4 outline-none focus:border-primary/50 text-sm font-bold text-text-main"
                              />
                              <button
                                type="button"
                                onClick={() => handleSearchCep()}
                                disabled={loadingCep}
                                className="px-4 py-3 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap disabled:opacity-50"
                              >
                                {loadingCep ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                                Buscar CEP
                              </button>
                            </div>
                          </div>

                          {/* Logradouro / Rua */}
                          <div className="sm:col-span-2 space-y-2">
                            <label className="text-[10px] font-black uppercase text-text-muted ml-1">
                              Rua / Logradouro
                            </label>
                            <input 
                              type="text" 
                              value={getSetting('store_street').value} 
                              onChange={(e) => updateAddressPart('store_street', e.target.value)}
                              placeholder="Ex: Av. Paulista"
                              className="w-full bg-background border border-surface-border rounded-xl py-3 px-4 outline-none focus:border-primary/50 text-sm font-bold text-text-main"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                          {/* Número */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-text-muted ml-1">
                              Número
                            </label>
                            <input 
                              type="text" 
                              value={getSetting('store_number').value} 
                              onChange={(e) => updateAddressPart('store_number', e.target.value)}
                              placeholder="Ex: 1234"
                              className="w-full bg-background border border-surface-border rounded-xl py-3 px-4 outline-none focus:border-primary/50 text-sm font-bold text-text-main"
                            />
                          </div>

                          {/* Complemento */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-text-muted ml-1">
                              Complemento
                            </label>
                            <input 
                              type="text" 
                              value={getSetting('store_complement').value} 
                              onChange={(e) => updateAddressPart('store_complement', e.target.value)}
                              placeholder="Ex: Loja 01"
                              className="w-full bg-background border border-surface-border rounded-xl py-3 px-4 outline-none focus:border-primary/50 text-sm font-bold text-text-main"
                            />
                          </div>

                          {/* Bairro */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-text-muted ml-1">
                              Bairro
                            </label>
                            <input 
                              type="text" 
                              value={getSetting('store_neighborhood').value} 
                              onChange={(e) => updateAddressPart('store_neighborhood', e.target.value)}
                              placeholder="Ex: Centro"
                              className="w-full bg-background border border-surface-border rounded-xl py-3 px-4 outline-none focus:border-primary/50 text-sm font-bold text-text-main"
                            />
                          </div>

                          {/* Cidade / UF */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-text-muted ml-1">
                              Cidade / UF
                            </label>
                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                value={getSetting('store_city').value} 
                                onChange={(e) => updateAddressPart('store_city', e.target.value)}
                                placeholder="Cidade"
                                className="flex-1 bg-background border border-surface-border rounded-xl py-3 px-3 outline-none focus:border-primary/50 text-sm font-bold text-text-main"
                              />
                              <input 
                                type="text" 
                                maxLength={2}
                                value={getSetting('store_state').value} 
                                onChange={(e) => updateAddressPart('store_state', e.target.value.toUpperCase())}
                                placeholder="UF"
                                className="w-14 bg-background border border-surface-border rounded-xl py-3 text-center outline-none focus:border-primary/50 text-sm font-bold text-text-main uppercase"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Endereço Completo Formatado */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-text-muted ml-1">
                            Endereço Formatado Completo (Exibido no aplicativo)
                          </label>
                          <input 
                            type="text" 
                            value={getSetting('store_address').value} 
                            onChange={(e) => updateSetting('store_address', e.target.value)}
                            placeholder="Ex: Av. Pizzaria Senna, 1234 - Centro, São Paulo - SP, CEP 01001-000"
                            className="w-full bg-background border border-surface-border rounded-xl py-3 px-4 outline-none focus:border-primary/50 text-sm font-bold text-text-main"
                          />
                        </div>
                      </div>

                      {/* Geolocalização e Entrega Dinâmica */}
                      <div className="md:col-span-2 pt-4 border-t border-surface-border space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                            <Navigation size={16} /> Geolocalização & Entrega Dinâmica
                          </h4>
                          <button
                            type="button"
                            onClick={handleGeocode}
                            disabled={loadingGeocode}
                            className="px-4 py-2 bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/20 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all disabled:opacity-50"
                          >
                            {loadingGeocode ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
                            Obter Coordenadas GPS pelo Endereço
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <SettingInput 
                            label="Latitude da Loja" 
                            value={getSetting('store_latitude').value} 
                            onChange={(val: string) => updateSetting('store_latitude', val)} 
                            placeholder="-23.550520"
                          />
                          <SettingInput 
                            label="Longitude da Loja" 
                            value={getSetting('store_longitude').value} 
                            onChange={(val: string) => updateSetting('store_longitude', val)} 
                            placeholder="-46.633308"
                          />
                          <SettingInput 
                            label="Taxa Base de Entrega (Fallback)" 
                            value={getSetting('delivery_base_fee').value} 
                            onChange={(val: string) => updateSetting('delivery_base_fee', val)} 
                            type="number"
                            placeholder="5.00"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-text-muted ml-1">
                            Regras de Entrega por Distância (Km)
                          </label>
                          <div className="space-y-3">
                            {(() => {
                              let rules = [];
                              try {
                                const rulesStr = getSetting('delivery_rules').value || '[]';
                                rules = JSON.parse(rulesStr);
                              } catch (e) {
                                rules = [];
                              }

                              const updateRules = (newRules: any[]) => {
                                updateSetting('delivery_rules', JSON.stringify(newRules));
                              };

                              const addRule = () => {
                                updateRules([...rules, { maxDistance: 5, fee: 7.00 }]);
                              };

                              const removeRule = (idx: number) => {
                                updateRules(rules.filter((_: any, i: number) => i !== idx));
                              };

                              const updateRuleField = (idx: number, field: string, val: number) => {
                                updateRules(rules.map((r: any, i: number) => i === idx ? { ...r, [field]: val } : r));
                              };

                              return (
                                <div className="space-y-3">
                                  {rules.map((rule: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-4 bg-background/50 border border-surface-border rounded-xl p-3">
                                      <div className="flex-1 flex items-center gap-2">
                                        <span className="text-xs text-text-muted font-bold whitespace-nowrap">Até</span>
                                        <input 
                                          type="number" 
                                          value={rule.maxDistance} 
                                          onChange={(e) => updateRuleField(idx, 'maxDistance', parseFloat(e.target.value) || 0)}
                                          className="w-full bg-background border border-surface-border rounded-lg py-1.5 px-3 text-xs text-text-main font-bold outline-none focus:border-primary/50" 
                                          placeholder="Distância"
                                        />
                                        <span className="text-xs text-text-muted font-bold">Km</span>
                                      </div>
                                      <div className="flex-1 flex items-center gap-2">
                                        <span className="text-xs text-text-muted font-bold whitespace-nowrap">Taxa R$</span>
                                        <input 
                                          type="number" 
                                          step="0.01"
                                          value={rule.fee} 
                                          onChange={(e) => updateRuleField(idx, 'fee', parseFloat(e.target.value) || 0)}
                                          className="w-full bg-background border border-surface-border rounded-lg py-1.5 px-3 text-xs text-text-main font-bold outline-none focus:border-primary/50" 
                                          placeholder="Valor"
                                        />
                                      </div>
                                      <button 
                                        type="button"
                                        onClick={() => removeRule(idx)}
                                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg border border-red-500/20 transition-all"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  ))}
                                  <button 
                                    type="button"
                                    onClick={addRule}
                                    className="w-full py-3.5 bg-surface-border/20 hover:bg-surface-border/40 border border-dashed border-surface-border text-text-muted hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                                  >
                                    + Adicionar Regra de Distância
                                  </button>
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
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

              {activeTab === 'cupons' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black">Gerenciador de Cupons 🎫</h3>
                      <p className="text-xs text-text-muted mt-1">Crie, ative e remova cupons de desconto para seus clientes.</p>
                    </div>
                    <button 
                      onClick={() => openCouponModal()}
                      className="bg-primary text-background px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg glow-primary flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                    >
                      <Plus size={16} /> Novo Cupom
                    </button>
                  </div>

                  {loadingCoupons ? (
                    <div className="flex justify-center py-20">
                      <Loader2 className="w-10 h-10 text-primary animate-spin" />
                    </div>
                  ) : (
                    <div className="glass-card overflow-hidden border-white/5">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-surface-border bg-surface/30">
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Cupom</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Tipo</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Desconto</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Mínimo</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Validade</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Status</th>
                            <th className="px-6 py-4"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-surface-border">
                          {coupons.map((c) => {
                            const isExpired = c.expires_at && new Date(c.expires_at) < new Date();
                            return (
                              <tr key={c.id} className="hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">
                                  <span className="text-sm font-black text-primary uppercase">{c.code}</span>
                                  {c.description && <p className="text-[10px] text-text-muted mt-0.5">{c.description}</p>}
                                </td>
                                <td className="px-6 py-4 text-xs font-bold text-text-muted uppercase">
                                  {c.type === 'percentage' ? 'Porcentagem' : c.type === 'fixed' ? 'Fixo' : 'Frete Grátis'}
                                </td>
                                <td className="px-6 py-4 text-sm font-black">
                                  {c.type === 'percentage' ? `${c.value}%` : c.type === 'fixed' ? `R$ ${Number(c.value).toFixed(2)}` : 'Entrega Grátis'}
                                </td>
                                <td className="px-6 py-4 text-sm text-text-muted">
                                  R$ {Number(c.min_subtotal || 0).toFixed(2)}
                                </td>
                                <td className="px-6 py-4 text-xs text-text-muted">
                                  {c.expires_at ? new Date(c.expires_at).toLocaleDateString('pt-BR') : 'Sem expiração'}
                                </td>
                                <td className="px-6 py-4">
                                  <button 
                                    onClick={() => handleToggleCouponActive(c.id, c.is_active)}
                                    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border cursor-pointer transition-all ${
                                      c.is_active && !isExpired
                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                                    }`}
                                  >
                                    {isExpired ? 'Expirado' : c.is_active ? 'Ativo' : 'Inativo'}
                                  </button>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex gap-2 justify-end">
                                    <button 
                                      onClick={() => openCouponModal(c)}
                                      className="p-2 text-text-muted hover:text-white transition-all bg-white/5 rounded-lg border border-white/5"
                                    >
                                      <Edit size={12} />
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteCoupon(c.id)}
                                      className="p-2 text-red-500 hover:text-white hover:bg-red-500/20 transition-all bg-red-500/10 rounded-lg border border-red-500/10"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {coupons.length === 0 && (
                            <tr>
                              <td colSpan={7} className="px-6 py-12 text-center text-text-muted">
                                Nenhum cupom cadastrado. Clique em Novo Cupom para começar!
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
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

      {/* Coupon Creation/Editing Modal */}
      <AnimatePresence>
        {showCouponModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-surface border border-surface-border rounded-3xl p-8 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowCouponModal(false)}
                className="absolute top-6 right-6 p-2 text-text-muted hover:text-white transition-all bg-white/5 rounded-full"
              >
                <X size={16} />
              </button>

              <h3 className="text-xl font-black mb-6">
                {editingCoupon ? 'Editar Cupom' : 'Criar Novo Cupom'}
              </h3>

              <form onSubmit={handleSaveCoupon} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <label className="text-[10px] font-black uppercase text-text-muted">Código do Cupom</label>
                    <input 
                      type="text"
                      required
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="EX: PIZZA10"
                      className="w-full bg-background border border-surface-border rounded-xl py-3 px-4 text-sm text-text-main font-bold outline-none focus:border-primary/50 uppercase"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-text-muted">Tipo de Desconto</label>
                    <select
                      value={couponType}
                      onChange={(e) => setCouponType(e.target.value as any)}
                      className="w-full bg-background border border-surface-border rounded-xl py-3 px-4 text-sm text-text-main font-bold outline-none focus:border-primary/50"
                    >
                      <option value="percentage">Porcentagem (%)</option>
                      <option value="fixed">Valor Fixo (R$)</option>
                      <option value="shipping">Frete Grátis</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-text-muted">Valor Desconto</label>
                    <input 
                      type="number"
                      required
                      min="0"
                      disabled={couponType === 'shipping'}
                      value={couponType === 'shipping' ? 0 : couponValue}
                      onChange={(e) => setCouponValue(parseFloat(e.target.value) || 0)}
                      className="w-full bg-background border border-surface-border rounded-xl py-3 px-4 text-sm text-text-main font-bold outline-none focus:border-primary/50 disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-text-muted">Subtotal Mínimo (R$)</label>
                    <input 
                      type="number"
                      required
                      min="0"
                      value={couponMinSubtotal}
                      onChange={(e) => setCouponMinSubtotal(parseFloat(e.target.value) || 0)}
                      className="w-full bg-background border border-surface-border rounded-xl py-3 px-4 text-sm text-text-main font-bold outline-none focus:border-primary/50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-text-muted">Validade</label>
                    <input 
                      type="date"
                      value={couponExpiresAt}
                      onChange={(e) => setCouponExpiresAt(e.target.value)}
                      className="w-full bg-background border border-surface-border rounded-xl py-3 px-4 text-sm text-text-main font-bold outline-none focus:border-primary/50"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-text-muted">Descrição / Regras</label>
                  <input 
                    type="text"
                    value={couponDescription}
                    onChange={(e) => setCouponDescription(e.target.value)}
                    placeholder="Ex: R$ 10 de desconto nas pizzas clássicas"
                    className="w-full bg-background border border-surface-border rounded-xl py-3 px-4 text-sm text-text-main font-bold outline-none focus:border-primary/50"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input 
                    type="checkbox"
                    id="is_active"
                    checked={couponIsActive}
                    onChange={(e) => setCouponIsActive(e.target.checked)}
                    className="w-4 h-4 rounded border-surface-border bg-background text-primary focus:ring-primary"
                  />
                  <label htmlFor="is_active" className="text-xs text-text-main font-bold uppercase select-none">
                    Cupom Ativo e Liberado
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowCouponModal(false)}
                    className="py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="py-3.5 bg-primary text-background hover:bg-primary/90 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/10 glow-primary"
                  >
                    Salvar Cupom
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
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
        className="w-full bg-background border border-surface-border rounded-xl py-3 px-4 outline-none focus:border-primary/50 text-sm transition-all focus:ring-1 focus:ring-primary/20 text-text-main font-bold" 
      />
    </div>
  );
}
