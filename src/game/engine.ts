import { randomInt, shuffle } from './random'
import type { GameState, Settings, Slip, Team, Turn } from './types'

export const TEAM_PRESETS = [
  { name: 'Tubarões', color: '#f97316' },
  { name: 'Polvos', color: '#0ea5e9' },
  { name: 'Baleias', color: '#a855f7' },
  { name: 'Siris', color: '#22c55e' },
  { name: 'Águas-vivas', color: '#ec4899' },
  { name: 'Baiacus', color: '#eab308' },
] as const

export const MAX_TEAMS = TEAM_PRESETS.length
export const MIN_PLAYERS_PER_TEAM = 2
/** Abaixo disso o tempo que sobra não vale a pena ser herdado */
const MIN_CARRY_MS = 3000

export const DEFAULT_SETTINGS: Settings = {
  turnSeconds: 60,
  wordsPerPlayer: 4,
  skipsPerTurn: 1,
  rounds: ['describe', 'oneWord', 'charades'],
  carryOverTime: true,
  sound: true,
}

export function createInitialState(): GameState {
  return {
    version: 1,
    settings: DEFAULT_SETTINGS,
    teams: TEAM_PRESETS.slice(0, 2).map((p) => ({ ...p, players: [] })),
    slips: [],
    bowl: [],
    roundIdx: 0,
    teamCursor: 0,
    playerCursors: [],
    scores: [],
    turn: null,
    carryMs: null,
    history: [],
    phase: { name: 'setup' },
  }
}

export type GameAction =
  | { type: 'UPDATE_SETTINGS'; settings: Partial<Settings> }
  | { type: 'SET_TEAMS'; teams: Team[] }
  | { type: 'START_WRITING' }
  | { type: 'QUICK_START'; words: string[]; seed: number }
  | { type: 'REVEAL_WRITER' }
  | { type: 'SUBMIT_WORDS'; words: string[]; seed: number }
  | { type: 'BACK_TO_SETUP' }
  | { type: 'BEGIN_ROUND' }
  | { type: 'START_TURN'; now: number }
  | { type: 'PAUSE'; now: number }
  | { type: 'RESUME'; now: number }
  | { type: 'CORRECT'; now: number }
  | { type: 'SKIP'; seed: number }
  | { type: 'TIME_UP' }
  | { type: 'TOGGLE_REJECT'; slipId: string }
  | { type: 'CONFIRM_TURN'; seed: number }
  | { type: 'NEXT_ROUND'; seed: number }
  | { type: 'REMATCH'; seed: number }
  | { type: 'NEW_GAME' }

export function writingOrder(teams: Team[]) {
  return teams.flatMap((team, teamIdx) =>
    team.players.map((player) => ({ player, teamIdx })),
  )
}

export function setupErrors(teams: Team[]): string[] {
  const errors: string[] = []
  const seen = new Set<string>()
  for (const team of teams) {
    if (!team.name.trim()) errors.push('Todo time precisa de um nome.')
    if (team.players.length < MIN_PLAYERS_PER_TEAM)
      errors.push(
        `${team.name || 'Um time'} precisa de pelo menos ${MIN_PLAYERS_PER_TEAM} jogadores.`,
      )
    for (const p of team.players) {
      const key = p.trim().toLowerCase()
      if (seen.has(key)) errors.push(`O nome "${p}" está repetido.`)
      seen.add(key)
    }
  }
  return [...new Set(errors)]
}

export function skipsLeft(state: GameState) {
  const { skipsPerTurn } = state.settings
  if (!state.turn) return 0
  if (skipsPerTurn < 0) return Infinity
  return Math.max(0, skipsPerTurn - state.turn.skips)
}

function startGame(state: GameState, slips: Slip[], seed: number): GameState {
  return {
    ...state,
    slips,
    bowl: shuffle(
      slips.map((s) => s.id),
      seed,
    ),
    roundIdx: 0,
    teamCursor: 0,
    playerCursors: state.teams.map(() => 0),
    scores: state.teams.map(() => state.settings.rounds.map(() => 0)),
    turn: null,
    carryMs: null,
    history: [],
    phase: { name: 'roundIntro' },
  }
}

