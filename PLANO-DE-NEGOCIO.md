# farmOps 3D — Plano de negócio e operação

> Documento de trabalho para lançar e ganhar dinheiro com o farmOps 3D como **pessoa física**, gastando o mínimo.
> Valores e regras fiscais mudam: confirme taxas no Mercado Pago e impostos com um contador antes de decisões grandes.

---

## 1. Resumo em uma página

| Item | Decisão |
|------|---------|
| Modelo | **Freemium**: Free para sempre (limitado) + **Pro** por assinatura |
| Preço Pro | **R$ 19,90/mês** ou **R$ 199/ano** (2 meses grátis) |
| Teste | **14 dias de Pro** em todo cadastro, sem cartão e sem cobrança automática depois |
| Limites do Free | 15 produtos · 20 pedidos/mês · sem importação de planilha · OS com selo "farmOps 3D" |
| Cobrança (fase 1) | Manual: link do Mercado Pago ou Pix → cliente envia comprovante → você ativa em **Painel → Administração** |
| Custo fixo hoje | **R$ 0** (Supabase Free, Vercel/Cloudflare grátis, Gmail) |
| Ponto de equilíbrio | ~**8 assinantes** pagam o Supabase Pro + domínio, quando eles forem necessários |
| Meta inicial | 30 cadastros e 5 assinantes nos primeiros 60 dias |

---

## 2. Para quem é e por que pagariam

**Público:** makers e pequenas "farms" de impressão 3D que vendem no Instagram, WhatsApp, Shopee, Mercado Livre, Elo7 e feiras. Hoje usam planilha (como a `Controle_3D.xlsx`) ou nada.

**Dores que o produto resolve:**
1. Não saber o custo real da peça (filamento + energia + extras) e cobrar "no chute".
2. Pedidos espalhados no WhatsApp; esquecer de entregar ou cobrar.
3. Não saber se, no fim do mês, sobrou dinheiro.
4. Passar orçamento ou ordem de serviço de forma profissional.

**Por que o Pro vale R$ 19,90:** menos que um rolo de filamento por mês. Um único pedido mal precificado custa mais que isso.

---

## 3. Planos

| | Free | Pro |
|---|---|---|
| Calculadora de preço | ✅ | ✅ |
| Produtos | até 15 | ilimitados |
| Pedidos | até 20/mês | ilimitados |
| Pedidos com vários itens, frete, desconto | ✅ | ✅ |
| Ordem de serviço (PDF) | com selo farmOps 3D | sem selo |
| Importar planilha Excel | — | ✅ |
| Tema com cores da logo | ✅ | ✅ |

**Por que esses limites:** quem vende pouco consegue usar de verdade (e indica para outros). Quem já vende bem (mais de 20 pedidos/mês) sente o limite exatamente quando o produto já se pagou.

**Oferta de lançamento (opcional, recomendada):** "Fundador" — os **primeiros 30 assinantes** pagam **R$ 14,90/mês para sempre** (ou R$ 149/ano). Ative com o período "mensal" no Admin e anote "Fundador" na observação.

**Onde mudar valores e limites:**
- Preços e textos: `src/config/planos.ts`
- Limites no banco: função `verificar_limite_plano` (migration 4). Mude **os dois**.
- Dias de teste: `criar_assinatura_inicial` (migration 4) e `diasTeste` em `planos.ts`.

---

## 4. Concorrência e posicionamento

| Concorrente | Modelo | Preço |
|---|---|---|
| PrintControl 3D (BR) | Pagamento único, sem mensalidade | ~R$ 496 (até 10x) |
| SimplyPrint | Plano grátis + Enterprise (controle de impressoras) | Enterprise sob consulta |
| 3DPBOSS | Pagamento único (exterior) | a partir de US$ 49 |

**Posicionamento:** "gestão de impressão 3D feita no Brasil, que funciona no celular, começa grátis e custa menos que um rolo de filamento". Diferenciais: em português, sem instalar nada, ordem de serviço em PDF, tema com a marca do cliente, importação da planilha que ele já usa, dados acessíveis de qualquer lugar.

