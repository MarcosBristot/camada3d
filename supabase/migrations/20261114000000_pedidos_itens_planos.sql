-- =====================================================================
-- farmOps 3D — Migration 4
--   1. PEDIDOS com vários ITENS (a antiga tabela "vendas" vira "pedido_itens")
--      Cada venda existente vira um pedido de 1 item (mesmo id, mesmo código).
--   2. PLANOS: assinatura por usuário (teste de 14 dias, Pro até uma data),
--      limites do plano Free aplicados no banco.
--   3. ADMIN: funções para o dono do serviço ativar/estender o Pro (cobrança manual).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. PEDIDOS
-- ---------------------------------------------------------------------
create table if not exists public.pedidos (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  codigo           text not null check (char_length(btrim(codigo)) between 1 and 30),
  cliente_nome     text not null check (char_length(btrim(cliente_nome)) between 1 and 120),
  cliente_contato  text check (char_length(cliente_contato) <= 120),
  data_pedido      date not null default current_date,
  prazo_entrega    date,
  status_entrega   public.status_entrega not null default 'pendente',
  pago             boolean not null default false,
  forma_pagamento  text,
  frete            numeric(12,2) not null default 0 check (frete >= 0),
  desconto         numeric(12,2) not null default 0 check (desconto >= 0),
  observacoes      text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint pedidos_codigo_unico unique (user_id, codigo)
);

create index if not exists pedidos_user_data_idx   on public.pedidos (user_id, data_pedido desc);
create index if not exists pedidos_user_status_idx on public.pedidos (user_id, status_entrega);
create index if not exists pedidos_user_criado_idx on public.pedidos (user_id, created_at);

drop trigger if exists pedidos_updated_at on public.pedidos;
create trigger pedidos_updated_at
  before update on public.pedidos
  for each row execute function public.set_updated_at();

alter table public.pedidos enable row level security;
drop policy if exists "pedidos: dono" on public.pedidos;
create policy "pedidos: dono" on public.pedidos
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Cada venda existente vira um pedido (reaproveita o id para ligar os itens)
insert into public.pedidos (id, user_id, codigo, cliente_nome, data_pedido, status_entrega, pago, forma_pagamento, observacoes, created_at, updated_at)
select v.id, v.user_id,
       coalesce(v.codigo, 'ANT-' || upper(left(v.id::text, 8))),
       v.cliente_nome, v.data_venda, v.status_entrega, v.pago, v.forma_pagamento, v.observacoes,
       v.created_at, v.updated_at
from public.vendas v
on conflict (id) do nothing;

-- A view depende das colunas que vão sair de "vendas"
drop view if exists public.resumo_financeiro;

-- ---------------------------------------------------------------------
-- vendas -> pedido_itens
-- ---------------------------------------------------------------------
alter table public.vendas add column if not exists pedido_id uuid;
update public.vendas set pedido_id = id where pedido_id is null;
alter table public.vendas alter column pedido_id set not null;
alter table public.vendas
  add constraint pedido_itens_pedido_id_fkey foreign key (pedido_id) references public.pedidos (id) on delete cascade;

alter table public.vendas
  drop column cliente_nome,
  drop column data_venda,
  drop column status_entrega,
  drop column pago,
  drop column forma_pagamento,
  drop column codigo,
  drop column observacoes;

alter table public.vendas rename to pedido_itens;
alter policy "vendas: dono" on public.pedido_itens rename to "itens: dono";
alter trigger vendas_snapshot on public.pedido_itens rename to itens_snapshot;
alter trigger vendas_updated_at on public.pedido_itens rename to itens_updated_at;
alter index if exists public.vendas_produto_idx rename to pedido_itens_produto_idx;
alter index if exists public.vendas_pkey rename to pedido_itens_pkey;
create index if not exists pedido_itens_pedido_idx on public.pedido_itens (pedido_id);

comment on column public.pedido_itens.preco_final is 'Valor total cobrado por este item (quantidade x preço unitário).';
comment on column public.pedido_itens.custo_total is 'Custo efetivo do item, congelado no registro (custo_base x quantidade).';

-- Snapshot do produto + garante que o pedido é do mesmo dono
create or replace function public.vendas_preencher_snapshot()
returns trigger
language plpgsql
as $$
declare
  p record;
