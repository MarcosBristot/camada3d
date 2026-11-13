# Manual de publicação e operação do farmOps 3D

Guia passo a passo para colocar o farmOps 3D no ar para outras pessoas usarem e mantê-lo funcionando.
Siga na ordem: cada passo depende do anterior. Tempo estimado: **1h a 1h30** na primeira vez.

---

## Como as peças se encaixam

```
 Usuário ──► Vercel (site)  ──►  Supabase (login, banco de dados, fotos)
                 ▲                         │
   git push ─────┘                         └──► Gmail (e-mails de confirmação e de senha)
 (GitHub: MarcosBristot/farmops3d)
```

| Serviço  | Para quê                                     | Plano     |
|----------|----------------------------------------------|-----------|
| GitHub   | Guarda o código; cada `push` publica o site  | Grátis    |
| Vercel   | Hospeda o site com HTTPS                     | Hobby (grátis) |
| Supabase | Contas, banco de dados e fotos (projeto **camada 3d**) | Free |
| Gmail    | Envia os e-mails de cadastro e de senha      | Grátis    |

---

## Passo 0 — Antes de começar

- [ ] Acesso ao GitHub (repositório `MarcosBristot/farmops3d`) ✅ já feito
- [ ] Projeto Supabase **camada 3d** criado e linkado ✅ já feito
- [ ] Migrations 1 e 2 aplicadas na nuvem ✅ já feito
- [ ] Criar o e-mail do serviço (Passo 1)
- [ ] Criar conta na Vercel entrando com o GitHub (Passo 4)

> **Ative a verificação em duas etapas** no GitHub, na Vercel, no Supabase e no Gmail novo.
> Quem entrar nessas contas controla o site e os dados de todos os usuários.

---

## Passo 1 — Criar o e-mail do serviço (Gmail)

Esse e-mail aparece no site como contato e canal de privacidade, e também envia os e-mails automáticos.

1. Crie uma conta nova em <https://accounts.google.com/signup>, por exemplo `farmops3d@gmail.com`.
2. Ative a **verificação em duas etapas**: <https://myaccount.google.com/signinoptions/twosv>.
3. Crie uma **senha de app** (é ela que o Supabase usa para enviar e-mails):
   - acesse <https://myaccount.google.com/apppasswords>;
   - nome do app: `Supabase farmOps 3D`;
   - copie a senha de 16 letras que aparecer e guarde num lugar seguro (gerenciador de senhas). Ela não é mostrada de novo.

---

## Passo 2 — Colocar o e-mail nos documentos legais ✅ feito (`farmops3d@gmail.com`)

1. Abra `src/config/legal.ts` e troque a linha:
   ```ts
   email: P('e-mail de suporte'),
   ```
   por:
   ```ts
   email: 'farmops3d@gmail.com',
   ```
2. Confira:
   ```bash
   npm run check:legal
   ```
   Tem que aparecer `✔ Dados legais preenchidos.`
3. Envie para o GitHub:
   ```bash
   git add src/config/legal.ts
   git commit -m "Preenche e-mail de contato"
   git push
   ```

> O deploy **falha de propósito** enquanto houver campo `[PREENCHER` no `legal.ts`. Assim nenhuma página legal vai ao ar incompleta.

---

## Passo 3 — Aplicar a migration 3 (exclusão de conta) no Supabase

Sem ela, o botão **Excluir minha conta** dá erro no site publicado. No terminal, dentro da pasta do projeto:

```bash
npx supabase db query --remote --yes -f supabase/migrations/20261113180000_excluir_conta.sql
```
```bash
npx supabase db query --remote --yes "insert into supabase_migrations.schema_migrations (version, statements, name) values ('20261113180000', '{}', 'excluir_conta') on conflict do nothing"
```

Para conferir, este comando deve listar as 3 versões:
```bash
npx supabase db query --remote --read-only "select version from supabase_migrations.schema_migrations order by 1"
```

> Usamos `db query` (pela API) porque o `db push` trava em "Initialising login role" nesse projeto.

---

## Passo 4 — Publicar na Vercel

1. Acesse <https://vercel.com/signup> e entre com **Continue with GitHub**.
2. Clique em **Add New… → Project**.
3. Em *Import Git Repository*, encontre `farmops3d`. Se não aparecer, clique em **Adjust GitHub App Permissions** e libere o repositório (ele é privado).
4. Clique em **Import**. A Vercel detecta tudo pelo `vercel.json`, então **não altere** Framework, Build Command nem Output Directory.
5. Abra **Environment Variables** e adicione as duas:

   | Name | Value |
   |------|-------|
   | `VITE_SUPABASE_URL` | `https://eewdqdpcaggigvuxgibf.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | a chave **anon / publishable**. Copie do seu arquivo `.env` ou de Supabase → Project Settings → API Keys |

   > ⚠️ **Nunca** use a chave `service_role` / `secret`. Ela ignora todas as regras de segurança. O build recusa essa chave automaticamente.
6. Clique em **Deploy** e aguarde cerca de 1 minuto.
7. Anote o endereço gerado, no seu caso `https://farmops3d.vercel.app` (projeto **farmops3d** na Vercel). Ele é usado no Passo 5.

