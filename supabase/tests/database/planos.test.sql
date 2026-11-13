-- Testes de planos (teste grátis, limites do Free, admin). Rode com: npx supabase test db
begin;
create extension if not exists pgtap with schema extensions;

select plan(19);

insert into auth.users (id, email, aud, role)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a@teste.local', 'authenticated', 'authenticated'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'admin@teste.local', 'authenticated', 'authenticated');

-- Cadastro novo ganha 14 dias de Pro
select ok(
  (select teste_ate between now() + interval '13 days 23 hours' and now() + interval '14 days 1 hour'
   from public.assinaturas where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'cadastro novo recebe 14 dias de teste'
);

set local role authenticated;
set local "request.jwt.claims" to '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}';
select is(public.plano_efetivo(), 'pro', 'durante o teste o plano é Pro');

-- No teste (Pro) não há limite: 16 produtos passam
insert into public.produtos (nome, peso_gramas) select 'Peça ' || g, 10 from generate_series(1, 16) g;
select is((select count(*) from produtos), 16::bigint, 'Pro cadastra mais de 15 produtos');

-- Usuário não consegue se dar Pro sozinho
update public.assinaturas set pro_ate = now() + interval '10 years';
select is((select pro_ate from public.assinaturas), null::timestamptz, 'usuário não altera a própria assinatura');
select throws_ok($$select public.admin_estender_pro('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 365)$$, '42501', null, 'usuário comum não usa função de admin');
select throws_ok($$select * from public.admin_listar_assinaturas()$$, '42501', null, 'usuário comum não lista assinaturas');

-- Fim do teste: vira Free
reset role;
update public.assinaturas set teste_ate = now() - interval '1 minute' where user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}';
select is(public.plano_efetivo(), 'free', 'depois do teste o plano é Free');

-- Free: já tem 16 produtos, não cadastra o 17º; os existentes continuam
select throws_ok($$insert into public.produtos (nome, peso_gramas) values ('Mais uma', 10)$$, 'P0001', null, 'Free bloqueia produto acima de 15');
select is((select count(*) from produtos), 16::bigint, 'produtos já existentes continuam acessíveis');

-- Free: 20 pedidos no mês, o 21º é bloqueado
select public.criar_pedido(jsonb_build_object('codigo', 'P-' || g, 'cliente_nome', 'Cliente'),
       jsonb_build_array(jsonb_build_object('produto_id', (select id from public.produtos limit 1), 'quantidade', 1, 'preco_final', 10)))
from generate_series(1, 20) g;
select is((select count(*) from pedidos), 20::bigint, 'Free registra até 20 pedidos no mês');
select throws_ok(
  $$select public.criar_pedido('{"codigo":"P-21","cliente_nome":"X"}'::jsonb, jsonb_build_array(jsonb_build_object('produto_id', (select id from public.produtos limit 1), 'quantidade', 1, 'preco_final', 10)))$$,
  'P0001', null, 'Free bloqueia o 21º pedido do mês'
);

-- ======================= Admin =======================================
reset role;
insert into public.admins (user_id) values ('cccccccc-cccc-cccc-cccc-cccccccccccc');
update auth.users set raw_user_meta_data = '{"origem":"reels-calculadora"}' where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"cccccccc-cccc-cccc-cccc-cccccccccccc","role":"authenticated"}';

select ok(public.eh_admin(), 'admin é reconhecido');
select is((select count(*) from public.admin_listar_assinaturas() where email like '%@teste.local'), 2::bigint, 'admin lista todos os usuários');
select is(
  (select produtos from public.admin_listar_assinaturas() where email = 'a@teste.local'),
  16::bigint, 'listagem mostra o uso de cada usuário'
);
select is((select origem from public.admin_listar_assinaturas() where email = 'a@teste.local'), 'reels-calculadora', 'admin vê a origem do cadastro');
select ok(
  public.admin_estender_pro('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 30, 'mensal', 'Pix 14/11') > now() + interval '29 days',
  'admin ativa 30 dias de Pro'
);
select throws_ok($$select public.admin_estender_pro('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', -5)$$, '22023', null, 'dias negativos são recusados');

-- O usuário volta a ser Pro e o limite some
set local "request.jwt.claims" to '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}';
select is(public.plano_efetivo(), 'pro', 'pagamento ativado: plano Pro');
select lives_ok($$insert into public.produtos (nome, peso_gramas) values ('Liberado', 10)$$, 'com Pro, volta a cadastrar produtos');

select * from finish();
rollback;