begin
  if not exists (select 1 from public.pedidos where id = new.pedido_id and user_id = new.user_id) then
    raise exception 'Pedido % não encontrado para este usuário', new.pedido_id
      using errcode = 'foreign_key_violation';
  end if;

  if new.produto_id is not null
     and (tg_op = 'INSERT' or new.produto_id is distinct from old.produto_id) then

    select nome, custo_base into p
    from public.produtos
    where id = new.produto_id and user_id = new.user_id;

    if not found then
      raise exception 'Produto % não encontrado para este usuário', new.produto_id
        using errcode = 'foreign_key_violation';
    end if;

    new.produto_nome := coalesce(new.produto_nome, p.nome);

    if tg_op = 'INSERT' and new.custo_total is null then
      new.custo_total := round(p.custo_base * new.quantidade, 2);
    end if;
  end if;

  if new.custo_total is null then
    new.custo_total := 0;
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Resumo financeiro (pedidos cancelados não entram; desconto reduz o faturamento;
-- frete é repassado e não conta como receita)
-- ---------------------------------------------------------------------
create view public.resumo_financeiro
with (security_invoker = true) as
with ped as (
  select p.user_id,
         p.id,
         p.desconto,
         coalesce(sum(i.preco_final), 0) as itens_total,
         coalesce(sum(i.custo_total), 0) as custo
  from public.pedidos p
  left join public.pedido_itens i on i.pedido_id = p.id
  where p.status_entrega <> 'cancelado'
  group by p.user_id, p.id, p.desconto
),
v as (
  select user_id,
         count(*)                       as total_vendas,
         sum(itens_total - desconto)    as faturamento,
         sum(custo)                     as custo_produtos
  from ped
  group by user_id
),
d as (
  select user_id, coalesce(sum(valor), 0) as despesas
  from public.despesas_operacionais
  group by user_id
)
select
  user_id,
  coalesce(v.total_vendas, 0)::int                                         as total_vendas,
  coalesce(v.faturamento, 0)::numeric(14,2)                                as faturamento_total,
  coalesce(v.custo_produtos, 0)::numeric(14,2)                             as custo_produtos,
  coalesce(d.despesas, 0)::numeric(14,2)                                   as despesas_operacionais,
  (coalesce(v.custo_produtos, 0) + coalesce(d.despesas, 0))::numeric(14,2) as gastos_total,
  (coalesce(v.faturamento, 0)
    - coalesce(v.custo_produtos, 0)
    - coalesce(d.despesas, 0))::numeric(14,2)                              as lucro_liquido
from v
full outer join d using (user_id);

