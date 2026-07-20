-- Migração: classificação de categorias (Hardware / Licença / Celular)
-- e campos específicos de Licença e Celular em it_assets.
-- Rodar no SQL Editor do Supabase.

alter table it_categories
  add column if not exists tipo text not null default 'Hardware';

alter table it_categories
  drop constraint if exists it_categories_tipo_check;

alter table it_categories
  add constraint it_categories_tipo_check check (tipo in ('Hardware', 'Licença', 'Celular'));

-- Campos específicos de Licença de Software
alter table it_assets add column if not exists license_type text;

-- Campos específicos de Celular
alter table it_assets add column if not exists phone_number text;
alter table it_assets add column if not exists carrier text;
alter table it_assets add column if not exists imei_device text;
alter table it_assets add column if not exists imei_chip text;
