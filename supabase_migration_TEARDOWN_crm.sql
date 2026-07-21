-- Remove do projeto CRM Maxpesa tudo que foi adicionado para o sistema
-- Ativos de TI, deixando o banco do CRM exatamente como estava antes.
-- SÓ RODAR DEPOIS de confirmar que o Ativos de TI já está funcionando
-- de verdade no projeto MAPA DA FROTA (novo destino).
-- Não toca em nenhuma tabela do CRM (contacts, deals, campaigns, attachments,
-- fleet, individual_contacts, lead_sources, loss_reasons, segments, tasks, users_crm).

drop table if exists it_device_passwords cascade;
drop table if exists it_printers cascade;
drop table if exists it_maintenances cascade;
drop table if exists it_movements cascade;
drop table if exists it_assets cascade;
drop table if exists it_responsibles cascade;
drop table if exists it_categories cascade;
drop table if exists it_departments cascade;
drop table if exists allowed_emails cascade;

drop trigger if exists trg_check_allowed_email on auth.users;

drop function if exists check_allowed_email() cascade;
drop function if exists is_allowed_user() cascade;
drop function if exists list_device_passwords(text) cascade;
drop function if exists add_device_password(text, text, uuid, text, text) cascade;
drop function if exists update_device_password(uuid, text, text, uuid, text, text) cascade;

-- Depois de rodar isto, vá também em Authentication → Users e apague manualmente
-- a conta maxpesa.tecnologia@gmail.com deste projeto (CRM), já que ela vai
-- existir no projeto novo (MAPA DA FROTA) daqui pra frente.
