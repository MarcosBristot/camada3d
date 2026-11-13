-- Testes do schema (pgTAP). Rode com:  npx supabase test db
-- Tudo acontece numa transação que é desfeita no final.
begin;
create extension if not exists pgtap with schema extensions;

select plan(29);

insert into auth.users (id, email, aud, role)
values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'a@teste.local', 'authenticated', 'authenticated'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'b@teste.local', 'authenticated', 'authenticated');

-- ======================= Usuário A ===================================
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}';

insert into public.produtos
  (id, nome, peso_gramas, preco_kg_material, tempo_maquina_horas, potencia_watts, tarifa_kwh, custo_adicional, margem_lucro_pct)
values
  ('11111111-1111-1111-1111-111111111111', 'Vaso espiral', 85, 120, 4.5, 150, 0.85, 2, 150),
  ('11111111-1111-1111-1111-222222222222', 'Chaveiro', 10, 100, 0.5, 150, 0.85, 0, 200);

-- Colunas geradas (mesmos valores que src/lib/pricing.ts produz)
select is((select user_id from produtos where nome = 'Vaso espiral'), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'user_id vem de auth.uid()');
select is((select custo_material from produtos where nome = 'Vaso espiral'), 10.20::numeric, 'custo_material = 85g x R$120/kg');
select is((select custo_energia  from produtos where nome = 'Vaso espiral'), 0.57::numeric,  'custo_energia = 150W x 4,5h x R$0,85');
select is((select custo_base     from produtos where nome = 'Vaso espiral'), 12.77::numeric, 'custo_base = material + energia + adicional');
select is((select preco_sugerido from produtos where nome = 'Vaso espiral'), 31.93::numeric, 'preco_sugerido = custo_base x 2,5');

-- Pedido com 2 itens criado de uma vez (RPC)
select lives_ok(
  $$select public.criar_pedido(
      '{"codigo":"PED-100","cliente_nome":"Ana","desconto":5,"frete":12}'::jsonb,
      '[{"produto_id":"11111111-1111-1111-1111-111111111111","quantidade":3,"preco_final":90},
        {"produto_id":"11111111-1111-1111-1111-222222222222","quantidade":2,"preco_final":10}]'::jsonb)$$,
  'criar_pedido grava pedido e itens'
);
select is((select count(*) from pedido_itens i join pedidos p on p.id = i.pedido_id where p.codigo = 'PED-100'), 2::bigint, 'pedido tem 2 itens');
select is(
  (select custo_total from pedido_itens i join pedidos p on p.id = i.pedido_id where p.codigo = 'PED-100' and i.produto_nome = 'Vaso espiral'),
  38.31::numeric, 'custo do item congelado pelo trigger (12,77 x 3)'
);
select is(
  (select lucro from pedido_itens i join pedidos p on p.id = i.pedido_id where p.codigo = 'PED-100' and i.produto_nome = 'Vaso espiral'),
  51.69::numeric, 'lucro do item = preço - custo'
);
select is((select data_pedido from pedidos where codigo = 'PED-100'), current_date, 'data_pedido padrão = hoje');

-- Pedido sem itens é recusado e não deixa pedido órfão
select throws_ok($$select public.criar_pedido('{"codigo":"PED-VAZIO","cliente_nome":"X"}'::jsonb, '[]'::jsonb)$$, '22023', null, 'pedido sem itens é recusado');
select is((select count(*) from pedidos where codigo = 'PED-VAZIO'), 0::bigint, 'nenhum pedido vazio ficou gravado');

-- Item inválido desfaz o pedido inteiro (transação)
select throws_ok(
  $$select public.criar_pedido('{"codigo":"PED-RUIM","cliente_nome":"X"}'::jsonb, '[{"produto_id":"11111111-1111-1111-1111-111111111111","quantidade":0,"preco_final":1}]'::jsonb)$$,
  '23514', null, 'quantidade zero é rejeitada'
);
select is((select count(*) from pedidos where codigo = 'PED-RUIM'), 0::bigint, 'erro num item desfaz o pedido inteiro');

