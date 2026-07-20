-- ======================================================================
-- SCRIPT DE POPULAÇÃO DEFINITIVO DE PRODUTOS DA PIZZARIA SENNA
-- Execute este script no SQL Editor do seu Painel do Supabase
-- ======================================================================

-- 1. Criar tabelas se não existirem
CREATE TABLE IF NOT EXISTS public.product_categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT NOT NULL,
    display_order INTEGER DEFAULT 0
);

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

-- 2. Garantir que as colunas novas existam
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS promo_price NUMERIC(10, 2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS allow_customizations BOOLEAN DEFAULT TRUE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS serves_description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS prep_time INTEGER;

-- 3. DESABILITAR RLS E CONCEDER PERMISSÕES
ALTER TABLE IF EXISTS public.product_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products DISABLE ROW LEVEL SECURITY;

GRANT ALL ON TABLE public.product_categories TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.products TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 4. Limpar dados antigos com CASCADE para evitar conflitos de chave única/estrangeira
TRUNCATE TABLE public.products RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.product_categories RESTART IDENTITY CASCADE;

-- 5. Inserir as Categorias Principais
INSERT INTO public.product_categories (id, name, slug, icon) VALUES
  (1, 'Pizzas', 'pizzas', 'Pizza'),
  (2, 'Bebidas', 'bebidas', 'Wine'),
  (3, 'Combos', 'combos', 'Sparkles'),
  (4, 'Sucos', 'sucos', 'Wine'),
  (5, 'Refrigerantes', 'refrigerantes', 'Wine');

SELECT setval('product_categories_id_seq', (SELECT MAX(id) FROM public.product_categories));

-- 6. Inserir PIZZAS (Categoria 1)
INSERT INTO public.products (category_id, name, description, price, promo_price, main_image_url, is_active, is_featured, allow_customizations, serves_description, prep_time, stock_quantity) VALUES
  (1, 'Senna Especial', 'Peito de frango, catupiry, calabresa, presunto, mussarela, provolone, bacon e molho de tomate.', 53.00, 49.90, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800', true, true, true, '3 a 4 pessoas', 30, 100),
  (1, 'A Moda da Casa', 'Peito de frango, calabresa, presunto, mussarela, molho de tomate e lombo canadense.', 53.00, NULL, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800', true, true, true, '3 a 4 pessoas', 25, 100),
  (1, 'Frango com Catupiry', 'Peito de frango, catupiry, mussarela, molho de tomate e orégano.', 53.00, NULL, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&q=80&w=800', true, true, true, '3 a 4 pessoas', 25, 100),
  (1, 'Frango com Bacon', 'Peito de frango, bacon, mussarela, molho de tomate e orégano.', 53.00, NULL, 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&q=80&w=800', true, false, true, '3 a 4 pessoas', 25, 100),
  (1, 'Calabresa', 'Calabresa, molho de tomate, mussarela e orégano.', 53.00, 47.00, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=800', true, false, true, '3 a 4 pessoas', 20, 100),
  (1, 'Carne Seca com Requeijão', 'Molho de tomate, mussarela, orégano, carne seca desfiada e requeijão.', 53.00, NULL, 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&q=80&w=800', true, false, true, '3 a 4 pessoas', 30, 100),
  (1, '4 Queijos', 'Provolone, mussarela, parmesão, catupiry, molho de tomate e orégano.', 53.00, NULL, 'https://images.unsplash.com/photo-1573821663912-6df460f9c684?auto=format&fit=crop&q=80&w=800', true, false, true, '3 a 4 pessoas', 20, 100);

-- 7. Inserir COMBOS (Categoria 3)
INSERT INTO public.products (category_id, name, description, price, promo_price, main_image_url, is_active, is_featured, allow_customizations, serves_description, prep_time, stock_quantity) VALUES
  (3, 'Combo Pizza 35cm + Refrigerante (Kuat/Sukita/Mate Couro/Pepsi 2L)', 'Pizza Gigante (35 cm) à sua escolha + Refrigerante 2L (Kuat, Sukita, Mate Couro ou Pepsi).', 75.00, NULL, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800', true, true, false, '4 a 5 pessoas', 35, 100),
  (3, 'Combo Pizza 30cm + Refrigerante (Kuat/Sukita/Mate Couro/Pepsi 2L)', 'Pizza Família (30 cm) à sua escolha + Refrigerante 2L (Kuat, Sukita, Mate Couro ou Pepsi).', 72.00, NULL, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800', true, false, false, '3 a 4 pessoas', 30, 100),
  (3, 'Combo Pizza 25cm + Refrigerante (Kuat/Sukita/Mate Couro/Pepsi 2L)', 'Pizza Grande (25 cm) à sua escolha + Refrigerante 2L (Kuat, Sukita, Mate Couro ou Pepsi).', 67.00, NULL, 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&q=80&w=800', true, false, false, '2 a 3 pessoas', 25, 100),
  (3, 'Combo Pizza 35cm + Coca-Cola ou Guaraná 2L', 'Pizza Gigante (35 cm) à sua escolha + Coca-Cola ou Guaraná Antarctica 2L.', 77.00, NULL, 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&q=80&w=800', true, true, false, '4 a 5 pessoas', 35, 100),
  (3, 'Combo Pizza 30cm + Coca-Cola ou Guaraná 2L', 'Pizza Família (30 cm) à sua escolha + Coca-Cola ou Guaraná Antarctica 2L.', 74.00, NULL, 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&q=80&w=800', true, false, false, '3 a 4 pessoas', 30, 100),
  (3, 'Combo Pizza 25cm + Coca-Cola ou Guaraná 2L', 'Pizza Grande (25 cm) à sua escolha + Coca-Cola ou Guaraná Antarctica 2L.', 69.00, NULL, 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&q=80&w=800', true, false, false, '2 a 3 pessoas', 25, 100),
  (3, 'Combo Pizza 35cm + Mate Couro 2L', 'Pizza Gigante (35 cm) à sua escolha + Mate Couro 2L.', 75.00, NULL, 'https://images.unsplash.com/photo-1573821663912-6df460f9c684?auto=format&fit=crop&q=80&w=800', true, false, false, '4 a 5 pessoas', 35, 100),
  (3, 'Combo Pizza 30cm + Mate Couro 2L', 'Pizza Família (30 cm) à sua escolha + Mate Couro 2L.', 72.00, NULL, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=800', true, false, false, '3 a 4 pessoas', 30, 100),
  (3, 'Combo Pizza 25cm + Mate Couro 2L', 'Pizza Grande (25 cm) à sua escolha + Mate Couro 2L.', 67.00, NULL, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&q=80&w=800', true, false, false, '2 a 3 pessoas', 25, 100);

-- 8. Inserir SUCOS (Categoria 4)
INSERT INTO public.products (category_id, name, description, price, promo_price, main_image_url, is_active, is_featured, allow_customizations, serves_description, prep_time, stock_quantity) VALUES
  (4, 'Suco de Manga 500 ml', 'Suco natural de manga bem gelado 500ml.', 8.50, NULL, 'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&q=80&w=800', true, false, false, '1 pessoa', 5, 100),
  (4, 'Suco de Uva 500 ml', 'Suco natural de uva bem gelado 500ml.', 8.50, NULL, 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&q=80&w=800', true, false, false, '1 pessoa', 5, 100),
  (4, 'Suco de Pêssego 500 ml', 'Suco saboroso de pêssego 500ml.', 8.50, NULL, 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&q=80&w=800', true, false, false, '1 pessoa', 5, 100),
  (4, 'Suco de Goiaba 500 ml', 'Suco cremoso de goiaba 500ml.', 8.50, NULL, 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&q=80&w=800', true, false, false, '1 pessoa', 5, 100),
  (4, 'Suco de Maracujá 500 ml', 'Suco refrescante de maracujá 500ml.', 8.50, NULL, 'https://images.unsplash.com/photo-1577805947697-89e18249d767?auto=format&fit=crop&q=80&w=800', true, false, false, '1 pessoa', 5, 100),
  (4, 'Suco de Laranja 500 ml', 'Suco de laranja natural 100% fruta 500ml.', 8.50, NULL, 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&q=80&w=800', true, true, false, '1 pessoa', 5, 100);

-- 9. Inserir OUTRAS BEBIDAS (Categoria 2)
INSERT INTO public.products (category_id, name, description, price, promo_price, main_image_url, is_active, is_featured, allow_customizations, serves_description, prep_time, stock_quantity) VALUES
  (2, 'Água Mineral 500 ml', 'Garrafa de água mineral sem gás 500ml.', 5.00, NULL, 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&q=80&w=800', true, false, false, '1 pessoa', 0, 100),
  (2, 'Água com Gás 500 ml', 'Garrafa de água mineral com gás 500ml.', 6.00, NULL, 'https://images.unsplash.com/photo-1559839914-17aae19cec71?auto=format&fit=crop&q=80&w=800', true, false, false, '1 pessoa', 0, 100),
  (2, 'H2OH! 500 ml', 'H2OH! Limão levemente gaseificada 500ml.', 7.50, NULL, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=800', true, false, false, '1 pessoa', 0, 100),
  (2, 'Gatorade 500 ml', 'Bebida isotônica Gatorade 500ml.', 10.00, NULL, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=800', true, false, false, '1 pessoa', 0, 100),
  (2, 'Energético Red Bull 250 ml', 'Lata de energético Red Bull Energy Drink 250ml.', 15.00, NULL, 'https://images.unsplash.com/photo-1527960471264-932f39eb5846?auto=format&fit=crop&q=80&w=800', true, false, false, '1 pessoa', 0, 100);

-- 10. Inserir REFRIGERANTES (Categoria 5)
INSERT INTO public.products (category_id, name, description, price, promo_price, main_image_url, is_active, is_featured, allow_customizations, serves_description, prep_time, stock_quantity) VALUES
  (5, 'Refrigerante Caçulinha', 'Refrigerante mini caçulinha gelado.', 4.00, NULL, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=800', true, false, false, '1 pessoa', 0, 100),
  (5, 'Refrigerante Lata 220 ml', 'Lata 220ml super gelada.', 5.00, NULL, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=800', true, false, false, '1 pessoa', 0, 100),
  (5, 'Refrigerante 310 ml', 'Lata sleek 310ml.', 6.00, NULL, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=800', true, false, false, '1 pessoa', 0, 100),
  (5, 'Refrigerante LT 350 ml', 'Lata tradicional 350ml.', 7.00, NULL, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=800', true, false, false, '1 pessoa', 0, 100),
  (5, 'Refrigerante 600 ml', 'Garrafa 600ml gelada.', 9.00, NULL, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=800', true, false, false, '1 a 2 pessoas', 0, 100),
  (5, 'Refrigerante 1 L', 'Garrafa 1 Litro.', 10.00, NULL, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=800', true, false, false, '2 a 3 pessoas', 0, 100),
  (5, 'Refrigerante 1,5 L', 'Garrafa 1,5 Litros.', 12.00, NULL, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=800', true, false, false, '3 pessoas', 0, 100),
  (5, 'Kuat 2 L', 'Garrafa Kuat Guaraná 2 Litros.', 15.00, NULL, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=800', true, false, false, '4 pessoas', 0, 100),
  (5, 'Sukita 2 L', 'Garrafa Sukita Laranja 2 Litros.', 15.00, NULL, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=800', true, false, false, '4 pessoas', 0, 100),
  (5, 'Pepsi 2 L', 'Garrafa Pepsi Cola 2 Litros.', 15.00, NULL, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=800', true, false, false, '4 pessoas', 0, 100),
  (5, 'Mate Couro 2 L', 'Garrafa Mate Couro 2 Litros.', 15.00, NULL, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=800', true, false, false, '4 pessoas', 0, 100),
  (5, 'Guaraná Antarctica 2 L', 'Garrafa Guaraná Antarctica 2 Litros.', 18.00, NULL, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=800', true, true, false, '4 pessoas', 0, 100),
  (5, 'Coca-Cola 2 L', 'Garrafa Coca-Cola Original 2 Litros.', 18.00, NULL, 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=800', true, true, false, '4 pessoas', 0, 100);
