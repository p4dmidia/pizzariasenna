-- ======================================================================
-- MIGRATION SCRIPT - VARIAÇÕES DE PRODUTOS (EX: SABORES DE BEBIDAS)
-- Execute este script no SQL Editor do seu Painel do Supabase
-- ======================================================================

-- 1. Adicionar novas colunas na tabela public.products para variações / sabores
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variations JSONB DEFAULT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variation_title TEXT DEFAULT NULL;

-- 2. Adicionar comentários explicativos nas colunas
COMMENT ON COLUMN public.products.variations IS 'Armazena lista de variações do produto (ex: sabores de bebidas, tipos, opções): [{"id": "v1", "name": "Melancia", "price": 0, "is_active": true}]';
COMMENT ON COLUMN public.products.variation_title IS 'Título da pergunta para o cliente (ex: "Escolha o sabor da bebida")';
