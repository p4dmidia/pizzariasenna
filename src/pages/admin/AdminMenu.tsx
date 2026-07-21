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

  const getSizesList = (val?: string | null) => {
    if (!val) return ['media', 'grande', 'familia', 'gigante'];
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

      setProducts(productsRes.data || []);
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
      const data = {
        name: editingProduct.name,
        description: editingProduct.description,
        price: Number(editingProduct.price),
        category_id: Number(editingProduct.category_id),
        main_image_url: editingProduct.main_image_url,
        is_active: editingProduct.is_active ?? true,
        stock_quantity: Number(editingProduct.stock_quantity || 0),
        promo_price: editingProduct.promo_price ? Number(editingProduct.promo_price) : null,
        is_featured: editingProduct.is_featured ?? false,
        allow_customizations: editingProduct.allow_customizations !== false,
        serves_description: editingProduct.serves_description || null,
        prep_time: editingProduct.prep_time ? Number(editingProduct.prep_time) : null,
        available_sizes: editingProduct.available_sizes || null,
        allow_half_and_half: editingProduct.allow_half_and_half !== false,
        updated_at: new Date().toISOString()
      };

      if (editingProduct.id) {
        const { error } = await supabase.from('products').update(data).eq('id', editingProduct.id);
        if (error) throw error;
        toast.success('Produto atualizado!');
      } else {
        const { error } = await supabase.from('products').insert([data]);
        if (error) throw error;
        toast.success('Produto criado com sucesso!');
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
                 setEditingProduct({});
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
                            type="number" 
                            step="0.01"
                            required
                            value={editingProduct?.price || ''}
                            onChange={(e) => setEditingProduct({ ...editingProduct!, price: Number(e.target.value) })}
                            className="w-full bg-background border border-surface-border rounded-xl py-3 pl-10 pr-4 outline-none focus:border-primary/50 text-sm font-black text-text-main"
                          />
                          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={16} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-text-muted ml-1">Preço Promocional (R$)</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            step="0.01"
                            value={editingProduct?.promo_price || ''}
                            onChange={(e) => setEditingProduct({ ...editingProduct!, promo_price: e.target.value ? Number(e.target.value) : null })}
                            className="w-full bg-background border border-surface-border rounded-xl py-3 pl-10 pr-4 outline-none focus:border-primary/50 text-sm font-black text-text-main"
                            placeholder="Sem desconto"
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
