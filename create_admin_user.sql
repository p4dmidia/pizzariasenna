-- ======================================================================
-- SCRIPT SQL PARA CRIAR/RESTAURAR USUÁRIO ADMINISTRADOR
-- Pizza Senna
-- Execute este script no SQL Editor do seu Painel do Supabase
-- ======================================================================

DO $$
DECLARE
  new_user_id UUID;
  password_hash TEXT;
BEGIN
  -- 1. Habilitar a extensão pgcrypto para criptografia se não estiver ativa
  CREATE EXTENSION IF NOT EXISTS pgcrypto;

  -- 2. Gerar o hash da senha usando bcrypt (via crypt do pgcrypto)
  password_hash := crypt('admin123', gen_salt('bf'));

  -- 3. Verificar se o usuário já existe pelo e-mail
  SELECT id INTO new_user_id FROM auth.users WHERE email = 'admin@pizzasenna.com.br';

  IF new_user_id IS NOT NULL THEN
    -- Se o usuário existe, atualiza a senha e atualiza o timestamp
    UPDATE auth.users
    SET encrypted_password = password_hash,
        updated_at = now()
    WHERE id = new_user_id;
    
    -- Garante que o perfil público correspondente existe e é administrador
    INSERT INTO public.user_profiles (mocha_user_id, email, full_name, role)
    VALUES (new_user_id, 'admin@pizzasenna.com.br', 'Administrador Pizza Senna', 'admin')
    ON CONFLICT (mocha_user_id) 
    DO UPDATE SET role = 'admin', full_name = 'Administrador Pizza Senna', email = 'admin@pizzasenna.com.br';
  ELSE
    -- Se não existe, cria um novo UUID
    new_user_id := gen_random_uuid();
    
    -- Inserir na tabela de autenticação auth.users do Supabase
    INSERT INTO auth.users (
      instance_id,
      id,
      role,
      aud,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      new_user_id,
      'authenticated',
      'authenticated',
      'admin@pizzasenna.com.br',
      password_hash,
      now(),
      now(),
      now(),
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      '{"full_name": "Administrador Pizza Senna"}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    -- Atualiza ou insere o perfil correspondente na tabela pública com perfil de admin
    -- (Nota: A trigger handle_new_user() já insere um perfil automático com a role 'user',
    -- esse comando com ON CONFLICT atualiza a role para 'admin')
    INSERT INTO public.user_profiles (mocha_user_id, email, full_name, role)
    VALUES (new_user_id, 'admin@pizzasenna.com.br', 'Administrador Pizza Senna', 'admin')
    ON CONFLICT (mocha_user_id) 
    DO UPDATE SET role = 'admin', full_name = 'Administrador Pizza Senna', email = 'admin@pizzasenna.com.br';
  END IF;

END $$;
