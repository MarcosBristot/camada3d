-- =====================================================================
-- Camada3D — Migration 3: exclusão de conta pelo próprio usuário (LGPD, art. 18, VI)
--
-- Apaga a linha em auth.users do usuário logado. Produtos, vendas, despesas,
-- filamentos e perfil são removidos em cascata (FKs "on delete cascade").
-- As fotos e a logo no Storage são apagadas pelo app ANTES de chamar a função
-- (o Supabase não permite apagar arquivos do Storage via SQL).
-- =====================================================================

create or replace function public.excluir_minha_conta()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Não autenticado' using errcode = '28000';
  end if;

  delete from auth.users where id = uid;
end;
$$;

comment on function public.excluir_minha_conta() is
  'Exclui definitivamente a conta do usuário autenticado e, em cascata, todos os seus dados.';

revoke all on function public.excluir_minha_conta() from public, anon;
grant execute on function public.excluir_minha_conta() to authenticated;
