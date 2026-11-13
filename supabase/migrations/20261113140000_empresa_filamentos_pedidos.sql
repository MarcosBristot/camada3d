-- =====================================================================
-- Camada3D — Migration 2
--   perfil_empresa   nome, logo e cores do tema (uma linha por usuário)
--   filamentos       cores/materiais com preço por kg (vindos da planilha)
--   produtos         + categoria, cor, preço de venda praticado, filamento
--   vendas           + código do pedido (PED-001), pago, forma de pagamento
-- =====================================================================

-- ---------------------------------------------------------------------
-- PERFIL DA EMPRESA
-- ---------------------------------------------------------------------
create table if not exists public.perfil_empresa (
  user_id         uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  nome            text not null check (char_length(btrim(nome)) between 1 and 80),
  logo_url        text,
  logo_path       text,
  cor_primaria    text not null default '#f97316' check (cor_primaria ~ '^#[0-9a-fA-F]{6}$'),
  cor_secundaria  text not null default '#fbbf24' check (cor_secundaria ~ '^#[0-9a-fA-F]{6}$'),
  tema            text not null default 'escuro' check (tema in ('claro', 'escuro', 'sistema')),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists perfil_empresa_updated_at on public.perfil_empresa;
create trigger perfil_empresa_updated_at
  before update on public.perfil_empresa
  for each row execute function public.set_updated_at();

alter table public.perfil_empresa enable row level security;

drop policy if exists "perfil: dono" on public.perfil_empresa;
create policy "perfil: dono" on public.perfil_empresa
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- FILAMENTOS
-- ---------------------------------------------------------------------
create table if not exists public.filamentos (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  cor         text not null check (char_length(btrim(cor)) between 1 and 60),
  material    text not null default 'PLA',
  marca       text,
  preco_kg    numeric(10,2) not null check (preco_kg >= 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint filamentos_unico unique nulls not distinct (user_id, cor, material, marca)
);

create index if not exists filamentos_user_idx on public.filamentos (user_id, cor);

drop trigger if exists filamentos_updated_at on public.filamentos;
create trigger filamentos_updated_at
  before update on public.filamentos
  for each row execute function public.set_updated_at();

alter table public.filamentos enable row level security;

drop policy if exists "filamentos: dono" on public.filamentos;
create policy "filamentos: dono" on public.filamentos
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- PRODUTOS: dados que a planilha já usa
--   preco_venda = preço praticado (opcional). Quando nulo, vale o preco_sugerido.
--   preco_kg_material continua sendo uma cópia: mudar o preço do filamento
--   depois não altera o custo de produtos já cadastrados.
-- ---------------------------------------------------------------------
alter table public.produtos
  add column if not exists categoria    text,
  add column if not exists cor          text,
  add column if not exists preco_venda  numeric(12,2) check (preco_venda >= 0),
  add column if not exists filamento_id uuid references public.filamentos (id) on delete set null;

create index if not exists produtos_filamento_idx on public.produtos (filamento_id);

-- ---------------------------------------------------------------------
-- VENDAS: código do pedido e pagamento
-- ---------------------------------------------------------------------
alter table public.vendas
  add column if not exists codigo           text check (char_length(codigo) <= 30),
  add column if not exists pago             boolean not null default false,
  add column if not exists forma_pagamento  text;

create unique index if not exists vendas_user_codigo_uidx
  on public.vendas (user_id, codigo) where codigo is not null;

-- O trigger de snapshot também precisa garantir que o filamento é do mesmo dono
create or replace function public.produtos_validar_filamento()
returns trigger
language plpgsql
as $$
begin
  if new.filamento_id is not null and not exists (
    select 1 from public.filamentos where id = new.filamento_id and user_id = new.user_id
  ) then
    raise exception 'Filamento % não encontrado para este usuário', new.filamento_id
      using errcode = 'foreign_key_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists produtos_filamento_dono on public.produtos;
create trigger produtos_filamento_dono
  before insert or update of filamento_id on public.produtos
  for each row execute function public.produtos_validar_filamento();
