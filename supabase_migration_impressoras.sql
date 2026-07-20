-- Migração: cadastro de Impressoras
-- Rodar no SQL Editor do Supabase.

create table if not exists it_printers (
  id uuid primary key default gen_random_uuid(),
  model text not null,
  cartridge_type text,
  department_id uuid references it_departments(id) on delete set null,
  created_at timestamptz default now()
);

alter table it_printers enable row level security;

drop policy if exists "it_printers_select" on it_printers;
create policy "it_printers_select" on it_printers for select using (true);

drop policy if exists "it_printers_insert" on it_printers;
create policy "it_printers_insert" on it_printers for insert with check (true);

drop policy if exists "it_printers_update" on it_printers;
create policy "it_printers_update" on it_printers for update using (true);

drop policy if exists "it_printers_delete" on it_printers;
create policy "it_printers_delete" on it_printers for delete using (true);
