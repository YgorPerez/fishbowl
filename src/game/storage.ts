import { createInitialState } from './engine'
import type { GameState } from './types'

const STORAGE_KEY = 'fishbowl:v1'

/** Só chamar no cliente (a rota do jogo usa `ssr: false`). */
export function loadState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return createInitialState()
    const state = JSON.parse(raw) as GameState
    if (state.version !== 1) return createInitialState()
    // Ao recarregar no meio de um turno, volta pausado com o tempo que restava
    if (state.turn?.endsAt != null) {
      state.turn = {
        ...state.turn,
        endsAt: null,
        remainingMs: Math.max(0, state.turn.endsAt - Date.now()),
      }
    }
    return state
  } catch {
    return createInitialState()
  }
}

export function saveState(state: GameState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Modo privado / quota cheia: o jogo continua, só não sobrevive a um reload
  }
}
