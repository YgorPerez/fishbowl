export type RoundKind = 'describe' | 'oneWord' | 'charades' | 'sounds'

export interface Team {
  name: string
  color: string
  players: string[]
}

export interface Settings {
  turnSeconds: number
  wordsPerPlayer: number
  /** -1 = ilimitado */
  skipsPerTurn: number
  rounds: RoundKind[]
  /** Tempo que sobra quando o pote esvazia passa para a próxima rodada */
  carryOverTime: boolean
  sound: boolean
}

export interface Slip {
  id: string
  text: string
  author: string
}

export interface Turn {
  teamIdx: number
  player: string
  durationMs: number
  /** Timestamp de fim quando o cronômetro está rodando; null = pausado/parado */
  endsAt: number | null
  /** Tempo restante quando pausado/parado */
  remainingMs: number
  guessed: string[]
  skips: number
}

export interface TurnRecord {
  roundIdx: number
  teamIdx: number
  player: string
  count: number
}

export type Phase =
  | { name: 'setup' }
  | { name: 'writing'; cursor: number; revealed: boolean }
  | { name: 'roundIntro' }
  | { name: 'turnReady' }
  | { name: 'turnActive' }
  | { name: 'turnReview'; reason: 'time' | 'bowlEmpty'; rejected: string[] }
  | { name: 'roundEnd' }
  | { name: 'gameOver' }

export interface GameState {
  version: 1
  settings: Settings
  teams: Team[]
  slips: Slip[]
  /** Ids dos papéis ainda no pote nesta rodada; bowl[0] é o papel da vez */
  bowl: string[]
  roundIdx: number
  teamCursor: number
  /** Próximo jogador de cada time (índice cresce sem parar; usar módulo) */
  playerCursors: number[]
  /** scores[teamIdx][roundIdx] */
  scores: number[][]
  turn: Turn | null
  /** Tempo herdado da rodada anterior pelo próximo turno */
  carryMs: number | null
  history: TurnRecord[]
  phase: Phase
}