-- Pedido cancelado não entra no resumo
select public.criar_pedido('{"codigo":"PED-101","cliente_nome":"Carla","status_entrega":"cancelado"}'::jsonb,
  '[{"produto_id":"11111111-1111-1111-1111-111111111111","quantidade":1,"preco_final":1000}]'::jsonb);
insert into public.despesas_operacionais (descricao, categoria, valor) values ('Troca de bico', 'manutencao', 35);

-- faturamento = (90 + 10) - 5 de desconto = 95; custo = 38,31 + 2,12 (1,06 x 2); frete não conta
select results_eq(
  'select total_vendas, faturamento_total, custo_produtos, despesas_operacionais, gastos_total, lucro_liquido from resumo_financeiro',
  $$values (1, 95.00::numeric(14,2), 40.43::numeric(14,2), 35.00::numeric(14,2), 75.43::numeric(14,2), 19.57::numeric(14,2))$$,
  'resumo: itens - desconto, ignora cancelados e frete'
);

-- updated_at é atualizado
update public.pedidos set updated_at = now() - interval '1 day' where codigo = 'PED-100';
update public.pedidos set status_entrega = 'enviado' where codigo = 'PED-100';
select ok((select updated_at > now() - interval '1 minute' from pedidos where codigo = 'PED-100'), 'trigger atualiza updated_at');

-- Validações
select throws_ok($$insert into public.produtos (nome, peso_gramas) values ('Negativo', -1)$$, '23514', null, 'peso negativo é rejeitado');
select throws_ok($$insert into public.produtos (nome) values ('   ')$$, '23514', null, 'nome em branco é rejeitado');
select throws_ok($$update public.produtos set custo_base = 1 where id = '11111111-1111-1111-1111-111111111111'$$, '428C9', null, 'colunas calculadas não podem ser escritas');

-- Storage: A pode enviar para a própria pasta, não para a de B
select lives_ok($$insert into storage.objects (bucket_id, name) values ('produtos', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/foto.webp')$$, 'upload na própria pasta é permitido');
select throws_ok($$insert into storage.objects (bucket_id, name) values ('produtos', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/foto.webp')$$, '42501', null, 'upload na pasta de outro usuário é bloqueado');

-- guarda o id de um pedido de A para o teste de invasão
select set_config('teste.pedido_a', (select id::text from public.pedidos where codigo = 'PED-100'), true);

-- ======================= Usuário B ===================================
set local "request.jwt.claims" to '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","role":"authenticated"}';

select is((select count(*) from produtos), 0::bigint, 'B não vê produtos de A');
select is((select count(*) from pedidos) + (select count(*) from pedido_itens), 0::bigint, 'B não vê pedidos nem itens de A');
select is((select count(*) from resumo_financeiro), 0::bigint, 'B não vê o resumo de A');

select throws_ok(
  $$select public.criar_pedido('{"codigo":"FRAUDE","cliente_nome":"X"}'::jsonb, '[{"produto_id":"11111111-1111-1111-1111-111111111111","quantidade":1,"preco_final":1}]'::jsonb)$$,
  '23503', null, 'B não pode vender produto de A'
);
select throws_ok(
  $$insert into public.pedido_itens (pedido_id, quantidade, preco_final) values (current_setting('teste.pedido_a')::uuid, 1, 1)$$,
  '23503', null, 'B não pode anexar item a pedido de A'
);

-- ======================= Anônimo =====================================
set local role anon;
select is((select count(*) from produtos), 0::bigint, 'anônimo não vê produtos');

-- ======================= De volta ao A ===============================
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}';

-- Excluir produto mantém o item no histórico, com o nome
delete from public.produtos where id = '11111111-1111-1111-1111-111111111111';
select results_eq(
  $$select i.produto_id, i.produto_nome from pedido_itens i join pedidos p on p.id = i.pedido_id where p.codigo = 'PED-100' and i.produto_nome = 'Vaso espiral'$$,
  $$values (null::uuid, 'Vaso espiral'::text)$$,
  'item continua no histórico com o nome do produto após excluir o produto'
);

-- Excluir o pedido apaga os itens
delete from public.pedidos where codigo = 'PED-100';
select is((select count(*) from pedido_itens), 1::bigint, 'excluir pedido apaga os itens dele (sobra só o do cancelado)');

select * from finish();
rollback;
