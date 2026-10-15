import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff, 
  Loader2, 
  Image as ImageIcon,
  ChevronRight,
  Package,
  DollarSign,
  Tag,
  AlertCircle,
  X,
  Save,
  TrendingUp,
  Pizza as PizzaIcon,
  Wine,
  Sparkles,
  IceCream,
  GraduationCap
} from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

export interface ProductVariation {
  id: string;
  name: string;
  price?: number | null;
  is_active?: boolean;
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category_id: number;
  main_image_url: string;
  is_active: boolean;
  stock_quantity: number;
  promo_price?: number | null;
  is_featured?: boolean;
  allow_customizations?: boolean;
  serves_description?: string | null;
  prep_time?: number | null;
  available_sizes?: string | null;
  allow_half_and_half?: boolean;
  size_prices?: any | null;
  combo_sizes?: string | null;
  variations?: ProductVariation[] | null;
  variation_title?: string | null;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
}

const getCategoryIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'Pizza':
    case 'PizzaIcon':
      return PizzaIcon;
    case 'Wine':
      return Wine;
    case 'Sparkles':
      return Sparkles;
    case 'IceCream':
      return IceCream;
    case 'Package':
      return Package;
    default:
      return Package;
  }
};

export default function AdminMenu() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<number | 'all'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategorySlug, setNewCategorySlug] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('Pizza');
  const [savingCategory, setSavingCategory] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);

  // Estados para adição rápida de variações / sabores
  const [newVarName, setNewVarName] = useState('');
  const [newVarPrice, setNewVarPrice] = useState('');

  const handleAddVariation = (customName?: string) => {
    const nameToAdd = (customName || newVarName).trim();
    if (!nameToAdd || !editingProduct) return;

    const currentVariations = Array.isArray(editingProduct.variations) ? editingProduct.variations : [];
    
    if (currentVariations.some(v => v.name.toLowerCase() === nameToAdd.toLowerCase())) {
      toast.error('Este sabor/variação já foi adicionado!');
      return;
    }

    const newVar: ProductVariation = {
      id: `var-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: nameToAdd,
      price: customName ? 0 : (newVarPrice ? Number(newVarPrice) : 0),
      is_active: true
    };

    setEditingProduct({
      ...editingProduct,
      variations: [...currentVariations, newVar]
    });

    if (!customName) {
      setNewVarName('');
      setNewVarPrice('');
    }
  };

  const handleAddPresetVariation = (presetName: string) => {
    handleAddVariation(presetName);
  };

  const handleRemoveVariation = (id: string) => {
    if (!editingProduct) return;
    const currentVariations = Array.isArray(editingProduct.variations) ? editingProduct.variations : [];
    setEditingProduct({
      ...editingProduct,
      variations: currentVariations.filter(v => v.id !== id)
    });
  };

  const handleToggleVariationActive = (id: string) => {
    if (!editingProduct) return;
    const currentVariations = Array.isArray(editingProduct.variations) ? editingProduct.variations : [];
    setEditingProduct({
      ...editingProduct,
      variations: currentVariations.map(v => v.id === id ? { ...v, is_active: v.is_active === false ? true : false } : v)
    });
  };

  const getSizesList = (val?: string | null) => {
    if (!val) return ['pequena', 'media', 'grande', 'familia', 'gigante'];
    return val.split(',').map(s => s.trim());
  };

  const toggleSizeSelection = (sizeId: string) => {
    const currentVal = editingProduct?.available_sizes;
    const list = getSizesList(currentVal);
    let newList;
    if (list.includes(sizeId)) {
      newList = list.filter(s => s !== sizeId);
    } else {
      newList = [...list, sizeId];
    }
    setEditingProduct({
      ...editingProduct!,
      available_sizes: newList.join(',')
    });
  };

  const getComboSizesList = (val?: string | null) => {
    if (!val) return [];
    return val.split(',').map(s => s.trim());
  };

  const toggleComboSizeSelection = (sizeId: string) => {
    const currentVal = editingProduct?.combo_sizes;
    const list = getComboSizesList(currentVal);
    let newList;
    if (list.includes(sizeId)) {
      newList = list.filter(s => s !== sizeId);
    } else {
      newList = [...list, sizeId];
    }
    setEditingProduct({
      ...editingProduct!,
      combo_sizes: newList.join(',')
    });
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove accents
      .replace(/[^a-z0-9\s-]/g, '')    // remove special chars
      .replace(/\s+/g, '-')            // replace spaces with hyphens
      .replace(/-+/g, '-');            // remove consecutive hyphens
  };

  const handleAddCategory = async () => {
    if (!newCategoryName || !newCategorySlug) return;
    try {
      setSavingCategory(true);
      const data = {
        name: newCategoryName,
        slug: newCategorySlug,
        icon: newCategoryIcon,
        display_order: 0
      };

      const { error } = await supabase.from('product_categories').insert([data]);
      if (error) throw error;

      toast.success('Categoria criada com sucesso!');
      setNewCategoryName('');
      setNewCategorySlug('');
      setNewCategoryIcon('Pizza');
      fetchData();
    } catch (error: any) {
      toast.error('Erro ao criar categoria: ' + error.message);
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    const productsInCat = products.filter(p => p.category_id === id);
    if (productsInCat.length > 0) {
      toast.error(`Não é possível excluir esta categoria pois ela possui ${productsInCat.length} produto(s) associado(s).`);
      return;
    }

    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;

    try {
      setDeletingCategoryId(id);
      const { error } = await supabase.from('product_categories').delete().eq('id', id);
      if (error) throw error;

      toast.success('Categoria excluída com sucesso!');
      if (activeCategory === id) {
        setActiveCategory('all');
      }
      fetchData();
    } catch (error: any) {
      toast.error('Erro ao excluir categoria: ' + error.message);
    } finally {
      setDeletingCategoryId(null);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('product_categories').select('*').order('name'),
      ]);

      if (productsRes.error) throw productsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;

      const mappedProducts = (productsRes.data || []).map((p: any) => {
        let variations = p.variations;
        let variation_title = p.variation_title;
        if (!variations) {
          const localVars = localStorage.getItem(`product_variations_${p.id}`);
          if (localVars) {
            try { variations = JSON.parse(localVars); } catch {}
          }
        }
        if (!variation_title) {
          variation_title = localStorage.getItem(`product_variation_title_${p.id}`) || null;
        }
        return {
          ...p,
          variations,
          variation_title
        };
      });

      setProducts(mappedProducts);
      setCategories(categoriesRes.data || []);
    } catch (error: any) {
      toast.error('Erro ao carregar dados: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (product: Product) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !product.is_active })
        .eq('id', product.id);

      if (error) throw error;
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, is_active: !p.is_active } : p));
      toast.success(`${product.name} ${!product.is_active ? 'ativado' : 'desativado'}`);
    } catch (error: any) {
      toast.error('Erro ao atualizar status: ' + error.message);
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setProducts(prev => prev.filter(p => p.id !== id));
      toast.success('Produto excluído com sucesso');
    } catch (error: any) {
      toast.error('Erro ao excluir: ' + error.message);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `menu-items/${fileName}`;

      const { data, error } = await supabase.storage
        .from('products')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (error) {
        console.warn('Erro ao carregar no Supabase storage, usando Base64 como fallback:', error);
        const reader = new FileReader();
        reader.onloadend = () => {
          setEditingProduct((prev: any) => ({
            ...prev,
            main_image_url: reader.result as string
          }));
        };
        reader.readAsDataURL(file);
      } else if (data) {
        const { data: publicUrlData } = supabase.storage
          .from('products')
          .getPublicUrl(filePath);
          
        setEditingProduct((prev: any) => ({
          ...prev,
          main_image_url: publicUrlData.publicUrl
        }));
        toast.success('Imagem carregada com sucesso!');
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Erro ao processar imagem: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      setSaving(true);
      
      let mainPrice = Number(editingProduct.price || 0);
      let mainPromoPrice = editingProduct.promo_price ? Number(editingProduct.promo_price) : null;

      // Se for Pizza (categoria 1), sincroniza o preço principal com o preço do tamanho padrão (grande ou o primeiro disponível)
      if (Number(editingProduct.category_id) === 1) {
        const sizesList = editingProduct.available_sizes
          ? editingProduct.available_sizes.split(',').map((s: string) => s.trim().toLowerCase())
          : ['pequena', 'media', 'grande', 'familia', 'gigante'];
        
        if (sizesList.length > 0) {
          const defaultSize = sizesList.includes('grande') ? 'grande' : sizesList[0];
          const sizePrices = editingProduct.size_prices || {};
          const defaultSizeData = sizePrices[defaultSize];
          if (defaultSizeData && defaultSizeData.price !== undefined && defaultSizeData.price !== null) {
            mainPrice = Number(defaultSizeData.price);
            mainPromoPrice = defaultSizeData.promo_price !== undefined && defaultSizeData.promo_price !== null 
              ? Number(defaultSizeData.promo_price) 
              : null;
          }
        }
      }

      const data: any = {
        name: editingProduct.name,
        description: editingProduct.description,
        price: mainPrice,
        category_id: Number(editingProduct.category_id),
        main_image_url: editingProduct.main_image_url,
        is_active: editingProduct.is_active ?? true,
        stock_quantity: Number(editingProduct.stock_quantity || 0),
        promo_price: mainPromoPrice,
        is_featured: editingProduct.is_featured ?? false,
        allow_customizations: editingProduct.allow_customizations !== false,
        serves_description: editingProduct.serves_description || null,
        prep_time: editingProduct.prep_time ? Number(editingProduct.prep_time) : null,
        available_sizes: editingProduct.available_sizes || null,
        allow_half_and_half: editingProduct.allow_half_and_half !== false,
        size_prices: editingProduct.size_prices || null,
        combo_sizes: editingProduct.combo_sizes || null,
        variations: editingProduct.variations && editingProduct.variations.length > 0 ? editingProduct.variations : null,
        variation_title: editingProduct.variation_title || null,
        updated_at: new Date().toISOString()
      };

      if (editingProduct.id) {
        if (data.variations) {
          localStorage.setItem(`product_variations_${editingProduct.id}`, JSON.stringify(data.variations));
          if (data.variation_title) {
            localStorage.setItem(`product_variation_title_${editingProduct.id}`, data.variation_title);
          }
        } else {
          localStorage.removeItem(`product_variations_${editingProduct.id}`);
          localStorage.removeItem(`product_variation_title_${editingProduct.id}`);
        }

        let updateResult = await supabase.from('products').update(data).eq('id', editingProduct.id);
        if (updateResult.error && (updateResult.error.message.includes('variations') || updateResult.error.message.includes('variation_title'))) {
          console.warn('Coluna variations ainda não existe no Supabase. Salvando localmente:', updateResult.error);
          const { variations, variation_title, ...dataWithoutVars } = data;
          updateResult = await supabase.from('products').update(dataWithoutVars).eq('id', editingProduct.id);
          toast((t) => (
            <span>
              Produto salvo! Execute o script <b>migration_product_variations.sql</b> no Supabase SQL Editor para persistir variações no banco.
            </span>
          ), { duration: 6000, icon: 'ℹ️' });
        } else if (updateResult.error) {
          throw updateResult.error;
        } else {
          toast.success('Produto atualizado!');
        }
      } else {
        let insertResult = await supabase.from('products').insert([data]).select();
        if (insertResult.error && (insertResult.error.message.includes('variations') || insertResult.error.message.includes('variation_title'))) {
          console.warn('Coluna variations ainda não existe no Supabase. Inserindo sem elas:', insertResult.error);
          const { variations, variation_title, ...dataWithoutVars } = data;
          insertResult = await supabase.from('products').insert([dataWithoutVars]).select();
          if (insertResult.data?.[0]?.id && data.variations) {
            localStorage.setItem(`product_variations_${insertResult.data[0].id}`, JSON.stringify(data.variations));
            if (data.variation_title) {
              localStorage.setItem(`product_variation_title_${insertResult.data[0].id}`, data.variation_title);
            }
          }
          toast((t) => (
            <span>
              Produto criado! Execute o script <b>migration_product_variations.sql</b> no Supabase SQL Editor para persistir variações no banco.
            </span>
          ), { duration: 6000, icon: 'ℹ️' });
        } else if (insertResult.error) {
          throw insertResult.error;
        } else {
          if (insertResult.data?.[0]?.id && data.variations) {
            localStorage.setItem(`product_variations_${insertResult.data[0].id}`, JSON.stringify(data.variations));
            if (data.variation_title) {
              localStorage.setItem(`product_variation_title_${insertResult.data[0].id}`, data.variation_title);
            }
          }
          toast.success('Produto criado com sucesso!');
        }
      }

      setIsModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || p.category_id === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryName = (id: number) => categories.find(c => c.id === id)?.name || 'Sem Categoria';

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin" />
          <p className="text-text-muted font-black uppercase tracking-widest text-xs">Carregando Cardápio...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div>
              <h1 className="text-3xl font-black mb-1">Gestão do Cardápio 🍕</h1>
              <p className="text-text-muted text-sm">Adicione, edite ou remova produtos do delivery do <span className="text-primary font-bold">Pizza Senna</span>.</p>
           </div>
           <div className="flex gap-3">
             <button 
               onClick={() => {
                 setIsCategoriesModalOpen(true);
               }}
               className="bg-surface hover:bg-surface-hover border border-surface-border text-text-main px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all"
             >
                Categorias
             </button>
             <button 
                onClick={() => {
                  setNewVarName('');
                  setNewVarPrice('');
                  setEditingProduct({
                    category_id: typeof activeCategory === 'number' ? activeCategory : undefined,
                    is_active: true,
                    allow_customizations: true,
                    allow_half_and_half: true,
                    variations: [],
                    variation_title: ''
                  });
                  setIsModalOpen(true);
                }}
                className="bg-primary text-background px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg glow-primary flex items-center gap-2 hover:scale-105 transition-all"
              >
                 <Plus size={16} /> Novo Produto
              </button>
           </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
           <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
              <input 
                type="text" 
                placeholder="Buscar produto por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-surface/50 border border-surface-border rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:border-primary/50 text-sm"
              />
           </div>
           <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
              <button 
                onClick={() => setActiveCategory('all')}
                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  activeCategory === 'all' ? 'bg-primary text-background glow-primary' : 'bg-surface border border-surface-border text-text-muted hover:text-white'
                }`}
              >
                Todos
              </button>
              {categories.map((cat) => (
                <button 
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    activeCategory === cat.id ? 'bg-primary text-background glow-primary' : 'bg-surface border border-surface-border text-text-muted hover:text-white'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
           </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <motion.div 
              layout
              key={product.id}
              className={`glass-card overflow-hidden group border-white/5 ${!product.is_active ? 'opacity-60' : ''}`}
            >
              <div className="h-48 relative overflow-hidden bg-surface">
                {product.main_image_url ? (
                  <img 
                    src={product.main_image_url} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-muted">
                    <ImageIcon size={48} strokeWidth={1} />
                  </div>
                )}
                <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                  <span className="bg-background/80 backdrop-blur-md text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/10 w-fit">
                    {getCategoryName(product.category_id)}
                  </span>
                  {product.is_featured && (
                    <span className="bg-amber-500/80 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-amber-500/20 w-fit">
                      ⭐ Destaque
                    </span>
                  )}
                  {product.promo_price && (
                    <span className="bg-emerald-500/80 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-emerald-500/20 w-fit">
                      🏷️ Promoção
                    </span>
                  )}
                  {product.variations && product.variations.length > 0 && (
                    <span className="bg-primary/90 backdrop-blur-md text-background text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-primary/20 w-fit">
                      🥤 {product.variations.length} {product.variations.length === 1 ? 'Sabor' : 'Sabores'}
                    </span>
                  )}
                </div>
                <div className="absolute top-4 right-4 flex gap-2">
                  <button 
                    onClick={() => toggleStatus(product)}
                    className={`p-2 rounded-xl backdrop-blur-md border transition-all ${
                      product.is_active ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20' : 'bg-red-500/20 text-red-400 border-red-500/20'
                    }`}
                  >
                    {product.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-black text-lg group-hover:text-primary transition-colors line-clamp-1">{product.name}</h3>
                  <p className="text-[10px] text-text-muted uppercase font-bold tracking-widest">{product.stock_quantity} em estoque</p>
                </div>

                <div className="flex justify-between items-end">
                   <div>
                      <p className="text-[10px] text-text-muted font-black uppercase tracking-widest mb-1">Preço do Delivery</p>
                      {product.promo_price ? (
                        <div className="flex items-baseline gap-2">
                          <p className="text-xl font-black text-secondary">R$ {product.promo_price.toFixed(2)}</p>
                          <p className="text-xs text-text-muted line-through font-bold">R$ {product.price.toFixed(2)}</p>
                        </div>
                      ) : (
                        <p className="text-xl font-black text-secondary">R$ {product.price.toFixed(2)}</p>
                      )}
                   </div>
                </div>

                <div className="pt-4 border-t border-surface-border flex gap-2">
                   <button 
                     onClick={() => {
                       setNewVarName('');
                       setNewVarPrice('');
                       setEditingProduct(product);
                       setIsModalOpen(true);
                     }}
                     className="flex-1 bg-surface border border-surface-border hover:bg-surface-hover text-text-main py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                   >
                      <Edit2 size={14} /> Editar
                   </button>
                   <button 
                     onClick={() => deleteProduct(product.id)}
                     className="p-2.5 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                   >
                      <Trash2 size={16} />
                   </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20 glass-card">
            <Package size={48} className="mx-auto text-text-muted mb-4" />
            <p className="text-text-muted font-bold">Nenhum produto encontrado.</p>
          </div>
        )}
      </div>

      {/* Product Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-4xl bg-surface border border-white/10 rounded-[32px] overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
                <div>
                   <h2 className="text-2xl font-black">{editingProduct?.id ? 'Editar Produto' : 'Novo Produto'}</h2>
                   <p className="text-xs text-text-muted uppercase font-black tracking-widest mt-1">Detalhes do item no cardápio</p>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-text-muted hover:text-white transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Left Column: Image & Basic Info */}
                  <div className="space-y-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-text-muted ml-1">Imagem do Produto</label>
                       <div className="relative flex items-center justify-center border-2 border-dashed border-surface-border hover:border-primary/50 rounded-2xl p-6 bg-background transition-all cursor-pointer group">
                         <input 
                           type="file" 
                           accept="image/*"
                           onChange={handleImageUpload}
                           className="absolute inset-0 opacity-0 cursor-pointer"
                           disabled={uploading}
                         />
                         <div className="text-center space-y-2">
                           {uploading ? (
                             <Loader2 className="animate-spin mx-auto text-primary" size={28} />
                           ) : (
                             <ImageIcon className="mx-auto text-text-muted group-hover:text-primary transition-colors" size={28} />
                           )}
                           <p className="text-[10px] font-black uppercase tracking-widest text-text-muted group-hover:text-white transition-colors">
                             {uploading ? 'Carregando...' : 'Clique para Enviar Imagem'}
                           </p>
                           <p className="text-[8px] text-text-muted">PNG, JPG, JPEG até 5MB</p>
                         </div>
                       </div>
                    </div>

                    <div className="aspect-video rounded-2xl bg-background border border-surface-border overflow-hidden flex items-center justify-center relative group">
                       {editingProduct?.main_image_url ? (
                         <>
                           <img src={editingProduct.main_image_url} alt="Preview" className="w-full h-full object-cover" />
                           <button
                             type="button"
                             onClick={() => setEditingProduct({ ...editingProduct!, main_image_url: '' })}
                             className="absolute top-2 right-2 p-2 bg-red-500/20 text-red-500 border border-red-500/30 rounded-xl hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all z-20"
                           >
                             <Trash2 size={16} />
                           </button>
                         </>
                       ) : (
                         <div className="text-center text-text-muted">
                           <ImageIcon size={48} className="mx-auto mb-2 opacity-20" />
                           <p className="text-[10px] font-black uppercase tracking-widest">Prévia da Imagem</p>
                         </div>
                       )}
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-text-muted ml-1">Nome do Produto</label>
                       <input 
                         type="text" 
                         required
                         value={editingProduct?.name || ''}
                         onChange={(e) => setEditingProduct({ ...editingProduct!, name: e.target.value })}
                         placeholder="Ex: Pizza Calabresa Especial"
                         className="w-full bg-background border border-surface-border rounded-xl py-3 px-4 outline-none focus:border-primary/50 text-sm"
                       />
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-text-muted ml-1">Descrição</label>
                       <textarea 
                         rows={4}
                         value={editingProduct?.description || ''}
                         onChange={(e) => setEditingProduct({ ...editingProduct!, description: e.target.value })}
                         placeholder="Ingredientes, detalhes e diferenciais..."
                         className="w-full bg-background border border-surface-border rounded-xl py-3 px-4 outline-none focus:border-primary/50 text-sm resize-none"
                       />
                    </div>
                  </div>

                  {/* Right Column: Pricing & Options */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-text-muted ml-1">Categoria</label>
                        <select 
                          required
                          value={editingProduct?.category_id || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct!, category_id: Number(e.target.value) })}
                          className="w-full bg-background border border-surface-border rounded-xl py-3 px-4 outline-none focus:border-primary/50 text-sm appearance-none cursor-pointer"
                        >
                          <option value="">Selecionar...</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-text-muted ml-1">Estoque</label>
                        <input 
                          type="number" 
                          value={editingProduct?.stock_quantity || 0}
                          onChange={(e) => setEditingProduct({ ...editingProduct!, stock_quantity: Number(e.target.value) })}
                          className="w-full bg-background border border-surface-border rounded-xl py-3 px-4 outline-none focus:border-primary/50 text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-text-muted ml-1">Preço Original (R$)</label>
                        <div className="relative">
                          <input 
                            type={editingProduct?.category_id === 1 ? "text" : "number"} 
                            step="0.01"
                            required={editingProduct?.category_id !== 1}
                            disabled={editingProduct?.category_id === 1}
                            value={editingProduct?.category_id === 1 ? 'Definido por tamanho' : (editingProduct?.price || '')}
                            onChange={(e) => setEditingProduct({ ...editingProduct!, price: Number(e.target.value) })}
                            className="w-full bg-background border border-surface-border rounded-xl py-3 pl-10 pr-4 outline-none focus:border-primary/50 text-sm font-black text-text-main disabled:opacity-60"
                          />
                          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={16} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-text-muted ml-1">Preço Promocional (R$)</label>
                        <div className="relative">
                          <input 
                            type={editingProduct?.category_id === 1 ? "text" : "number"} 
                            step="0.01"
                            disabled={editingProduct?.category_id === 1}
                            value={editingProduct?.category_id === 1 ? 'Definido por tamanho' : (editingProduct?.promo_price || '')}
                            onChange={(e) => setEditingProduct({ ...editingProduct!, promo_price: e.target.value ? Number(e.target.value) : null })}
                            className="w-full bg-background border border-surface-border rounded-xl py-3 pl-10 pr-4 outline-none focus:border-primary/50 text-sm font-black text-text-main disabled:opacity-60"
                            placeholder={editingProduct?.category_id === 1 ? 'Definido por tamanho' : 'Sem desconto'}
                          />
                          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/50" size={16} />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-text-muted ml-1">Serve (Ex: 2 pessoas)</label>
                        <input 
                          type="text" 
                          value={editingProduct?.serves_description || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct!, serves_description: e.target.value })}
                          placeholder="Ex: Serve 1 a 2 pessoas"
                          className="w-full bg-background border border-surface-border rounded-xl py-3 px-4 outline-none focus:border-primary/50 text-sm font-bold text-text-main"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-text-muted ml-1">Tempo de Preparo (min)</label>
                        <input 
                          type="number" 
                          value={editingProduct?.prep_time || ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct!, prep_time: e.target.value ? Number(e.target.value) : null })}
                          placeholder="Ex: 25"
                          className="w-full bg-background border border-surface-border rounded-xl py-3 px-4 outline-none focus:border-primary/50 text-sm font-bold text-text-main"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-hover border border-white/5">
                         <div>
                            <p className="text-sm font-black text-text-main">Status do Produto</p>
                            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Visível no cardápio do delivery</p>
                         </div>
                         <button 
                          type="button"
                          onClick={() => setEditingProduct({ ...editingProduct!, is_active: !editingProduct?.is_active })}
                          className={`w-14 h-8 rounded-full relative transition-all ${editingProduct?.is_active !== false ? 'bg-primary shadow-[0_0_15px_rgba(0,229,255,0.4)]' : 'bg-surface border border-surface-border'}`}
                         >
                            <div className={`absolute top-1.5 w-5 h-5 rounded-full bg-white transition-all ${editingProduct?.is_active !== false ? 'left-7' : 'left-1.5'}`} />
                         </button>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-hover border border-white/5">
                         <div>
                            <p className="text-sm font-black text-text-main">Destaque da Loja</p>
                            <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Exibir na seção Mais Pedidos</p>
                         </div>
                         <button 
                          type="button"
                          onClick={() => setEditingProduct({ ...editingProduct!, is_featured: !editingProduct?.is_featured })}
                          className={`w-14 h-8 rounded-full relative transition-all ${editingProduct?.is_featured ? 'bg-primary shadow-[0_0_15px_rgba(0,229,255,0.4)]' : 'bg-surface border border-surface-border'}`}
                         >
                            <div className={`absolute top-1.5 w-5 h-5 rounded-full bg-white transition-all ${editingProduct?.is_featured ? 'left-7' : 'left-1.5'}`} />
                         </button>
                      </div>

                      <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-hover border border-white/5">
                          <div>
                             <p className="text-sm font-black text-text-main">Permitir Personalização</p>
                             <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Habilitar tamanhos e meio-a-meio</p>
                          </div>
                          <button 
                           type="button"
                           onClick={() => setEditingProduct({ ...editingProduct!, allow_customizations: !editingProduct?.allow_customizations })}
                           className={`w-14 h-8 rounded-full relative transition-all ${editingProduct?.allow_customizations !== false ? 'bg-primary shadow-[0_0_15px_rgba(0,229,255,0.4)]' : 'bg-surface border border-surface-border'}`}
                          >
                             <div className={`absolute top-1.5 w-5 h-5 rounded-full bg-white transition-all ${editingProduct?.allow_customizations !== false ? 'left-7' : 'left-1.5'}`} />
                          </button>
                       </div>

                       {editingProduct?.category_id === 1 && (
                         <div className="space-y-4 pt-4 border-t border-white/5">
                           <h4 className="text-[10px] font-black uppercase tracking-widest text-text-muted ml-1">Configurações de Pizza</h4>
                           
                           {/* Tamanhos Disponíveis */}
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-text-muted ml-1">Tamanhos Disponíveis</label>
                              <div className="grid grid-cols-2 gap-3">
                                {[
                                  { id: 'pequena', label: 'Pizza 16cm (Pequena)' },
                                  { id: 'media', label: 'Pizza 20cm (Média)' },
                                  { id: 'grande', label: 'Pizza 25cm (Grande)' },
                                  { id: 'familia', label: 'Pizza 30cm (Família)' },
                                  { id: 'gigante', label: 'Pizza 35cm (Gigante)' }
                                ].map((sz) => {
                                  const list = getSizesList(editingProduct?.available_sizes);
                                  const isChecked = list.includes(sz.id);
                                  return (
                                    <button
                                      key={sz.id}
                                      type="button"
                                      onClick={() => toggleSizeSelection(sz.id)}
                                      className={`flex items-center gap-2.5 p-3.5 rounded-xl border text-left transition-all ${
                                        isChecked 
                                          ? 'border-primary bg-primary/5 text-text-main shadow-md' 
                                          : 'border-surface-border bg-background text-text-muted hover:bg-surface-hover'
                                      }`}
                                    >
                                      <div className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                                        isChecked ? 'border-primary bg-primary text-background' : 'border-surface-border bg-transparent'
                                      }`}>
                                        {isChecked && <span className="text-[9px] font-black">✓</span>}
                                      </div>
                                      <span className="text-xs font-black">{sz.label}</span>
                                    </button>
                                  );
                                })}
                              </div>
                           </div>

                           {/* Preços por Tamanho */}
                           {getSizesList(editingProduct?.available_sizes).length > 0 && (
                             <div className="space-y-3 p-4 rounded-2xl bg-surface/50 border border-white/5 mt-4">
                               <h5 className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Preços Específicos por Tamanho</h5>
                               <div className="space-y-3">
                                 {getSizesList(editingProduct?.available_sizes).map((szId) => {
                                   const sizeObj = [
                                     { id: 'pequena', label: 'Pequena (16cm)' },
                                     { id: 'media', label: 'Média (20cm)' },
                                     { id: 'grande', label: 'Grande (25cm)' },
                                     { id: 'familia', label: 'Família (30cm)' },
                                     { id: 'gigante', label: 'Gigante (35cm)' }
                                   ].find(s => s.id === szId);
                                   if (!sizeObj) return null;
                                   
                                   const sizePrices = editingProduct?.size_prices || {};
                                   const sizeData = sizePrices[szId] || { price: null, promo_price: null };
                                   
                                   const handlePriceChange = (field: 'price' | 'promo_price', val: string) => {
                                     const numVal = val === '' ? null : Number(val);
                                     const updatedPrices = {
                                       ...sizePrices,
                                       [szId]: {
                                         ...(sizePrices[szId] || { price: null, promo_price: null }),
                                         [field]: numVal
                                       }
                                     };
                                     setEditingProduct({
                                       ...editingProduct!,
                                       size_prices: updatedPrices
                                     });
                                   };
                                   
                                   return (
                                     <div key={szId} className="flex flex-col gap-1.5 p-3 rounded-xl bg-background border border-surface-border/50">
                                       <span className="text-xs font-black text-primary">{sizeObj.label}</span>
                                       <div className="grid grid-cols-2 gap-2">
                                         <div>
                                           <label className="text-[9px] font-black uppercase text-text-muted block mb-1">Preço Original</label>
                                           <input 
                                             type="number"
                                             step="0.01"
                                             required
                                             placeholder="Ex: 26.00"
                                             value={sizeData.price ?? ''}
                                             onChange={(e) => handlePriceChange('price', e.target.value)}
                                             className="w-full bg-surface border border-surface-border rounded-lg py-1.5 px-2 outline-none focus:border-primary/50 text-xs font-bold text-text-main"
                                           />
                                         </div>
                                         <div>
                                           <label className="text-[9px] font-black uppercase text-text-muted block mb-1">Preço Promo</label>
                                           <input 
                                             type="number"
                                             step="0.01"
                                             placeholder="Sem desconto"
                                             value={sizeData.promo_price ?? ''}
                                             onChange={(e) => handlePriceChange('promo_price', e.target.value)}
                                             className="w-full bg-surface border border-surface-border rounded-lg py-1.5 px-2 outline-none focus:border-primary/50 text-xs font-bold text-text-main"
                                           />
                                         </div>
                                       </div>
                                     </div>
                                   );
                                 })}
                               </div>
                             </div>
                           )}

                           {/* Combos Habilitados */}
                           <div className="space-y-2 pt-2 border-t border-white/5 mt-4">
                              <label className="text-[10px] font-black uppercase text-text-muted ml-1">Disponível em Combos de Tamanho</label>
                              <div className="grid grid-cols-3 gap-3">
                                {[
                                  { id: 'grande', label: 'Grande (25cm)' },
                                  { id: 'familia', label: 'Família (30cm)' },
                                  { id: 'gigante', label: 'Gigante (35cm)' }
                                ].map((sz) => {
                                  const list = getComboSizesList(editingProduct?.combo_sizes);
                                  const isChecked = list.includes(sz.id);
                                  return (
                                    <button
                                      key={sz.id}
                                      type="button"
                                      onClick={() => toggleComboSizeSelection(sz.id)}
                                      className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                                        isChecked 
                                          ? 'border-primary bg-primary/5 text-text-main shadow-md' 
                                          : 'border-surface-border bg-background text-text-muted hover:bg-surface-hover'
                                      }`}
                                    >
                                      <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${
                                        isChecked ? 'border-primary bg-primary text-background' : 'border-surface-border bg-transparent'
                                      }`}>
                                        {isChecked && <span className="text-[8px] font-black">✓</span>}
                                      </div>
                                      <span className="text-[10px] font-black">{sz.label}</span>
                                    </button>
                                  );
                                })}
                              </div>
                              <p className="text-[9px] text-text-muted ml-1 mt-1">
                                * Se nenhum for selecionado, por padrão o sabor estará disponível em todos os combos correspondentes aos tamanhos ativos da pizza.
                              </p>
                           </div>

                           {/* Permitir Meio a Meio */}
                           <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-hover border border-white/5">
                              <div>
                                 <p className="text-sm font-black text-text-main">Aceita Meio-a-Meio?</p>
                                 <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">Permitir dividir com outro sabor</p>
                              </div>
                              <button 
                               type="button"
                               onClick={() => setEditingProduct({ ...editingProduct!, allow_half_and_half: editingProduct?.allow_half_and_half === false ? true : false })}
                               className={`w-14 h-8 rounded-full relative transition-all ${editingProduct?.allow_half_and_half !== false ? 'bg-primary shadow-[0_0_15px_rgba(0,229,255,0.4)]' : 'bg-surface border border-surface-border'}`}
                              >
                                 <div className={`absolute top-1.5 w-5 h-5 rounded-full bg-white transition-all ${editingProduct?.allow_half_and_half !== false ? 'left-7' : 'left-1.5'}`} />
                              </button>
                           </div>
                         </div>
                       )}

                       {/* Seção de Variações & Sabores (ex: Bebidas, Sucos, Sobremesas, etc) */}
                       <div className="space-y-4 pt-4 border-t border-white/5">
                         <div className="flex items-center justify-between">
                           <div>
                             <div className="flex items-center gap-2">
                               <h4 className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                                 <Wine size={14} /> Variações & Sabores do Produto
                               </h4>
                               {editingProduct?.variations && editingProduct.variations.length > 0 && (
                                 <span className="bg-primary/20 text-primary text-[10px] font-black px-2.5 py-0.5 rounded-full border border-primary/30">
                                   {editingProduct.variations.length} {editingProduct.variations.length === 1 ? 'sabor' : 'sabores'}
                                 </span>
                               )}
                             </div>
                             <p className="text-[10px] text-text-muted mt-1 leading-relaxed">
                               Permite ao cliente escolher o sabor ou opção ao pedir (ex: sabores de latas de refrigerante, energéticos como Red Bull, sucos, sorvetes).
                             </p>
                           </div>
                         </div>

                         {/* Título de exibição para o cliente */}
                         <div className="space-y-1.5 bg-surface-hover/60 p-3.5 rounded-2xl border border-white/5">
                           <label className="text-[9px] font-black uppercase text-text-muted ml-1 flex items-center justify-between">
                             <span>Título da Pergunta para o Cliente</span>
                             <span className="text-[8px] text-text-muted lowercase font-normal">(opcional)</span>
                           </label>
                           <input 
                             type="text"
                             value={editingProduct?.variation_title || ''}
                             onChange={(e) => setEditingProduct({ ...editingProduct!, variation_title: e.target.value })}
                             placeholder="Ex: Escolha o sabor do energético / bebida"
                             className="w-full bg-background border border-surface-border rounded-xl py-2.5 px-3 text-xs outline-none focus:border-primary/50 text-text-main font-bold"
                           />
                         </div>

                         {/* Formulário para adicionar nova variação */}
                         <div className="p-4 bg-surface-hover/80 border border-primary/20 rounded-2xl space-y-3">
                           <div className="flex items-center justify-between">
                             <span className="text-[10px] font-black uppercase tracking-wider text-text-main">
                               + Adicionar Sabor ou Variação
                             </span>
                             <span className="text-[8px] text-text-muted font-bold uppercase">
                               Pressione Enter ou clique em Adicionar
                             </span>
                           </div>

                           <div className="flex flex-col sm:flex-row gap-2">
                             <div className="flex-[3]">
                               <input 
                                 type="text"
                                 value={newVarName}
                                 onChange={(e) => setNewVarName(e.target.value)}
                                 onKeyDown={(e) => {
                                   if (e.key === 'Enter') {
                                     e.preventDefault();
                                     handleAddVariation();
                                   }
                                 }}
                                 placeholder="Nome do sabor (ex: Melancia, Tropical, Zero...)"
                                 className="w-full bg-background border border-surface-border rounded-xl py-2.5 px-3 text-xs outline-none focus:border-primary/50 text-text-main font-bold"
                               />
                             </div>
                             <div className="flex-[2] relative">
                               <input 
                                 type="number"
                                 step="0.01"
                                 value={newVarPrice}
                                 onChange={(e) => setNewVarPrice(e.target.value)}
                                 onKeyDown={(e) => {
                                   if (e.key === 'Enter') {
                                     e.preventDefault();
                                     handleAddVariation();
                                   }
                                 }}
                                 placeholder="Adicional R$ (opcional)"
                                 className="w-full bg-background border border-surface-border rounded-xl py-2.5 pl-6 pr-3 text-xs outline-none focus:border-primary/50 text-text-main font-bold"
                               />
                               <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-primary font-black text-xs">+</span>
                             </div>
                             <button
                               type="button"
                               onClick={() => handleAddVariation()}
                               className="px-4 py-2.5 bg-primary text-background rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 hover:scale-102 active:scale-98 transition-all shrink-0 cursor-pointer shadow-md"
                             >
                               <Plus size={14} /> Adicionar
                             </button>
                           </div>

                           {/* Sugestões rápidas de 1 clique para sabores comuns de bebidas */}
                           <div className="pt-2 border-t border-white/5 space-y-1.5">
                             <span className="text-[9px] font-black uppercase text-text-muted tracking-wider block">
                               Sugestões rápidas (1 clique para adicionar):
                             </span>
                             <div className="flex flex-wrap gap-1.5">
                               {[
                                 'Tradicional / Original',
                                 'Sugar Free (Zero Açúcar)',
                                 'Tropical',
                                 'Melancia',
                                 'Pitaya',
                                 'Coco e Açaí',
                                 'Morango e Pêssego',
                                 'Laranja',
                                 'Limão',
                                 'Uva',
                                 'Maracujá'
                               ].map((flavor) => (
                                 <button
                                   key={flavor}
                                   type="button"
                                   onClick={() => handleAddPresetVariation(flavor)}
                                   className="text-[9px] font-bold px-2 py-1 rounded-lg bg-background hover:bg-primary/10 border border-surface-border hover:border-primary/40 text-text-muted hover:text-primary transition-all cursor-pointer"
                                 >
                                   + {flavor}
                                 </button>
                               ))}
                             </div>
                           </div>
                         </div>

                         {/* Lista das variações cadastradas */}
                         {editingProduct?.variations && editingProduct.variations.length > 0 ? (
                           <div className="space-y-2">
                             <div className="flex items-center justify-between ml-1">
                               <span className="text-[10px] font-black uppercase tracking-wider text-text-muted">
                                 Sabores / Variações Cadastradas ({editingProduct.variations.length})
                               </span>
                               <span className="text-[8px] text-text-muted uppercase font-bold">
                                 Alterne o status para pausar vendas
                               </span>
                             </div>
                             
                             <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                               {editingProduct.variations.map((v, index) => (
                                 <div 
                                   key={v.id || index}
                                   className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                                     v.is_active !== false 
                                       ? 'bg-surface/90 border-surface-border' 
                                       : 'bg-red-500/5 border-dashed border-red-500/30 opacity-75'
                                   }`}
                                 >
                                   <div className="flex items-center gap-2.5 min-w-0">
                                     <span className="text-[10px] font-black text-text-muted w-4">{index + 1}.</span>
                                     <div className="min-w-0">
                                       <p className="text-xs font-black text-text-main truncate">{v.name}</p>
                                       <div className="flex items-center gap-2 mt-0.5">
                                         <span className="text-[9px] font-bold text-secondary">
                                           {Number(v.price) > 0 ? `+ R$ ${Number(v.price).toFixed(2)}` : 'Preço original (sem acréscimo)'}
                                         </span>
                                         {v.is_active === false && (
                                           <span className="text-[8px] font-black uppercase text-red-400 bg-red-500/20 px-1.5 py-0.2 rounded">
                                             Esgotado
                                           </span>
                                         )}
                                       </div>
                                     </div>
                                   </div>

                                   <div className="flex items-center gap-2 shrink-0">
                                     <button
                                       type="button"
                                       onClick={() => handleToggleVariationActive(v.id)}
                                       className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                                         v.is_active !== false 
                                           ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' 
                                           : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                                       }`}
                                       title={v.is_active !== false ? 'Clique para marcar como esgotado' : 'Clique para reativar este sabor'}
                                     >
                                       {v.is_active !== false ? 'Disponível' : 'Esgotado'}
                                     </button>

                                     <button
                                       type="button"
                                       onClick={() => handleRemoveVariation(v.id)}
                                       className="p-1.5 text-text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                                       title="Remover sabor"
                                     >
                                       <Trash2 size={14} />
                                     </button>
                                   </div>
                                 </div>
                               ))}
                             </div>
                           </div>
                         ) : (
                           <div className="text-center py-4 px-3 border border-dashed border-surface-border rounded-2xl bg-surface/30">
                             <p className="text-xs text-text-muted font-bold">Nenhum sabor cadastrado ainda para este produto.</p>
                             <p className="text-[9px] text-text-muted/70 mt-1">
                               Adicione as variações acima para que os clientes escolham o sabor desejado ao comprar.
                             </p>
                           </div>
                         )}
                       </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 shrink-0">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-text-muted hover:text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={saving}
                    className="flex-[2] py-4 bg-primary text-background rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg glow-primary flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    {editingProduct?.id ? 'Salvar Alterações' : 'Criar Produto'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Categories Modal */}
      <AnimatePresence>
        {isCategoriesModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCategoriesModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-2xl bg-surface border border-white/10 rounded-[32px] overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
                <div>
                   <h2 className="text-2xl font-black">Gerenciar Categorias 🍕</h2>
                   <p className="text-xs text-text-muted uppercase font-black tracking-widest mt-1">Adicione ou remova categorias do delivery</p>
                </div>
                <button 
                  onClick={() => setIsCategoriesModalOpen(false)}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-text-muted hover:text-white transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                {/* Add Category Form */}
                <div className="p-6 rounded-2xl bg-surface-hover border border-white/5 space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-wider text-primary">Nova Categoria</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-text-muted ml-1">Nome</label>
                      <input 
                        type="text" 
                        value={newCategoryName}
                        onChange={(e) => {
                          setNewCategoryName(e.target.value);
                          setNewCategorySlug(generateSlug(e.target.value));
                        }}
                        placeholder="Ex: Entradas"
                        className="w-full bg-background border border-surface-border rounded-xl py-3 px-4 outline-none focus:border-primary/50 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-text-muted ml-1">Slug</label>
                      <input 
                        type="text" 
                        value={newCategorySlug}
                        onChange={(e) => setNewCategorySlug(e.target.value)}
                        placeholder="Ex: entradas"
                        className="w-full bg-background border border-surface-border rounded-xl py-3 px-4 outline-none focus:border-primary/50 text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-text-muted ml-1">Ícone</label>
                      <select 
                        value={newCategoryIcon}
                        onChange={(e) => setNewCategoryIcon(e.target.value)}
                        className="w-full bg-background border border-surface-border rounded-xl py-3 px-4 outline-none focus:border-primary/50 text-sm appearance-none cursor-pointer"
                      >
                        <option value="Pizza">Pizza</option>
                        <option value="Wine">Bebida (Vinho/Copo)</option>
                        <option value="Sparkles">Combos (Brilhos)</option>
                        <option value="IceCream">Sobremesa (Sorvete)</option>
                        <option value="Package">Geral (Pacote)</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button 
                      onClick={handleAddCategory}
                      disabled={savingCategory || !newCategoryName || !newCategorySlug}
                      className="px-6 py-3 bg-primary text-background rounded-xl font-black text-xs uppercase tracking-widest shadow-lg glow-primary flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {savingCategory ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                      Adicionar
                    </button>
                  </div>
                </div>

                {/* Categories List */}
                <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-wider">Categorias Existentes</h3>
                  <div className="border border-white/5 rounded-2xl overflow-hidden bg-background">
                    <table className="w-full border-collapse text-left text-text-main">
                      <thead>
                        <tr className="border-b border-white/5 bg-white/[0.02]">
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Ícone</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Nome</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest text-text-muted">Slug</th>
                          <th className="p-4 text-[10px] font-black uppercase tracking-widest text-text-muted text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categories.map((cat) => {
                          const IconComp = getCategoryIconComponent(cat.icon);
                          return (
                            <tr key={cat.id} className="border-b border-white/5 hover:bg-white/[0.01]">
                              <td className="p-4">
                                <div className="p-2 bg-primary/10 text-primary rounded-lg inline-flex">
                                  <IconComp size={16} />
                                </div>
                              </td>
                              <td className="p-4 text-sm font-bold text-text-main">{cat.name}</td>
                              <td className="p-4 text-sm text-text-muted">{cat.slug}</td>
                              <td className="p-4 text-right">
                                <button 
                                  onClick={() => handleDeleteCategory(cat.id)}
                                  disabled={deletingCategoryId === cat.id}
                                  className="p-2 bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white rounded-xl transition-all disabled:opacity-50"
                                >
                                  {deletingCategoryId === cat.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {categories.length === 0 && (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-text-muted text-xs font-bold">Nenhuma categoria encontrada.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-white/5 flex gap-4 shrink-0">
                <button 
                  onClick={() => setIsCategoriesModalOpen(false)}
                  className="w-full py-4 bg-white/5 hover:bg-white/10 text-text-muted hover:text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
}
