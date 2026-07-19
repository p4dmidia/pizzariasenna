-- ======================================================================
-- MIGRATION UPDATE SCRIPT - PIZZA SENNA
-- Execute este script no SQL Editor do seu Painel do Supabase
-- ======================================================================

-- 1. Remover coluna cashback_balance da tabela de perfis de usuário
ALTER TABLE public.user_profiles DROP COLUMN IF EXISTS cashback_balance;

-- 2. Atualizar a função handle_new_user para remover o cashback da inserção inicial
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

-- 3. Criar a tabela de itens de pedido (order_items)
CREATE TABLE IF NOT EXISTS public.order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id INTEGER REFERENCES public.products(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    customizations JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Desabilitar RLS em order_items
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;

-- 4. Criar a tabela de cupons (coupons)
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

-- Desabilitar RLS em coupons
ALTER TABLE public.coupons DISABLE ROW LEVEL SECURITY;

-- 5. Inserir cupons padrão iniciais
INSERT INTO public.coupons (code, type, value, description, min_subtotal, is_active) VALUES
('BEMVINDO15', 'percentage', 15.00, 'Válido para seu primeiro pedido acima de R$ 50.', 50.00, TRUE),
('PIZZAFREE', 'fixed', 10.00, 'Desconto direto em qualquer pizza clássica.', 0.00, TRUE),
('QUARTALOUCA', 'shipping', 5.00, 'Aproveite entrega gratuita em pedidos feitos às quartas-feiras.', 0.00, TRUE)
ON CONFLICT (code) DO NOTHING;

-- 6. Adicionar configurações de geolocalização e entrega nas system_settings
INSERT INTO public.system_settings (key, value) VALUES
('store_latitude', '-23.550520'),
('store_longitude', '-46.633308'),
('delivery_base_fee', '5.00'),
('delivery_rules', '[{"maxDistance": 3, "fee": 5.00}, {"maxDistance": 7, "fee": 10.00}, {"maxDistance": 12, "fee": 15.00}]')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