---

## 5. Números

### Quanto sobra de cada assinatura
| | Mensal | Anual |
|---|---|---|
| Preço | R$ 19,90 | R$ 199,00 |
| Taxa Mercado Pago (≈ 4–5%, confira a vigente) | ≈ R$ 0,99 | ≈ R$ 9,95 |
| **Você recebe (antes do IR)** | **≈ R$ 18,91** | **≈ R$ 189,05** |

### Custos fixos por fase
| Fase | O que pagar | Custo/mês |
|---|---|---|
| Lançamento (0–10 assinantes) | nada | **R$ 0** |
| Profissionalização | domínio `.com.br` (R$ 40/ano) | ≈ R$ 3,50 |
| Com clientes pagando de verdade | Supabase Pro (backups diários, sem pausa) | ≈ US$ 25 (~R$ 140) |
| Se ficar na Vercel ao cobrar | Vercel Pro (uso comercial) | US$ 20 — **evite: use Cloudflare Pages (grátis)** |

### Cenários (receita líquida de taxa, antes do IR; supondo 70% mensal / 30% anual)
| Assinantes | Receita/mês | Custos fixos | Sobra antes do IR |
|---|---|---|---|
| 10 | ≈ R$ 179 | R$ 0–145 | ≈ R$ 35–179 |
| 50 | ≈ R$ 897 | ≈ R$ 145 | ≈ R$ 752 |
| 100 | ≈ R$ 1.795 | ≈ R$ 145 | ≈ R$ 1.650 |
| 300 | ≈ R$ 5.384 | ≈ R$ 145 | ≈ R$ 5.239 → **hora de virar empresa** |

---

## 6. Funcionando como pessoa física (PF)

**Pode vender o serviço como PF?** Sim. Desenvolvimento/licenciamento de software **não pode ser MEI**, então as opções são PF (agora) ou uma ME no Simples Nacional (depois).

**Impostos como PF (resumo, confirme com contador):**
- O que você recebe de **pessoas físicas** entra no **carnê-leão** todo mês: o imposto é calculado pela tabela progressiva do IR e pago por DARF até o último dia útil do mês seguinte. Use o app/site "Meu Imposto de Renda" (Carnê-Leão Web).
- Recebimentos de empresas (clientes com CNPJ) vão na declaração anual.
- Pode haver ISS municipal e inscrição de autônomo na sua prefeitura: varia de cidade para cidade.
- Guarde os extratos do Mercado Pago e a planilha de quem pagou (o Admin mostra isso).

**Exigência ao começar a cobrar:** o Decreto 7.962/2013 pede que quem vende pela internet mostre **CPF/CNPJ e endereço físico** no site. O build já bloqueia `planosPagos: true` sem esses dados. Opções para não expor sua casa:
- endereço comercial (coworking/escritório virtual, ~R$ 50–100/mês), ou
- abrir a ME já com endereço comercial quando a receita justificar.

**Quando virar empresa (ME, Simples Nacional):** quando a receita passar de uns **R$ 4–5 mil/mês**, o Simples (Anexo III, com Fator R) costuma sair mais barato que o IR da pessoa física, e você passa a emitir nota fiscal com facilidade. Contabilidade online para ME custa ~R$ 100–200/mês.

---

## 7. Hospedagem ao começar a cobrar

O plano grátis da Vercel (Hobby) **não permite uso comercial**. Antes da primeira cobrança, mova o site para o **Cloudflare Pages** (grátis, permite uso comercial). O projeto já tem `public/_headers` e `public/_redirects` com as mesmas regras de segurança e rotas.

1. <https://dash.cloudflare.com> → **Workers & Pages → Create → Pages → Connect to Git** → repositório `farmops3d`.
2. Build command: `npm run build:producao` · Output: `dist`.
3. Variáveis: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` e `NODE_VERSION=22`.
4. Depois do deploy, troque no Supabase (Authentication → URL Configuration) o Site URL e as Redirect URLs para o novo endereço (`https://farmops3d.pages.dev` ou seu domínio).
5. Atualize a hospedagem em `src/config/legal.ts` (fornecedores) e a `versao` dos documentos.

