import { useEffect, useRef, useState } from 'react'
import { skipsLeft, slipText } from '#/game/engine'
import { beep, unlockAudio, vibrate, useWakeLock } from '#/game/device'
import { newSeed } from '#/game/random'
import { ROUNDS } from '#/game/rounds'
import type { GameState } from '#/game/types'
import type { Dispatch } from '#/game/useGame'
import { Button, QuitButton, Screen, Scoreboard, TeamDot } from './ui'

/** Ignora toques duplos acidentais nos botões de acerto/pulo */
const TAP_COOLDOWN_MS = 350

interface Props {
  state: GameState
  dispatch: Dispatch
}

function RoundChip({ state }: { state: GameState }) {
  const round = ROUNDS[state.settings.rounds[state.roundIdx]]
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-sm font-bold">
      {round.emoji} {round.title}
    </span>
  )
}

export function TurnReadyScreen({ state, dispatch }: Props) {
  const turn = state.turn
  if (!turn) return null
  const team = state.teams[turn.teamIdx]
  const round = ROUNDS[state.settings.rounds[state.roundIdx]]
  const seconds = Math.ceil(turn.remainingMs / 1000)
  const isCarry = turn.durationMs !== state.settings.turnSeconds * 1000
  const guessers = team.players.filter((p) => p !== turn.player)

  return (
    <Screen
      className="justify-between gap-6"
      style={{
        background: `radial-gradient(120% 70% at 50% 0%, ${team.color}55, transparent 70%)`,
      }}
    >
      <div className="flex items-center justify-between">
        <RoundChip state={state} />
        <QuitButton onQuit={() => dispatch({ type: 'NEW_GAME' })} />
      </div>

      <div className="space-y-4 text-center">
        <p className="inline-flex items-center gap-2 text-lg font-bold">
          <TeamDot color={team.color} size={16} /> Vez do time {team.name}
        </p>
        <p className="text-foam/70">Passe o celular para</p>
        <h1 className="font-display text-5xl font-black break-words">
          {turn.player}
        </h1>
        <p className="text-foam/70">
          {guessers.length > 0 && (
            <>
              Quem adivinha: <b className="text-foam">{guessers.join(', ')}</b>
            </>
          )}
        </p>
        <div className="mx-auto max-w-xs rounded-2xl bg-white/8 p-3 text-sm">
          <b>
            {round.emoji} {round.title}:
          </b>{' '}
          {round.short}.
        </div>
        <p className="text-lg font-bold">
          {isCarry ? `⏱️ Continua com ${seconds}s que sobraram` : `⏱️ ${seconds} segundos`}
          <span className="block text-sm font-semibold text-foam/60">
            {state.bowl.length} papéis no pote
          </span>
        </p>
      </div>

      <div className="space-y-4">
        <Button
          size="lg"
          variant="success"
          className="w-full"
          onClick={() => {
            if (state.settings.sound) unlockAudio()
            dispatch({ type: 'START_TURN', now: Date.now() })
          }}
        >
          Valendo! ▶
        </Button>
        <details className="rounded-2xl bg-white/5 px-4 py-2">
          <summary className="cursor-pointer py-1 text-sm font-bold text-foam/70">
            Placar
          </summary>
          <div className="py-2">
            <Scoreboard state={state} highlightRound={state.roundIdx} />
          </div>
        </details>
      </div>
    </Screen>
  )
}

function useRemainingMs(endsAt: number | null, pausedMs: number) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (endsAt === null) return
    const id = window.setInterval(() => setNow(Date.now()), 100)
    return () => window.clearInterval(id)
  }, [endsAt])
  return endsAt === null ? pausedMs : Math.max(0, endsAt - now)
}

