import { useEffect, useReducer } from 'react'
import { gameReducer } from './engine'
import type { GameAction } from './engine'
import { loadState, saveState } from './storage'
import type { GameState } from './types'

export type Dispatch = (action: GameAction) => void

export function useGame(): [GameState, Dispatch] {
  const [state, dispatch] = useReducer(gameReducer, undefined, loadState)
  useEffect(() => saveState(state), [state])
  return [state, dispatch]
}
