import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { calculateFeeForAddressObj } from '../utils/deliveryCalculator';
import { getPizzaSizePrice } from '../utils/pizzaCalculator';

export interface CartItem {
  id: number;
  uniqueKey: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  size?: string; // brotinho | media | grande
  border?: string; // none | catupiry | cheddar
  halfAndHalf?: {
    secondFlavorId: number;
    secondFlavorName: string;
    secondFlavorPrice: number;
  } | null;
  extras?: Array<{
    id: number;
    name: string;
    price: number;
  }>;
  combo_pizza_flavor?: any;
  combo_drink?: string;
  variation?: {
    id: string;
    name: string;
    price?: number;
  } | null;
  observation?: string;
  sauces?: string[];
}

export interface Coupon {
  code: string;
  type: 'percentage' | 'fixed' | 'shipping';
  value: number; // 15 for 15%, 10 for R$ 10, 5 for delivery fee
  minSubtotal?: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: any, customOptions?: any) => void;
  removeFromCart: (uniqueKey: string) => void;
  updateQuantity: (uniqueKey: string, delta: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  deliveryFee: number;
  appliedCoupon: Coupon | null;
  discountAmount: number;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem('delivery.cart');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [deliveryFee, setDeliveryFee] = useState<number>(0);

  useEffect(() => {
    async function updateFee() {
      if (cartItems.length === 0) {
        setDeliveryFee(0);
        return;
      }
      try {
        const { fee } = await calculateFeeForAddressObj(profile);
        setDeliveryFee(fee);
      } catch {
        setDeliveryFee(5.00);
      }
    }
    updateFee();
  }, [profile, cartItems.length]);

  React.useEffect(() => {
    localStorage.setItem('delivery.cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product: any, customOptions?: any) => {
    // Tratamento para Combos (categoria 3)
    if (product.category_id === 3) {
      const combo_pizza_flavor = customOptions?.combo_pizza_flavor || null;
      const combo_drink = customOptions?.combo_drink || null;
      const observation = customOptions?.observation || '';
      const finalPrice = product.promo_price ? Number(product.promo_price) : Number(product.price);
      
      const displayName = combo_pizza_flavor && combo_drink
        ? `${product.name} (Sabor: ${combo_pizza_flavor.name} • Bebida: ${combo_drink})`
        : product.name;
        
      const uniqueKey = `${product.id}-combo-${combo_pizza_flavor?.id || ''}-${combo_drink || ''}-${observation}`;
      
      setCartItems(prev => {
        const existing = prev.find(item => item.uniqueKey === uniqueKey);
        if (existing) {
          return prev.map(item => 
            item.uniqueKey === uniqueKey ? { ...item, quantity: item.quantity + (customOptions?.quantity || 1) } : item
          );
        }
        return [...prev, { 
          id: product.id, 
          uniqueKey,
          name: displayName, 
          price: finalPrice, 
          image: product.image || product.main_image_url,
          quantity: customOptions?.quantity || 1,
          combo_pizza_flavor,
          combo_drink,
          observation
        }];
      });
      toast.success(`${product.name} adicionado ao carrinho!`);
      return;
    }

    // Tratamento para Produtos com Variação (ex: Sabores de Bebidas, Sobremesas, etc)
    if (customOptions?.variation) {
      const variation = customOptions.variation;
      const variationExtra = Number(variation.price) > 0 ? Number(variation.price) : 0;
      const basePrice = product.promo_price ? Number(product.promo_price) : Number(product.price);
      const finalPrice = basePrice + variationExtra;
      const observation = customOptions?.observation || '';
      const displayName = `${product.name} (${variation.name})`;
      const uniqueKey = `${product.id}-var-${variation.id}-${observation}`;

      setCartItems(prev => {
        const existing = prev.find(item => item.uniqueKey === uniqueKey);
        if (existing) {
          return prev.map(item => 
            item.uniqueKey === uniqueKey ? { ...item, quantity: item.quantity + (customOptions?.quantity || 1) } : item
          );
        }
        return [...prev, { 
          id: product.id, 
          uniqueKey,
          name: displayName, 
          price: finalPrice, 
          image: product.image || product.main_image_url,
          quantity: customOptions?.quantity || 1,
          variation,
          observation
        }];
      });
      toast.success(`${displayName} adicionado ao carrinho!`);
      return;
    }

    const size = customOptions?.size || (product.category === 'pizzas' ? 'grande' : undefined);
    const border = customOptions?.border || 'none';
    const halfAndHalf = customOptions?.halfAndHalf || null;
    const extras = customOptions?.extras || [];
    const observation = customOptions?.observation || '';

    const isPizza = product.category === 'pizzas' || product.category_id === 1;
    let finalPrice = 0;

    if (isPizza) {
      const p1Price = getPizzaSizePrice(product, size || 'grande');
      finalPrice = p1Price.promo_price !== null ? p1Price.promo_price : p1Price.price;
    } else {
      finalPrice = product.promo_price ? Number(product.promo_price) : Number(product.price);
    }

    if (border === 'catupiry') finalPrice += 5.00;
    if (border === 'cheddar') finalPrice += 6.00;

    const extrasPrice = extras.reduce((acc: number, curr: any) => acc + Number(curr.price), 0);
    finalPrice += extrasPrice;

    let displayName = product.name;

    // Se for meio a meio
    if (halfAndHalf) {
      displayName = `Meio/Meio: ${product.name} e ${halfAndHalf.secondFlavorName}`;
      // Usar o preço da metade mais cara
      const p1Price = getPizzaSizePrice(product, size || 'grande');
      const baseFlavor1Price = p1Price.promo_price !== null ? p1Price.promo_price : p1Price.price;

      // Montar objeto mockado do flavor2 contendo seus campos e size_prices passados pelo modal
      const secondFlavorObj = {
        price: halfAndHalf.secondFlavorPrice,
        promo_price: halfAndHalf.secondFlavorPromoPrice,
        size_prices: halfAndHalf.secondFlavorSizePrices || null
      };
      
      const p2Price = getPizzaSizePrice(secondFlavorObj, size || 'grande');
      const baseFlavor2Price = p2Price.promo_price !== null ? p2Price.promo_price : p2Price.price;
      
      let basePrice = Math.max(baseFlavor1Price, baseFlavor2Price);

      finalPrice = basePrice;
      if (border === 'catupiry') finalPrice += 5.00;
      if (border === 'cheddar') finalPrice += 6.00;
      finalPrice += extrasPrice;
    }

    if (size) {
      const sizeLabel = size === 'pequena' ? 'Pequena (16cm)'
        : size === 'media' ? 'Média (20cm)'
        : size === 'grande' ? 'Grande (25cm)'
        : size === 'familia' ? 'Família (30cm)'
        : size === 'gigante' ? 'Gigante (35cm)'
        : size;
      displayName = `${displayName} (${sizeLabel})`;
    }

    const extrasKey = extras.map((e: any) => e.id).sort().join('-');
    const sauces: string[] = customOptions?.sauces || [];
    const saucesKey = (sauces || []).slice().sort().join('|');
    const uniqueKey = `${product.id}-${size || ''}-${border}-${halfAndHalf?.secondFlavorId || ''}-${extrasKey}-${saucesKey}-${observation}`;

    setCartItems(prev => {
      const existing = prev.find(item => item.uniqueKey === uniqueKey);
      if (existing) {
        return prev.map(item => 
          item.uniqueKey === uniqueKey ? { ...item, quantity: item.quantity + (customOptions?.quantity || 1) } : item
        );
      }
      return [...prev, { 
        id: product.id, 
        uniqueKey,
        name: displayName, 
        price: finalPrice, 
        image: product.image || product.main_image_url,
        quantity: customOptions?.quantity || 1,
        size,
        border,
        halfAndHalf,
        extras,
        observation,
        sauces
      }];
    });
    toast.success(`${product.name} adicionado ao carrinho!`);
  };

  const removeFromCart = (uniqueKey: string) => {
    setCartItems(prev => prev.filter(item => item.uniqueKey !== uniqueKey));
  };

  const updateQuantity = (uniqueKey: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.uniqueKey === uniqueKey) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const clearCart = () => {
    setCartItems([]);
    setAppliedCoupon(null);
  };

  const applyCoupon = async (code: string): Promise<boolean> => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      toast.error('Digite o código do cupom.');
      return false;
    }

    try {
      let coupon: any = null;

      // 1. Tentar buscar no Supabase
      try {
        const { data, error } = await supabase
          .from('coupons')
          .select('*')
          .eq('code', cleanCode)
          .eq('is_active', true)
          .maybeSingle();

        if (!error && data) {
          coupon = data;
        }
      } catch {
        coupon = null;
      }

      // 2. Se não encontrar no banco, buscar no cache local de cupons
      if (!coupon) {
        const mockCoupons = JSON.parse(localStorage.getItem('supabase.mock-coupons') || '[]');
        coupon = mockCoupons.find((c: any) => c.code === cleanCode && c.is_active);
      }

      if (!coupon) {
        toast.error('Cupom inválido ou expirado.');
        return false;
      }

      // Validar data de expiração se houver
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        toast.error('Este cupom já expirou.');
        return false;
      }

      // Validar valor mínimo de compra
      if (coupon.min_subtotal && cartTotal < Number(coupon.min_subtotal)) {
        toast.error(`Cupom válido apenas para pedidos acima de R$ ${Number(coupon.min_subtotal).toFixed(2)}.`);
        return false;
      }

      const adaptedCoupon: Coupon = {
        code: coupon.code,
        type: coupon.type as any,
        value: Number(coupon.value),
        minSubtotal: coupon.min_subtotal ? Number(coupon.min_subtotal) : undefined
      };

      setAppliedCoupon(adaptedCoupon);
      toast.success('Cupom aplicado com sucesso!');
      return true;
    } catch (err) {
      console.error('Erro ao validar cupom:', err);
      toast.error('Erro ao validar cupom.');
      return false;
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percentage') {
      discountAmount = cartTotal * (appliedCoupon.value / 100);
    } else if (appliedCoupon.type === 'fixed') {
      discountAmount = Math.min(cartTotal, appliedCoupon.value);
    } else if (appliedCoupon.type === 'shipping') {
      discountAmount = 5.00; // Frete grátis (desconta o valor da taxa)
    }
  }

  return (
    <CartContext.Provider value={{ 
      cartItems, 
      addToCart, 
      removeFromCart, 
      updateQuantity, 
      clearCart,
      cartCount,
      cartTotal,
      deliveryFee,
      appliedCoupon,
      discountAmount,
      applyCoupon,
      removeCoupon
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
