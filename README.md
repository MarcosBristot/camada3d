# Camada3D

Gestão de vendas, controle financeiro e precificação para negócios de impressão 3D.

**Stack:** React 19 + TypeScript · Vite 6 · Tailwind CSS 4 · Framer Motion · Supabase (Postgres + Storage)

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
e aplique com `npx supabase db push`.

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