O build de produção (`npm run build:producao`) verifica três coisas antes de publicar:
- se as variáveis do Supabase existem e são as certas (`check:env`);
- se não falta nenhum dado legal (`check:legal`);
- se o TypeScript compila.

Se algo estiver errado, o log da Vercel mostra o motivo em português.

---

## Passo 5 — Configurar o login no Supabase

Tudo no painel do Supabase, projeto **camada 3d** (<https://supabase.com/dashboard/project/eewdqdpcaggigvuxgibf>).

### 5.1 Endereços do site
**Authentication → URL Configuration**
- **Site URL:** exatamente `https://farmops3d.vercel.app`, **com** `https://` e **sem** `/**` no final. (Com `/**` aqui, os links dos e-mails levam para uma página inexistente.)
- **Redirect URLs:** adicione
  - `https://farmops3d.vercel.app/**`
  - `http://localhost:5173/**` (para continuar testando no seu computador)

> Se faltar isso, o link de confirmação do e-mail abre em `localhost` e não funciona para os usuários.

### 5.2 Regras de cadastro
**Authentication → Sign In / Providers → Email**
- **Confirm email:** ligado
- **Minimum password length:** `8` (o site já pede 8)
- **Secure email change:** ligado

### 5.3 Envio de e-mails pelo Gmail (obrigatório)
Sem SMTP próprio, o Supabase só envia e-mails para os membros do seu time, ou seja, **novos usuários não recebem a confirmação**.

**Authentication → Emails → SMTP Settings → Enable Custom SMTP**

| Campo | Valor |
|-------|-------|
| Sender email | `farmops3d@gmail.com` |
| Sender name | `farmOps 3D` |
| Host | `smtp.gmail.com` |
| Port | `587` |
| Username | `farmops3d@gmail.com` |
| Password | a **senha de app** do Passo 1 (não a senha normal do Gmail) |
| Minimum interval | `60` segundos |

Depois, em **Authentication → Rate Limits**, aumente *Rate limit for sending emails* para algo como **30 por hora**. O Gmail aguenta cerca de 500 por dia.

### 5.4 E-mails em português
**Authentication → Emails → Templates**

| Modelo | Assunto | Conteúdo (cole o arquivo inteiro) |
|--------|---------|-----------------------------------|
| **Confirm signup** | `Confirme seu e-mail no farmOps 3D` | `supabase/templates/confirmacao.html` |
| **Reset password** | `Redefinir sua senha do farmOps 3D` | `supabase/templates/recuperacao.html` |

Salve cada um.

---

## Passo 6 — Testar em produção

Use **outro e-mail seu** (não o do serviço) e marque cada item:

- [ ] O site abre com cadeado (HTTPS), e a landing aparece com a animação.
- [ ] O rodapé mostra "Marcos Bristot (pessoa física)" e o e-mail, e os 5 links legais abrem.
- [ ] **Criar conta:** sem marcar o aceite, aparece o erro; marcando, a conta é criada.
- [ ] O e-mail de confirmação **chega em português** (veja também o spam) e o botão abre o painel.
- [ ] **Empresa:** enviar a logo, conferir as cores, escolher tema e salvar.
- [ ] **Importar planilha:** `Controle_3D.xlsx`, revisar e importar. Os pedidos aparecem em **Pedidos**.
- [ ] **Produtos:** adicionar uma foto num produto.
- [ ] **Novo pedido**, mover entre as abas e marcar como pago.
- [ ] **Sair → Esqueci minha senha:** o e-mail chega, e a nova senha funciona.
- [ ] **Conta → Baixar meus dados:** baixa um arquivo `.json`.
- [ ] **Excluir conta:** teste com uma **conta descartável**, nunca com a sua conta principal.
- [ ] No celular: abrir o site e conferir o menu inferior e o tema claro/escuro.

Tudo certo? O site está pronto para receber pessoas. 🎉

---

## Dia a dia

### Publicar uma atualização
Faça a mudança, teste localmente e depois:
```bash
git add -A
git commit -m "Descreve a mudança"
git push
```
A Vercel publica sozinha em ~1 minuto. Para testar antes, crie uma *branch*: cada branch ganha um endereço de prévia próprio na Vercel.

### Algo quebrou depois de uma atualização
Vercel → projeto → **Deployments** → escolha a última versão boa → **⋯ → Instant Rollback**. O site volta na hora; depois corrija com calma.

### Mudar o banco de dados
1. Crie um arquivo novo em `supabase/migrations/` (ex.: `20261201120000_nova_coluna.sql`).
2. Teste localmente: `npm run db:start` e `npm run db:test`.
3. Aplique na nuvem com o mesmo padrão do Passo 3 (`db query -f …` e o `insert` no histórico com a versão nova).

### Mudar um documento legal
1. Edite o texto em `src/pages/legal/` e/ou os dados em `src/config/legal.ts`.
2. Atualize `versao` e `vigenciaDesde` em `legal.ts`.
3. Mudança relevante: **avise os usuários com 15 dias de antecedência** (os Termos prometem isso).

### Rotina recomendada
- **Toda semana:** entre no painel do Supabase. No plano grátis, **projetos sem uso por 7 dias são pausados**; se isso acontecer, clique em *Restore*.
- **Todo mês:** em **Conta → Baixar meus dados**, guarde uma cópia dos seus dados. O plano grátis do Supabase **não tem backup automático**.
- Responda e-mails de privacidade (LGPD) em **até 15 dias**.

---

## Limites do plano grátis

| Serviço | Limite principal | O que acontece |
|---------|------------------|----------------|
| Supabase Free | 500 MB de banco, 1 GB de arquivos, 50 mil usuários ativos/mês, pausa após 7 dias sem uso | Ao chegar perto, avalie o plano Pro (US$ 25/mês, inclui backups diários) |
| Vercel Hobby | **Somente uso não comercial**, 100 GB de tráfego/mês | Ao começar a cobrar, migre para o Vercel Pro (US$ 20/mês) ou para Netlify/Cloudflare Pages |
| Gmail | ~500 e-mails por dia | Com muitos cadastros por dia, use Brevo ou Resend com domínio próprio |

---

## Domínio próprio (opcional, recomendado)

1. Registre um domínio `.com.br` em <https://registro.br> (cerca de R$ 40/ano; com CPF é possível).
2. Vercel → projeto → **Settings → Domains → Add**, e siga as instruções de DNS no Registro.br.
3. Atualize no Supabase (Passo 5.1) a **Site URL** e as **Redirect URLs** para o domínio novo.
4. Com domínio, dá para ter `contato@seudominio.com.br` e trocar o Gmail por um SMTP profissional (Resend ou Brevo), com melhor entrega.

---

## Quando começar a cobrar

Antes de cobrar qualquer valor:
1. **Abra um MEI** pelo <https://www.gov.br/empresas-e-negocios/pt-br/empreendedor> (gratuito e online). Confira com um contador se a sua atividade (software/SaaS) pode ser MEI; se não puder, o caminho é uma ME no Simples Nacional.
2. Em `src/config/legal.ts`: `tipo: 'PJ'`, razão social, CNPJ e endereço comercial; `cobranca.planosPagos: true` e `processadorPagamento` (ex.: Mercado Pago ou Stripe); atualize a `versao`.
3. Avise os usuários sobre os novos documentos com 15 dias de antecedência.
4. Emita nota fiscal das vendas e mude a Vercel para um plano que permita uso comercial.
5. Peça a um advogado para revisar os Termos e a Política de Privacidade.

---

## Solução de problemas

| Sintoma | Causa provável | Como resolver |
|---------|----------------|---------------|
| Deploy falhou com "campo(s) legal(is) ainda sem preencher" | Falta o e-mail no `legal.ts` | Passo 2 |
| Deploy falhou com "Variáveis de ambiente de produção" | Variáveis ausentes ou erradas na Vercel | Passo 4.5 e depois **Redeploy** |
| Usuário não recebe e-mail | SMTP não configurado, senha de app errada ou limite atingido | Passo 5.3; peça para olhar o spam; veja **Supabase → Logs → Auth** |
| Link do e-mail abre `localhost` ou dá erro | Site URL ou Redirect URLs erradas | Passo 5.1 |
| "Link inválido ou expirado" ao redefinir a senha | O link vale 1 hora e só pode ser usado uma vez | Peça um novo em "Esqueci minha senha" |
| Site fora do ar ou "Failed to fetch" | Projeto Supabase pausado | Painel do Supabase → **Restore project** |
| "Excluir minha conta" dá erro | Migration 3 não aplicada | Passo 3 |
| Algo não carrega e o console mostra "Content Security Policy" | Recurso externo bloqueado pela política de segurança | Ajuste a linha `Content-Security-Policy` em `vercel.json` (só libere domínios em que você confia) |

---

## Onde fica cada coisa

| Arquivo | Conteúdo |
|---------|----------|
| `src/config/legal.ts` | Nome, e-mail, fornecedores, prazos e versão dos documentos |
| `src/pages/legal/` | Textos dos Termos, Privacidade, Cookies, Reembolso e Contato |
| `vercel.json` | Rotas, cache e cabeçalhos de segurança (CSP) |
| `supabase/migrations/` | Estrutura do banco (3 migrations) |
| `supabase/tests/` | Testes do banco (`npm run db:test`, 48 testes) |
| `supabase/templates/` | E-mails em português |
| `scripts/check-*.mjs` | Verificações automáticas do build de produção |
| `.env` | URL e chave anon do Supabase da nuvem (**não vai para o GitHub**) |
| `.env.localdb` | Supabase local de testes (**não vai para o GitHub**) |
