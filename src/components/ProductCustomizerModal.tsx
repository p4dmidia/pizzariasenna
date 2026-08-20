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

const EXTRAS_OPTIONS = [
  { id: 1, name: 'Queijo Mussarela Extra', price: 4.50 },
  { id: 2, name: 'Bacon Crocante Extra', price: 5.50 },
  { id: 3, name: 'Tomate Cereja Extra', price: 3.00 },
  { id: 4, name: 'Cebola Roxa Extra', price: 2.00 }
];

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
  
  // Extras
  const [selectedExtras, setSelectedExtras] = useState<any[]>([]);
  
  // Observação e Qtd
  const [observation, setObservation] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Combo selections state
  const [selectedComboFlavor, setSelectedComboFlavor] = useState<any>(null);
  const [selectedComboDrink, setSelectedComboDrink] = useState<string>('');

  // Resetar estados quando o produto mudar ou abrir o modal
  useEffect(() => {
    if (product) {
      const sizes = getPizzaSizes(product);
      const defaultSize = sizes.some(s => s.id === 'grande') ? 'grande' : (sizes[0]?.id || 'media');
      setSize(defaultSize as any);
      setBorder('none');
      setIsHalfAndHalf(false);
      setSecondFlavor(null);
      setSelectedExtras([]);
      setObservation('');
      setQuantity(1);

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
    if (product.category_id === 3) {
      const basePrice = product.promo_price ? Number(product.promo_price) : Number(product.price);
      return basePrice * quantity;
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
    
    // Adicionais
    const extrasTotal = selectedExtras.reduce((acc, curr) => acc + curr.price, 0);
    
    return (basePrice + extrasTotal) * quantity;
  };

  const handleToggleExtra = (extra: any) => {
    setSelectedExtras(prev => {
      const exists = prev.find(item => item.id === extra.id);
      if (exists) {
        return prev.filter(item => item.id !== extra.id);
      }
      return [...prev, extra];
    });
  };

  const handleAdd = () => {
    if (product.category_id === 3) {
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
    } else {
      const payload = {
        size,
        border,
        halfAndHalf: isHalfAndHalf && secondFlavor ? {
          secondFlavorId: secondFlavor.id,
          secondFlavorName: secondFlavor.name,
          secondFlavorPrice: Number(secondFlavor.price),
          secondFlavorPromoPrice: secondFlavor.promo_price ? Number(secondFlavor.promo_price) : null,
          secondFlavorSizePrices: secondFlavor.size_prices || null
        } : null,
        extras: selectedExtras,
        observation: observation.trim(),
        quantity
      };
      onConfirm(payload);
    }
    onClose();
  };

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

                  {/* Adicionais Extras */}
                  <section className="space-y-3">
                    <h3 className="text-sm font-black uppercase tracking-widest text-text-muted">Ingredientes Adicionais (Opcional)</h3>
                    <div className="space-y-2">
                      {EXTRAS_OPTIONS.map((extra) => {
                        const isSelected = selectedExtras.some(e => e.id === extra.id);
                        return (
                          <button
                            key={extra.id}
                            type="button"
                            onClick={() => handleToggleExtra(extra)}
                            className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${
                              isSelected 
                                ? 'border-primary bg-primary/5 text-gray-900 font-bold' 
                                : 'border-surface-border bg-background hover:bg-surface-hover text-text-muted'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                                isSelected ? 'border-primary bg-primary text-white' : 'border-surface-border'
                              }`}>
                                {isSelected && <Check size={12} strokeWidth={3} className="text-white" />}
                              </div>
                              <span className="text-sm font-bold text-gray-900">{extra.name}</span>
                            </div>
                            <span className="text-xs font-black text-secondary">+ R$ {extra.price.toFixed(2)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                </>
              )}

              {/* Observações */}
              <section className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-text-muted ml-1">Observações do Item</label>
                <textarea 
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  placeholder="Ex: sem cebola, bem assada, cortar em 12 fatias..."
                  maxLength={150}
                  rows={2}
                  className="w-full bg-background border border-surface-border rounded-2xl py-3.5 px-6 outline-none focus:border-primary/50 transition-all text-sm font-bold text-text-main resize-none"
                />
              </section>
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
