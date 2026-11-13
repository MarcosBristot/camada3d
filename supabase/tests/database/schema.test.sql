-- Testes do schema (pgTAP). Rode com:  npx supabase test db
-- Tudo acontece numa transação que é desfeita no final.
begin;
create extension if not exists pgtap with schema extensions;

select plan(27);

-- ---------------------------------------------------------------------
-- Usuários de teste
-- ---------------------------------------------------------------------
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
  ('11111111-1111-1111-1111-111111111111', 'Vaso espiral', 85, 120, 4.5, 150, 0.85, 2, 150);

-- Colunas geradas (mesmos valores que src/lib/pricing.ts produz)
select is((select user_id from produtos where nome = 'Vaso espiral'), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid, 'user_id vem de auth.uid()');
select is((select custo_material from produtos where nome = 'Vaso espiral'), 10.20::numeric, 'custo_material = 85g x R$120/kg');
select is((select custo_energia  from produtos where nome = 'Vaso espiral'), 0.57::numeric,  'custo_energia = 150W x 4,5h x R$0,85');
select is((select custo_base     from produtos where nome = 'Vaso espiral'), 12.77::numeric, 'custo_base = material + energia + adicional');
select is((select preco_sugerido from produtos where nome = 'Vaso espiral'), 31.93::numeric, 'preco_sugerido = custo_base x 2,5');

-- Venda sem custo_total: trigger congela custo_base x quantidade
insert into public.vendas (id, produto_id, cliente_nome, quantidade, preco_final)
values ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Ana', 3, 90);

select is((select custo_total from vendas where id = '22222222-2222-2222-2222-222222222222'), 38.31::numeric, 'custo_total preenchido pelo trigger (12,77 x 3)');
select is((select lucro       from vendas where id = '22222222-2222-2222-2222-222222222222'), 51.69::numeric, 'lucro = preco_final - custo_total');
select is((select produto_nome from vendas where id = '22222222-2222-2222-2222-222222222222'), 'Vaso espiral', 'produto_nome copiado do produto');
select is((select data_venda  from vendas where id = '22222222-2222-2222-2222-222222222222'), current_date, 'data_venda padrão = hoje');

-- custo_total informado manualmente é respeitado
insert into public.vendas (produto_id, cliente_nome, preco_final, custo_total)
values ('11111111-1111-1111-1111-111111111111', 'Bruno', 40, 15);
select is((select lucro from vendas where cliente_nome = 'Bruno'), 25.00::numeric, 'custo_total manual é respeitado');

-- Venda cancelada não entra no resumo
insert into public.vendas (produto_id, cliente_nome, preco_final, status_entrega)
values ('11111111-1111-1111-1111-111111111111', 'Carla', 1000, 'cancelado');

insert into public.despesas_operacionais (descricao, categoria, valor) values ('Troca de bico', 'manutencao', 35);

select results_eq(
  'select total_vendas, faturamento_total, custo_produtos, despesas_operacionais, gastos_total, lucro_liquido from resumo_financeiro',
  $$values (2, 130.00::numeric(14,2), 53.31::numeric(14,2), 35.00::numeric(14,2), 88.31::numeric(14,2), 41.69::numeric(14,2))$$,
  'resumo_financeiro: soma vendas válidas + despesas e ignora canceladas'
);

-- updated_at é atualizado
update public.vendas set updated_at = now() - interval '1 day' where id = '22222222-2222-2222-2222-222222222222';
update public.vendas set status_entrega = 'enviado' where id = '22222222-2222-2222-2222-222222222222';
select ok((select updated_at > now() - interval '1 minute' from vendas where id = '22222222-2222-2222-2222-222222222222'), 'trigger atualiza updated_at');

-- Validações
select throws_ok($$insert into public.produtos (nome, peso_gramas) values ('Negativo', -1)$$, '23514', null, 'peso negativo é rejeitado');
select throws_ok($$insert into public.produtos (nome) values ('   ')$$, '23514', null, 'nome em branco é rejeitado');
select throws_ok($$insert into public.vendas (produto_id, cliente_nome, preco_final, quantidade) values ('11111111-1111-1111-1111-111111111111', 'X', 10, 0)$$, '23514', null, 'quantidade zero é rejeitada');
select throws_ok($$update public.produtos set custo_base = 1 where id = '11111111-1111-1111-1111-111111111111'$$, '428C9', null, 'colunas calculadas não podem ser escritas');

-- Storage: A pode enviar para a própria pasta, não para a de B
select lives_ok($$insert into storage.objects (bucket_id, name) values ('produtos', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/foto.webp')$$, 'upload na própria pasta é permitido');
select throws_ok($$insert into storage.objects (bucket_id, name) values ('produtos', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/foto.webp')$$, '42501', null, 'upload na pasta de outro usuário é bloqueado');

-- ======================= Usuário B ===================================
set local "request.jwt.claims" to '{"sub":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb","role":"authenticated"}';

select is((select count(*) from produtos), 0::bigint, 'B não vê produtos de A');
select is((select count(*) from vendas), 0::bigint, 'B não vê vendas de A');
select is((select count(*) from resumo_financeiro), 0::bigint, 'B não vê o resumo de A');

select throws_ok(
  $$insert into public.vendas (produto_id, cliente_nome, preco_final) values ('11111111-1111-1111-1111-111111111111', 'Fraude', 1)$$,
  '23503', null, 'B não pode vender produto de A'
);
select throws_ok(
  $$insert into public.produtos (nome, user_id) values ('Invasor', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')$$,
  '42501', null, 'B não pode criar produto em nome de A'
);

update public.produtos set nome = 'hackeado' where id = '11111111-1111-1111-1111-111111111111';
delete from public.vendas where id = '22222222-2222-2222-2222-222222222222';

-- ======================= Anônimo =====================================
set local role anon;
select is((select count(*) from produtos), 0::bigint, 'anônimo não vê produtos');

-- ======================= De volta ao A ===============================
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa","role":"authenticated"}';

select is((select nome from produtos where id = '11111111-1111-1111-1111-111111111111'), 'Vaso espiral', 'update de B não afetou o produto de A');
select is((select count(*) from vendas where id = '22222222-2222-2222-2222-222222222222'), 1::bigint, 'delete de B não afetou a venda de A');

-- Excluir produto mantém o histórico de vendas
delete from public.produtos where id = '11111111-1111-1111-1111-111111111111';
select results_eq(
  $$select produto_id, produto_nome from vendas where id = '22222222-2222-2222-2222-222222222222'$$,
  $$values (null::uuid, 'Vaso espiral'::text)$$,
  'venda continua no histórico com o nome do produto após excluir o produto'
);

select * from finish();
rollback;
