-- Testes da exclusão de conta (LGPD). Rode com: npx supabase test db
begin;
create extension if not exists pgtap with schema extensions;

select plan(7);

insert into auth.users (id, email, aud, role)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a@teste.local', 'authenticated', 'authenticated'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'b@teste.local', 'authenticated', 'authenticated');

-- Dados de A
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}';
insert into public.perfil_empresa (nome) values ('Empresa A');
insert into public.filamentos (cor, preco_kg) values ('Preto', 129);
insert into public.produtos (id, nome, peso_gramas) values ('11111111-1111-1111-1111-111111111111', 'Peça A', 10);
select public.criar_pedido('{"codigo":"PED-1","cliente_nome":"Cliente"}'::jsonb, '[{"produto_id":"11111111-1111-1111-1111-111111111111","quantidade":1,"preco_final":10}]'::jsonb);
insert into public.despesas_operacionais (descricao, valor) values ('Bico', 30);

-- Dados de B
set local "request.jwt.claims" to '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","role":"authenticated"}';
insert into public.produtos (nome, peso_gramas) values ('Peça B', 10);

-- Anônimo não pode chamar a função
set local role anon;
select throws_ok('select public.excluir_minha_conta()', '42501', null, 'anônimo não pode excluir contas');

-- A exclui a própria conta
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}';
select lives_ok('select public.excluir_minha_conta()', 'usuário consegue excluir a própria conta');

reset role;
select is((select count(*) from auth.users where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), 0::bigint, 'usuário A removido de auth.users');
select is(
  (select count(*) from public.produtos where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
  + (select count(*) from public.pedidos where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
  + (select count(*) from public.pedido_itens where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
  + (select count(*) from public.assinaturas where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
  + (select count(*) from public.despesas_operacionais where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
  + (select count(*) from public.filamentos where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
  + (select count(*) from public.perfil_empresa where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  0::bigint,
  'todos os dados de A foram apagados em cascata'
);
select is((select count(*) from auth.users where id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'), 1::bigint, 'conta de B intacta');
select is((select count(*) from public.produtos where user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'), 1::bigint, 'dados de B intactos');

-- Sem sessão, a função recusa
set local role authenticated;
set local "request.jwt.claims" to '{"role":"authenticated"}';
select throws_ok('select public.excluir_minha_conta()', '28000', null, 'sem usuário na sessão a função recusa');

select * from finish();
rollback;
