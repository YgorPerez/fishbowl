import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  MAX_TEAMS,
  TEAM_PRESETS,
  setupErrors,
  writingOrder,
} from '#/game/engine'
import { newSeed, shuffle } from '#/game/random'
import { ALL_ROUND_KINDS, ROUNDS } from '#/game/rounds'
import type { GameState, Team } from '#/game/types'
import type { Dispatch } from '#/game/useGame'
import { pickWords, wordBankQuery } from '#/game/word-bank'
import { Button, Fishbowl, Panel, Screen, TeamDot } from './ui'

const TURN_OPTIONS = [30, 45, 60, 90, 120]
const SKIP_OPTIONS = [0, 1, 2, 3, -1]

export function SetupScreen({
  state,
  dispatch,
}: {
  state: GameState
  dispatch: Dispatch
}) {
  const { teams, settings } = state
  const [showErrors, setShowErrors] = useState(false)
  const [showRules, setShowRules] = useState(false)
  const wordBank = useQuery(wordBankQuery)
  const errors = setupErrors(teams)

  const setTeams = (next: Team[]) => dispatch({ type: 'SET_TEAMS', teams: next })
  const updateTeam = (idx: number, patch: Partial<Team>) =>
    setTeams(teams.map((t, i) => (i === idx ? { ...t, ...patch } : t)))

  const addTeam = () => {
    const used = new Set(teams.map((t) => t.color))
    const preset = TEAM_PRESETS.find((p) => !used.has(p.color)) ?? TEAM_PRESETS[0]
    setTeams([...teams, { ...preset, players: [] }])
  }

  const shuffleTeams = () => {
    const everyone = shuffle(
      teams.flatMap((t) => t.players),
      newSeed(),
    )
    setTeams(
      teams.map((t, i) => ({
        ...t,
        players: everyone.filter((_, j) => j % teams.length === i),
      })),
    )
  }

  const tryStart = (quick: boolean) => {
    if (errors.length) {
      setShowErrors(true)
      return
    }
    if (!quick) {
      dispatch({ type: 'START_WRITING' })
      return
    }
    const count = writingOrder(teams).length * settings.wordsPerPlayer
    dispatch({
      type: 'QUICK_START',
      words: pickWords(wordBank.data ?? [], count),
      seed: newSeed(),
    })
  }

  return (
    <Screen className="gap-4 pb-8">
      <header className="pt-4 text-center">
        <Fishbowl size={104} />
        <h1 className="font-display mt-2 text-5xl font-black tracking-tight">
          Fishbowl
        </h1>
        <p className="mt-1 text-foam/70">
          O jogo do pote — um celular só, passando de mão em mão.
        </p>
        <button
          type="button"
          className="mt-2 text-sm font-semibold text-amber-300 underline underline-offset-4"
          onClick={() => setShowRules((v) => !v)}
        >
          {showRules ? 'Esconder regras' : 'Como jogar?'}
        </button>
      </header>

      {showRules && <HowToPlay />}

      <Panel>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-extrabold">Times</h2>
          <Button
            variant="secondary"
            size="sm"
            onClick={shuffleTeams}
            disabled={teams.every((t) => t.players.length === 0)}
          >
            🔀 Sortear times
          </Button>
        </div>
        <div className="space-y-3">
          {teams.map((team, idx) => (
            <TeamEditor
              key={team.color}
              team={team}
              canRemove={teams.length > 2}
              onChange={(patch) => updateTeam(idx, patch)}
              onRemove={() => setTeams(teams.filter((_, i) => i !== idx))}
            />
          ))}
        </div>
        {teams.length < MAX_TEAMS && (
          <Button variant="ghost" size="sm" className="mt-3 w-full" onClick={addTeam}>
            + Adicionar time
          </Button>
        )}
      </Panel>

      <Panel className="space-y-5">
        <h2 className="text-lg font-extrabold">Regras da partida</h2>

        <Field label="Tempo por turno">
          <Chips
            options={TURN_OPTIONS}
            value={settings.turnSeconds}
            format={(s) => `${s}s`}
            onChange={(turnSeconds) =>
              dispatch({ type: 'UPDATE_SETTINGS', settings: { turnSeconds } })
            }
          />
        </Field>

        <Field label="Papéis por pessoa">
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              className="w-11"
              disabled={settings.wordsPerPlayer <= 1}
              onClick={() =>
                dispatch({
                  type: 'UPDATE_SETTINGS',
                  settings: { wordsPerPlayer: settings.wordsPerPlayer - 1 },
                })
              }
            >
              −
            </Button>
            <span className="w-8 text-center text-2xl font-black tabular-nums">
              {settings.wordsPerPlayer}
            </span>
            <Button
              variant="secondary"
              size="sm"
              className="w-11"
              disabled={settings.wordsPerPlayer >= 10}
              onClick={() =>
                dispatch({
                  type: 'UPDATE_SETTINGS',
                  settings: { wordsPerPlayer: settings.wordsPerPlayer + 1 },
                })
              }
            >
              +
            </Button>
          </div>
        </Field>

        <Field label="Pulos por turno" hint="O papel pulado volta para o pote.">
          <Chips
            options={SKIP_OPTIONS}
            value={settings.skipsPerTurn}
            format={(n) => (n < 0 ? '∞' : String(n))}
            onChange={(skipsPerTurn) =>
              dispatch({ type: 'UPDATE_SETTINGS', settings: { skipsPerTurn } })
            }
          />
        </Field>

        <Field label="Rodadas" hint="Os mesmos papéis voltam ao pote em cada rodada.">
          <div className="grid grid-cols-2 gap-2">
            {ALL_ROUND_KINDS.map((kind) => {
              const on = settings.rounds.includes(kind)
              return (
                <button
                  key={kind}
                  type="button"
                  aria-pressed={on}
                  className={`rounded-2xl px-3 py-2.5 text-left text-sm font-bold ring-1 transition ${
                    on
                      ? 'bg-amber-400/20 ring-amber-300 text-amber-100'
                      : 'bg-white/5 ring-white/15 text-foam/50'
                  }`}
                  onClick={() => {
                    const rounds = on
                      ? settings.rounds.filter((k) => k !== kind)
                      : ALL_ROUND_KINDS.filter(
                          (k) => k === kind || settings.rounds.includes(k),
                        )
                    if (rounds.length)
                      dispatch({ type: 'UPDATE_SETTINGS', settings: { rounds } })
                  }}
                >
                  {ROUNDS[kind].emoji} {ROUNDS[kind].title}
                </button>
              )
            })}
          </div>
        </Field>

        <Toggle
          label="Tempo que sobra passa para a próxima rodada"
          checked={settings.carryOverTime}
          onChange={(carryOverTime) =>
            dispatch({ type: 'UPDATE_SETTINGS', settings: { carryOverTime } })
          }
        />
        <Toggle
          label="Sons e vibração"
          checked={settings.sound}
          onChange={(sound) => dispatch({ type: 'UPDATE_SETTINGS', settings: { sound } })}
        />
      </Panel>

      {showErrors && errors.length > 0 && (
        <div role="alert" className="rounded-2xl bg-rose-500/20 p-3 text-sm ring-1 ring-rose-400/50">
          {errors.map((e) => (
            <p key={e}>• {e}</p>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <Button size="lg" className="w-full" onClick={() => tryStart(false)}>
          Escrever os papéis ✍️
        </Button>
        <Button
          variant="secondary"
          className="w-full"
          disabled={!wordBank.data}
          onClick={() => tryStart(true)}
        >
          ⚡ Jogo rápido (papéis sorteados)
        </Button>
      </div>
    </Screen>
  )
}

function TeamEditor({
  team,
  canRemove,
  onChange,
  onRemove,
}: {
  team: Team
  canRemove: boolean
  onChange: (patch: Partial<Team>) => void
  onRemove: () => void
}) {
  const [draft, setDraft] = useState('')

  const addPlayer = () => {
    const names = draft
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean)
    if (!names.length) return
    onChange({ players: [...team.players, ...names] })
    setDraft('')
  }

  return (
    <div
      className="rounded-2xl bg-ocean-950/40 p-3 ring-2"
      style={{ ['--tw-ring-color' as string]: `${team.color}88` }}
    >
      <div className="flex items-center gap-2">
        <TeamDot color={team.color} size={16} />
        <input
          className="min-w-0 flex-1 bg-transparent text-lg font-extrabold outline-none"
          value={team.name}
          maxLength={24}
          aria-label="Nome do time"
          onChange={(e) => onChange({ name: e.target.value })}
        />
        {canRemove && (
          <button
            type="button"
            className="px-2 text-sm text-foam/50"
            aria-label={`Remover ${team.name}`}
            onClick={onRemove}
          >
            Remover
          </button>
        )}
      </div>

      {team.players.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {team.players.map((p, i) => (
            <li
              key={`${p}-${i}`}
              className="flex items-center gap-1 rounded-full bg-white/10 py-1 pl-3 pr-1 text-sm font-semibold"
            >
              {p}
              <button
                type="button"
                aria-label={`Remover ${p}`}
                className="grid h-6 w-6 place-items-center rounded-full text-foam/60 active:bg-white/20"
                onClick={() =>
                  onChange({ players: team.players.filter((_, j) => j !== i) })
                }
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <form
        className="mt-2 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          addPlayer()
        }}
      >
        <input
          className="min-w-0 flex-1 rounded-xl bg-white/10 px-3 py-2 outline-none placeholder:text-foam/40 focus:ring-2 focus:ring-amber-300"
          placeholder="Nome do jogador"
          value={draft}
          maxLength={60}
          enterKeyHint="done"
          autoCapitalize="words"
          onChange={(e) => setDraft(e.target.value)}
        />
        <Button type="submit" variant="secondary" size="sm" disabled={!draft.trim()}>
          Adicionar
        </Button>
      </form>
    </div>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="mb-2 text-sm font-bold text-foam/80">{label}</div>
      {children}
      {hint && <p className="mt-1.5 text-xs text-foam/50">{hint}</p>}
    </div>
  )
}

function Chips<T extends number>({
  options,
  value,
  format,
  onChange,
}: {
  options: T[]
  value: T
  format: (v: T) => string
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          aria-pressed={opt === value}
          className={`min-w-12 rounded-xl px-3 py-2 font-bold tabular-nums transition ${
            opt === value
              ? 'bg-amber-400 text-ocean-950'
              : 'bg-white/10 text-foam/80 active:bg-white/20'
          }`}
          onClick={() => onChange(opt)}
        >
          {format(opt)}
        </button>
      ))}
    </div>
  )
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between gap-4 text-sm font-bold text-foam/80">
      {label}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked ? 'bg-emerald-400' : 'bg-white/20'
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
            checked ? 'left-6' : 'left-1'
          }`}
        />
      </button>
    </label>
  )
}

function HowToPlay() {
  return (
    <Panel className="space-y-2 text-sm leading-relaxed text-foam/85">
      <p>
        <b>1. Monte os times</b> e configure a partida. Precisa de pelo menos 2
        pessoas por time.
      </p>
      <p>
        <b>2. Cada pessoa escreve papéis</b> em segredo (nomes, lugares, filmes,
        coisas…) e passa o celular adiante. Tudo vai para o pote.
      </p>
      <p>
        <b>3. Os times se revezam.</b> Na sua vez, você tem um tempo para fazer
        seu time adivinhar o máximo de papéis. Cada acerto vale 1 ponto.
      </p>
      <p>
        <b>4. Quando o pote esvazia, a rodada acaba</b> e todos os papéis voltam
        para o pote — mas agora com uma regra mais difícil:
      </p>
      <ul className="space-y-1 pl-4">
        {ALL_ROUND_KINDS.map((k) => (
          <li key={k}>
            {ROUNDS[k].emoji} <b>{ROUNDS[k].title}:</b> {ROUNDS[k].short}.
          </li>
        ))}
      </ul>
      <p>Como os papéis se repetem, a memória do time vira a arma secreta!</p>
    </Panel>
  )
}
