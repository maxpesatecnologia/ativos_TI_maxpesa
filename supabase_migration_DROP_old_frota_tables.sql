-- Remove as tabelas it_* antigas (dados de teste) do projeto Mapa da Frota,
-- pra recriar do zero com o schema correto e validado.
-- NÃO toca em nenhuma outra tabela do banco (clientes, equipamentos, frota_diario,
-- itens_motivo, motivos, operadores, po_*, programacao, programacao_anexos,
-- status_programacao) — só as com prefixo it_.
-- Rodar no SQL Editor do Mapa da Frota, ANTES de supabase_migration_schema_base.sql.

drop table if exists it_movements cascade;
drop table if exists it_maintenances cascade;
drop table if exists it_printers cascade;
drop table if exists it_responsibles cascade;
drop table if exists it_assets cascade;
drop table if exists it_categories cascade;
drop table if exists it_departments cascade;
