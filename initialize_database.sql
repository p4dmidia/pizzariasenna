-- ==========================================
-- SQL de Inicialização do Banco de Dados
-- APP Delivery P4D Mídia (Formato iFood Premium)
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
    cashback_balance NUMERIC(10, 2) DEFAULT 0.00,
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

-- 6. Tabela de Avaliações de Pedidos (Reviews)
CREATE TABLE IF NOT EXISTS public.order_reviews (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES public.orders(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. Tabela de Configurações do Sistema
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- 8. Trigger para sincronizar o Supabase Auth com Perfis Públicos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (mocha_user_id, email, full_name, role, cashback_balance)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Novo Usuário'),
    'user',
    0.00
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
('store_address', 'Av. Pizzaria Casarão, 1234 - Centro'),
('support_whatsapp', '5511999999999')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. Inserção de Categorias
INSERT INTO public.product_categories (id, name, slug, icon, display_order) VALUES
(1, 'Pizzas', 'pizzas', 'Pizza', 1),
(2, 'Bebidas', 'bebidas', 'Wine', 2),
(3, 'Combos', 'combos', 'Sparkles', 3),
(4, 'Sobremesas', 'sobremesas', 'IceCream', 4)
ON CONFLICT (id) DO NOTHING;

-- 3. Inserção de Produtos
INSERT INTO public.products (id, name, description, price, category_id, main_image_url, is_active, stock_quantity) VALUES
-- Pizzas
(1, 'Margherita Especial', 'Molho de tomate italiano, mussarela de búfala artesanal, manjericão fresco e azeite extra virgem.', 45.00, 1, 'https://images.unsplash.com/photo-1574071318508-1cdbad80ad38?auto=format&fit=crop&q=80&w=1000', TRUE, 99),
(2, 'Double Pepperoni', 'Dose dupla de pepperoni crocante sobre generosa camada de mussarela e molho especial.', 49.00, 1, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=1000', TRUE, 99),
(3, 'Portuguesa da Casa', 'Presunto, ovos, cebola roxa, ervilhas, azeitonas pretas e o toque secreto do chef.', 47.00, 1, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=1000', TRUE, 99),
(4, 'Calabresa', 'Calabresa fatiada e cebola.', 38.00, 1, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=1000', TRUE, 99),
(5, 'Quatro Queijos', 'Mussarela, provolone, gorgonzola e catupiry.', 42.00, 1, 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?auto=format&fit=crop&q=80&w=1000', TRUE, 99),
(6, 'Frango com Catupiry', 'Frango desfiado com o original catupiry.', 40.00, 1, NULL, TRUE, 99),
(7, 'Camarão Premium', 'Camarões selecionados e cream cheese.', 62.00, 1, NULL, FALSE, 0),
-- Bebidas
(101, 'Coca-Cola 2L', 'Refrigerante Coca-Cola garrafa PET de 2 litros gelada.', 12.00, 2, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=1000', TRUE, 150),
(102, 'Coca-Cola Lata', 'Refrigerante Coca-Cola lata 350ml trincando de gelada.', 6.00, 2, 'https://images.unsplash.com/photo-1527960656366-ee2a999e32e6?auto=format&fit=crop&q=80&w=1000', TRUE, 200),
(103, 'Guaraná Antarctica 2L', 'Refrigerante Guaraná Antarctica garrafa PET de 2 litros gelado.', 11.00, 2, 'https://images.unsplash.com/photo-1527960656366-ee2a999e32e6?auto=format&fit=crop&q=80&w=1000', TRUE, 150),
(104, 'Suco de Laranja Natural', 'Suco natural de laranja espremida na hora 500ml.', 8.50, 2, 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&q=80&w=1000', TRUE, 50),
(105, 'Cerveja Heineken Long Neck', 'Cerveja Heineken Long Neck 330ml gelada.', 9.00, 2, 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&q=80&w=1000', TRUE, 100),
(106, 'Água Mineral sem Gás', 'Garrafa de água mineral sem gás 500ml.', 4.00, 2, 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&q=80&w=1000', TRUE, 300),
-- Combos
(201, 'Combo Master', '1 Pizza Grande (Calabresa, Margherita ou Quatro Queijos) + 1 Refrigerante 2L de sua escolha.', 55.00, 3, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=1000', TRUE, 99),
(202, 'Combo Casal', '1 Pizza Média + 2 Latas de Refrigerante + 1 Pizza Doce de Chocolate broto para sobremesa.', 69.00, 3, 'https://images.unsplash.com/photo-1615557960901-b458b82bc7b2?auto=format&fit=crop&q=80&w=1000', TRUE, 99),
(203, 'Combo Família', '2 Pizzas Grandes + 1 Refrigerante 2L + 1 Porção generosa de Batata Frita.', 99.00, 3, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=1000', TRUE, 99),
(204, 'Combo Individual', '1 Pizza Brotinho + 1 Lata de Refrigerante de sua escolha.', 35.00, 3, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=1000', TRUE, 99),
-- Sobremesas
(301, 'Pizza Doce de Chocolate', 'Deliciosa pizza broto coberta com chocolate ao leite Nestlé e morangos frescos fatiados.', 25.00, 4, 'https://images.unsplash.com/photo-1617343251257-b5d709934bcd?auto=format&fit=crop&q=80&w=1000', TRUE, 99),
(302, 'Petit Gâteau Clássico', 'Bolo quente de chocolate com recheio cremoso e fluído, acompanhado de sorvete de creme.', 18.00, 4, 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=1000', TRUE, 99)
ON CONFLICT (id) DO NOTHING;

-- Ajustar sequências de IDs caso necessário
SELECT setval('public.product_categories_id_seq', COALESCE((SELECT MAX(id)+1 FROM public.product_categories), 1), false);
SELECT setval('public.products_id_seq', COALESCE((SELECT MAX(id)+1 FROM public.products), 1), false);


-- ==========================================
-- CRIAÇÃO DO PERFIL DO ADMINISTRADOR E AJUSTES DE SEGURANÇA
-- ==========================================

-- 1. Inserir ou atualizar o perfil do Admin na tabela pública
INSERT INTO public.user_profiles (
  mocha_user_id,
  email,
  full_name,
  role,
  cashback_balance
) VALUES (
  'a8f9c0b1-c2d3-4e5f-b6a7-8c9d0e1f2a3b',
  'admin@appdelivery.com.br',
  'Administrador Geral',
  'admin',
  0.00
)
ON CONFLICT (mocha_user_id) DO UPDATE 
SET role = 'admin';

-- 2. Desabilitar RLS em todas as tabelas públicas para evitar erros de permissão no frontend
ALTER TABLE public.product_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings DISABLE ROW LEVEL SECURITY;
