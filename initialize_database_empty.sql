-- ==========================================
-- SQL de Inicialização do Banco de Dados (Sem Produtos)
-- Pizza Senna (Formato iFood Premium)
-- ==========================================

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Tabela de Categorias de Produtos
CREATE TABLE IF NOT EXISTS public.product_categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT NOT NULL,
    display_order INTEGER DEFAULT 0
);

-- 3. Tabela de Produtos
CREATE TABLE IF NOT EXISTS public.products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    category_id INTEGER REFERENCES public.product_categories(id) ON DELETE CASCADE,
    main_image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    stock_quantity INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. Tabela de Perfis de Usuários
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id SERIAL PRIMARY KEY,
    mocha_user_id UUID UNIQUE NOT NULL,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'caixa')),
    avatar_url TEXT,
    address TEXT,
    number TEXT,
    complement TEXT,
    neighborhood TEXT,
    city TEXT,
    state TEXT,
    zipcode TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Tabela de Pedidos
CREATE TABLE IF NOT EXISTS public.orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'preparando', 'entrega', 'concluido', 'cancelado')),
    total_amount NUMERIC(10, 2) NOT NULL,
    delivery_fee NUMERIC(10, 2) DEFAULT 0.00,
    address_summary TEXT,
    payment_method TEXT CHECK (payment_method IN ('pix', 'card', 'wallet', 'cash', 'delivery')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. Tabela de Itens de Pedidos (Order Items)
CREATE TABLE IF NOT EXISTS public.order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id INTEGER REFERENCES public.products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    customizations JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. Tabela de Cupons de Desconto (Coupons)
CREATE TABLE IF NOT EXISTS public.coupons (
    id SERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    type TEXT CHECK (type IN ('percentage', 'fixed', 'shipping')) NOT NULL,
    value NUMERIC(10, 2) NOT NULL,
    description TEXT,
    min_subtotal NUMERIC(10, 2) DEFAULT 0.00,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. Tabela de Avaliações de Pedidos (Reviews)
CREATE TABLE IF NOT EXISTS public.order_reviews (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 9. Tabela de Configurações do Sistema
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- 10. Trigger para sincronizar o Supabase Auth com Perfis Públicos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (mocha_user_id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Novo Usuário'),
    'user'
  )
  ON CONFLICT (mocha_user_id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar a trigger real no auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ==========================================
-- CARGA DE DADOS INICIAIS
-- ==========================================

-- 1. Configurações de Sistema Iniciais
INSERT INTO public.system_settings (key, value) VALUES
('store_open', 'true'),
('delivery_time_est', '35 - 50 min'),
('store_address', 'Av. Pizzaria Senna, 1234 - Centro'),
('support_whatsapp', '5511999999999'),
('store_latitude', '-23.550520'),
('store_longitude', '-46.633308'),
('delivery_base_fee', '5.00'),
('delivery_rules', '[{"maxDistance": 3, "fee": 5.00}, {"maxDistance": 7, "fee": 10.00}, {"maxDistance": 12, "fee": 15.00}]')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. Inserção de Categorias
INSERT INTO public.product_categories (id, name, slug, icon, display_order) VALUES
(1, 'Pizzas', 'pizzas', 'Pizza', 1),
(2, 'Bebidas', 'bebidas', 'Wine', 2),
(3, 'Combos', 'combos', 'Sparkles', 3),
(4, 'Sobremesas', 'sobremesas', 'IceCream', 4)
ON CONFLICT (id) DO NOTHING;

-- Inserir cupons iniciais
INSERT INTO public.coupons (code, type, value, description, min_subtotal, is_active) VALUES
('BEMVINDO15', 'percentage', 15.00, 'Válido para seu primeiro pedido acima de R$ 50.', 50.00, TRUE),
('PIZZAFREE', 'fixed', 10.00, 'Desconto direto em qualquer pizza clássica.', 0.00, TRUE),
('QUARTALOUCA', 'shipping', 5.00, 'Aproveite entrega gratuita em pedidos feitos às quartas-feiras.', 0.00, TRUE)
ON CONFLICT (code) DO NOTHING;

-- Ajustar sequências de IDs
SELECT setval('public.product_categories_id_seq', COALESCE((SELECT MAX(id)+1 FROM public.product_categories), 1), false);
SELECT setval('public.products_id_seq', 1, false);


-- ==========================================
-- CRIAÇÃO DO PERFIL DO ADMINISTRADOR E AJUSTES DE SEGURANÇA
-- ==========================================

-- 1. Inserir ou atualizar o perfil do Admin na tabela pública
INSERT INTO public.user_profiles (
  mocha_user_id,
  email,
  full_name,
  role
) VALUES (
  'a8f9c0b1-c2d3-4e5f-b6a7-8c9d0e1f2a3b',
  'admin@appdelivery.com.br',
  'Administrador Geral',
  'admin'
)
ON CONFLICT (mocha_user_id) DO UPDATE 
SET role = 'admin';

-- 2. Desabilitar RLS em todas as tabelas públicas para evitar erros de permissão no frontend
ALTER TABLE public.product_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings DISABLE ROW LEVEL SECURITY;
