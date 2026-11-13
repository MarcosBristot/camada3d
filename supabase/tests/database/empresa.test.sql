-- Testes da migration 2 (perfil, filamentos, campos de pedido). Rode com: npx supabase test db
begin;
create extension if not exists pgtap with schema extensions;

select plan(14);

insert into auth.users (id, email, aud, role)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a@teste.local', 'authenticated', 'authenticated'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'b@teste.local', 'authenticated', 'authenticated');

-- ======================= Usuário A ===================================
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}';

insert into public.perfil_empresa (nome) values ('tess3D');
select results_eq(
  'select nome, cor_primaria, tema from perfil_empresa',
  $$values ('tess3D'::text, '#f97316'::text, 'escuro'::text)$$,
  'perfil criado com cores e tema padrão'
);
select throws_ok($$update public.perfil_empresa set cor_primaria = 'laranja'$$, '23514', null, 'cor precisa ser hex #rrggbb');
select throws_ok($$update public.perfil_empresa set tema = 'neon'$$, '23514', null, 'tema só aceita claro/escuro/sistema');
select throws_ok($$insert into public.perfil_empresa (nome) values ('Outra')$$, '23505', null, 'um perfil por usuário');

insert into public.filamentos (id, cor, material, marca, preco_kg)
values ('f1111111-1111-1111-1111-111111111111', 'Preto', 'PLA', 'Voolt3D', 129);
select throws_ok(
  $$insert into public.filamentos (cor, material, marca, preco_kg) values ('Preto', 'PLA', 'Voolt3D', 140)$$,
  '23505', null, 'filamento repetido (cor+material+marca) é rejeitado'
);
insert into public.filamentos (id, cor, material, marca, preco_kg) values ('f2222222-2222-2222-2222-222222222222', 'Preto', 'PLA', null, 139);
select throws_ok(
  $$insert into public.filamentos (cor, material, marca, preco_kg) values ('Preto', 'PLA', null, 150)$$,
  '23505', null, 'marca vazia também conta para repetição'
);

insert into public.produtos (id, nome, cor, categoria, peso_gramas, preco_kg_material, filamento_id, preco_venda)
values ('11111111-1111-1111-1111-111111111111', 'Personagem Banguela', 'Preto', 'Miniatura', 12.34, 129,
        'f1111111-1111-1111-1111-111111111111', 15);
select results_eq(
  $$select custo_base, preco_venda, categoria from produtos where nome = 'Personagem Banguela'$$,
  $$values (1.59::numeric, 15.00::numeric, 'Miniatura'::text)$$,
  'produto importado da planilha mantém custo e preço praticado'
);

insert into public.vendas (produto_id, cliente_nome, preco_final, codigo, pago, forma_pagamento)
values ('11111111-1111-1111-1111-111111111111', 'Rafa', 15, 'PED-001', true, 'PIX');
select results_eq(
  $$select codigo, pago, forma_pagamento, lucro from vendas$$,
  $$values ('PED-001'::text, true, 'PIX'::text, 13.41::numeric)$$,
  'venda guarda código, pagamento e lucro'
);
select throws_ok(
  $$insert into public.vendas (produto_id, cliente_nome, preco_final, codigo) values ('11111111-1111-1111-1111-111111111111', 'X', 1, 'PED-001')$$,
  '23505', null, 'código de pedido não se repete para o mesmo usuário'
);

-- Excluir o filamento não apaga o produto
delete from public.filamentos where id = 'f1111111-1111-1111-1111-111111111111';
select is((select filamento_id from produtos where nome = 'Personagem Banguela'), null::uuid, 'excluir filamento solta o vínculo do produto');

-- ======================= Usuário B ===================================
set local "request.jwt.claims" to '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","role":"authenticated"}';

select is((select count(*) from perfil_empresa), 0::bigint, 'B não vê o perfil de A');
select is((select count(*) from filamentos), 0::bigint, 'B não vê filamentos de A');
select throws_ok(
  $$insert into public.produtos (nome, peso_gramas, filamento_id) values ('Peça invasora', 10, 'f2222222-2222-2222-2222-222222222222')$$,
  '23503', null, 'B não pode vincular produto a filamento de A'
);

-- B pode usar o mesmo código de pedido que A (é único por usuário)
insert into public.produtos (id, nome, peso_gramas) values ('22222222-2222-2222-2222-222222222222', 'Peça B', 10);
select lives_ok(
  $$insert into public.vendas (produto_id, cliente_nome, preco_final, codigo) values ('22222222-2222-2222-2222-222222222222', 'Cliente B', 5, 'PED-001')$$,
  'código de pedido é independente entre usuários'
);

select * from finish();
rollback;
