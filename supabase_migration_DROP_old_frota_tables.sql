-- Reset completo de tudo relacionado ao Ativos de TI no projeto Mapa da Frota,
-- porque uma execução anterior parcial deixou coisas pela metade
-- (allowed_emails/is_allowed_user/it_device_passwords existiam, mas
-- list_device_passwords não — estado inconsistente).
-- Apaga as 7 tabelas de teste + tudo que já tinha sido criado do nosso lado,
-- pra recriar do zero de forma limpa e consistente.
-- NÃO toca em nenhuma outra tabela do banco (clientes, equipamentos,
-- frota_diario, itens_motivo, motivos, operadores, po_*, programacao,
-- programacao_anexos, status_programacao).
-- Rodar no SQL Editor do Mapa da Frota, ANTES de supabase_migration_schema_base.sql.

drop table if exists it_device_passwords cascade;
drop table if exists it_movements cascade;
drop table if exists it_maintenances cascade;
drop table if exists it_printers cascade;
drop table if exists it_responsibles cascade;
drop table if exists it_assets cascade;
drop table if exists it_categories cascade;
drop table if exists it_departments cascade;
drop table if exists allowed_emails cascade;

drop trigger if exists trg_check_allowed_email on auth.users;

drop function if exists check_allowed_email() cascade;
drop function if exists is_allowed_user() cascade;
drop function if exists list_device_passwords(text) cascade;
drop function if exists add_device_password(text, text, uuid, text, text) cascade;
drop function if exists update_device_password(uuid, text, text, uuid, text, text) cascade;
