-- ======================================================================
-- SCRIPT DE AJUSTE DE BANCO DE DADOS - PIZZARIA SENNA
-- Executar no SQL Editor do Supabase
-- ======================================================================

-- 1. Desabilitar RLS em todas as tabelas para permitir leitura/escrita do frontend
ALTER TABLE IF EXISTS public.product_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.coupons DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.system_settings DISABLE ROW LEVEL SECURITY;

-- 2. Inserir as configurações iniciais do sistema (incluindo status da loja aberta)
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

-- 3. Inserir algumas avaliações mock (sem dependência de pedidos) para calcular a média
INSERT INTO public.order_reviews (rating, comment) VALUES
(5, 'A melhor pizza da região! Entrega super rápida.'),
(4, 'Pizza deliciosa, ingredientes muito frescos.'),
(5, 'Atendimento excelente e entrega antes do prazo!')
ON CONFLICT DO NOTHING;
