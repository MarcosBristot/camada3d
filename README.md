# Camada3D

Gestão de vendas, controle financeiro e precificação para negócios de impressão 3D.

**Stack:** React 19 + TypeScript · Vite 6 · Tailwind CSS 4 · Framer Motion · Supabase (Postgres + Auth + Storage) · Vercel

📘 **Para publicar:** [MANUAL-DEPLOY.md](MANUAL-DEPLOY.md)

## Rodando localmente

```bash
npm install
npm run dev
```

Acesse http://localhost:5173. O painel fica em `/dashboard`.

### Modo demonstração

Sem `.env`, o painel abre em **modo demonstração**: tudo funciona igual, mas os dados ficam no `localStorage`
do navegador e vêm com alguns produtos e vendas de exemplo (o botão "Restaurar dados de exemplo" na barra
lateral recria esses dados). Assim que o `.env` existir, o app passa a usar o Supabase com login.

## Supabase local (Docker)

Para desenvolver e testar sem tocar no banco de produção:

```bash
npm run db:start      # sobe Postgres, Auth, Storage e Studio (http://127.0.0.1:54323) e aplica as migrations
npm run db:test       # roda os testes pgTAP em supabase/tests
npm run dev:localdb   # app apontando para o banco local (usa .env.localdb)
npm run db:stop
```

`.env.localdb` (fora do git) leva a URL `http://127.0.0.1:54321` e a `ANON_KEY` que o `db:start` imprime.

## Supabase na nuvem

1. Crie o projeto em https://supabase.com/dashboard/new e guarde a senha do banco.
2. Entre e linke o projeto (o `link` pede a senha do banco):
   ```bash
   npx supabase login
   npx supabase link --project-ref SEU_PROJECT_REF
   ```
   O `project-ref` é o trecho `xxxx` de `https://xxxx.supabase.co`.
3. Aplique o schema e confira:
   ```bash
   npx supabase db push
   ```
4. Copie `.env.example` para `.env` e preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
   (Project Settings → API Keys; a chave "anon"/"publishable" é pública e pode ir para o front-end).
5. Em **Authentication → URL Configuration**, defina o *Site URL* (em desenvolvimento,
   `http://localhost:5173`) para o link de confirmação de e-mail voltar para o app.

Mudanças futuras no banco: crie um novo arquivo em `supabase/migrations/`, teste com `db:start`/`db:test`
e aplique com `npx supabase db push --remote` (na CLI 3, sem `--remote` o alvo é o banco local).

> **Se o `db push --remote` travar em "Initialising login role..."**: o pooler está recusando a conexão
> temporária da CLI. Aplique o arquivo pela API (HTTPS) e registre a versão no histórico:
> ```bash
> npx supabase db query --remote --yes -f supabase/migrations/ARQUIVO.sql
> npx supabase db query --remote --yes "insert into supabase_migrations.schema_migrations (version, statements, name) values ('VERSAO', '{}', 'nome') on conflict do nothing"
> ```

## Estrutura

```
src/
  components/
    landing/      seções da landing (Hero, Features, HowItWorks, PricingPreview...)
    dashboard/    layout, login, histórico de vendas, modal de nova venda
    ui/           Reveal, MagneticButton, AnimatedNumber, Modal, Toast, campos de formulário
  contexts/       AuthContext (Supabase Auth ou usuário de demonstração)
  hooks/          useData.ts — queries e mutations (TanStack Query)
  lib/
    api/          contrato DataApi + implementações Supabase e demonstração
    pricing.ts    fórmula de preço (mesma do SQL)
    image.ts      redimensiona fotos e converte para WebP antes do upload
    supabase.ts   cliente tipado
    storage.ts    upload/remoção de fotos de produtos
  pages/
    Landing.tsx
    Dashboard.tsx         rotas do painel (carregado sob demanda)
    dashboard/            Overview, Calculator, Products, Expenses
  types/
    database.ts   tipagens das tabelas e da view
supabase/migrations/20261113000000_schema_inicial.sql
```

## Regras de precificação

| Campo            | Fórmula                                              |
|------------------|------------------------------------------------------|
| `custo_material` | peso (g) ÷ 1000 × preço do kg                        |
| `custo_energia`  | potência (W) ÷ 1000 × horas × tarifa (R$/kWh)        |
| `custo_base`     | material + energia + custo adicional                 |
| `preco_sugerido` | custo_base × (1 + margem % ÷ 100)                    |

