import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Minus, Check, Star, ShoppingBag } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getPizzaSizePrice } from '../utils/pizzaCalculator';

interface ProductCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: any;
  onConfirm: (options: any) => void;
  pizzaFlavors: any[];
}

export const getPizzaSizes = (product: any) => {
  if (!product) return [];
  
  // Default size definitions
  const allSizes = [
    { id: 'media', label: 'Pizza 20cm', detail: '6 Fatias', factor: 26 / 53 },
    { id: 'grande', label: 'Pizza 25cm', detail: '8 Fatias', factor: 1.0 },
    { id: 'familia', label: 'Pizza 30cm', detail: '10 Fatias', factor: 58 / 53 },
    { id: 'gigante', label: 'Pizza 35cm', detail: '12 Fatias', factor: 61 / 53 }
  ];

  if (product.available_sizes) {
    const dbSizes = product.available_sizes.split(',').map((s: string) => s.trim().toLowerCase());
    return allSizes.filter(s => dbSizes.includes(s.id));
  }
  
  return allSizes;
};

export const detectComboPizzaSize = (productName: string): string => {
  const name = productName.toLowerCase();
  if (name.includes('35cm')) return 'gigante';
  if (name.includes('30cm')) return 'familia';
  if (name.includes('25cm')) return 'grande';
  return 'grande';
};

export const getComboDrinksList = (product: any): string[] => {
  if (!product) return [];
  const name = (product.name || '').toLowerCase();
  const desc = (product.description || '').toLowerCase();
  
  if (desc.includes('coca-cola ou guaraná') || name.includes('coca-cola ou guaraná')) {
    return ['Coca-Cola 2L', 'Guaraná Antarctica 2L'];
  }
  if (desc.includes('mate couro 2l') || name.includes('mate couro 2l')) {
    return ['Mate Couro 2L'];
  }
  if (desc.includes('kuat') || desc.includes('sukita') || desc.includes('pepsi') || desc.includes('mate couro')) {
    return ['Kuat 2L', 'Sukita 2L', 'Mate Couro 2L', 'Pepsi 2L'];
  }
  
  return ['Coca-Cola 2L', 'Guaraná Antarctica 2L', 'Fanta Laranja 2L', 'Pepsi 2L', 'Mate Couro 2L'];
};

export const SAUCE_CONFIG = [
  {
    id: 'especial' as const,
    name: 'Molho Especial',
    icon: '✨',
    sacheLabel: 'Sachê de molho especial',
    pizzaLabel: 'Molho especial por cima da pizza'
  },
  {
    id: 'ketchup' as const,
    name: 'Katchup',
    icon: '🥫',
    sacheLabel: 'Sachê de Katchup',
    pizzaLabel: 'Katchup por cima da pizza'
  },
  {
    id: 'maionese' as const,
    name: 'Maionese',
    icon: '🍶',
    sacheLabel: 'Sachê de maionese',
    pizzaLabel: 'Maionese por cima da pizza'
  }
];

