import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  MapPin, 
  CreditCard, 
  QrCode, 
  Banknote, 
  ChevronRight, 
  CheckCircle2, 
  ShoppingCart,
  Clock,
  ShieldCheck,
  Plus,
  Wallet,
  Truck,
  Loader2,
  X
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { isStoreCurrentlyOpen } from '../utils/storeHours';
import { calculateFeeForAddressObj } from '../utils/deliveryCalculator';

import AppLogo from '../components/AppLogo';

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, cartTotal, discountAmount, appliedCoupon, clearCart } = useCart();
  const { profile: authProfile } = useAuth();
  const isAdminDemo = localStorage.getItem('admin_auth') === 'true';

  const [showGuestModal, setShowGuestModal] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestAddress, setGuestAddress] = useState('');
  const [guestNumber, setGuestNumber] = useState('');
  const [guestComplement, setGuestComplement] = useState('');
  const [guestNeighborhood, setGuestNeighborhood] = useState('');
  const [guestCity, setGuestCity] = useState('');
  const [guestZipcode, setGuestZipcode] = useState('');
  const [guestProfile, setGuestProfile] = useState<any | null>(null);

  // Obter perfil real do usuário ou do visitante, usando fallback do localStorage para endereço
  const rawProfile = authProfile || guestProfile;
  
  let localAddressObj: any = null;
  try {
    const saved = localStorage.getItem('delivery.userAddress');
    if (saved) localAddressObj = JSON.parse(saved);
  } catch {}

  const profile = rawProfile ? {
    ...rawProfile,
    address: rawProfile.address || localAddressObj?.address || 'Rua Maria Estela de Souza',
    number: rawProfile.number || localAddressObj?.number || '262',
    complement: rawProfile.complement || localAddressObj?.complement || '',
    neighborhood: rawProfile.neighborhood || localAddressObj?.neighborhood || 'Bernardo Valadares',
    city: rawProfile.city || localAddressObj?.city || 'Sete Lagoas',
    state: rawProfile.state || localAddressObj?.state || 'MG',
    zipcode: rawProfile.zipcode || localAddressObj?.zipcode || '35702-369'
  } : (isAdminDemo ? {
    id: 0,
    mocha_user_id: 'admin',
    email: 'weider.07@hotmail.com',
    full_name: 'WEIDER DE OLIVEIRA',
    role: 'admin',
    address: localAddressObj?.address || 'Rua Maria Estela de Souza',
    number: localAddressObj?.number || '262',
    complement: localAddressObj?.complement || '',
    neighborhood: localAddressObj?.neighborhood || 'Bernardo Valadares',
    city: localAddressObj?.city || 'Sete Lagoas',
    state: localAddressObj?.state || 'MG',
    zipcode: localAddressObj?.zipcode || '35702-369'
  } : null);

  const [step, setStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [observations, setObservations] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [isAddressSelected, setIsAddressSelected] = useState(false);
  const [needsChange, setNeedsChange] = useState<boolean>(false);
  const [changeForAmount, setChangeForAmount] = useState<string>('');

  // Geoloc e Taxa de Entrega Dinâmica
  const [calculatedDeliveryFee, setCalculatedDeliveryFee] = useState<number | null>(null);
  const [calculatingFee, setCalculatingFee] = useState(false);
  const [deliveryDistance, setDeliveryDistance] = useState<number | null>(null);
  const [storeOpen, setStoreOpen] = useState(true);
  const [deliverySettings, setDeliverySettings] = useState<{
    storeLat: number | null;
    storeLng: number | null;
    baseFee: number;
    rules: any[];
  }>({
    storeLat: null,
    storeLng: null,
    baseFee: 5.00,
    rules: []
  });

  const handleOpenGuestModal = () => {
    if (guestProfile) {
      setGuestName(guestProfile.full_name || '');
      setGuestPhone(guestProfile.phone || '');
      setGuestAddress(guestProfile.address || '');
      setGuestNumber(guestProfile.number || '');
      setGuestComplement(guestProfile.complement || '');
      setGuestNeighborhood(guestProfile.neighborhood || '');
      setGuestCity(guestProfile.city || '');
      setGuestZipcode(guestProfile.zipcode || '');
    }
    setShowGuestModal(true);
  };

  const handleSaveGuestAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !guestPhone.trim() || !guestAddress.trim() || !guestNumber.trim() || !guestNeighborhood.trim()) {
      toast.error('Preencha os campos obrigatórios (Nome, WhatsApp, Endereço, Número e Bairro).');
      return;
    }
    
    const newGuestProfile = {
      id: 9999,
      full_name: guestName,
      phone: guestPhone,
      address: guestAddress,
      number: guestNumber,
      complement: guestComplement,
      neighborhood: guestNeighborhood,
      city: guestCity || 'P4D Mídia',
      zipcode: guestZipcode,
      email: 'guest@appdelivery.com'
    };
    
    setGuestProfile(newGuestProfile);
    setIsAddressSelected(true);
    setShowGuestModal(false);
    toast.success('Endereço de entrega registrado!');
  };

  const [order, setOrder] = useState<any | null>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [supportWhatsapp, setSupportWhatsapp] = useState('');
  const [loadingOrder, setLoadingOrder] = useState(false);

  // Carregar configurações de entrega
  useEffect(() => {
    async function loadDeliverySettings() {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('key, value');

        if (error) throw error;
        if (data) {
          const latSetting = data.find(s => s.key === 'store_latitude');
          const lngSetting = data.find(s => s.key === 'store_longitude');
          const feeSetting = data.find(s => s.key === 'delivery_base_fee');
          const rulesSetting = data.find(s => s.key === 'delivery_rules');
          const openSetting = data.find(s => s.key === 'store_open');
          const whatsappSetting = data.find(s => s.key === 'support_whatsapp');

          if (whatsappSetting?.value) {
            setSupportWhatsapp(whatsappSetting.value);
          }

          let rules = [];
          if (rulesSetting?.value) {
            try {
              rules = JSON.parse(rulesSetting.value);
            } catch (e) {
              rules = [];
            }
          }

          setDeliverySettings({
            storeLat: latSetting?.value ? parseFloat(latSetting.value) : null,
            storeLng: lngSetting?.value ? parseFloat(lngSetting.value) : null,
            baseFee: feeSetting?.value ? parseFloat(feeSetting.value) : 5.00,
            rules
          });

          if (openSetting) {
            setStoreOpen(openSetting.value === 'true');
          }
        }
      } catch (err) {
        console.error('Erro ao carregar configurações de entrega:', err);
      }
    }
    loadDeliverySettings();
  }, []);

  const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const d = R * c; // Distance in km
    return d;
  };

  const calculateDynamicFee = async (addressObj: any) => {
    if (!addressObj || !addressObj.address) {
      setCalculatedDeliveryFee(deliverySettings.baseFee);
      setDeliveryDistance(null);
      return;
    }

    setCalculatingFee(true);
    try {
      const { fee, distanceKm } = await calculateFeeForAddressObj(addressObj, deliverySettings);
      setCalculatedDeliveryFee(fee);
      setDeliveryDistance(distanceKm);
    } catch (e) {
      console.error('Erro ao calcular taxa de entrega:', e);
      setCalculatedDeliveryFee(deliverySettings.baseFee);
      setDeliveryDistance(null);
    } finally {
      setCalculatingFee(false);
    }
  };

  useEffect(() => {
    if (profile?.address) {
      calculateDynamicFee(profile);
    } else {
      setCalculatedDeliveryFee(null);
      setDeliveryDistance(null);
    }
  }, [profile?.address, deliverySettings.storeLat]);

  const deliveryFee = cartItems.length > 0 
    ? (calculatedDeliveryFee !== null ? calculatedDeliveryFee : deliverySettings.baseFee) 
    : 0;
  
  const finalDiscountAmount = appliedCoupon?.type === 'shipping' ? deliveryFee : discountAmount;
  const total = Math.max(0, cartTotal + deliveryFee - finalDiscountAmount);

  useEffect(() => {
    if (profile?.address) {
      setIsAddressSelected(true);
    } else {
      setIsAddressSelected(false);
    }
  }, [profile?.address]);

  useEffect(() => {
    const status = searchParams.get('status') || searchParams.get('collection_status');
    const orderIdStr = searchParams.get('order_id') || searchParams.get('external_reference');

    if (status && orderIdStr) {
      const orderId = parseInt(orderIdStr, 10);
      
      const processPaymentResponse = async () => {
        if (status === 'approved' || status === 'success' && !searchParams.get('processed')) {
          const isReturningFromPayment = status === 'approved' || status === 'success' && searchParams.get('collection_status');
          
          if (isReturningFromPayment) {
            try {
              const { error } = await supabase
                .from('orders')
                .update({ status: 'preparando', updated_at: new Date().toISOString() })
                .eq('id', orderId);

              if (error) throw error;
              toast.success('Pagamento aprovado com sucesso!');
            } catch (err: any) {
              console.error('Erro ao atualizar status do pedido:', err);
              toast.error('Erro ao registrar confirmação de pagamento.');
            }
          }
        }
        
        setLoadingOrder(true);
        try {
          let foundOrder: any = null;
          let settingsRes: any = null;

          try {
            const [orderRes, setRes] = await Promise.all([
              supabase.from('orders').select('*').eq('id', orderId).maybeSingle(),
              supabase.from('system_settings').select('value').eq('key', 'support_whatsapp').maybeSingle()
            ]);
            if (orderRes && orderRes.data) foundOrder = orderRes.data;
            settingsRes = setRes;
          } catch {}

          // Fallback se não encontrar no Supabase ou se a tabela não existir
          if (!foundOrder) {
            const mockOrders = JSON.parse(localStorage.getItem('supabase.mock-orders') || '[]');
            foundOrder = mockOrders.find((o: any) => String(o.id) === String(orderId));
          }

          if (foundOrder) {
            setOrder(foundOrder);
            
            const savedItems = localStorage.getItem(`order_items_${orderId}`);
            if (savedItems) {
              setOrderItems(JSON.parse(savedItems));
            } else {
              try {
                const { data: dbItems } = await supabase
                  .from('order_items')
                  .select('*, products(name, main_image_url)')
                  .eq('order_id', orderId);
                if (dbItems && dbItems.length > 0) {
                  setOrderItems(dbItems.map((item: any) => ({
                    id: item.product_id,
                    name: item.products?.name || 'Pizza',
                    price: Number(item.price),
                    quantity: item.quantity,
                    image: item.products?.main_image_url || '',
                    ...item.customizations
                  })));
                }
              } catch {}
            }
            
            setIsSuccess(true);
          }
          
          if (settingsRes?.data?.value) {
            setSupportWhatsapp(settingsRes.data.value);
          }
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingOrder(false);
        }

        if (searchParams.get('collection_status') || searchParams.get('status') === 'approved') {
          setSearchParams({ status: 'success', order_id: orderIdStr }, { replace: true });
        }
      };

      processPaymentResponse();

      const syncOrderStatus = async () => {
        try {
          const { data } = await supabase.from('orders').select('*').eq('id', orderId).maybeSingle();
          if (data) {
            setOrder((prev: any) => {
              if (prev && prev.status !== data.status) {
                const statusLabels: Record<string, string> = {
                  'pendente': 'Aguardando aceite do estabelecimento',
                  'preparando': 'Em produção (preparando sua pizza)',
                  'entrega': 'Saiu para entrega',
                  'concluido': 'Entregue',
                  'cancelado': 'Pedido cancelado pelo estabelecimento'
                };
                toast.success(`Pedido #${orderId}: ${statusLabels[data.status] || data.status}`, { icon: '🍕', duration: 6000 });
              }
              return data;
            });
            return;
          }
        } catch {}

        const mockOrders = JSON.parse(localStorage.getItem('supabase.mock-orders') || '[]');
        const localFound = mockOrders.find((o: any) => String(o.id) === String(orderId));
        if (localFound) {
          setOrder((prev: any) => {
            if (prev && prev.status !== localFound.status) {
              const statusLabels: Record<string, string> = {
                'pendente': 'Aguardando aceite do estabelecimento',
                'preparando': 'Em produção (preparando sua pizza)',
                'entrega': 'Saiu para entrega',
                'concluido': 'Entregue',
                'cancelado': 'Pedido cancelado pelo estabelecimento'
              };
              toast.success(`Pedido #${orderId}: ${statusLabels[localFound.status] || localFound.status}`, { icon: '🍕', duration: 6000 });
            }
            return localFound;
          });
        }
      };

      const channel = supabase
        .channel(`order-tracking:${orderId}`)
        .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'orders',
          filter: `id=eq.${orderId}`
        }, (payload) => {
          const updatedOrder = payload.new;
          setOrder(updatedOrder);

          const statusLabels: Record<string, string> = {
            'pendente': 'Aguardando aceite do estabelecimento',
            'preparando': 'Em produção (preparando sua pizza)',
            'entrega': 'Saiu para entrega',
            'concluido': 'Entregue',
            'cancelado': 'Pedido cancelado pelo estabelecimento'
          };
          
          const newLabel = statusLabels[updatedOrder.status] || updatedOrder.status;
          toast.success(`Pedido #${orderId}: ${newLabel}`, {
            icon: '🍕',
            duration: 6000
          });
        })
        .subscribe();

      window.addEventListener('storage', syncOrderStatus);
      const pollTimer = setInterval(syncOrderStatus, 2000);

      return () => {
        supabase.removeChannel(channel);
        window.removeEventListener('storage', syncOrderStatus);
        clearInterval(pollTimer);
      };
    }
  }, [searchParams, setSearchParams, clearCart]);

  const handleFinish = async () => {
    if (!profile) {
      toast.error('Faça login para finalizar o pedido.');
      return;
    }

    if (!paymentMethod) {
      toast.error('Selecione uma forma de pagamento.');
      return;
    }

    if (paymentMethod === 'cash' && needsChange) {
      const val = parseFloat(changeForAmount);
      if (isNaN(val) || val < total) {
        toast.error(`Informe um valor de troco maior ou igual ao total do pedido (R$ ${total.toFixed(2)}).`);
        return;
      }
    }

    setIsProcessing(true);

    try {
      const { data: allSettings } = await supabase.from('system_settings').select('*');
      if (allSettings) {
        const sMap: any = {};
        allSettings.forEach(s => sMap[s.key] = s.value);
        const isOpenNow = isStoreCurrentlyOpen({
          operating_mode: sMap['operating_mode'] || 'auto',
          opening_time: sMap['opening_time'] || '18:00',
          closing_time: sMap['closing_time'] || '23:30',
          operating_days: sMap['operating_days'] || '[0,1,2,3,4,5,6]',
          store_open: sMap['store_open'] === 'true'
        });

        if (!isOpenNow) {
          throw new Error('O estabelecimento está fechado no momento. Desculpe pelo inconveniente!');
        }
      }
      const isGuest = !authProfile && !isAdminDemo;

      let changeObs = '';
      if (paymentMethod === 'cash') {
        if (needsChange && changeForAmount) {
          const val = parseFloat(changeForAmount);
          const changeVal = val - total;
          changeObs = ` [Dinheiro: Levar troco para R$ ${val.toFixed(2)} (Troco = R$ ${changeVal.toFixed(2)})]`;
        } else {
          changeObs = ` [Dinheiro: Não precisa de troco]`;
        }
      } else if (paymentMethod === 'pix') {
        changeObs = ` [PIX na Entrega]`;
      } else if (paymentMethod === 'card') {
        changeObs = ` [Cartão na Entrega]`;
      }

      const addressSummary = (isGuest ? `Nome: ${profile.full_name} | Tel: ${profile.phone} | ` : '') + (profile.address 
        ? `${profile.address}, ${profile.number}${profile.complement ? ` - ${profile.complement}` : ''} - ${profile.neighborhood}`
        : 'Não cadastrado') + changeObs + (observations.trim() ? ` (Obs: ${observations.trim()})` : '');

      let userId = profile.id;
      
      const { data: profileCheck } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (!profileCheck) {
        const { data: dbProfile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('email', profile.email)
          .maybeSingle();

        if (dbProfile) {
          userId = dbProfile.id;
        } else {
          const { data: adminProfile } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('email', 'admin@appdelivery.com.br')
            .maybeSingle();

          if (adminProfile) {
            userId = adminProfile.id;
          } else {
            const { data: fallbackProfile } = await supabase
              .from('user_profiles')
              .select('id')
              .limit(1)
              .maybeSingle();
            if (fallbackProfile) {
              userId = fallbackProfile.id;
            }
          }
        }
      }

      // 1. Tentar criar pedido com status pendente no Supabase
      let orderData: any = null;
      try {
        const { data, error } = await supabase
          .from('orders')
          .insert({
            user_id: userId || 1,
            status: 'pendente',
            total_amount: total,
            delivery_fee: deliveryFee,
            address_summary: addressSummary,
            payment_method: paymentMethod
          })
          .select()
          .single();

        if (!error && data) {
          orderData = data;
        }
      } catch (e) {
        console.warn('Erro ao salvar no Supabase (usando fallback local):', e);
      }

      // Se falhou no Supabase (tabela não criada ou erro de conexão), gerar pedido local com ID único
      if (!orderData) {
        orderData = {
          id: Math.floor(100000 + Math.random() * 900000),
          user_id: userId || 1,
          status: 'pendente',
          total_amount: total,
          delivery_fee: deliveryFee,
          address_summary: addressSummary,
          payment_method: paymentMethod,
          created_at: new Date().toISOString()
        };
      }

      // 2. Salvar os itens localmente para a tela de confirmação
      localStorage.setItem(`order_items_${orderData.id}`, JSON.stringify(cartItems));

      // Tentar salvar também no banco se a tabela existir
      try {
        const orderItemsPayload = cartItems.map(item => ({
          order_id: orderData.id,
          product_id: item.id,
          quantity: item.quantity,
          price: item.price,
          customizations: {
            size: item.size || null,
            border: item.border || null,
            halfAndHalf: item.halfAndHalf || null,
            extras: item.extras || null,
            observation: item.observation || null
          }
        }));

        const { error: itemErr } = await supabase.from('order_items').insert(orderItemsPayload);
        if (itemErr) {
          console.warn('Tabela order_items não disponível no Supabase (itens mantidos no cache local):', itemErr);
        }
      } catch (e) {
        console.warn('Tabela order_items não disponível no Supabase (itens mantidos no cache local):', e);
      }

      // 3. Salvar pedido no cache de mock-orders para garantia de exibição imediata
      const mockOrders = JSON.parse(localStorage.getItem('supabase.mock-orders') || '[]');
      const existingIdx = mockOrders.findIndex((o: any) => o.id === orderData.id);
      if (existingIdx !== -1) {
        mockOrders[existingIdx] = orderData;
      } else {
        mockOrders.unshift(orderData);
      }
      localStorage.setItem('supabase.mock-orders', JSON.stringify(mockOrders));

      // Limpar carrinho e avançar para confirmação do pedido
      clearCart();
      setIsProcessing(false);
      toast.success('Pedido enviado com sucesso! O motoboy levará o pagamento na entrega.');
      setSearchParams({ status: 'success', order_id: orderData.id.toString() }, { replace: true });
    } catch (error: any) {
      console.error('Erro ao finalizar pedido:', error);
      toast.error(error.message || 'Erro ao finalizar pedido.');
      setIsProcessing(false);
    }
  };

  if (loadingOrder) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-primary animate-spin" />
        <p className="text-text-muted font-black uppercase tracking-widest text-xs">Carregando Rastreamento...</p>
      </div>
    );
  }

  if (isSuccess && order) {
    const isCanceled = order.status === 'cancelado';
    
    const getStatusIndex = (status: string) => {
      switch (status) {
        case 'pendente': return 0;
        case 'preparando': return 1;
        case 'entrega': return 2;
        case 'concluido': return 3;
        default: return 0;
      }
    };
    
    const activeIndex = getStatusIndex(order.status);
    
    const timelineSteps = [
      { label: 'Confirmado', desc: 'Aguardando aceite do estabelecimento', statusKey: 'pendente' },
      { label: 'Na Cozinha', desc: 'Seu pedido está sendo preparado', statusKey: 'preparando' },
      { label: 'A Caminho', desc: 'Saiu para entrega', statusKey: 'entrega' },
      { label: 'Entregue', desc: 'Pedido entregue com sucesso', statusKey: 'concluido' }
    ];

    const getPaymentLabel = (method: string) => {
      switch (method) {
        case 'pix': return 'PIX (Mercado Pago)';
        case 'card': return 'Cartão (Mercado Pago)';
        case 'wallet': return 'Carteira (Saldo de Bônus)';
        case 'cash': return 'Dinheiro (na entrega)';
        case 'delivery': return 'Cartão (na entrega)';
        default: return method;
      }
    };

    const handleSendWhatsApp = () => {
      const itemsText = orderItems.length > 0
        ? orderItems.map(item => `- ${item.quantity}x ${item.name} (R$ ${(item.price * item.quantity).toFixed(2)})`).join('\n')
        : 'Itens do pedido (verifique com a loja)';
      
      const paymentText = getPaymentLabel(order.payment_method);
      
      let cleanAddress = order.address_summary;
      if (cleanAddress && cleanAddress.startsWith("Nome: ")) {
        cleanAddress = cleanAddress.replace("Nome: ", "*Nome:* ").replace(" | Tel: ", "\n*Tel:* ").replace(" | ", "\n*Endereço:* ");
      }
      
      const message = `Olá! Gostaria de confirmar meu pedido *#${order.id}* no Pizza Senna.\n\n` +
                      `*Itens do Pedido:*\n${itemsText}\n\n` +
                      `*Taxa de Entrega:* R$ ${Number(order.delivery_fee).toFixed(2)}\n` +
                      `*Total:* R$ ${Number(order.total_amount).toFixed(2)}\n\n` +
                      `*Forma de Pagamento:* ${paymentText}\n` +
                      `*Endereço de Entrega:* ${cleanAddress}\n\n` +
                      `Status Atual: *${order.status.toUpperCase()}*\n\n` +
                      `Agradeço desde já!`;
                      
      const encodedMessage = encodeURIComponent(message);
      const whatsappNumber = supportWhatsapp || '5511999999999';
      window.open(`https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodedMessage}`, '_blank');
    };

    return (
      <div className="min-h-screen bg-background text-text-main py-12 px-6 flex flex-col items-center">
        {/* Header */}
        <header className="w-full max-w-2xl mb-12 flex justify-between items-center">
          <AppLogo />
          <Link 
            to="/" 
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-text-muted hover:text-primary transition-colors"
          >
            Voltar para o Menu
          </Link>
        </header>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl space-y-8"
        >
          {/* Radar Status Tracker Card */}
          <div className="glass-card p-8 border-white/5 relative overflow-hidden flex flex-col items-center text-center">
            {/* Radar effect */}
            {!isCanceled && order.status !== 'concluido' && (
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full text-primary">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span className="text-[8px] font-black uppercase tracking-widest animate-pulse">Buscando atualizações...</span>
              </div>
            )}

            <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-2 text-glow">
              {isCanceled ? 'Pedido Cancelado' : order.status === 'concluido' ? 'Pedido Entregue!' : 'Acompanhe seu Pedido'}
            </h2>
            <p className="text-text-muted text-sm mb-8">
              {isCanceled ? 'Infelizmente seu pedido foi cancelado pelo estabelecimento.' : 
               order.status === 'concluido' ? 'Seu pedido foi entregue. Bom apetite!' :
               'Seu pedido está sendo processado em tempo real pelo restaurante.'}
            </p>

            {/* Canceled Notice */}
            {isCanceled ? (
              <div className="w-full p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider mb-6">
                Este pedido foi cancelado. Entre em contato com o suporte para maiores informações.
              </div>
            ) : (
              /* Timeline */
              <div className="w-full space-y-6 relative mb-8">
                {/* Connecting Line */}
                <div className="absolute left-[21px] top-6 bottom-6 w-0.5 bg-surface-border z-0" />
                
                {/* Filled Connecting Line */}
                <div 
                  className="absolute left-[21px] top-6 w-0.5 bg-primary z-0 transition-all duration-1000"
                  style={{ 
                    height: `${(activeIndex / 3) * 85}%`,
                    maxHeight: '85%'
                  }}
                />

                {timelineSteps.map((stepInfo, index) => {
                  const isDone = index < activeIndex;
                  const isActive = index === activeIndex;
                  const isPending = index > activeIndex;
                  
                  return (
                    <div key={index} className="flex items-start gap-6 relative z-10 text-left group">
                      {/* Checkpoint Dot */}
                      <div 
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-500 border ${
                          isActive 
                            ? 'bg-primary text-background border-primary shadow-[0_0_15px_rgba(0,229,255,0.6)] scale-110' 
                            : isDone 
                            ? 'bg-primary/20 text-primary border-primary/40' 
                            : 'bg-surface text-text-muted border-surface-border'
                        }`}
                      >
                        {index === 0 && <CheckCircle2 size={20} />}
                        {index === 1 && <Clock size={20} className={isActive ? 'animate-spin' : ''} style={{ animationDuration: isActive ? '3s' : '1s' }} />}
                        {index === 2 && <Truck size={20} className={isActive ? 'animate-bounce' : ''} />}
                        {index === 3 && <CheckCircle2 size={20} />}
                      </div>
                      
                      {/* Step Text */}
                      <div className="flex-1 py-1">
                        <h4 className={`text-sm font-black uppercase tracking-wider transition-colors ${
                          isActive ? 'text-primary' : isDone ? 'text-text-main' : 'text-text-muted'
                        }`}>
                          {stepInfo.label}
                        </h4>
                        <p className={`text-[10px] uppercase font-bold tracking-widest ${
                          isActive ? 'text-text-main animate-pulse' : 'text-text-muted'
                        }`}>
                          {stepInfo.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quick Actions */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <button 
                onClick={handleSendWhatsApp}
                className="w-full bg-emerald-500 text-background py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-2 cursor-pointer hover:bg-emerald-400"
              >
                Enviar via WhatsApp
              </button>
              <Link 
                to="/" 
                className="w-full glass py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-surface-hover hover:scale-[1.02] transition-all"
              >
                Ir para o Menu
              </Link>
            </div>
          </div>

          {/* Order Details Card */}
          <div className="glass-card p-8 border-white/5 space-y-6">
             <h3 className="text-xl font-black italic uppercase tracking-tighter border-b border-surface-border pb-4">
                Detalhes do Pedido #<span className="text-primary">{order.id}</span>
             </h3>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                <div>
                   <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">Endereço de Entrega</p>
                   <p className="font-bold text-white mt-1">
                      {order.address_summary && order.address_summary.startsWith("Nome: ") 
                        ? order.address_summary.split(" | ").slice(2).join(" | ")
                        : order.address_summary}
                   </p>
                </div>
                <div>
                   <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">Forma de Pagamento</p>
                    <p className="font-bold text-text-main mt-1">{getPaymentLabel(order.payment_method)}</p>
                </div>
                <div>
                   <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">Taxa de Entrega</p>
                    <p className="font-bold text-text-main mt-1">R$ {Number(order.delivery_fee).toFixed(2)}</p>
                </div>
                <div>
                   <p className="text-[10px] text-text-muted font-black uppercase tracking-widest">Total Geral</p>
                   <p className="font-bold text-secondary mt-1 text-lg">R$ {Number(order.total_amount).toFixed(2)}</p>
                </div>
             </div>
             
             {/* Order Items List */}
             {orderItems.length > 0 && (
                <div className="mt-8 pt-6 border-t border-surface-border">
                   <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mb-4">Itens Selecionados</p>
                   <div className="space-y-4">
                      {orderItems.map((item, idx) => (
                         <div key={idx} className="flex justify-between items-center">
                            <p className="text-xs font-bold text-text-main">
                               <span className="text-primary font-black mr-2">{item.quantity}x</span> 
                               {item.name}
                            </p>
                            <span className="text-xs font-black text-text-muted">
                               R$ {(item.price * item.quantity).toFixed(2)}
                            </span>
                         </div>
                      ))}
                   </div>
                </div>
             )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-text-main pb-12">
      {/* Header */}
      <header className="glass h-20 flex items-center px-6 md:px-12 sticky top-0 z-50 justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2.5 bg-surface border border-surface-border rounded-xl text-text-muted hover:text-white transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <AppLogo />
        </div>
        <h1 className="text-xl font-black italic uppercase tracking-tighter hidden sm:block">Checkout</h1>
      </header>

      <main className="max-w-6xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column: Forms */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Step 1: Delivery Address */}
          <section className="glass-card p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <MapPin size={20} />
                </div>
                <h3 className="text-lg font-black italic uppercase tracking-tighter">Endereço de Entrega</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {profile?.address ? (
                   <button 
                      type="button"
                      onClick={() => setIsAddressSelected(!isAddressSelected)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-4 relative overflow-hidden group ${
                         isAddressSelected 
                           ? 'bg-primary/10 border-primary shadow-lg' 
                           : 'bg-surface border-surface-border hover:border-white/20'
                      }`}
                   >
                      <div className="absolute top-0 right-0 w-16 h-16 bg-primary/5 rounded-bl-full -mr-4 -mt-4 transition-all group-hover:scale-150" />
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                         isAddressSelected ? 'bg-primary text-background' : 'bg-background text-text-muted'
                      }`}>
                         <MapPin size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                         <p className={`font-bold text-sm ${isAddressSelected ? 'text-primary' : 'text-text-main'}`}>Principal</p>
                         <p className="text-[10px] text-text-muted truncate uppercase tracking-widest mt-1">
                            {profile.address}, {profile.number}{profile.complement ? ` - ${profile.complement}` : ''} - {profile.neighborhood}
                         </p>
                      </div>
                      {isAddressSelected ? (
                         <CheckCircle2 className="text-primary flex-shrink-0" size={20} />
                      ) : (
                         <div className="w-5 h-5 rounded-full border border-surface-border flex items-center justify-center flex-shrink-0" />
                      )}
                   </button>
                ) : (
                   <div className="p-4 rounded-2xl border border-surface-border border-dashed flex flex-col items-center justify-center gap-2 text-text-muted text-center">
                      <MapPin size={20} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Nenhum Endereço</span>
                      <span className="text-[8px] opacity-75">Cadastre clicando no botão ao lado.</span>
                   </div>
                )}

                {!authProfile ? (
                  <button 
                    type="button"
                    onClick={handleOpenGuestModal}
                    className="p-4 rounded-2xl border border-surface-border border-dashed flex items-center justify-center gap-3 text-text-muted hover:text-primary hover:border-primary transition-all"
                  >
                     <Plus size={20} />
                     <span className="text-[10px] font-black uppercase tracking-widest">Alterar / Novo</span>
                  </button>
                ) : (
                  <Link to="/profile" className="p-4 rounded-2xl border border-surface-border border-dashed flex items-center justify-center gap-3 text-text-muted hover:text-primary hover:border-primary transition-all">
                     <Plus size={20} />
                     <span className="text-[10px] font-black uppercase tracking-widest">Alterar / Novo</span>
                  </Link>
                )}
             </div>
          </section>

          {/* Step 2: Payment Method */}
          <section className="glass-card p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                <CreditCard size={20} />
              </div>
              <div>
                <h3 className="text-lg font-black italic uppercase tracking-tighter">Forma de Pagamento</h3>
                <p className="text-xs text-text-muted font-bold">O pagamento é feito diretamente ao nosso motoboy na entrega do seu pedido.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <PaymentOption 
                icon={QrCode} 
                label="PIX na Entrega" 
                selected={paymentMethod === 'pix'} 
                onClick={() => setPaymentMethod('pix')} 
                highlight
              />
              <PaymentOption 
                icon={CreditCard} 
                label="Cartão na Entrega" 
                selected={paymentMethod === 'card'} 
                onClick={() => setPaymentMethod('card')} 
              />
              <PaymentOption 
                icon={Banknote} 
                label="Dinheiro" 
                selected={paymentMethod === 'cash'} 
                onClick={() => setPaymentMethod('cash')} 
              />
            </div>

            {paymentMethod === 'pix' && (
               <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20"
               >
                  <p className="text-sm font-bold text-emerald-400 mb-1 flex items-center gap-2">
                     <QrCode size={18} /> Pagamento via PIX na Entrega
                  </p>
                  <p className="text-xs text-text-muted font-bold">
                     Nosso motoboy levará o QR Code / Chave PIX da pizzaria para você pagar no momento da entrega do pedido.
                  </p>
               </motion.div>
            )}

            {paymentMethod === 'card' && (
               <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-6 rounded-2xl bg-primary/10 border border-primary/20"
               >
                  <p className="text-sm font-bold text-primary mb-1 flex items-center gap-2">
                     <CreditCard size={18} /> Pagamento no Cartão na Entrega
                  </p>
                  <p className="text-xs text-text-muted font-bold">
                     O motoboy levará a maquininha de cartão (Débito ou Crédito) até a sua casa.
                  </p>
               </motion.div>
            )}

            {paymentMethod === 'cash' && (
               <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-4"
               >
                  <div className="flex items-center justify-between">
                     <p className="text-sm font-bold text-amber-400 flex items-center gap-2">
                        <Banknote size={18} /> Pagamento em Dinheiro na Entrega
                     </p>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-amber-500/20">
                     <label className="text-xs font-black uppercase tracking-wider text-text-main block">
                        Precisa de troco?
                     </label>
                     
                     <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => {
                            setNeedsChange(false);
                            setChangeForAmount('');
                          }}
                          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider border transition-all cursor-pointer ${
                            !needsChange 
                              ? 'bg-amber-500 text-background border-amber-500 shadow-md font-bold' 
                              : 'bg-background/50 border-surface-border text-text-muted hover:text-white'
                          }`}
                        >
                           Não preciso de troco
                        </button>

                        <button
                          type="button"
                          onClick={() => setNeedsChange(true)}
                          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider border transition-all cursor-pointer ${
                            needsChange 
                              ? 'bg-amber-500 text-background border-amber-500 shadow-md font-bold' 
                              : 'bg-background/50 border-surface-border text-text-muted hover:text-white'
                          }`}
                        >
                           Sim, preciso de troco
                        </button>
                     </div>

                     {needsChange && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-3 pt-2"
                        >
                           <label className="text-[11px] font-bold text-text-muted block">
                              Troco para quanto? (Digite o valor da nota que vai entregar ao motoboy)
                           </label>

                           <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-amber-400">R$</span>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="Ex: 50 ou 100"
                                value={changeForAmount}
                                onChange={(e) => setChangeForAmount(e.target.value)}
                                className="flex-1 bg-background border border-amber-500/40 rounded-xl py-3 px-4 text-sm font-bold text-text-main outline-none focus:border-amber-500"
                              />
                           </div>

                           <div className="flex gap-2 pt-1 flex-wrap">
                              {[50, 100, 150, 200].map(val => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => setChangeForAmount(val.toString())}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                    changeForAmount === val.toString()
                                      ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                                      : 'bg-background/50 border-surface-border text-text-muted hover:text-white'
                                  }`}
                                >
                                   R$ {val}
                                </button>
                              ))}
                           </div>

                           {changeForAmount && !isNaN(parseFloat(changeForAmount)) && (
                              <div className="p-3 bg-amber-500/10 rounded-xl text-xs font-bold text-amber-300">
                                 {parseFloat(changeForAmount) >= total ? (
                                    <span>
                                       💵 Troco a ser levado pelo motoboy: <strong className="text-white">R$ {(parseFloat(changeForAmount) - total).toFixed(2)}</strong>
                                    </span>
                                 ) : (
                                    <span className="text-red-400">
                                       ⚠️ O valor deve ser maior ou igual ao total do pedido (R$ {total.toFixed(2)}).
                                    </span>
                                 )}
                              </div>
                           )}
                        </motion.div>
                     )}
                  </div>
               </motion.div>
            )}

            {/* Campo de Observações */}
            <div className="mt-8 space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Observações do Pedido</label>
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Ex: Sem cebola, troco para R$ 100, ponto da massa, etc."
                rows={3}
                className="w-full bg-background border border-surface-border rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-primary/50 transition-all text-xs resize-none"
              />
            </div>
          </section>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-5">
           <div className="glass-card p-8 sticky top-32">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <ShoppingCart size={20} />
                </div>
                <h3 className="text-lg font-black italic uppercase tracking-tighter">Resumo do Pedido</h3>
              </div>

              <div className="space-y-4 mb-8 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-background border border-surface-border flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black truncate">{item.name}</p>
                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{item.quantity}x R$ {item.price.toFixed(2)}</p>
                      </div>
                    </div>
                    <span className="text-xs font-black">R$ {(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-6 border-t border-surface-border">
                <div className="flex justify-between text-xs font-bold text-text-muted uppercase tracking-widest">
                  <span>Subtotal</span>
                  <span>R$ {cartTotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-xs font-bold text-emerald-400 uppercase tracking-widest">
                    <span>Desconto {appliedCoupon ? `(${appliedCoupon.code})` : ''}</span>
                    <span>- R$ {discountAmount.toFixed(2)}</span>
                  </div>
                )}
                 <div className="flex justify-between text-xs font-bold text-text-muted uppercase tracking-widest">
                   <span>Taxa de Entrega {deliveryDistance !== null && `(${deliveryDistance.toFixed(1)} km)`}</span>
                   <span className="flex items-center gap-2">
                     {calculatingFee && <Loader2 size={12} className="animate-spin text-primary" />}
                     R$ {deliveryFee.toFixed(2)}
                   </span>
                 </div>
                <div className="flex justify-between text-2xl font-black pt-4 border-t border-white/5 italic">
                  <span>TOTAL</span>
                  <span className="text-primary text-glow">R$ {total.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                 {!profile ? (
                    <div className="flex items-center gap-2 p-3 bg-red-500/5 border border-red-500/20 rounded-xl text-red-500">
                       <ShieldCheck size={16} />
                       <span className="text-[10px] font-black uppercase tracking-widest">Faça Login ou adicione um endereço para Finalizar</span>
                    </div>
                 ) : !profile.address ? (
                   <div className="flex items-center gap-2 p-3 bg-red-500/5 border border-red-500/20 rounded-xl text-red-500">
                      <MapPin size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Cadastre um Endereço para Finalizar</span>
                   </div>
                 ) : !isAddressSelected ? (
                   <div className="flex items-center gap-2 p-3 bg-red-500/5 border border-red-500/20 rounded-xl text-red-500">
                      <MapPin size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Selecione o Endereço de Entrega acima</span>
                   </div>
                 ) : !paymentMethod ? (
                   <div className="flex items-center gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl text-amber-500">
                      <CreditCard size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Selecione uma Forma de Pagamento</span>
                   </div>
                 ) : cartItems.length === 0 ? (
                   <div className="flex items-center gap-2 p-3 bg-red-500/5 border border-red-500/20 rounded-xl text-red-500">
                      <ShoppingCart size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Seu Carrinho está Vazio</span>
                   </div>
                 ) : (
                   <div className="flex items-center gap-2 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-emerald-500">
                      <ShieldCheck size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Pagamento Seguro</span>
                   </div>
                 )}

                 <button 
                  disabled={!profile || !profile.address || !isAddressSelected || !paymentMethod || isProcessing || cartItems.length === 0}
                  onClick={handleFinish}
                  className="w-full bg-primary disabled:opacity-50 disabled:cursor-not-allowed text-background py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl glow-primary hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                 >
                    {isProcessing ? (
                       <div className="w-5 h-5 border-2 border-background border-t-transparent rounded-full animate-spin" />
                    ) : (
                       <>CONFIRMAR PEDIDO (PAGAR NA ENTREGA) <ChevronRight size={18} /></>
                    )}
                 </button>
              </div>
           </div>
        </div>
      </main>

       {/* Modal de Endereço de Visitante */}
       <AnimatePresence>
         {showGuestModal && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
             <motion.div
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               transition={{ type: 'spring', duration: 0.5 }}
               className="w-full max-w-lg bg-surface border border-surface-border rounded-3xl p-8 shadow-2xl relative overflow-y-auto max-h-[90vh] text-left"
             >
               <button 
                 type="button"
                 onClick={() => setShowGuestModal(false)}
                 className="absolute top-6 right-6 p-2 text-text-muted hover:text-white transition-all bg-white/5 rounded-full"
               >
                 <X size={16} />
               </button>

               <div className="mb-6">
                 <span className="text-[10px] font-black uppercase tracking-widest text-primary">Identificação e Entrega</span>
                 <h2 className="text-2xl font-black text-text-main mt-1">Dados de Entrega</h2>
                 <p className="text-[10px] text-text-muted font-bold mt-1">
                   Preencha os campos abaixo para podermos entregar seu pedido.
                 </p>
               </div>

               <form onSubmit={handleSaveGuestAddress} className="space-y-4">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-text-muted ml-1">Nome Completo *</label>
                   <input 
                     type="text" 
                     required
                     value={guestName} 
                     onChange={(e) => setGuestName(e.target.value)} 
                     placeholder="Seu nome completo"
                     className="w-full bg-background border border-surface-border rounded-2xl py-3 px-5 outline-none focus:border-primary/50 transition-all text-xs font-bold text-text-main" 
                   />
                 </div>

                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-text-muted ml-1">WhatsApp (Celular) *</label>
                   <input 
                     type="text" 
                     required
                     value={guestPhone} 
                     onChange={(e) => setGuestPhone(e.target.value)} 
                     placeholder="DDD + Celular (Ex: 11999999999)"
                     className="w-full bg-background border border-surface-border rounded-2xl py-3 px-5 outline-none focus:border-primary/50 transition-all text-xs font-bold text-text-main" 
                   />
                 </div>

                 <div className="grid grid-cols-3 gap-4">
                   <div className="col-span-2 space-y-2">
                     <label className="text-[10px] font-black uppercase text-text-muted ml-1">CEP</label>
                     <input 
                       type="text" 
                       value={guestZipcode} 
                       onChange={(e) => setGuestZipcode(e.target.value)} 
                       placeholder="Ex: 01000-000"
                       className="w-full bg-background border border-surface-border rounded-2xl py-3 px-5 outline-none focus:border-primary/50 transition-all text-xs font-bold text-text-main" 
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-text-muted ml-1">Número *</label>
                     <input 
                       type="text" 
                       required
                       value={guestNumber} 
                       onChange={(e) => setGuestNumber(e.target.value)} 
                       placeholder="Ex: 123"
                       className="w-full bg-background border border-surface-border rounded-2xl py-3 px-5 outline-none focus:border-primary/50 transition-all text-xs font-bold text-text-main" 
                     />
                   </div>
                 </div>

                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-text-muted ml-1">Endereço (Rua, Avenida) *</label>
                   <input 
                     type="text" 
                     required
                     value={guestAddress} 
                     onChange={(e) => setGuestAddress(e.target.value)} 
                     placeholder="Ex: Rua das Flores"
                     className="w-full bg-background border border-surface-border rounded-2xl py-3 px-5 outline-none focus:border-primary/50 transition-all text-xs font-bold text-text-main" 
                   />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-text-muted ml-1">Bairro *</label>
                     <input 
                       type="text" 
                       required
                       value={guestNeighborhood} 
                       onChange={(e) => setGuestNeighborhood(e.target.value)} 
                       placeholder="Ex: Centro"
                       className="w-full bg-background border border-surface-border rounded-2xl py-3 px-5 outline-none focus:border-primary/50 transition-all text-xs font-bold text-text-main" 
                     />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[10px] font-black uppercase text-text-muted ml-1">Complemento</label>
                     <input 
                       type="text" 
                       value={guestComplement} 
                       onChange={(e) => setGuestComplement(e.target.value)} 
                       placeholder="Ex: Apto 45"
                       className="w-full bg-background border border-surface-border rounded-2xl py-3 px-5 outline-none focus:border-primary/50 transition-all text-xs font-bold text-text-main" 
                     />
                   </div>
                 </div>

                 <div className="space-y-2">
                   <label className="text-[10px] font-black uppercase text-text-muted ml-1">Cidade</label>
                   <input 
                     type="text" 
                     value={guestCity} 
                     onChange={(e) => setGuestCity(e.target.value)} 
                     placeholder="Ex: Sete Lagoas"
                     className="w-full bg-background border border-surface-border rounded-2xl py-3 px-5 outline-none focus:border-primary/50 transition-all text-xs font-bold text-text-main" 
                   />
                 </div>

                 <div className="pt-4 flex gap-4">
                   <button
                     type="button"
                     onClick={() => setShowGuestModal(false)}
                     className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-text-main rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                   >
                     Cancelar
                   </button>
                   <button
                     type="submit"
                     className="flex-1 py-3 bg-primary text-background hover:bg-primary/90 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20"
                   >
                     Confirmar
                   </button>
                 </div>
               </form>
             </motion.div>
           </div>
         )}
       </AnimatePresence>
     </div>
   );
 }

function PaymentOption({ icon: Icon, label, selected, onClick, highlight = false, badge = "" }: any) {
  return (
    <button 
      onClick={onClick}
      className={`p-4 sm:p-6 rounded-2xl border transition-all flex flex-col items-center justify-center gap-3 relative overflow-hidden ${
        selected 
          ? 'bg-primary/10 border-primary shadow-lg' 
          : 'bg-surface border-surface-border hover:border-white/20'
      }`}
    >
      {badge && (
         <div className="absolute top-2 -right-6 bg-primary text-background text-[8px] font-black uppercase px-6 py-1 rotate-45 shadow-lg">
            {badge}
         </div>
      )}
      <div className={`p-3 rounded-xl ${selected ? 'bg-primary text-background' : 'bg-background text-text-muted'}`}>
         <Icon size={24} />
      </div>
      <span className={`text-[10px] font-black uppercase tracking-widest text-center ${selected ? 'text-primary' : 'text-text-muted'}`}>
         {label}
         {highlight && <span className="block text-[8px] text-emerald-500 mt-1 whitespace-nowrap">Recomendado</span>}
      </span>
    </button>
  );
}
