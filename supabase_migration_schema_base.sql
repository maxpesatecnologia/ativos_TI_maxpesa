-- Migração: schema base do Ativos de TI (nunca tinha sido criado neste banco).
-- Rodar no SQL Editor do Supabase ANTES de supabase_migration_auth_e_cofre.sql.
-- Tabelas com prefixo it_ — isoladas, não tocam em nenhuma tabela do CRM (contacts, deals, campaigns, etc).
-- Este arquivo substitui/incorpora supabase_migration_tipo_ativos.sql e supabase_migration_impressoras.sql:
-- não é necessário rodar aqueles dois separadamente neste projeto.

create table if not exists it_departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  unit text,
  created_at timestamptz default now()
);

create table if not exists it_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tipo text not null default 'Hardware' check (tipo in ('Hardware', 'Licença', 'Celular')),
  created_at timestamptz default now()
);

create table if not exists it_responsibles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  department_id uuid references it_departments(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists it_assets (
  id uuid primary key default gen_random_uuid(),
  patrimony_code text unique,
  name text not null,
  category_id uuid references it_categories(id) on delete set null,
  brand text,
  model text,
  serial_number text,
  status text not null default 'Estoque' check (status in ('Estoque', 'Em uso', 'Manutenção', 'Baixado')),
  processor text,
  ram text,
  storage text,
  os text,
  ip_address text,
  mac_address text,
  license_type text,
  phone_number text,
  carrier text,
  imei_device text,
  imei_chip text,
  responsible_id uuid references it_responsibles(id) on delete set null,
  physical_location text,
  delivery_date date,
  photo_url text,
  created_at timestamptz default now()
);

create table if not exists it_movements (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references it_assets(id) on delete cascade,
  movement_date date not null,
  previous_responsible_id uuid references it_responsibles(id) on delete set null,
  new_responsible_id uuid references it_responsibles(id) on delete set null,
  previous_location text,
  new_location text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists it_maintenances (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references it_assets(id) on delete cascade,
  maintenance_date date not null,
  maintenance_type text not null default 'Corretiva' check (maintenance_type in ('Corretiva', 'Preventiva', 'Instalação', 'Outro')),
  problem text,
  solution text,
  technician_id uuid references it_responsibles(id) on delete set null,
  notes text,
  created_at timestamptz default now()
);

create table if not exists it_printers (
  id uuid primary key default gen_random_uuid(),
  model text not null,
  cartridge_type text,
  department_id uuid references it_departments(id) on delete set null,
  created_at timestamptz default now()
);

-- RLS: só usuário autenticado (logado) lê/escreve. Nada de acesso anônimo aberto.
do $$
declare
  t text;
begin
  foreach t in array array['it_departments','it_categories','it_responsibles','it_assets','it_movements','it_maintenances','it_printers']
  loop
    execute format('alter table %I enable row level security', t);

    execute format('drop policy if exists "%s_select" on %I', t, t);
    execute format('create policy "%s_select" on %I for select using (auth.role() = ''authenticated'')', t, t);

    execute format('drop policy if exists "%s_insert" on %I', t, t);
    execute format('create policy "%s_insert" on %I for insert with check (auth.role() = ''authenticated'')', t, t);

    execute format('drop policy if exists "%s_update" on %I', t, t);
    execute format('create policy "%s_update" on %I for update using (auth.role() = ''authenticated'')', t, t);

    execute format('drop policy if exists "%s_delete" on %I', t, t);
    execute format('create policy "%s_delete" on %I for delete using (auth.role() = ''authenticated'')', t, t);
  end loop;
end $$;