export default function ProductCustomizerModal({
  isOpen,
  onClose,
  product,
  onConfirm,
  pizzaFlavors
}: ProductCustomizerModalProps) {
  const [size, setSize] = useState<'pequena' | 'media' | 'grande' | 'familia' | 'gigante'>('grande');
  const [border, setBorder] = useState<'none' | 'catupiry' | 'cheddar'>('none');
  
  // Meio a Meio
  const [isHalfAndHalf, setIsHalfAndHalf] = useState(false);
  const [secondFlavor, setSecondFlavor] = useState<any | null>(null);
  
  // Observação e Qtd
  const [observation, setObservation] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Combo selections state
  const [selectedComboFlavor, setSelectedComboFlavor] = useState<any>(null);
  const [selectedComboDrink, setSelectedComboDrink] = useState<string>('');

  // Variações / Sabores (Bebidas, Sobremesas, etc)
  const [selectedVariation, setSelectedVariation] = useState<any>(null);

  // Molhos da Pizza (Opcional - até 3 molhos: sachê ou por cima da pizza)
  const [selectedSauces, setSelectedSauces] = useState<{
    especial: 'sache' | 'pizza' | null;
    ketchup: 'sache' | 'pizza' | null;
    maionese: 'sache' | 'pizza' | null;
  }>({
    especial: null,
    ketchup: null,
    maionese: null
  });

  const isPizza = (product?.category === 'pizzas' || product?.category_id === 1);
  const isCombo = product?.category_id === 3;
  const hasVariations = product?.variations && Array.isArray(product.variations) && product.variations.length > 0;

  // Resetar estados quando o produto mudar ou abrir o modal
  useEffect(() => {
    if (product) {
      const sizes = getPizzaSizes(product);
      const defaultSize = sizes.some(s => s.id === 'grande') ? 'grande' : (sizes[0]?.id || 'media');
      setSize(defaultSize as any);
      setBorder('none');
      setIsHalfAndHalf(false);
      setSecondFlavor(null);
      setObservation('');
      setQuantity(1);
      setSelectedSauces({
        especial: null,
        ketchup: null,
        maionese: null
      });

      if (product.variations && Array.isArray(product.variations) && product.variations.length > 0) {
        const firstActive = product.variations.find((v: any) => v.is_active !== false) || product.variations[0];
        setSelectedVariation(firstActive || null);
      } else {
        setSelectedVariation(null);
      }

      if (product.category_id === 3) {
        const comboSize = detectComboPizzaSize(product.name);
        const flavors = pizzaFlavors.filter(flavor => {
          if (flavor.category_id !== 1) return false;
          const sizes = flavor.available_sizes
            ? flavor.available_sizes.split(',').map((s: string) => s.trim().toLowerCase())
            : ['media', 'grande', 'familia', 'gigante'];
          if (!sizes.includes(comboSize)) return false;
          if (flavor.combo_sizes) {
            const comboSizes = flavor.combo_sizes.split(',').map((s: string) => s.trim().toLowerCase());
            return comboSizes.includes(comboSize);
          }
          return true;
        });
        setSelectedComboFlavor(flavors[0] || null);

        const drinks = getComboDrinksList(product);
        setSelectedComboDrink(drinks[0] || '');
      }
    }
  }, [product, isOpen]);

  if (!product) return null;

  // Cálculo de Preço Dinâmico
  const getCalculatedPrice = () => {
    if (isCombo) {
      const basePrice = product.promo_price ? Number(product.promo_price) : Number(product.price);
      return basePrice * quantity;
    }

    if (hasVariations && !isPizza) {
      const basePrice = product.promo_price ? Number(product.promo_price) : Number(product.price);
      const extraPrice = selectedVariation && Number(selectedVariation.price) > 0 ? Number(selectedVariation.price) : 0;
      return (basePrice + extraPrice) * quantity;
    }

    const p1Price = getPizzaSizePrice(product, size);
    let basePrice = p1Price.promo_price !== null ? p1Price.promo_price : p1Price.price;
    
    // Se meio a meio, usar o preço da metade mais cara (considerando preços promocionais)
    if (isHalfAndHalf && secondFlavor) {
      const p2Price = getPizzaSizePrice(secondFlavor, size);
      const secondFlavorPrice = p2Price.promo_price !== null ? p2Price.promo_price : p2Price.price;
      basePrice = Math.max(basePrice, secondFlavorPrice);
    }
    
    // Borda
    if (border === 'catupiry') basePrice += 5.00;
    if (border === 'cheddar') basePrice += 6.00;
    
    return basePrice * quantity;
  };

  const handleAdd = () => {
    if (isCombo) {
      if (!selectedComboFlavor || !selectedComboDrink) {
        toast.error('Por favor, selecione o sabor da pizza e a bebida!');
        return;
      }
      onConfirm({
        combo_pizza_flavor: selectedComboFlavor,
        combo_drink: selectedComboDrink,
        observation: observation.trim(),
        quantity
      });
    } else if (hasVariations && !isPizza) {
      if (!selectedVariation) {
        toast.error('Por favor, selecione uma opção/sabor!');
        return;
      }
      onConfirm({
        variation: selectedVariation,
        observation: observation.trim(),
        quantity
      });
    } else {
      const payload = {
        size,
        border,
        variation: selectedVariation || null,
        halfAndHalf: isHalfAndHalf && secondFlavor ? {
          secondFlavorId: secondFlavor.id,
          secondFlavorName: secondFlavor.name,
          secondFlavorPrice: Number(secondFlavor.price),
          secondFlavorPromoPrice: secondFlavor.promo_price ? Number(secondFlavor.promo_price) : null,
          secondFlavorSizePrices: secondFlavor.size_prices || null
        } : null,
        extras: [],
        observation: isPizza ? '' : observation.trim(),
        sauces: isPizza ? getSelectedSaucesList() : [],
        quantity
      };
      onConfirm(payload);
    }
    onClose();
  };

  const handleToggleSauce = (type: 'especial' | 'ketchup' | 'maionese', format: 'sache' | 'pizza') => {
    setSelectedSauces(prev => ({
      ...prev,
      [type]: prev[type] === format ? null : format
    }));
  };

  const getSelectedSaucesList = (): string[] => {
    const list: string[] = [];
    if (selectedSauces.especial === 'sache') list.push('Sachê de molho especial');
    if (selectedSauces.especial === 'pizza') list.push('Molho especial por cima da pizza');
    if (selectedSauces.ketchup === 'sache') list.push('Sachê de Katchup');
    if (selectedSauces.ketchup === 'pizza') list.push('Katchup por cima da pizza');
    if (selectedSauces.maionese === 'sache') list.push('Sachê de maionese');
    if (selectedSauces.maionese === 'pizza') list.push('Maionese por cima da pizza');
    return list;
  };

  const selectedSaucesCount = Object.values(selectedSauces).filter(Boolean).length;

  const getAvailableSizes = () => {
    return getPizzaSizes(product);
  };

  const basePizzaPrice = Number(product.price);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
          {/* Overlay background close */}
          <div className="absolute inset-0" onClick={onClose} />
          
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            className="w-full max-w-2xl bg-surface border border-surface-border rounded-[2.5rem] relative shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh] md:max-h-[85vh]"
          >
            {/* Header com Imagem */}
            <div className="h-44 md:h-52 w-full relative shrink-0">
              <img 
                src={product.image || product.main_image_url || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=1000'} 
                alt={product.name} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/40 to-transparent" />
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2.5 bg-black/60 hover:bg-black/80 text-white rounded-xl backdrop-blur-md transition-all border border-white/10"
              >
                <X size={18} />
              </button>
              
              <div className="absolute bottom-4 left-8 right-8">
                <h2 className="text-2xl md:text-3xl font-black italic">{product.name}</h2>
                <p className="text-text-muted text-xs line-clamp-2 mt-1">{product.description}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {product.promo_price && (
                    <span className="bg-emerald-500/10 text-emerald-600 text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-emerald-500/20">
                      🏷️ Promoção
                    </span>
                  )}
                  {product.serves_description && (
                    <span className="bg-surface/80 text-text-main text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-surface-border">
                      👥 {product.serves_description}
                    </span>
                  )}
                  {product.prep_time && (
                    <span className="bg-surface/80 text-text-main text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-surface-border flex items-center gap-1">
                      ⏱️ {product.prep_time} min
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Conteúdo com Scroll */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 select-none">
              
              {product.category_id === 3 ? (
                <>
                  {/* Escolha do Sabor da Pizza */}
                  <section className="space-y-3">
                    <h3 className="text-sm font-black uppercase tracking-widest text-text-muted">Sabor da Pizza</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {(() => {
                        const comboSize = detectComboPizzaSize(product.name);
                        const allowedFlavors = pizzaFlavors.filter(flavor => {
                          if (flavor.category_id !== 1) return false;
                          const sizes = flavor.available_sizes
                            ? flavor.available_sizes.split(',').map((s: string) => s.trim().toLowerCase())
                            : ['media', 'grande', 'familia', 'gigante'];
                          if (!sizes.includes(comboSize)) return false;
                          if (flavor.combo_sizes) {
                            const comboSizes = flavor.combo_sizes.split(',').map((s: string) => s.trim().toLowerCase());
                            return comboSizes.includes(comboSize);
                          }
                          return true;
                        });

                        if (allowedFlavors.length === 0) {
                          return <p className="text-xs text-text-muted italic ml-1">Nenhum sabor disponível para este tamanho de combo no momento.</p>;
                        }

                        return allowedFlavors.map(flavor => {
                          const isSelected = selectedComboFlavor?.id === flavor.id;
                          return (
                            <button
                              key={flavor.id}
                              type="button"
                              onClick={() => setSelectedComboFlavor(flavor)}
                              className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col gap-1 ${
                                isSelected 
                                  ? 'border-primary bg-primary/5 shadow-lg scale-102 text-text-main font-bold' 
                                  : 'border-surface-border bg-background hover:bg-surface-hover text-text-muted'
                              }`}
                            >
                              <span className="text-sm font-black text-text-main flex items-center justify-between">
                                {flavor.name}
                                {isSelected && <span className="text-primary text-[10px] font-black">✓</span>}
                              </span>
                              <span className="text-[10px] text-text-muted line-clamp-2">{flavor.description}</span>
                            </button>
                          );
                        });
                      })()}
                    </div>
                  </section>

                  {/* Escolha a Bebida */}
                  <section className="space-y-3">
                    <h3 className="text-sm font-black uppercase tracking-widest text-text-muted">Escolha a Bebida</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {getComboDrinksList(product).map(drink => {
                        const isSelected = selectedComboDrink === drink;
                        return (
                          <button
                            key={drink}
                            type="button"
                            onClick={() => setSelectedComboDrink(drink)}
                            className={`p-3.5 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center gap-1 font-bold text-xs ${
                              isSelected 
                                ? 'border-primary bg-primary/5 shadow-lg scale-105 text-text-main' 
                                : 'border-surface-border bg-background hover:bg-surface-hover text-text-muted'
                            }`}
                          >
                            <span>{drink}</span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                </>
              ) : hasVariations && !isPizza ? (
                /* Escolha da Variação / Sabor da Bebida ou Sobremesa */
                <div className="space-y-6">
                  <section className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                        <span>🥤</span> {product.variation_title || 'Escolha o Sabor'}
                      </h3>
                      <span className="text-[10px] font-black text-primary uppercase tracking-wider bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
                        Obrigatório
                      </span>
                    </div>
                    <p className="text-xs text-text-muted font-medium">Selecione uma das opções disponíveis para o seu pedido:</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {product.variations.map((v: any) => {
                        const isSelected = selectedVariation?.id === v.id;
                        const isOutOfStock = v.is_active === false;
                        const extra = Number(v.price) > 0 ? Number(v.price) : 0;

                        return (
                          <button
                            key={v.id}
                            type="button"
                            disabled={isOutOfStock}
                            onClick={() => setSelectedVariation(v)}
                            className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between gap-3 ${
                              isOutOfStock
                                ? 'border-surface-border bg-surface/30 opacity-40 cursor-not-allowed'
                                : isSelected
                                  ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10 scale-[1.02] text-text-main font-bold'
                                  : 'border-surface-border bg-background hover:bg-surface-hover text-text-muted hover:text-text-main'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                isSelected ? 'border-primary bg-primary' : 'border-surface-border bg-transparent'
                              }`}>
                                {isSelected && <div className="w-2 h-2 rounded-full bg-background" />}
                              </div>
                              <div className="min-w-0">
                                <span className={`text-sm font-black block truncate ${isSelected ? 'text-primary' : 'text-text-main'}`}>
                                  {v.name}
                                </span>
                                {isOutOfStock && (
                                  <span className="text-[9px] font-black uppercase text-red-400">Esgotado</span>
                                )}
                              </div>
                            </div>

                            {extra > 0 && (
                              <span className="text-xs font-black text-secondary shrink-0">
                                + R$ {extra.toFixed(2)}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                </div>
              ) : (
                <>
                  {/* Opção Meio a Meio */}
                  {size !== 'media' && product.allow_half_and_half !== false && (
                    <section className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black uppercase tracking-widest text-text-muted">Dividir Sabor? (Meio a Meio)</h3>
                        <button 
                          type="button"
                          onClick={() => {
                            setIsHalfAndHalf(!isHalfAndHalf);
                            if (isHalfAndHalf) setSecondFlavor(null);
                          }}
                          className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${
                            isHalfAndHalf 
                              ? 'bg-primary text-background border-primary shadow-lg glow-primary' 
                              : 'bg-background hover:bg-surface-hover text-text-muted border-surface-border'
                          }`}
                        >
                          {isHalfAndHalf ? 'Ativado' : 'Desativado'}
                        </button>
                      </div>
                      
                      {isHalfAndHalf && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="p-4 rounded-3xl bg-background border border-surface-border space-y-3"
                        >
                          <label className="text-[10px] font-black uppercase text-text-muted">Selecione a Outra Metade:</label>
                          <select 
                            onChange={(e) => {
                              const flavorId = parseInt(e.target.value, 10);
                              const flavor = pizzaFlavors.find(p => p.id === flavorId);
                              setSecondFlavor(flavor || null);
                            }}
                            value={secondFlavor?.id || ''}
                            className="w-full bg-white border border-surface-border rounded-xl py-3 px-4 outline-none text-sm font-bold text-gray-900 shadow-sm"
                          >
                            <option value="">-- Escolha um Sabor --</option>
                            {pizzaFlavors
                              .filter(p => p.id !== product.id)
                              .filter(p => {
                                const name = (p.name || '').toLowerCase();
                                const isRestricted = name.includes('frango com catupiry') || name.includes('4 queijos') || name.includes('quatro queijos');
                                // Excluir sabores restritos de 20cm se o tamanho atual não for 20cm (media)
                                if (size !== 'media' && isRestricted) {
                                  return false;
                                }
                                return true;
                              })
                              .map(p => (
                                <option key={p.id} value={p.id}>{p.name} (R$ {Number(p.price).toFixed(2)})</option>
                              ))
                            }
                          </select>
                          <p className="text-[10px] text-text-muted">
                            * O valor base da pizza meio-a-meio será o preço do sabor mais caro.
                          </p>
                        </motion.div>
                      )}
                    </section>
                  )}

                  {/* Tamanho da Pizza */}
                  <section className="space-y-3">
                    <h3 className="text-sm font-black uppercase tracking-widest text-text-muted">Escolha o Tamanho</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {getAvailableSizes().map((s) => {
                        const sPriceData = getPizzaSizePrice(product, s.id);
                        const sizePrice = sPriceData.promo_price !== null ? sPriceData.promo_price : sPriceData.price;
                        const hasPromo = sPriceData.promo_price !== null;

                        return (
                          <button
                            key={s.id}
                            onClick={() => setSize(s.id as any)}
                            className={`p-3.5 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center gap-1 ${
                              size === s.id 
                                ? 'border-primary bg-primary/5 shadow-lg scale-105 text-text-main' 
                                : 'border-surface-border bg-background hover:bg-surface-hover text-text-muted'
                            }`}
                          >
                            <span className="text-xs font-black text-text-main">{s.label}</span>
                            <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">{s.detail}</span>
                            <div className="flex flex-col items-center mt-1">
                              {hasPromo ? (
                                <>
                                  <span className="text-[9px] text-text-muted line-through font-bold">R$ {sPriceData.price.toFixed(2)}</span>
                                  <span className="text-xs font-black text-secondary">R$ {sPriceData.promo_price!.toFixed(2)}</span>
                                </>
                              ) : (
                                <span className="text-xs font-black text-secondary">R$ {sizePrice.toFixed(2)}</span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>

                  {/* Escolha dos Molhos (Apenas se for Pizza) */}
                  <section className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-black uppercase tracking-widest text-text-muted flex items-center gap-2">
                        <span>🥫</span> Escolha os Molhos
                      </h3>
                      <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border transition-all ${
                        selectedSaucesCount > 0 
                          ? 'bg-primary/10 text-primary border-primary/20' 
                          : 'bg-surface text-text-muted border-surface-border'
                      }`}>
                        {selectedSaucesCount > 0 ? `${selectedSaucesCount} de 3 selecionados` : 'Opcional • Até 3'}
                      </span>
                    </div>

                    <p className="text-xs text-text-muted leading-relaxed">
                      Você pode escolher até <strong>3 molhos</strong> (Molho Especial, Katchup e Maionese). Para cada tipo, escolha se deseja <strong>no sachê</strong> ou <strong>por cima da pizza</strong>:
                    </p>

                    <div className="space-y-3 pt-1">
                      {SAUCE_CONFIG.map((sauce) => {
                        const currentFormat = selectedSauces[sauce.id];
                        return (
                          <div 
                            key={sauce.id} 
                            className={`p-3.5 rounded-2xl border transition-all ${
                              currentFormat
                                ? 'border-primary/40 bg-primary/[0.04]'
                                : 'border-surface-border bg-background hover:border-surface-border/80'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <span className="text-xl shrink-0">{sauce.icon}</span>
                                <div>
                                  <span className="text-sm font-black text-text-main block">{sauce.name}</span>
                                  <span className="text-[10px] text-text-muted font-bold block">
                                    {currentFormat === 'sache' && (
                                      <span className="text-primary font-black">✓ {sauce.sacheLabel}</span>
                                    )}
                                    {currentFormat === 'pizza' && (
                                      <span className="text-secondary font-black">✓ {sauce.pizzaLabel}</span>
                                    )}
                                    {!currentFormat && 'Nenhum selecionado'}
                                  </span>
                                </div>
                              </div>

                              {/* Opções: Sachê ou Por Cima */}
                              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleSauce(sauce.id, 'sache')}
                                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                                    currentFormat === 'sache'
                                      ? 'bg-primary text-background border-primary shadow-md font-black scale-102'
                                      : 'bg-surface hover:bg-surface-hover text-text-muted hover:text-text-main border-surface-border'
                                  }`}
                                >
                                  <span>📦</span>
                                  <span>Sachê</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleToggleSauce(sauce.id, 'pizza')}
                                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                                    currentFormat === 'pizza'
                                      ? 'bg-secondary text-background border-secondary shadow-md font-black scale-102'
                                      : 'bg-surface hover:bg-surface-hover text-text-muted hover:text-text-main border-surface-border'
                                  }`}
                                >
                                  <span>🍕</span>
                                  <span>Por cima</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>

                </>
              )}

              {/* Observações ou Aviso Pizza Pré-Assada */}
              {isPizza ? (
                <div className="p-4 rounded-2xl bg-surface border border-surface-border flex items-center gap-3.5 shadow-sm">
                  <span className="text-2xl">🍕</span>
                  <div className="text-xs">
                    <p className="font-black text-primary uppercase tracking-wider text-[11px]">Pizza Artesanal Pré-Assada</p>
                    <p className="text-text-muted mt-0.5 leading-relaxed">
                      Nossas pizzas são receitas padronizadas e pré-assadas. Não é possível alterar, adicionar ou retirar ingredientes da receita.
                    </p>
                  </div>
                </div>
              ) : (
                <section className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Observações do Item</label>
                  <textarea 
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
                    placeholder="Ex: bem gelada, trazer copos descartáveis..."
                    maxLength={150}
                    rows={2}
                    className="w-full bg-background border border-surface-border rounded-2xl py-3.5 px-6 outline-none focus:border-primary/50 transition-all text-sm font-bold text-text-main resize-none"
                  />
                </section>
              )}
            </div>

            {/* Footer Fixo */}
            <div className="p-6 bg-background/50 border-t border-surface-border backdrop-blur-md flex flex-wrap items-center justify-between gap-4 shrink-0 px-8">
              {/* Seletor Qtd */}
              <div className="flex items-center gap-4 bg-surface p-1.5 rounded-2xl border border-surface-border">
                <button 
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-10 h-10 rounded-xl bg-background hover:bg-surface-hover flex items-center justify-center text-text-muted hover:text-white transition-all active:scale-95"
                >
                  <Minus size={16} />
                </button>
                <span className="font-display font-black text-lg w-6 text-center">{quantity}</span>
                <button 
                  onClick={() => setQuantity(q => q + 1)}
                  className="w-10 h-10 rounded-xl bg-background hover:bg-surface-hover flex items-center justify-center text-text-muted hover:text-white transition-all active:scale-95"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Botão Confirmação */}
              <button
                onClick={handleAdd}
                className="flex-1 min-w-[200px] py-4 bg-primary text-background rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 glow-primary shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                <ShoppingBag size={16} /> Adicionar ao Carrinho • R$ {getCalculatedPrice().toFixed(2)}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
