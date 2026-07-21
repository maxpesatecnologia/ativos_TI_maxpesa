-- Corrige bug real: no Supabase, a extensão pgcrypto fica instalada no schema
-- "extensions", não em "public". As funções do cofre tinham search_path fixado
-- só em "public", então não enxergavam pgp_sym_encrypt/pgp_sym_decrypt.
-- Rodar no SQL Editor.

alter function list_device_passwords(text) set search_path = public, extensions;
alter function add_device_password(text, text, uuid, text, text) set search_path = public, extensions;
alter function update_device_password(uuid, text, text, uuid, text, text) set search_path = public, extensions;
