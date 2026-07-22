-- Migração: e-mail vinculado à licença de software.
-- Rodar no SQL Editor do Supabase.

alter table it_assets add column if not exists license_email text;
