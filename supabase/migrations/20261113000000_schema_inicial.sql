-- =====================================================================
-- Camada3D — Fase 2: Modelagem do banco de dados
-- Execute no Supabase: Dashboard > SQL Editor > New query > Run
-- (ou via CLI: `supabase db push`)
--
-- Tabelas:
--   produtos               catálogo com custos e preço sugerido calculados
--   vendas                 histórico de vendas com custo congelado e lucro
--   despesas_operacionais  gastos que NÃO estão no custo da peça
-- View:
--   resumo_financeiro      faturamento, gastos e lucro líquido por usuário
-- Storage:
--   bucket "produtos"      fotos dos produtos ({user_id}/{arquivo})
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------
do $$ begin
  create type public.status_entrega as enum (
    'pendente', 'em_producao', 'pronto', 'enviado', 'entregue', 'cancelado'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.categoria_despesa as enum (
    'manutencao', 'embalagem', 'frete', 'marketing', 'software', 'equipamento', 'taxas', 'outros'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- Função utilitária: updated_at automático
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- PRODUTOS
-- As fórmulas abaixo espelham src/lib/pricing.ts — mantenha as duas iguais.
--   custo_material = peso_g / 1000 * preco_kg
--   custo_energia  = potencia_W / 1000 * horas * tarifa_kWh
--   custo_base     = material + energia + custo_adicional
--   preco_sugerido = custo_base * (1 + margem% / 100)   (margem sobre o custo)
-- ---------------------------------------------------------------------
create table if not exists public.produtos (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null default auth.uid() references auth.users (id) on delete cascade,

  nome                 text not null check (char_length(btrim(nome)) between 1 and 120),
  descricao            text,
  material             text not null default 'PLA',

  -- Foto (Supabase Storage)
  foto_url             text,          -- URL pública para exibir
  foto_path            text,          -- caminho no bucket, para trocar/remover o arquivo

  -- Custo de material
  peso_gramas          numeric(10,2) not null default 0 check (peso_gramas >= 0),
  preco_kg_material    numeric(10,2) not null default 0 check (preco_kg_material >= 0),

  -- Tempo de máquina e energia
  tempo_maquina_horas  numeric(8,2)  not null default 0 check (tempo_maquina_horas >= 0),
  potencia_watts       numeric(8,2)  not null default 0 check (potencia_watts >= 0),
  tarifa_kwh           numeric(8,4)  not null default 0 check (tarifa_kwh >= 0),

  -- Extras por peça (pintura, embalagem, ímãs, parafusos...)
  custo_adicional      numeric(10,2) not null default 0 check (custo_adicional >= 0),
  margem_lucro_pct     numeric(7,2)  not null default 0 check (margem_lucro_pct >= 0),

  -- Colunas calculadas pelo banco (somente leitura)
  custo_material       numeric(12,2) generated always as (
                         round(peso_gramas / 1000 * preco_kg_material, 2)
                       ) stored,
  custo_energia        numeric(12,2) generated always as (
                         round(potencia_watts / 1000 * tempo_maquina_horas * tarifa_kwh, 2)
                       ) stored,
  custo_base           numeric(12,2) generated always as (
                         round(
                           peso_gramas / 1000 * preco_kg_material
                           + potencia_watts / 1000 * tempo_maquina_horas * tarifa_kwh
                           + custo_adicional
                         , 2)
                       ) stored,
  preco_sugerido       numeric(12,2) generated always as (
                         round(
                           (peso_gramas / 1000 * preco_kg_material
                            + potencia_watts / 1000 * tempo_maquina_horas * tarifa_kwh
                            + custo_adicional)
                           * (1 + margem_lucro_pct / 100)
                         , 2)
                       ) stored,

  ativo                boolean not null default true,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index if not exists produtos_user_created_idx on public.produtos (user_id, created_at desc);

drop trigger if exists produtos_updated_at on public.produtos;
create trigger produtos_updated_at
  before update on public.produtos
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- VENDAS
-- custo_total = custo efetivo da venda, congelado no momento do registro.
-- Se não for informado, é preenchido com produtos.custo_base * quantidade.
-- lucro é calculado pelo banco.
-- ---------------------------------------------------------------------
create table if not exists public.vendas (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,

  produto_id       uuid references public.produtos (id) on delete set null,
  produto_nome     text,          -- cópia do nome: o histórico sobrevive se o produto for excluído

  cliente_nome     text not null check (char_length(btrim(cliente_nome)) between 1 and 120),
  data_venda       date not null default current_date,
  quantidade       integer not null default 1 check (quantidade > 0),

  preco_final      numeric(12,2) not null check (preco_final >= 0),   -- total cobrado do cliente
  custo_total      numeric(12,2) not null check (custo_total >= 0),   -- custo efetivo total
  lucro            numeric(12,2) generated always as (preco_final - custo_total) stored,

  status_entrega   public.status_entrega not null default 'pendente',
  observacoes      text,

  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists vendas_user_data_idx on public.vendas (user_id, data_venda desc);
create index if not exists vendas_produto_idx   on public.vendas (produto_id);
create index if not exists vendas_status_idx    on public.vendas (user_id, status_entrega);

-- Preenche snapshot do produto e valida que ele pertence ao mesmo usuário
create or replace function public.vendas_preencher_snapshot()
returns trigger
language plpgsql
as $$
declare
  p record;
begin
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

drop trigger if exists vendas_snapshot on public.vendas;
create trigger vendas_snapshot
  before insert or update on public.vendas
  for each row execute function public.vendas_preencher_snapshot();

drop trigger if exists vendas_updated_at on public.vendas;
create trigger vendas_updated_at
  before update on public.vendas
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- DESPESAS OPERACIONAIS
-- Gastos que não fazem parte do custo da peça (manutenção, frete,
-- embalagens em lote, assinaturas...). Não lance aqui o filamento/energia
-- já contabilizado nas vendas, para não contar duas vezes.
-- ---------------------------------------------------------------------
create table if not exists public.despesas_operacionais (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  descricao      text not null check (char_length(btrim(descricao)) between 1 and 200),
  categoria      public.categoria_despesa not null default 'outros',
  valor          numeric(12,2) not null check (valor > 0),
  data_despesa   date not null default current_date,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists despesas_user_data_idx on public.despesas_operacionais (user_id, data_despesa desc);

drop trigger if exists despesas_updated_at on public.despesas_operacionais;
create trigger despesas_updated_at
  before update on public.despesas_operacionais
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- VIEW: resumo financeiro (vendas canceladas não entram)
-- security_invoker = true -> respeita o RLS de quem consulta
-- ---------------------------------------------------------------------
create or replace view public.resumo_financeiro
with (security_invoker = true) as
with v as (
  select user_id,
         count(*)                      as total_vendas,
         coalesce(sum(preco_final), 0) as faturamento,
         coalesce(sum(custo_total), 0) as custo_produtos
  from public.vendas
  where status_entrega <> 'cancelado'
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
-- ROW LEVEL SECURITY: cada usuário só vê/edita os próprios dados
-- ---------------------------------------------------------------------
alter table public.produtos              enable row level security;
alter table public.vendas                enable row level security;
alter table public.despesas_operacionais enable row level security;

drop policy if exists "produtos: dono" on public.produtos;
create policy "produtos: dono" on public.produtos
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "vendas: dono" on public.vendas;
create policy "vendas: dono" on public.vendas
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "despesas: dono" on public.despesas_operacionais;
create policy "despesas: dono" on public.despesas_operacionais
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- STORAGE: bucket público para leitura das fotos; escrita apenas na
-- pasta do próprio usuário: produtos/{user_id}/arquivo.webp
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('produtos', 'produtos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "fotos produtos: upload do dono" on storage.objects;
create policy "fotos produtos: upload do dono" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'produtos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "fotos produtos: update do dono" on storage.objects;
create policy "fotos produtos: update do dono" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'produtos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'produtos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "fotos produtos: delete do dono" on storage.objects;
create policy "fotos produtos: delete do dono" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'produtos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- O dono também precisa de SELECT para o upsert/remove funcionarem
drop policy if exists "fotos produtos: leitura do dono" on storage.objects;
create policy "fotos produtos: leitura do dono" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'produtos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