export function TurnActiveScreen({ state, dispatch }: Props) {
  const turn = state.turn
  const remaining = useRemainingMs(turn?.endsAt ?? null, turn?.remainingMs ?? 0)
  const lastTap = useRef(0)
  const lastBeepSecond = useRef<number | null>(null)
  const running = turn?.endsAt != null
  const seconds = Math.ceil(remaining / 1000)
  const { sound } = state.settings

  useWakeLock(true)

  useEffect(() => {
    if (!running) return
    if (remaining <= 0) {
      if (sound) {
        beep(220, 600, 0.25)
        vibrate([200, 100, 400])
      }
      dispatch({ type: 'TIME_UP' })
      return
    }
    if (sound && seconds <= 5 && lastBeepSecond.current !== seconds) {
      lastBeepSecond.current = seconds
      beep(seconds === 1 ? 990 : 660, 90)
    }
  }, [running, remaining, seconds, sound, dispatch])

  if (!turn) return null
  const team = state.teams[turn.teamIdx]
  const word = slipText(state, state.bowl[0])
  const left = skipsLeft(state)
  const canSkip = state.bowl.length > 1 && left > 0
  const progress = turn.durationMs > 0 ? remaining / turn.durationMs : 0

  const guard = (fn: () => void) => () => {
    const now = Date.now()
    if (now - lastTap.current < TAP_COOLDOWN_MS) return
    lastTap.current = now
    fn()
  }

  return (
    <Screen className="no-select gap-4">
      <div className="flex items-center justify-between gap-2">
        <RoundChip state={state} />
        <span className="inline-flex min-w-0 items-center gap-1.5 truncate text-sm font-bold">
          <TeamDot color={team.color} /> {turn.player}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className={`absolute inset-y-0 left-0 rounded-full transition-[width] duration-100 ${
              seconds <= 10 ? 'bg-rose-400' : 'bg-amber-300'
            }`}
            style={{ width: `${Math.min(1, progress) * 100}%` }}
          />
        </div>
        <span
          className={`font-display w-16 text-right text-4xl font-black tabular-nums ${
            seconds <= 10 ? 'text-rose-300' : ''
          }`}
        >
          {seconds}
        </span>
      </div>

      <div className="relative flex flex-1 items-center justify-center">
        <div
          key={state.bowl[0]}
          className="card-pop w-full rounded-[2rem] bg-amber-50 px-6 py-12 text-center text-ocean-950 shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
          style={{ rotate: '-1deg' }}
        >
          <p
            className={`font-display font-black leading-tight break-words ${
              word.length > 28 ? 'text-3xl' : word.length > 14 ? 'text-4xl' : 'text-5xl'
            } ${running ? '' : 'blur-xl'}`}
          >
            {word}
          </p>
        </div>

        {!running && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-[2rem] bg-ocean-950/70 p-6 text-center backdrop-blur-sm">
            <p className="font-display text-3xl font-black">Pausado</p>
            <Button
              size="lg"
              variant="success"
              className="w-full"
              onClick={() => {
                if (sound) unlockAudio()
                dispatch({ type: 'RESUME', now: Date.now() })
              }}
            >
              Continuar ▶
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => dispatch({ type: 'TIME_UP' })}
            >
              Encerrar o turno
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-sm font-semibold text-foam/70">
        <span>🐟 {state.bowl.length} no pote</span>
        <span>✅ {turn.guessed.length} acertos</span>
        <button
          type="button"
          className="rounded-full bg-white/10 px-3 py-1.5 font-bold text-foam disabled:opacity-40"
          disabled={!running}
          onClick={() => dispatch({ type: 'PAUSE', now: Date.now() })}
        >
          ⏸ Pausar
        </button>
      </div>

      <div className="grid grid-cols-5 gap-3">
        <Button
          variant="secondary"
          size="lg"
          className="col-span-2 flex flex-col items-center leading-tight"
          disabled={!running || !canSkip}
          onClick={guard(() => dispatch({ type: 'SKIP', seed: newSeed() }))}
        >
          Pular
          <span className="text-xs font-semibold text-foam/60">
            {state.settings.skipsPerTurn < 0
              ? 'ilimitado'
              : `${left} ${left === 1 ? 'restante' : 'restantes'}`}
          </span>
        </Button>
        <Button
          variant="success"
          size="lg"
          className="col-span-3"
          disabled={!running}
          onClick={guard(() => {
            if (sound) beep(1200, 70, 0.1)
            dispatch({ type: 'CORRECT', now: Date.now() })
          })}
        >
          Acertou! ✓
        </Button>
      </div>
    </Screen>
  )
}

export function TurnReviewScreen({ state, dispatch }: Props) {
  const turn = state.turn
  if (state.phase.name !== 'turnReview' || !turn) return null
  const { reason, rejected } = state.phase
  const team = state.teams[turn.teamIdx]
  const points = turn.guessed.length - rejected.length

  return (
    <Screen className="gap-5">
      <header className="pt-4 text-center">
        <p className="text-5xl">{reason === 'time' ? '⏰' : '🎉'}</p>
        <h1 className="font-display mt-2 text-4xl font-black">
          {reason === 'time' ? 'Acabou o tempo!' : 'O pote esvaziou!'}
        </h1>
        <p className="mt-2 inline-flex items-center gap-2 text-lg font-bold">
          <TeamDot color={team.color} /> {team.name} fez {points}{' '}
          {points === 1 ? 'ponto' : 'pontos'}
        </p>
      </header>

      {turn.guessed.length > 0 ? (
        <div className="flex-1 space-y-2">
          <p className="text-center text-sm text-foam/60">
            Algum acerto não valeu? Toque para anular — o papel volta para o pote.
          </p>
          <ul className="space-y-2">
            {turn.guessed.map((id) => {
              const isRejected = rejected.includes(id)
              return (
                <li key={id}>
                  <button
                    type="button"
                    aria-pressed={!isRejected}
                    onClick={() => dispatch({ type: 'TOGGLE_REJECT', slipId: id })}
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left font-bold transition ${
                      isRejected
                        ? 'bg-rose-500/15 text-foam/50 line-through'
                        : 'bg-emerald-400/15'
                    }`}
                  >
                    <span className="text-xl">{isRejected ? '✗' : '✓'}</span>
                    <span className="break-words">{slipText(state, id)}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ) : (
        <p className="flex-1 text-center text-foam/60">
          Nenhum acerto desta vez. Acontece! 🐠
        </p>
      )}

      <Button
        size="lg"
        className="w-full"
        onClick={() => dispatch({ type: 'CONFIRM_TURN', seed: newSeed() })}
      >
        Confirmar
      </Button>
    </Screen>
  )
}
