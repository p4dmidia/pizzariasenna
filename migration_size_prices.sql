-- ======================================================================
-- MIGRATION SCRIPT - PREÇOS ESPECÍFICOS POR TAMANHO DE PIZZA
-- Execute este script no SQL Editor do seu Painel do Supabase
-- ======================================================================

-- 1. Adicionar nova coluna na tabela public.products para preços de tamanhos
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS size_prices JSONB DEFAULT NULL;

-- 2. Adicionar comentário explicativo na coluna
COMMENT ON COLUMN public.products.size_prices IS 'Armazena preços e preços promocionais específicos por tamanho de pizza: {"media": {"price": 26.00, "promo_price": 24.00}, "grande": {"price": 53.00, "promo_price": null}, ...}';

-- 3. Corrigir configuração da pizza Frango com Catupiry (ID 3) para habilitar todos os tamanhos,
-- resolvendo a inconsistência onde o preço cadastrado era 53.00 mas ela ficava restrita a 20cm (Média) no frontend.
UPDATE public.products 
SET available_sizes = NULL 
WHERE id = 3;
