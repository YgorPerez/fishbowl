import { totalScore } from '#/game/engine'
import { newSeed } from '#/game/random'
import { ROUNDS } from '#/game/rounds'
import type { GameState } from '#/game/types'
import type { Dispatch } from '#/game/useGame'
import { Button, Fishbowl, Panel, QuitButton, Screen, Scoreboard, TeamDot } from './ui'

interface Props {
  state: GameState
  dispatch: Dispatch
}

export function RoundIntroScreen({ state, dispatch }: Props) {
  const { rounds } = state.settings
  const round = ROUNDS[rounds[state.roundIdx]]
  return (
    <Screen className="justify-between gap-6">
      <div className="flex items-center justify-between text-sm font-bold text-foam/60">
        <span>
          Rodada {state.roundIdx + 1} de {rounds.length}
        </span>
        <QuitButton onQuit={() => dispatch({ type: 'NEW_GAME' })} />
      </div>

      <div className="space-y-5 text-center">
        <p className="text-7xl">{round.emoji}</p>
        <h1 className="font-display text-5xl font-black">{round.title}</h1>
        <Panel className="space-y-2 text-left text-lg">
          {round.rules.map((rule) => (
            <p key={rule}>• {rule}</p>
          ))}
        </Panel>
        <div className="flex items-center justify-center gap-3 text-foam/70">
          <Fishbowl size={56} />
          <span className="font-bold">{state.bowl.length} papéis no pote</span>
        </div>
      </div>

      <div className="space-y-4">
        {state.roundIdx > 0 && <Scoreboard state={state} />}
        <Button size="lg" className="w-full" onClick={() => dispatch({ type: 'BEGIN_ROUND' })}>
          Bora! 🐟
        </Button>
      </div>
    </Screen>
  )
}

export function RoundEndScreen({ state, dispatch }: Props) {
  const { rounds } = state.settings
  const finished = ROUNDS[rounds[state.roundIdx]]
  const next = ROUNDS[rounds[state.roundIdx + 1]]
  const carryTeam = state.teams[state.teamCursor]
  return (
    <Screen className="justify-between gap-6">
      <header className="pt-4 text-center">
        <p className="text-sm font-bold uppercase tracking-widest text-amber-300">
          Fim da rodada {state.roundIdx + 1}
        </p>
        <h1 className="font-display mt-1 text-4xl font-black">
          {finished.emoji} {finished.title}
        </h1>
      </header>

      <Scoreboard state={state} highlightRound={state.roundIdx} />

      <div className="space-y-3">
        {state.carryMs !== null && (
          <p className="text-center text-sm text-foam/70">
            <TeamDot color={carryTeam.color} /> {carryTeam.name} começa a próxima
            rodada com os {Math.ceil(state.carryMs / 1000)}s que sobraram.
          </p>
        )}
        <Button
          size="lg"
          className="w-full"
          onClick={() => dispatch({ type: 'NEXT_ROUND', seed: newSeed() })}
        >
          Próxima: {next.emoji} {next.title}
        </Button>
      </div>
    </Screen>
  )
}

export function GameOverScreen({ state, dispatch }: Props) {
  const totals = state.teams.map((_, i) => totalScore(state, i))
  const best = Math.max(...totals)
  const winners = state.teams.filter((_, i) => totals[i] === best)

  const byPlayer = new Map<string, number>()
  for (const h of state.history)
    byPlayer.set(h.player, (byPlayer.get(h.player) ?? 0) + h.count)
  const [mvp, mvpPoints] = [...byPlayer].sort((a, b) => b[1] - a[1])[0] ?? []

  return (
    <Screen className="gap-6">
      <header className="pt-6 text-center">
        <p className="text-7xl">🏆</p>
        <h1 className="font-display mt-2 text-4xl font-black">
          {winners.length > 1 ? 'Empate!' : `${winners[0].name} venceu!`}
        </h1>
        {winners.length > 1 && (
          <p className="mt-1 text-foam/70">{winners.map((w) => w.name).join(' e ')}</p>
        )}
      </header>

      <Scoreboard state={state} />

      {mvp && mvpPoints !== undefined && mvpPoints > 0 && (
        <Panel className="text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-amber-300">
            Melhor explicador
          </p>
          <p className="font-display mt-1 text-2xl font-black">
            {mvp} · {mvpPoints} acertos
          </p>
        </Panel>
      )}

      <div className="mt-auto space-y-3">
        <Button size="lg" className="w-full" onClick={() => dispatch({ type: 'NEW_GAME' })}>
          Novo jogo (mesmos times)
        </Button>
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => dispatch({ type: 'REMATCH', seed: newSeed() })}
        >
          Revanche com os mesmos papéis
        </Button>
      </div>
    </Screen>
  )
}
