-- ======================================================================
-- MIGRATION SCRIPT - NOVAS CARACTERÍSTICAS DOS PRODUTOS
-- Execute este script no SQL Editor do seu Painel do Supabase
-- ======================================================================

-- 1. Adicionar novas colunas na tabela public.products se elas não existirem
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS promo_price NUMERIC(10, 2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS allow_customizations BOOLEAN DEFAULT TRUE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS serves_description TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS prep_time INTEGER;

-- 2. Habilitar customização por padrão para as Pizzas existentes (categoria ID = 1)
UPDATE public.products 
SET allow_customizations = TRUE 
WHERE category_id = 1;

-- 3. Desabilitar customização por padrão para outras categorias já existentes (Bebidas, Combos, etc)
UPDATE public.products 
SET allow_customizations = FALSE 
WHERE category_id != 1;