A margem é aplicada **sobre o custo** (100% = o preço é o dobro do custo).
As fórmulas existem em `src/lib/pricing.ts` e como colunas geradas no SQL; mantenha as duas iguais.

Em `vendas`, se `custo_total` não for enviado, o banco usa `custo_base × quantidade` do produto e guarda esse valor,
então mudar o preço do filamento depois não altera o lucro de vendas antigas.

## Painel

| Rota                       | O que faz                                                                 |
|----------------------------|---------------------------------------------------------------------------|
| `/dashboard`               | Faturamento, gastos (produtos + operação), lucro líquido, histórico de vendas e "Nova venda" |
| `/dashboard/calculadora`   | Calcula custo e preço em tempo real e salva como produto (com foto)       |
| `/dashboard/produtos`      | Catálogo com foto, custo e preço; atalho para vender                      |
| `/dashboard/despesas`      | Despesas operacionais que entram no lucro líquido                         |
| `/dashboard/pedidos`       | Pedidos em abas **A fazer**, **Concluídos** e **Entregues**, com pagamento |
| `/dashboard/empresa`       | Logo, cores e tema; filamentos; importação da planilha                    |

## Identidade visual e tema

- Ao enviar a logo em **Empresa**, `src/lib/palette.ts` extrai a cor principal e a secundária no próprio
  navegador. O site inteiro usa essas cores (variáveis `--brand` / `--accent` em `src/index.css`;
  as classes `brand-*` e `accent-*` são derivadas delas).
- Tema claro, escuro ou do sistema, salvo no perfil e em cache local (a landing também usa).
- O texto sobre botões da cor principal fica claro ou escuro automaticamente, para manter contraste.

## Importação da planilha (Controle 3D)

Em **Empresa → Importar planilha**, envie o `.xlsx` com as abas `Filamentos`, `Produtos`, `Vendas` e `Marketing`.
O arquivo é lido no navegador e nada é gravado antes da revisão:

- linhas de exemplo ou isoladas no fim das abas vêm desmarcadas;
- cores repetidas em Filamentos geram aviso, porque fórmulas com SOMASE somam os preços;
- cada "Status Pagamento" da planilha pode ser direcionado para uma etapa do pedido;
- rodar de novo não duplica nada (filamento por cor+material+marca, produto por nome,
  pedido pelo código `PED-xxx`, despesa por descrição+valor).

O leitor fica em `src/lib/importacao/planilha.ts` (módulo puro, testável no Node) e a gravação em
`src/lib/importacao/executar.ts`.

## Documentos legais e privacidade (LGPD)

| Rota            | Documento                                        |
|-----------------|--------------------------------------------------|
| `/termos`       | Termos de Uso                                    |
| `/privacidade`  | Política de Privacidade (LGPD)                   |
| `/cookies`      | Cookies e armazenamento local                    |
| `/reembolso`    | Cancelamento e Reembolso (CDC, art. 49)          |
| `/contato`      | Canais de suporte, encarregado (DPO) e dados do fornecedor |

- Todos os dados variáveis (razão social, CNPJ/CPF, endereço, e-mails, foro, fornecedores, prazos, versão)
  ficam em **`src/config/legal.ts`**. `npm run check:legal` lista o que falta e falha se houver pendência.
- Cadastro exige aceite dos Termos e da Política; versão e data ficam em `auth.users.raw_user_meta_data`.
- **Painel → Conta**: baixar todos os dados (JSON) e excluir a conta. A exclusão apaga fotos/logo do Storage
  e chama `public.excluir_minha_conta()` (migration 3), que remove a conta e tudo em cascata.
- Sem Google Fonts, analytics ou pixels: fontes servidas pelo próprio site (`@fontsource-variable`).

## Publicação (deploy)

O passo a passo completo para colocar no ar (Gmail para envio de e-mails, Vercel, configuração do login no Supabase,
testes em produção, rotina, limites dos planos grátis e solução de problemas) está em **[MANUAL-DEPLOY.md](MANUAL-DEPLOY.md)**.

Resumo das proteções do build de produção (`npm run build:producao`, usado pela Vercel):
- `check:env`: exige as variáveis do Supabase e recusa a chave `service_role`;
- `check:legal`: bloqueia o deploy se houver `[PREENCHER` em `src/config/legal.ts`;
- `vercel.json`: rotas da SPA, cache dos arquivos e cabeçalhos de segurança (CSP sem scripts externos).