-- ---------------------------------------------------------------------
-- Criar pedido + itens numa única transação (o app chama via RPC)
-- ---------------------------------------------------------------------
create or replace function public.criar_pedido(pedido jsonb, itens jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  novo_id uuid;
  item jsonb;
begin
  if jsonb_typeof(itens) <> 'array' or jsonb_array_length(itens) = 0 then
    raise exception 'O pedido precisa de pelo menos um item.' using errcode = '22023';
  end if;

  insert into public.pedidos (codigo, cliente_nome, cliente_contato, data_pedido, prazo_entrega,
                              status_entrega, pago, forma_pagamento, frete, desconto, observacoes)
  values (
    btrim(pedido->>'codigo'),
    btrim(pedido->>'cliente_nome'),
    nullif(btrim(pedido->>'cliente_contato'), ''),
    coalesce((pedido->>'data_pedido')::date, current_date),
    nullif(pedido->>'prazo_entrega', '')::date,
    coalesce(nullif(pedido->>'status_entrega', ''), 'pendente')::public.status_entrega,
    coalesce((pedido->>'pago')::boolean, false),
    nullif(pedido->>'forma_pagamento', ''),
    coalesce((pedido->>'frete')::numeric, 0),
    coalesce((pedido->>'desconto')::numeric, 0),
    nullif(btrim(pedido->>'observacoes'), '')
  )
  returning id into novo_id;

  for item in select * from jsonb_array_elements(itens) loop
    insert into public.pedido_itens (pedido_id, produto_id, quantidade, preco_final, custo_total)
    values (
      novo_id,
      (item->>'produto_id')::uuid,
      coalesce((item->>'quantidade')::int, 1),
      (item->>'preco_final')::numeric,
      (item->>'custo_total')::numeric
    );
  end loop;

  return novo_id;
end;
$$;

revoke all on function public.criar_pedido(jsonb, jsonb) from public, anon;
grant execute on function public.criar_pedido(jsonb, jsonb) to authenticated;

-- =====================================================================
-- 2. PLANOS
-- =====================================================================
create table if not exists public.assinaturas (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  teste_ate   timestamptz,                 -- fim do teste grátis do Pro
  pro_ate     timestamptz,                 -- Pro pago até esta data
  periodo     text check (periodo in ('mensal', 'anual', 'cortesia')),
  observacao  text,                        -- anotação do admin (ex.: "Pix 13/11")
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists assinaturas_updated_at on public.assinaturas;
create trigger assinaturas_updated_at
  before update on public.assinaturas
  for each row execute function public.set_updated_at();

-- Usuário só LÊ a própria assinatura; alterações só pelas funções de admin
alter table public.assinaturas enable row level security;
drop policy if exists "assinaturas: leitura do dono" on public.assinaturas;
create policy "assinaturas: leitura do dono" on public.assinaturas
  for select to authenticated
  using (user_id = (select auth.uid()));

-- Todo cadastro novo ganha 14 dias de Pro
create or replace function public.criar_assinatura_inicial()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.assinaturas (user_id, teste_ate)
  values (new.id, now() + interval '14 days')
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists ao_criar_usuario_assinatura on auth.users;
create trigger ao_criar_usuario_assinatura
  after insert on auth.users
  for each row execute function public.criar_assinatura_inicial();

-- Usuários que já existem também ganham o teste
insert into public.assinaturas (user_id, teste_ate)
select id, now() + interval '14 days' from auth.users
on conflict (user_id) do nothing;

-- Plano efetivo: 'pro' se o teste ou o pagamento estiverem em vigor
create or replace function public.plano_efetivo(uid uuid default auth.uid())
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select case
    when exists (
      select 1 from public.assinaturas a
      where a.user_id = uid and (a.pro_ate > now() or a.teste_ate > now())
    ) then 'pro'
    else 'free'
  end;
$$;

grant execute on function public.plano_efetivo(uuid) to authenticated;

-- Limites do plano Free (mantenha igual a src/config/planos.ts)
create or replace function public.verificar_limite_plano()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  total int;
begin
  if public.plano_efetivo(new.user_id) = 'pro' then
    return new;
  end if;

  if tg_table_name = 'produtos' then
    select count(*) into total from public.produtos where user_id = new.user_id;
    if total >= 15 then
      raise exception 'LIMITE_PLANO: o plano Free permite até 15 produtos. Assine o Pro para cadastrar mais.'
        using errcode = 'P0001';
    end if;
  elsif tg_table_name = 'pedidos' then
    select count(*) into total from public.pedidos
    where user_id = new.user_id and created_at >= date_trunc('month', now());
    if total >= 20 then
      raise exception 'LIMITE_PLANO: o plano Free permite até 20 pedidos por mês. Assine o Pro para continuar registrando.'
        using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists produtos_limite_plano on public.produtos;
create trigger produtos_limite_plano
  before insert on public.produtos
  for each row execute function public.verificar_limite_plano();

drop trigger if exists pedidos_limite_plano on public.pedidos;
create trigger pedidos_limite_plano
  before insert on public.pedidos
  for each row execute function public.verificar_limite_plano();

-- =====================================================================
-- 3. ADMIN (cobrança manual)
--    Para se tornar admin, rode uma vez (trocando o e-mail):
--    insert into public.admins (user_id) select id from auth.users where email = 'voce@exemplo.com';
-- =====================================================================
create table if not exists public.admins (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now()
);
alter table public.admins enable row level security;   -- sem policies: só via funções

create or replace function public.eh_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

create or replace function public.admin_listar_assinaturas()
returns table (
  user_id        uuid,
  email          text,
  empresa        text,
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

-- dias > 0: estende o Pro a partir de hoje ou do vencimento atual (o que for maior)
-- dias = 0: encerra o Pro agora
create or replace function public.admin_estender_pro(alvo uuid, dias int, novo_periodo text default null, nota text default null)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  resultado timestamptz;
begin
  if not public.eh_admin() then
    raise exception 'Acesso restrito ao administrador' using errcode = '42501';
  end if;
  if dias < 0 or dias > 3660 then
    raise exception 'Informe de 0 a 3660 dias.' using errcode = '22023';
  end if;

  insert into public.assinaturas (user_id) values (alvo) on conflict (user_id) do nothing;

  update public.assinaturas
  set pro_ate    = case when dias = 0 then now()
                        else greatest(coalesce(pro_ate, now()), now()) + make_interval(days => dias) end,
      periodo    = coalesce(novo_periodo, periodo),
      observacao = coalesce(nota, observacao)
  where user_id = alvo
  returning pro_ate into resultado;

  return resultado;
end;
$$;

revoke all on function public.eh_admin() from public, anon;
revoke all on function public.admin_listar_assinaturas() from public, anon;
revoke all on function public.admin_estender_pro(uuid, int, text, text) from public, anon;
grant execute on function public.eh_admin() to authenticated;
grant execute on function public.admin_listar_assinaturas() to authenticated;
grant execute on function public.admin_estender_pro(uuid, int, text, text) to authenticated;
