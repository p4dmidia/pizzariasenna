-- ======================================================================
-- MIGRATION SCRIPT - CUSTOMIZAÇÃO DE COMBOS DE PIZZA
-- Execute este script no SQL Editor do seu Painel do Supabase
-- ======================================================================

-- 1. Adicionar nova coluna na tabela public.products para controle de participação em combos
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS combo_sizes TEXT DEFAULT NULL;

-- 2. Adicionar comentário explicativo na coluna
COMMENT ON COLUMN public.products.combo_sizes IS 'Armazena quais tamanhos de combo esta pizza pode pertencer: "grande,familia,gigante"';

-- 3. Habilitar customização para os Combos cadastrados
UPDATE public.products 
SET allow_customizations = TRUE 
WHERE category_id = 3;
