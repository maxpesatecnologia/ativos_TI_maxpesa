-- Corrige uma falha: o Supabase Auth deste projeto é compartilhado com o CRM,
-- então contas já existentes (criadas antes da allowlist) conseguiam logar no
-- Ativos de TI mesmo sem estar em allowed_emails. Esta migração faz o RLS
-- exigir e-mail permitido, não só "estar autenticado".
-- Rodar no SQL Editor DEPOIS de supabase_migration_auth_e_cofre.sql.

create or replace function is_allowed_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from allowed_emails
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

grant execute on function is_allowed_user() to authenticated;

-- Reaplica as policies das tabelas do Ativos de TI exigindo e-mail permitido.
do $$
declare
  t text;
begin
  foreach t in array array['it_departments','it_categories','it_responsibles','it_assets','it_movements','it_maintenances','it_printers','it_device_passwords']
  loop
    execute format('drop policy if exists "%s_select" on %I', t, t);
    execute format('create policy "%s_select" on %I for select using (is_allowed_user())', t, t);

    execute format('drop policy if exists "%s_insert" on %I', t, t);
    execute format('create policy "%s_insert" on %I for insert with check (is_allowed_user())', t, t);

    execute format('drop policy if exists "%s_update" on %I', t, t);
    execute format('create policy "%s_update" on %I for update using (is_allowed_user())', t, t);

    execute format('drop policy if exists "%s_delete" on %I', t, t);
    execute format('create policy "%s_delete" on %I for delete using (is_allowed_user())', t, t);
  end loop;
end $$;

-- allowed_emails: select continua liberado pra qualquer autenticado (necessário pro
-- próprio check acima funcionar e pro Login.jsx conferir a allowlist), mas
-- insert/delete (gerenciar quem entra) fica restrito a quem já está na allowlist.
drop policy if exists "allowed_emails_select" on allowed_emails;
create policy "allowed_emails_select" on allowed_emails for select using (auth.role() = 'authenticated');

drop policy if exists "allowed_emails_insert" on allowed_emails;
create policy "allowed_emails_insert" on allowed_emails for insert with check (is_allowed_user());

drop policy if exists "allowed_emails_delete" on allowed_emails;
create policy "allowed_emails_delete" on allowed_emails for delete using (is_allowed_user());

-- As funções do cofre também passam a exigir e-mail permitido, não só autenticado.
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
  if not is_allowed_user() then
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
  if not is_allowed_user() then
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
  if not is_allowed_user() then
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