function makeSlips(words: string[], author: string, offset: number): Slip[] {
  return words.map((text, i) => ({
    id: `slip-${offset + i}`,
    text: text.trim(),
    author,
  }))
}

function prepareTurn(state: GameState): Turn {
  const teamIdx = state.teamCursor
  const team = state.teams[teamIdx]
  const player = team.players[state.playerCursors[teamIdx] % team.players.length]
  const durationMs = state.carryMs ?? state.settings.turnSeconds * 1000
  return {
    teamIdx,
    player,
    durationMs,
    endsAt: null,
    remainingMs: durationMs,
    guessed: [],
    skips: 0,
  }
}

function advanceCursors(state: GameState): Pick<
  GameState,
  'teamCursor' | 'playerCursors'
> {
  const t = state.teamCursor
  return {
    teamCursor: (t + 1) % state.teams.length,
    playerCursors: state.playerCursors.map((c, i) => (i === t ? c + 1 : c)),
  }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.settings } }

    case 'SET_TEAMS':
      return { ...state, teams: action.teams }

    case 'START_WRITING': {
      if (setupErrors(state.teams).length) return state
      const teams = cleanTeams(state.teams)
      return {
        ...state,
        teams,
        slips: [],
        phase: { name: 'writing', cursor: 0, revealed: false },
      }
    }

    case 'QUICK_START': {
      if (setupErrors(state.teams).length) return state
      const teams = cleanTeams(state.teams)
      return startGame(
        { ...state, teams },
        makeSlips(action.words, '', 0),
        action.seed,
      )
    }

    case 'REVEAL_WRITER':
      if (state.phase.name !== 'writing') return state
      return { ...state, phase: { ...state.phase, revealed: true } }

    case 'SUBMIT_WORDS': {
      if (state.phase.name !== 'writing') return state
      const order = writingOrder(state.teams)
      const writer = order[state.phase.cursor]
      const slips = [
        ...state.slips,
        ...makeSlips(action.words, writer.player, state.slips.length),
      ]
      const cursor = state.phase.cursor + 1
      if (cursor >= order.length) return startGame(state, slips, action.seed)
      return {
        ...state,
        slips,
        phase: { name: 'writing', cursor, revealed: false },
      }
    }

    case 'BACK_TO_SETUP':
    case 'NEW_GAME':
      return {
        ...createInitialState(),
        settings: state.settings,
        teams: state.teams,
      }

    case 'BEGIN_ROUND':
      if (state.phase.name !== 'roundIntro') return state
      return { ...state, turn: prepareTurn(state), phase: { name: 'turnReady' } }

    case 'START_TURN':
      if (state.phase.name !== 'turnReady' || !state.turn) return state
      return {
        ...state,
        carryMs: null,
        turn: { ...state.turn, endsAt: action.now + state.turn.remainingMs },
        phase: { name: 'turnActive' },
      }

    case 'PAUSE': {
      const turn = state.turn
      if (state.phase.name !== 'turnActive' || !turn || turn.endsAt === null)
        return state
      return {
        ...state,
        turn: {
          ...turn,
          endsAt: null,
          remainingMs: Math.max(0, turn.endsAt - action.now),
        },
      }
    }

    case 'RESUME': {
      const turn = state.turn
      if (state.phase.name !== 'turnActive' || !turn || turn.endsAt !== null)
        return state
      return { ...state, turn: { ...turn, endsAt: action.now + turn.remainingMs } }
    }

    case 'CORRECT': {
      const turn = state.turn
      if (state.phase.name !== 'turnActive' || !turn || !state.bowl.length)
        return state
      const [current, ...rest] = state.bowl
      const guessed = [...turn.guessed, current]
      if (rest.length > 0)
        return { ...state, bowl: rest, turn: { ...turn, guessed } }
      const remainingMs =
        turn.endsAt === null
          ? turn.remainingMs
          : Math.max(0, turn.endsAt - action.now)
      return {
        ...state,
        bowl: rest,
        turn: { ...turn, guessed, endsAt: null, remainingMs },
        phase: { name: 'turnReview', reason: 'bowlEmpty', rejected: [] },
      }
    }

    case 'SKIP': {
      const turn = state.turn
      if (
        state.phase.name !== 'turnActive' ||
        !turn ||
        state.bowl.length < 2 ||
        skipsLeft(state) <= 0
      )
        return state
      const [current, ...rest] = state.bowl
      // Volta para o pote em qualquer posição, menos a primeira
      const at = 1 + randomInt(rest.length, action.seed)
      const bowl = [...rest.slice(0, at), current, ...rest.slice(at)]
      return { ...state, bowl, turn: { ...turn, skips: turn.skips + 1 } }
    }

    case 'TIME_UP': {
      const turn = state.turn
      if (state.phase.name !== 'turnActive' || !turn) return state
      return {
        ...state,
        turn: { ...turn, endsAt: null, remainingMs: 0 },
        phase: { name: 'turnReview', reason: 'time', rejected: [] },
      }
    }

    case 'TOGGLE_REJECT': {
      if (state.phase.name !== 'turnReview') return state
      const { rejected } = state.phase
      return {
        ...state,
        phase: {
          ...state.phase,
          rejected: rejected.includes(action.slipId)
            ? rejected.filter((id) => id !== action.slipId)
            : [...rejected, action.slipId],
        },
      }
    }

    case 'CONFIRM_TURN': {
      const turn = state.turn
      if (state.phase.name !== 'turnReview' || !turn) return state
      const { rejected } = state.phase
      const points = turn.guessed.length - rejected.length
      const scores = state.scores.map((row, t) =>
        t === turn.teamIdx
          ? row.map((v, r) => (r === state.roundIdx ? v + points : v))
          : row,
      )
      const bowl = shuffle([...state.bowl, ...rejected], action.seed)
      const history = [
        ...state.history,
        {
          roundIdx: state.roundIdx,
          teamIdx: turn.teamIdx,
          player: turn.player,
          count: points,
        },
      ]
      const base = { ...state, scores, bowl, history }

      if (bowl.length > 0) {
        const next = { ...base, ...advanceCursors(state), carryMs: null }
        return { ...next, turn: prepareTurn(next), phase: { name: 'turnReady' } }
      }

      const isLastRound = state.roundIdx >= state.settings.rounds.length - 1
      if (isLastRound)
        return { ...base, turn: null, phase: { name: 'gameOver' } }

      // Pote vazio: o mesmo jogador continua na próxima rodada com o tempo que sobrou
      const carry =
        state.settings.carryOverTime && turn.remainingMs >= MIN_CARRY_MS
          ? turn.remainingMs
          : null
      return {
        ...base,
        ...(carry === null ? advanceCursors(state) : {}),
        carryMs: carry,
        turn: null,
        phase: { name: 'roundEnd' },
      }
    }

    case 'NEXT_ROUND':
      if (state.phase.name !== 'roundEnd') return state
      return {
        ...state,
        roundIdx: state.roundIdx + 1,
        bowl: shuffle(
          state.slips.map((s) => s.id),
          action.seed,
        ),
        phase: { name: 'roundIntro' },
      }

    case 'REMATCH':
      return startGame(state, state.slips, action.seed)
  }
}

function cleanTeams(teams: Team[]): Team[] {
  return teams.map((t) => ({
    ...t,
    name: t.name.trim(),
    players: t.players.map((p) => p.trim()).filter(Boolean),
  }))
}

export function totalScore(state: GameState, teamIdx: number) {
  return (state.scores[teamIdx] ?? []).reduce((a, b) => a + b, 0)
}

export function slipText(state: GameState, id: string | undefined) {
  return state.slips.find((s) => s.id === id)?.text ?? ''
}
