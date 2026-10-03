# AGENTS.md — Fishbowl (jogo do pote, um celular só)

Recriação "pass-and-play" do fishbowl-game.com: um único celular passa de mão
em mão entre todos os jogadores. Interface em pt-BR.

## Como o projeto foi gerado

```bash
npx @tanstack/cli@latest create my-tanstack-app --agent --package-manager pnpm --tailwind --add-ons tanstack-query
```

- O CLI gerou em `../my-tanstack-app`; o conteúdo foi movido para a raiz deste
  repositório (que estava vazia). Nada do resultado do CLI foi descartado além
  do que está listado em "Mudanças sobre o template".
- Depois do scaffold:
  - `npx @tanstack/intent@latest install` → **falhou**: `intent.skills is not
    configured. Run intent install in an interactive terminal to review and
    confirm permissions.` O comando exige terminal interativo. Rode
    `npx @tanstack/intent@latest install` manualmente em um terminal para
    gravar a allowlist `intent.skills` e o bloco de skills neste arquivo.
  - `npx @tanstack/intent@latest list` (e `pnpm dlx @tanstack/intent list`) →
    `No intent-enabled packages found.` O scanner (intent 0.5.0) não encontrou
    as skills no layout de `node_modules` do pnpm 12 no Windows, embora os
    pacotes as tragam. Enquanto isso não funcionar, leia direto do pacote:
    - `node_modules/.pnpm/@tanstack+react-start@*/node_modules/@tanstack/react-start/skills/react-start/SKILL.md`
    - `node_modules/.pnpm/@tanstack+start-client-core@*/node_modules/@tanstack/start-client-core/skills/start-core/{execution-model,deployment,server-functions,...}/SKILL.md`
    - `node_modules/.pnpm/@tanstack+router-core@*/node_modules/@tanstack/router-core/skills/router-core/**/SKILL.md`
    - Encontre todas com: `find node_modules/.pnpm -path '*@tanstack*' -name SKILL.md`

## Stack

- **TanStack Start** (React 19, file-based routing, starter em branco) — Vite 8
- **TanStack Router** — uma rota só (`/`)
- **TanStack Query** (add-on `tanstack-query`) — provider via
  `setupRouterSsrQueryIntegration` em `src/router.tsx`; devtools no painel do
  TanStack Devtools (só em dev, removidos no build)
- **Tailwind CSS v4** (`@tailwindcss/vite`), tokens em `src/styles.css`
- Toolchain padrão do CLI: pnpm, TypeScript, sem linter/formatter extra

## Arquitetura

```
src/
  game/                  lógica pura, sem React (exceto useGame/device)
    types.ts             GameState, Phase (máquina de estados), Settings
    engine.ts            gameReducer + regras (turnos, pote, placar, tempo herdado)
    random.ts            shuffle com seed (mulberry32)
    rounds.ts            textos/regras das rodadas
    storage.ts           persistência em localStorage ('fishbowl:v1')
    useGame.ts           useReducer + salvar a cada mudança
    device.ts            beep (WebAudio), vibração, Screen Wake Lock
    word-bank.ts         queryOptions do banco de sugestões (TanStack Query)
    word-list.ts         lista de sugestões (chunk carregado sob demanda)
  components/game/       uma tela por fase (Setup, Writing, Turn*, Round*, GameOver) + ui.tsx
  routes/index.tsx       rota do jogo: ssr: false, loader faz prefetch do banco de palavras
  routes/__root.tsx      documento HTML, meta tags mobile, devtools
```

Decisões-chave:

- **Tudo no cliente.** A rota `/` usa `ssr: false` (selective SSR, ver skill
  `start-core/deployment`) porque o estado vive no `localStorage` e usa APIs do
  navegador. Não há server functions nem backend.
- **Reducer puro.** Aleatoriedade (`seed`) e horário (`now`) entram pelas
  ações, então o `gameReducer` é determinístico (o StrictMode chama reducers
  duas vezes em dev).
- **Fases** (`state.phase.name`): `setup → writing → roundIntro → turnReady →
  turnActive → turnReview → (turnReady | roundEnd | gameOver)`.
- **Pote:** `bowl[0]` é o papel da vez. Acerto remove; pulo devolve para uma
  posição aleatória (nunca a primeira); papel anulado na conferência volta para
  o pote.
- **Cronômetro:** guarda `endsAt` (timestamp), não um contador, então não
  atrasa com abas em segundo plano. Ao recarregar a página, o turno volta pausado.
- **Tempo herdado:** se o pote esvazia com ≥3s restantes e a opção estiver
  ligada, o mesmo jogador começa a próxima rodada com o tempo que sobrou.
- **TanStack Query** cacheia o banco de sugestões (`staleTime: Infinity`),
  carregado via `import()` dinâmico e pré-carregado no loader da rota.

## Mudanças sobre o template do CLI

- Removidos: `src/routes/about.tsx`, `src/routes/demo/tanstack-query.tsx`,
  `src/components/{Header,Footer,ThemeToggle}.tsx` e o script de tema. O jogo
  ocupa a tela inteira do celular e não tem navegação.
- `src/styles.css` reescrito (tema "oceano"); o `@plugin "@tailwindcss/typography"`
  saiu, mas a dependência continua no `package.json`.
- `vite.config.ts`: `base` vem de `BASE_PATH` e o prerender está ligado
  (gera `dist/client/index.html`).
- `package.json`: `name` → `fishbowl` e `packageManager: pnpm@12.3.4`.

## Variáveis de ambiente

Nenhuma é necessária em runtime. Só no build:

| Variável    | Padrão | Uso                                                        |
| ----------- | ------ | ---------------------------------------------------------- |
| `BASE_PATH` | `/`    | `base` do Vite e basepath do router. Pages usa `/fishbowl/` |

## Deploy (GitHub Pages)

- Repositório: https://github.com/YgorPerez/fishbowl — site: https://ygorperez.github.io/fishbowl/
- `.github/workflows/deploy.yml`: em push na `main` → `pnpm build` com
  `BASE_PATH=/<repo>/` → publica `dist/client` com `actions/deploy-pages`.
- Pages configurado com source = **GitHub Actions**.
- O site é estático: o prerender gera o HTML da casca e o React monta o jogo
  no cliente. `dist/server` é gerado, mas não é usado no Pages.

## Pegadinhas conhecidas

- **Git Bash no Windows** converte `BASE_PATH=/fishbowl/` em
  `C:/Program Files/Git/fishbowl/`. Use `MSYS_NO_PATHCONV=1` (no CI não acontece).
- O basepath do router vem do `base` do Vite (`deriveRouterBasepath`). Não
  defina `router.basepath` à mão.
- Áudio no iOS só toca depois de um toque: `unlockAudio()` é chamado nos
  botões "Valendo!" e "Continuar".
- Wake Lock precisa de HTTPS (ou localhost). Em `http://<ip-da-lan>:3000` a
  tela pode apagar durante o turno.
- O primeiro carregamento do `pnpm dev` é lento (compilação); a tela fica
  no `pendingComponent` (aquário) por alguns segundos.
- `pnpm` 12 avisa que o campo `"pnpm"` do `package.json` é ignorado. A config
  efetiva está em `pnpm-workspace.yaml` (`allowBuilds`).

## Próximos passos

- PWA (manifest + service worker) para instalar e jogar 100% offline.
- Editar/remover papéis antes do jogo e importar listas temáticas.
- Testes unitários do `gameReducer` (Vitest).
- Rodar `intent install` em um terminal interativo e registrar as skills aqui.
