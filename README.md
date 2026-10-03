# Fishbowl — o jogo do pote 🐟

Versão "um celular só" do jogo Fishbowl (inspirada no fishbowl-game.com): o
grupo inteiro joga passando o mesmo celular de mão em mão. Não precisa de
servidor, conta nem internet depois que a página carrega.

**Jogar:** https://ygorperez.github.io/fishbowl/

## Como funciona

1. **Configuração** — monte os times (2 a 6, pelo menos 2 pessoas cada), defina
   tempo por turno, papéis por pessoa, pulos por turno e quais rodadas jogar.
2. **Escrita** — o app chama cada pessoa pelo nome; ela escreve seus papéis em
   segredo (com 🎲 para sugestões) e passa o celular adiante.
3. **Rodadas** — os times se revezam. Quem explica vê um papel por vez e toca
   em **Acertou!** ou **Pular**. Quando o tempo acaba, a pessoa confere os
   acertos (dá para anular um acerto errado). Quando o pote esvazia, todos os
   papéis voltam para a próxima rodada:
   - 🗣️ **Descreva** — fale à vontade, sem dizer a palavra
   - ☝️ **Uma palavra** — só uma palavra por papel
   - 🤐 **Mímica** — sem falar nada
   - 🎵 **Só sons** (opcional) — só barulhos, sem palavras nem gestos
4. **Fim** — placar por rodada, time vencedor e melhor explicador. Dá para
   pedir revanche com os mesmos papéis.

O tempo que sobra quando o pote esvazia passa para a próxima rodada (opcional).
A partida fica salva no aparelho: se a página recarregar, o jogo volta pausado.

## Desenvolvimento

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm build        # gera dist/client (site estático) + dist/server
```

Para testar o build como no GitHub Pages:

```bash
BASE_PATH=/fishbowl/ pnpm build   # no Git Bash do Windows: MSYS_NO_PATHCONV=1 BASE_PATH=/fishbowl/ pnpm build
```

O deploy roda sozinho a cada push na `main`
(`.github/workflows/deploy.yml`).

Stack: TanStack Start (React) + TanStack Router + TanStack Query + Tailwind CSS v4.
Veja [AGENTS.md](./AGENTS.md) para as decisões de arquitetura.