---

## 8. Rotina da cobrança manual (fase 1)

### Configurar uma vez
1. **Mercado Pago** (conta pessoal serve) → **Assinaturas** → criar plano "farmOps 3D Pro" R$ 19,90/mês → copie o link.
2. **Link de pagamento** R$ 199 (anual, Pix ou cartão) → copie o link.
3. Em `src/config/planos.ts` preencha `COBRANCA.linkMensal`, `linkAnual` e, se quiser, `chavePix`.
4. Em `src/config/legal.ts`: `planosPagos: true`, `documento` (CPF) e `endereco`; atualize `versao`/`vigenciaDesde`.
5. Torne-se admin (uma vez, no Supabase):
   ```bash
   npx supabase db query --remote --yes "insert into public.admins (user_id) select id from auth.users where email = 'SEU-EMAIL-DE-LOGIN'"
   ```
6. `git push` → o menu **Administração** aparece para você.

### A cada venda
1. Cliente clica em **Assinar** (página Plano) e paga, ou manda e-mail pelo botão.
2. Confira o pagamento no app do Mercado Pago.
3. **Painel → Administração** → busque o e-mail → **+30 dias** (mensal) ou **+1 ano** (anual) → anotação "MP 14/11" → Confirmar.
4. Responda o e-mail: "Pro ativado até dd/mm. Obrigado!".

### Toda segunda-feira (10 min)
- Em Administração, veja **"Vencem em 7 dias"**. Assinatura mensal renova sozinha no Mercado Pago: quando o pagamento cair, clique **+30 dias**.
- Quem não renovou volta para o Free sozinho no vencimento, sem perder dados.
- Olhe quem está **em teste** e termina esta semana → mande uma mensagem pessoal (modelo na seção 9).

### Fase 2 (quando passar de ~30 assinantes)
Automatizar com **webhook do Mercado Pago → Edge Function do Supabase** que chama `admin_estender_pro` sozinho. A estrutura do banco já está pronta para isso.

---

## 9. Captação de clientes (custo zero)

### Onde estão os clientes
- **Grupos de Facebook e WhatsApp** de impressão 3D (Brasil, por estado, por impressora: Bambu, Ender, Elegoo).
- **Instagram/TikTok/Reels**: makers mostrando peças. Comente, ajude, não faça spam.
- **Discord e Reddit** (r/3Dprinting, servidores brasileiros).
- **YouTube**: canais BR de impressão 3D (parceria/cupom).
- **Lojas de filamento**: parceria → cupom de 1 mês grátis para quem compra filamento.

### Plano de 30 dias
| Semana | Ação |
|---|---|
| 1 | Conta Instagram/TikTok **@farmops3d**. 3 vídeos curtos: "quanto cobrar por esta peça?" usando a calculadora (gravar a tela do celular). |
| 1 | Convide 10 makers que você conhece: teste grátis + condição de Fundador em troca de feedback. |
| 2 | Post de valor em 5 grupos: "Planilha gratuita de precificação" ou "como calcular custo de energia" (com o link do site no fim, sem empurrar). |
| 2 | Responda toda dúvida de preço em grupos com o cálculo feito na calculadora. |
| 3 | 1 artigo/vídeo por semana: "Como precificar impressão 3D (com exemplo real)" → bom para Google. |
| 3 | Fale com 3 lojas de filamento sobre parceria de cupom. |
| 4 | Peça depoimento aos primeiros usuários → coloque na landing. Revise o funil (seção 10). |

### Mensagens prontas
**Convite direto:**
> Oi, [nome]! Fiz um sistema para quem vende impressão 3D: calcula o preço certo (filamento + energia + margem), organiza os pedidos em "a fazer / concluído / entregue" e gera ordem de serviço em PDF. Tá liberado 14 dias grátis, sem cartão: farmops3d.vercel.app — me conta o que achou? Os primeiros 30 que assinarem pagam R$ 14,90 pra sempre.

