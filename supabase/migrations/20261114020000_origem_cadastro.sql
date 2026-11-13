-- =====================================================================
-- farmOps 3D — Migration 6: mostra no painel de admin a ORIGEM de cada cadastro
-- (gravada pelo app em auth.users.raw_user_meta_data->>'origem', ex.: "reels-calculadora")
-- =====================================================================
drop function if exists public.admin_listar_assinaturas();

create function public.admin_listar_assinaturas()
returns table (
  user_id        uuid,
  email          text,
  empresa        text,
  origem         text,
  criado_em      timestamptz,
  ultimo_acesso  timestamptz,
  plano          text,
  teste_ate      timestamptz,
  pro_ate        timestamptz,
  periodo        text,
  observacao     text,
  produtos       bigint,
  pedidos_mes    bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.eh_admin() then
    raise exception 'Acesso restrito ao administrador' using errcode = '42501';
  end if;

  return query
  select u.id,
         u.email::text,
         (select pf.nome from public.perfil_empresa pf where pf.user_id = u.id),
         nullif(u.raw_user_meta_data->>'origem', ''),
         u.created_at,
         u.last_sign_in_at,
         case when a.pro_ate > now() or a.teste_ate > now() then 'pro' else 'free' end,
         a.teste_ate,
         a.pro_ate,
         a.periodo,
         a.observacao,
         (select count(*) from public.produtos p where p.user_id = u.id),
         (select count(*) from public.pedidos pe where pe.user_id = u.id and pe.created_at >= date_trunc('month', now()))
  from auth.users u
  left join public.assinaturas a on a.user_id = u.id
  order by u.created_at desc;
end;
$$;

revoke all on function public.admin_listar_assinaturas() from public, anon;
grant execute on function public.admin_listar_assinaturas() to authenticated;
