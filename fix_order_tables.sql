-- SCRIPT DE CRIAÇÃO E LIBERAÇÃO DAS TABELAS ORDERS E ORDER_ITEMS NO SUPABASE

-- 1. Tabela de Pedidos (orders)
CREATE TABLE IF NOT EXISTS public.orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pendente',
    total_amount NUMERIC(10, 2) NOT NULL,
    delivery_fee NUMERIC(10, 2) DEFAULT 0.00,
    address_summary TEXT,
    payment_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Tabela de Itens de Pedidos (order_items)
CREATE TABLE IF NOT EXISTS public.order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id INTEGER REFERENCES public.products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    customizations JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Habilitar Segurança por Linha (RLS) e Criar Políticas Abertas
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir tudo em orders" ON public.orders;
CREATE POLICY "Permitir tudo em orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir tudo em order_items" ON public.order_items;
CREATE POLICY "Permitir tudo em order_items" ON public.order_items FOR ALL USING (true) WITH CHECK (true);

GRANT ALL ON public.orders TO anon, authenticated, service_role;
GRANT ALL ON public.order_items TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
