-- Migração: login restrito a e-mails permitidos + cofre de senhas de dispositivos.
-- Rodar no SQL Editor do Supabase (projeto atual).

-- ============================================================
-- PARTE A — Allowlist de e-mails + fechamento das tabelas existentes
-- ============================================================

create table if not exists allowed_emails (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz default now()
);

-- Semente: garante que o acesso atual não fique travado após a migração.
insert into allowed_emails (email)
values ('jovem.aprendiz1@maxpesa.com.br')
on conflict (email) do nothing;

alter table allowed_emails enable row level security;

drop policy if exists "allowed_emails_select" on allowed_emails;
create policy "allowed_emails_select" on allowed_emails for select using (auth.role() = 'authenticated');
drop policy if exists "allowed_emails_insert" on allowed_emails;
create policy "allowed_emails_insert" on allowed_emails for insert with check (auth.role() = 'authenticated');
drop policy if exists "allowed_emails_delete" on allowed_emails;
create policy "allowed_emails_delete" on allowed_emails for delete using (auth.role() = 'authenticated');

-- Bloqueia signUp de e-mails fora da allowlist diretamente no banco.
create or replace function check_allowed_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from allowed_emails where lower(email) = lower(new.email)
  ) then
    raise exception 'E-mail não autorizado a criar conta neste sistema.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_check_allowed_email on auth.users;
create trigger trg_check_allowed_email
  before insert on auth.users
  for each row
  execute function check_allowed_email();

-- Fecha o acesso das tabelas existentes: só usuário autenticado passa a ler/escrever.
-- Tabelas que não existirem neste banco são ignoradas (não interrompem a migração).
do $$
declare
  t text;
begin
  foreach t in array array['it_assets','it_categories','it_departments','it_responsibles','it_movements','it_maintenances','it_printers']
  loop
    if to_regclass('public.' || t) is null then
      raise notice 'Tabela % não existe neste banco — pulando.', t;
      continue;
    end if;

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

-- ============================================================
-- PARTE B — Cofre de senhas de dispositivos (criptografado)
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists it_device_passwords (
  id uuid primary key default gen_random_uuid(),
  device_type text not null check (device_type in ('notebook', 'desktop')),
  device_name text not null,
  department_id uuid,
  encrypted_password bytea not null,
  created_at timestamptz default now()
);

do $$
begin
  if to_regclass('public.it_departments') is not null then
    alter table it_device_passwords drop constraint if exists it_device_passwords_department_id_fkey;
    alter table it_device_passwords
      add constraint it_device_passwords_department_id_fkey
      foreign key (department_id) references it_departments(id) on delete set null;
  else
    raise notice 'Tabela it_departments não existe — department_id ficará sem FK por enquanto.';
  end if;
end $$;

alter table it_device_passwords enable row level security;

drop policy if exists "it_device_passwords_select" on it_device_passwords;
create policy "it_device_passwords_select" on it_device_passwords for select using (auth.role() = 'authenticated');
drop policy if exists "it_device_passwords_insert" on it_device_passwords;
create policy "it_device_passwords_insert" on it_device_passwords for insert with check (auth.role() = 'authenticated');
drop policy if exists "it_device_passwords_update" on it_device_passwords;
create policy "it_device_passwords_update" on it_device_passwords for update using (auth.role() = 'authenticated');
drop policy if exists "it_device_passwords_delete" on it_device_passwords;
create policy "it_device_passwords_delete" on it_device_passwords for delete using (auth.role() = 'authenticated');

-- Lista os dispositivos já decriptados; falha inteira se vault_password estiver errada.
create or replace function list_device_passwords(vault_password text)
returns table (
  id uuid,
  device_type text,
  device_name text,
  department_id uuid,
  password text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'authenticated' then
    raise exception 'Não autorizado.';
  end if;

  return query
  select
    p.id,
    p.device_type,
    p.device_name,
    p.department_id,
    pgp_sym_decrypt(p.encrypted_password, vault_password),
    p.created_at
  from it_device_passwords p
  order by p.device_name;
end;
$$;

create or replace function add_device_password(
  p_device_type text,
  p_device_name text,
  p_department_id uuid,
  p_plain_password text,
  p_vault_password text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if auth.role() <> 'authenticated' then
    raise exception 'Não autorizado.';
  end if;

  insert into it_device_passwords (device_type, device_name, department_id, encrypted_password)
  values (p_device_type, p_device_name, p_department_id, pgp_sym_encrypt(p_plain_password, p_vault_password))
  returning id into new_id;

  return new_id;
end;
$$;

create or replace function update_device_password(
  p_id uuid,
  p_device_type text,
  p_device_name text,
  p_department_id uuid,
  p_plain_password text,
  p_vault_password text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'authenticated' then
    raise exception 'Não autorizado.';
  end if;

  update it_device_passwords
  set device_type = p_device_type,
      device_name = p_device_name,
      department_id = p_department_id,
      encrypted_password = pgp_sym_encrypt(p_plain_password, p_vault_password)
  where id = p_id;
end;
$$;

grant execute on function list_device_passwords(text) to authenticated;
grant execute on function add_device_password(text, text, uuid, text, text) to authenticated;
grant execute on function update_device_password(uuid, text, text, uuid, text, text) to authenticated;
