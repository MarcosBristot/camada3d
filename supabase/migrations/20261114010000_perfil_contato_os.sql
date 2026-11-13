-- =====================================================================
-- farmOps 3D — Migration 5: dados da empresa que aparecem na ordem de serviço
-- =====================================================================
alter table public.perfil_empresa
  add column if not exists contato   text check (char_length(contato) <= 200),   -- ex.: "WhatsApp (51) 99999-9999 · @tess3d"
  add column if not exists cidade    text check (char_length(cidade) <= 80),
  add column if not exists rodape_os text check (char_length(rodape_os) <= 800); -- garantia, prazos, cuidados com a peça

comment on column public.perfil_empresa.rodape_os is 'Texto padrão impresso no fim de toda ordem de serviço.';