**Fim do teste (dia 12):**
> Oi! Seu teste do Pro no farmOps 3D acaba em 2 dias. Se quiser continuar sem limite, é R$ 19,90/mês (ou R$ 199/ano). Se preferir ficar no Free, tudo bem: nada é apagado. Ficou faltando alguma coisa pra você?

**Resposta em grupo (sobre preço):**
> Fazendo a conta: 85 g × R$ 120/kg = R$ 10,20 de material + ~R$ 0,57 de energia (150 W × 4,5 h) + R$ 2 de extras = R$ 12,77 de custo. Com margem de 150% fica uns R$ 31,90. Eu uso uma calculadora que faz isso na hora, se quiser te passo.

---

## 10. Métricas para acompanhar (no Admin)

| Métrica | Como medir | Meta inicial |
|---|---|---|
| Cadastros/semana | contagem em Administração | 10 |
| Ativação | usuário com ≥ 3 produtos e 1 pedido | 50% dos cadastros |
| Conversão teste → Pro | Pro pagos ÷ testes encerrados | 10–15% |
| Cancelamento mensal | quem não renovou ÷ Pro do mês | < 8% |
| MRR | card "Receita mensal" do Admin | R$ 200 em 60 dias |

Se a ativação estiver baixa: melhore o primeiro uso (vídeo de 60 s na landing, produto de exemplo). Se a conversão estiver baixa: ajuste os limites do Free ou ofereça o anual com mais desconto.

---

## 11. Próximos passos do produto (por prioridade)

1. **Automação do pagamento** (webhook Mercado Pago → ativa/renova sozinho).
2. **Domínio próprio** `farmops3d.com.br` + e-mail `contato@` (melhora confiança e entrega de e-mails).
3. **Equipe**: convidar sócio/funcionário para a mesma conta (ex.: o Pedro da planilha).
4. **Orçamento** (pedido com status "orçamento" e link para o cliente aprovar).
5. **Estoque de filamento** (baixa automática por pedido).
6. **Nota fiscal** (quando virar ME).

---

## 12. Checklist de lançamento

- [ ] Aplicar migrations 4 e 5 na nuvem (ver `MANUAL-DEPLOY.md`)
- [ ] Você como admin (`insert into public.admins …`)
- [ ] Testar: cadastro novo recebe 14 dias de teste; pedido com 3 itens; OS em PDF; página Plano
- [ ] Criar links no Mercado Pago e preencher `src/config/planos.ts`
- [ ] Decidir endereço comercial ou expor endereço; preencher CPF/endereço; `planosPagos: true`
- [ ] Mover hospedagem para Cloudflare Pages antes da 1ª cobrança
- [ ] Conta @farmops3d no Instagram/TikTok e primeiros 3 vídeos
- [ ] 10 convites diretos com a oferta Fundador

---

### Fontes consultadas (13/11/2026)
- PrintControl 3D (preço único): <https://www.asaas.com/c/3h0bllkol1rse6f5>
- SimplyPrint (plano grátis/Enterprise): <https://simplyprint.io/pt-BR/enterprise>
- 3DPBOSS: <https://www.spendbase.co/pt/?p=21698>
- Mercado Pago — assinaturas e taxas: <https://www.mercadopago.com.br/ferramentas-para-vender/assinaturas>, <https://www.mercadopago.com.br/blog/criar-plano-assinatura-mercado-pago>
- Desenvolvedor e MEI / tributação PF: <https://contabilidade.com/blog/programador-pode-ser-mei>, <https://www.meucontadoronline.com.br/blog/desenvolvedor-de-software-pode-ser-mei/>, <https://contabilidade.com/blog/quanto-um-dev-paga-de-imposto-veja-a-tributacao-como-autonomo-simples-nacional-e-lucro-presumido/>
