import React, { createContext, useContext, useState, ReactNode } from 'react';
import { toast } from 'react-hot-toast';

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
  observation?: string;
}

export interface Coupon {
  code: string;
  type: 'percentage' | 'fixed' | 'shipping';
  value: number; // 15 for 15%, 10 for R$ 10, 5 for delivery fee
  minSubtotal?: number;
}

const AVAILABLE_COUPONS: Coupon[] = [
  { code: 'BEMVINDO15', type: 'percentage', value: 15, minSubtotal: 50 },
  { code: 'PIZZAFREE', type: 'fixed', value: 10 },
  { code: 'QUARTALOUCA', type: 'shipping', value: 5 }
];

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: any, customOptions?: any) => void;
  removeFromCart: (uniqueKey: string) => void;
  updateQuantity: (uniqueKey: string, delta: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  appliedCoupon: Coupon | null;
  discountAmount: number;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const stored = localStorage.getItem('delivery.cart');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  React.useEffect(() => {
    localStorage.setItem('delivery.cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product: any, customOptions?: any) => {
    const size = customOptions?.size || (product.category === 'pizzas' ? 'grande' : undefined);
    const border = customOptions?.border || 'none';
    const halfAndHalf = customOptions?.halfAndHalf || null;
    const extras = customOptions?.extras || [];
    const observation = customOptions?.observation || '';

    // Calcular preço baseado nas opções
    let finalPrice = Number(product.price);
    
    // Se for Pizza, aplicar fatores de tamanho
    if (product.category === 'pizzas') {
      if (size === 'brotinho') {
        finalPrice = Number(product.price) * 0.7; // Brotinho: 30% desconto
      } else if (size === 'media') {
        finalPrice = Number(product.price) * 0.85; // Média: 15% desconto
      }
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
      const secondFlavorPrice = Number(halfAndHalf.secondFlavorPrice) || Number(product.price);
      let basePrice = Math.max(Number(product.price), secondFlavorPrice);
      
      if (size === 'brotinho') {
        basePrice = basePrice * 0.7;
      } else if (size === 'media') {
        basePrice = basePrice * 0.85;
      }

      finalPrice = basePrice;
      if (border === 'catupiry') finalPrice += 5.00;
      if (border === 'cheddar') finalPrice += 6.00;
      finalPrice += extrasPrice;
    }

    if (size) {
      const sizeLabel = size === 'brotinho' ? 'Brotinho' : size === 'media' ? 'Média' : 'Grande';
      displayName = `${displayName} (${sizeLabel})`;
    }

    const extrasKey = extras.map((e: any) => e.id).sort().join('-');
    const uniqueKey = `${product.id}-${size || ''}-${border}-${halfAndHalf?.secondFlavorId || ''}-${extrasKey}-${observation}`;

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
        observation
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

  const applyCoupon = (code: string): boolean => {
    const coupon = AVAILABLE_COUPONS.find(c => c.code.toUpperCase() === code.trim().toUpperCase());
    if (!coupon) {
      toast.error('Cupom inválido.');
      return false;
    }
    if (coupon.minSubtotal && cartTotal < coupon.minSubtotal) {
      toast.error(`Cupom válido apenas para pedidos acima de R$ ${coupon.minSubtotal.toFixed(2)}.`);
      return false;
    }
    setAppliedCoupon(coupon);
    toast.success('Cupom aplicado com sucesso!');
    return true;
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
